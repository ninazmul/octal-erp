"use server";

import { connectToDatabase } from "@/lib/database";
import { requirePermission, requireSuperAdmin } from "@/lib/auth-guard";
import IdCardTemplate from "@/lib/database/models/idCardTemplate.model";
import Student from "@/lib/database/models/student.model";
import Employee from "@/lib/database/models/employee.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import Batch from "@/lib/database/models/batch.model";
import { getStudentById } from "@/lib/actions/student.actions";
import { getEmployeeById } from "@/lib/actions/staff.actions";
import { revalidatePath } from "next/cache";

export type IdCardRole = "student" | "staff";
export interface IdCardTemplateInput {
  role: IdCardRole;
  institutionName: string;
  cardTitle: string;
  backMessage: string;
  contactLine: string;
  addressLine: string;
  backgroundImageUrl: string;
  signatureImageUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  accentColor: string;
}

const defaults = (role: IdCardRole) => ({
  role,
  institutionName: "Octal Technical Training Institute",
  cardTitle: role === "student" ? "STUDENT IDENTITY CARD" : "STAFF IDENTITY CARD",
  backMessage: "If found, please return this card to the institute at the contact details below.",
  contactLine: "",
  addressLine: "",
  backgroundImageUrl: "",
  signatureImageUrl: "",
  signatoryName: "",
  signatoryTitle: "Authorized by",
  accentColor: "#173b72",
});

export async function getIdCardTemplates() {
  await requireSuperAdmin();
  await connectToDatabase();
  const records = await IdCardTemplate.find().lean();
  const templates = { student: defaults("student"), staff: defaults("staff") };
  for (const record of records) templates[record.role] = { ...templates[record.role], ...record };
  return JSON.parse(JSON.stringify(templates));
}

export async function saveIdCardTemplate(input: IdCardTemplateInput) {
  await requireSuperAdmin();
  await connectToDatabase();
  const data = { ...input };
  for (const key of ["institutionName", "cardTitle", "backMessage", "contactLine", "addressLine", "backgroundImageUrl", "signatureImageUrl", "signatoryName", "signatoryTitle"] as const) {
    data[key] = String(data[key] || "").trim();
  }
  if (!/^#[0-9a-f]{6}$/i.test(data.accentColor)) throw new Error("Enter a valid accent color.");
  const template = await IdCardTemplate.findOneAndUpdate({ role: data.role }, data, { new: true, upsert: true, runValidators: true });
  revalidatePath("/settings");
  revalidatePath("/students");
  revalidatePath("/staff");
  return JSON.parse(JSON.stringify(template));
}

export async function getIdCardTemplateForRender(role: IdCardRole, recordId?: string) {
  await requirePermission(role === "student" ? "students" : "staff", "read");
  await connectToDatabase();
  const template = await IdCardTemplate.findOne({ role }).lean();
  let person: Record<string, string> = {};
  if (recordId && role === "student") {
    const student = await getStudentById(recordId);
    const enrollment = student.enrollments?.[0];
    person = {
      name: student.fullName,
      id: student.studentId,
      imageUrl: student.profileImageUrl || "",
      phone: student.phone || "",
      email: student.email || "",
      status: student.status || "",
      detail: enrollment?.course?.title || "",
      detailLabel: "Course",
      extra: enrollment?.batch?.batchName || "",
      extraLabel: "Batch",
    };
  } else if (recordId && role === "staff") {
    const employee = await getEmployeeById(recordId);
    person = {
      name: employee.fullName,
      id: employee.employeeId,
      imageUrl: employee.profileImageUrl || "",
      phone: employee.phone || "",
      email: employee.email || "",
      status: employee.status || "",
      detail: employee.designation || "",
      detailLabel: "Designation",
      extra: employee.department || "",
      extraLabel: "Department",
    };
  }
  return JSON.parse(JSON.stringify({ template: { ...defaults(role), ...template }, person }));
}

export async function getIdCardTemplatesForRender(role: IdCardRole, recordIds: string[]) {
  if (!recordIds.length || recordIds.length > 250) throw new Error("Select between 1 and 250 ID cards to print at once.");
  const profile = await requirePermission(role === "student" ? "students" : "staff", "read");
  await connectToDatabase();
  const template = await IdCardTemplate.findOne({ role }).lean();
  let people: Array<Record<string, string>>;
  if (role === "student") {
    const students = await Student.find({ _id: { $in: recordIds } }).lean();
    if (students.length !== recordIds.length) throw new Error("One or more students could not be found.");
    if (profile.role === "instructor") {
      if (!profile.employeeId) throw new Error("Forbidden: Instructor profile is not linked to an employee.");
      const assignedBatches = await Batch.find({ instructors: profile.employeeId }).select("_id").lean();
      const assignedStudents = await Enrollment.distinct("student", {
        student: { $in: recordIds },
        batch: { $in: assignedBatches.map((batch) => batch._id) },
      });
      const allowed = new Set(assignedStudents.map(String));
      if (recordIds.some((id) => !allowed.has(id))) throw new Error("You can only print cards for students in your assigned batches.");
    }
    const enrollments = await Enrollment.find({ student: { $in: recordIds } })
      .populate("course", "title")
      .populate("batch", "batchName")
      .sort({ createdAt: -1 })
      .lean();
    const latestEnrollmentByStudent = new Map<string, (typeof enrollments)[number]>();
    for (const enrollment of enrollments) {
      const studentId = String(enrollment.student);
      if (!latestEnrollmentByStudent.has(studentId)) latestEnrollmentByStudent.set(studentId, enrollment);
    }
    const studentById = new Map(students.map((student) => [String(student._id), student]));
    people = recordIds.map((id) => {
      const student = studentById.get(id)!;
      const enrollment = latestEnrollmentByStudent.get(id);
      const course = enrollment?.course as { title?: string } | undefined;
      const batch = enrollment?.batch as { batchName?: string } | undefined;
      return {
        name: student.fullName,
        id: student.studentId,
        imageUrl: student.profileImageUrl || "",
        phone: student.phone || "",
        email: student.email || "",
        status: student.status || "",
        detail: course?.title || "",
        detailLabel: "Course",
        extra: batch?.batchName || "",
        extraLabel: "Batch",
      };
    });
  } else {
    const employees = await Employee.find({ _id: { $in: recordIds } }).lean();
    if (employees.length !== recordIds.length) throw new Error("One or more staff members could not be found.");
    const employeeById = new Map(employees.map((employee) => [String(employee._id), employee]));
    people = recordIds.map((id) => {
      const employee = employeeById.get(id)!;
      return {
        name: employee.fullName,
        id: employee.employeeId,
        imageUrl: employee.profileImageUrl || "",
        phone: employee.phone || "",
        email: employee.email || "",
        status: employee.status || "",
        detail: employee.designation || "",
        detailLabel: "Designation",
        extra: employee.department || "",
        extraLabel: "Department",
      };
    });
  }
  return JSON.parse(JSON.stringify({ template: { ...defaults(role), ...template }, people }));
}
