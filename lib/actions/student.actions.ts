"use server";

import { connectToDatabase } from "@/lib/database";
import Student from "@/lib/database/models/student.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import Payment from "@/lib/database/models/payment.model";
import Course from "@/lib/database/models/course.model";
import Batch from "@/lib/database/models/batch.model";
import CommissionRule from "@/lib/database/models/commissionRule.model";
import Counter from "@/lib/database/models/counter.model";
import { formatSL } from "@/lib/utils";
import {
  requirePermission,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// Sequential ID generators
async function getNextStudentId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_student_id",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `OCT-STU-${formatSL(counter.seq, 4)}`;
}

async function getNextEnrollmentId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_enrollment_id",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `OCT-ENR-${formatSL(counter.seq, 4)}`;
}

// ==========================================
// GET STUDENTS
// ==========================================

export async function getStudents(params?: {
  search?: string;
  status?: string;
  batchId?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}) {
  const profile = await requirePermission("students", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params?.status) {
    query.status = params.status;
  }

  if (params?.search) {
    query.$or = [
      { fullName: { $regex: params.search, $options: "i" } },
      { studentId: { $regex: params.search, $options: "i" } },
      { phone: { $regex: params.search, $options: "i" } },
      { email: { $regex: params.search, $options: "i" } },
    ];
  }

  // Instructor scoping: only see students enrolled in assigned courses/batches
  if (profile.role === "instructor" && profile.employeeId) {
    const instructorBatches = await Batch.find({
      instructors: profile.employeeId,
    })
      .select("_id")
      .lean();
    const batchIds = instructorBatches.map((b) => b._id);

    const enrollments = await Enrollment.find({
      batch: { $in: batchIds },
    })
      .select("student")
      .lean();
    const studentIds = enrollments.map((e) => e.student);
    query._id = { $in: studentIds };
  }

  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Aggregate enrollment summaries per student
  const studentListWithStats = await Promise.all(
    students.map(async (stu) => {
      const enrollments = await Enrollment.find({ student: stu._id }).lean();
      const totalEnrollmentsCount = enrollments.length;
      const totalPayableSum = enrollments.reduce(
        (sum, e) => sum + (e.finalPayableAmount || 0),
        0
      );
      const totalPaidSum = enrollments.reduce(
        (sum, e) => sum + (e.totalCollectedAmount || 0),
        0
      );
      const totalDueSum = enrollments.reduce(
        (sum, e) => sum + (e.remainingDue || 0),
        0
      );

      return {
        ...stu,
        totalEnrollmentsCount,
        totalPayableSum,
        totalPaidSum,
        totalDueSum,
      };
    })
  );

  return JSON.parse(
    JSON.stringify({
      students: studentListWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  );
}

// ==========================================
// GET STUDENT BY ID
// ==========================================

export async function getStudentById(id: string) {
  await requirePermission("students", "read");
  await connectToDatabase();

  const student = await Student.findById(id).lean();
  if (!student) throw new Error("Student not found");

  const enrollments = await Enrollment.find({ student: id })
    .populate("course", "title code durationMonths defaultFee")
    .populate("batch", "batchCode batchName startDate endDate status scheduleDescription")
    .populate("referrer", "fullName employeeId email")
    .sort({ createdAt: -1 })
    .lean();

  const payments = await Payment.find({ student: id })
    .populate("batch", "batchCode batchName")
    .sort({ paymentDate: -1 })
    .lean();

  const totalPayableSum = enrollments.reduce(
    (sum, e) => sum + (e.finalPayableAmount || 0),
    0
  );
  const totalPaidSum = enrollments.reduce(
    (sum, e) => sum + (e.totalCollectedAmount || 0),
    0
  );
  const totalDueSum = enrollments.reduce(
    (sum, e) => sum + (e.remainingDue || 0),
    0
  );

  return JSON.parse(
    JSON.stringify({
      ...student,
      enrollments,
      payments,
      totalPayableSum,
      totalPaidSum,
      totalDueSum,
    })
  );
}

// ==========================================
// ADMIT STUDENT (NEW OR RETURNING)
// ==========================================

export async function admitStudent(data: {
  // Student Profile
  studentId?: string; // If existing student
  fullName: string;
  phone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  notes?: string;

  // Enrollment Info
  courseId: string;
  batchId: string;
  agreedFee: number;
  discount?: number;

  // Referral Attribution
  referrerType?: "Instructor" | "Staff" | "External" | "None";
  referrerId?: string; // Employee ID
  referrerCommissionRate?: number;
}) {
  const actor = await requirePermission("students", "write");
  await connectToDatabase();

  const course = await Course.findById(data.courseId);
  if (!course) throw new Error("Course not found");

  const batch = await Batch.findById(data.batchId);
  if (!batch) throw new Error("Batch not found");

  // Check seat capacity
  const currentBatchEnrollments = await Enrollment.countDocuments({
    batch: data.batchId,
    status: { $ne: "Dropped" },
  });
  if (currentBatchEnrollments >= batch.maxCapacity) {
    throw new Error(
      `Batch ${batch.batchName} has reached maximum seat capacity (${batch.maxCapacity}).`
    );
  }

  // 1. Resolve or Create Student
  let studentDoc;
  if (data.studentId) {
    studentDoc = await Student.findOne({ studentId: data.studentId });
  }

  if (!studentDoc) {
    // Check by phone number to prevent duplicates
    const existingByPhone = await Student.findOne({ phone: data.phone.trim() });
    if (existingByPhone) {
      studentDoc = existingByPhone;
      // Update contact details if provided
      if (data.fullName) studentDoc.fullName = data.fullName.trim();
      if (data.email) studentDoc.email = data.email.trim().toLowerCase();
      if (data.guardianName) studentDoc.guardianName = data.guardianName.trim();
      if (data.guardianPhone) studentDoc.guardianPhone = data.guardianPhone.trim();
      if (data.address) studentDoc.address = data.address.trim();
      await studentDoc.save();
    } else {
      const generatedStudentId = await getNextStudentId();
      studentDoc = await Student.create({
        studentId: generatedStudentId,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim().toLowerCase() || "",
        guardianName: data.guardianName?.trim() || "",
        guardianPhone: data.guardianPhone?.trim() || "",
        address: data.address?.trim() || "",
        notes: data.notes?.trim() || "",
        status: "Active",
        admissionDate: new Date(),
      });
    }
  }

  // 2. Prevent duplicate enrollment in the same batch
  const existingEnrollment = await Enrollment.findOne({
    student: studentDoc._id,
    batch: batch._id,
  });
  if (existingEnrollment) {
    throw new Error(
      `Student ${studentDoc.fullName} is already enrolled in batch ${batch.batchName} (${existingEnrollment.enrollmentId}).`
    );
  }

  // 3. Compute Financial Invariants
  const agreedFee = Math.max(0, Number(data.agreedFee));
  const discount = Math.max(0, Number(data.discount || 0));
  const finalPayableAmount = Math.max(0, agreedFee - discount);
  const totalCollectedAmount = 0;
  const remainingDue = finalPayableAmount;

  // 4. Resolve Referrer Commission Rate
  let commissionRate = 0;
  let referrerEmployeeId = null;

  if (data.referrerType === "Instructor" && data.referrerId) {
    referrerEmployeeId = data.referrerId;
    // Check if custom rule exists for this referrer & course
    const specificRule = await CommissionRule.findOne({
      referrer: data.referrerId,
      course: course._id,
      isActive: true,
    });
    if (specificRule) {
      commissionRate = specificRule.percentage;
    } else {
      const globalRule = await CommissionRule.findOne({
        referrer: data.referrerId,
        course: null,
        isActive: true,
      });
      commissionRate =
        globalRule?.percentage ??
        data.referrerCommissionRate ??
        course.defaultCommissionRate ??
        20;
    }
  }

  // 5. Create Enrollment
  const generatedEnrollmentId = await getNextEnrollmentId();
  const enrollment = await Enrollment.create({
    enrollmentId: generatedEnrollmentId,
    student: studentDoc._id,
    course: course._id,
    batch: batch._id,
    agreedFee,
    discount,
    finalPayableAmount,
    totalCollectedAmount,
    remainingDue,
    referrerType: data.referrerType || "None",
    referrer: referrerEmployeeId,
    commissionRate,
    status: "Active",
    admittedBy: {
      email: actor.email,
      name: actor.name || "",
      userId: actor._id,
    },
    notes: data.notes?.trim() || "",
  });

  await logActivityAndNotify({
    actor,
    action: "ADMIT_STUDENT",
    module: "students",
    resourceId: String(studentDoc._id),
    resourceName: studentDoc.fullName,
    details: `Admitted student ${studentDoc.fullName} (${studentDoc.studentId}) to batch ${batch.batchName}. Final payable: ৳${finalPayableAmount}. Referrer: ${data.referrerType || "None"} (${commissionRate}%)`,
  });

  revalidatePath("/students");
  revalidatePath("/academic/batches");
  return JSON.parse(
    JSON.stringify({
      student: studentDoc,
      enrollment,
    })
  );
}

// ==========================================
// UPDATE STUDENT PROFILE
// ==========================================

export async function updateStudent(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    email?: string;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
    notes?: string;
    status?: "Active" | "Inactive" | "Archived";
  }
) {
  const actor = await requirePermission("students", "write");
  await connectToDatabase();

  const student = await Student.findById(id);
  if (!student) throw new Error("Student not found");

  if (data.fullName !== undefined) student.fullName = data.fullName.trim();
  if (data.phone !== undefined) student.phone = data.phone.trim();
  if (data.email !== undefined) student.email = data.email.trim().toLowerCase();
  if (data.guardianName !== undefined) student.guardianName = data.guardianName.trim();
  if (data.guardianPhone !== undefined)
    student.guardianPhone = data.guardianPhone.trim();
  if (data.address !== undefined) student.address = data.address.trim();
  if (data.notes !== undefined) student.notes = data.notes.trim();
  if (data.status !== undefined) student.status = data.status;

  await student.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_STUDENT",
    module: "students",
    resourceId: String(student._id),
    resourceName: student.fullName,
    details: `Updated profile for student ${student.fullName} (${student.studentId})`,
  });

  revalidatePath("/students");
  return JSON.parse(JSON.stringify(student));
}

// ==========================================
// UPDATE ENROLLMENT (DISCOUNT/REFERRER CORRECTION)
// ==========================================

export async function updateEnrollment(
  enrollmentId: string,
  data: {
    discount?: number;
    referrerType?: "Instructor" | "Staff" | "External" | "None";
    referrerId?: string;
    commissionRate?: number;
    status?: "Active" | "Completed" | "Dropped" | "Suspended";
    correctionReason: string;
  }
) {
  const actor = await requirePermission("students", "write");
  await connectToDatabase();

  const enrollment = await Enrollment.findById(enrollmentId).populate("student", "fullName");
  if (!enrollment) throw new Error("Enrollment not found");

  if (!data.correctionReason?.trim()) {
    throw new Error("A reason is strictly required for enrollment and financial corrections.");
  }

  if (data.discount !== undefined) {
    enrollment.discount = Math.max(0, Number(data.discount));
    enrollment.finalPayableAmount = Math.max(
      0,
      enrollment.agreedFee - enrollment.discount
    );
    enrollment.remainingDue = Math.max(
      0,
      enrollment.finalPayableAmount - enrollment.totalCollectedAmount
    );
  }

  if (data.referrerType !== undefined) enrollment.referrerType = data.referrerType;
  if (data.referrerId !== undefined) {
    enrollment.referrer = data.referrerId ? (data.referrerId as unknown as mongoose.Types.ObjectId) : null;
  }
  if (data.commissionRate !== undefined) {
    enrollment.commissionRate = Math.max(0, Math.min(100, Number(data.commissionRate)));
  }
  if (data.status !== undefined) enrollment.status = data.status;

  await enrollment.save();

  await logActivityAndNotify({
    actor,
    action: "CORRECT_ENROLLMENT",
    module: "students",
    resourceId: String(enrollment._id),
    resourceName: enrollment.enrollmentId,
    details: `Updated enrollment ${enrollment.enrollmentId}. Reason: "${data.correctionReason}". New payable: ৳${enrollment.finalPayableAmount}, Remaining: ৳${enrollment.remainingDue}`,
  });

  revalidatePath("/students");
  revalidatePath("/academic/batches");
  return JSON.parse(JSON.stringify(enrollment));
}
