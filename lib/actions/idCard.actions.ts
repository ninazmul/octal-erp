"use server";

import { connectToDatabase } from "@/lib/database";
import { requirePermission, requireSuperAdmin } from "@/lib/auth-guard";
import IdCardTemplate from "@/lib/database/models/idCardTemplate.model";
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
