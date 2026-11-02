"use server";

import { connectToDatabase } from "@/lib/database";
import Student from "@/lib/database/models/student.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import Payment from "@/lib/database/models/payment.model";
import Course from "@/lib/database/models/course.model";
import Batch from "@/lib/database/models/batch.model";
import CommissionRule from "@/lib/database/models/commissionRule.model";
import Counter from "@/lib/database/models/counter.model";
import Admin from "@/lib/database/models/admin.model";
import Notification from "@/lib/database/models/notification.model";
import AdmissionDiscountRequest from "@/lib/database/models/admissionDiscountRequest.model";
import type { IAdmissionDiscountRequestDocument } from "@/lib/database/models/admissionDiscountRequest.model";
import { escapeRegex, formatSL, normalizePagination } from "@/lib/utils";
import {
  getCurrentAdminProfile,
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

  const searchTerm = params?.search?.trim();
  if (searchTerm) {
    const search = new RegExp(escapeRegex(searchTerm), "i");
    query.$or = [
      { fullName: search },
      { studentId: search },
      { phone: search },
      { email: search },
    ];
  }

  // Instructor scoping: only see students enrolled in assigned courses/batches
  if (profile.role === "instructor") {
    if (!profile.employeeId) {
      query._id = { $in: [] };
    } else {
      const instructorBatches = await Batch.find({ instructors: profile.employeeId })
        .select("_id")
        .lean();
      const batchIds = instructorBatches.map((batch) => batch._id);
      const studentIds = await Enrollment.distinct("student", { batch: { $in: batchIds } });
      query._id = { $in: studentIds };
    }
  }

  const { page, limit } = normalizePagination(params?.page, params?.limit);
  const skip = (page - 1) * limit;

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Aggregate enrollment summaries per student
  const enrollmentSummaries = students.length
    ? await Enrollment.aggregate([
        { $match: { student: { $in: students.map((student) => student._id) } } },
        {
          $group: {
            _id: "$student",
            totalEnrollmentsCount: { $sum: 1 },
            totalPayableSum: { $sum: { $ifNull: ["$finalPayableAmount", 0] } },
            totalPaidSum: { $sum: { $ifNull: ["$totalCollectedAmount", 0] } },
            totalDueSum: { $sum: { $ifNull: ["$remainingDue", 0] } },
          },
        },
      ])
    : [];
  const summaryByStudent = new Map(
    enrollmentSummaries.map((summary) => [String(summary._id), summary])
  );
  const studentListWithStats = students.map((student) => ({
    ...student,
    totalEnrollmentsCount: summaryByStudent.get(String(student._id))?.totalEnrollmentsCount || 0,
    totalPayableSum: summaryByStudent.get(String(student._id))?.totalPayableSum || 0,
    totalPaidSum: summaryByStudent.get(String(student._id))?.totalPaidSum || 0,
    totalDueSum: summaryByStudent.get(String(student._id))?.totalDueSum || 0,
  }));

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
  const profile = await requirePermission("students", "read");
  await connectToDatabase();

  const student = await Student.findById(id).lean();
  if (!student) throw new Error("Student not found");

  if (profile.role === "instructor") {
    if (!profile.employeeId) {
      throw new Error("Forbidden: Instructor profile is not linked to an employee.");
    }
    const batches = await Batch.find({ instructors: profile.employeeId })
      .select("_id")
      .lean();
    const hasAssignedEnrollment = await Enrollment.exists({
      student: student._id,
      batch: { $in: batches.map((batch) => batch._id) },
    });
    if (!hasAssignedEnrollment) throw new Error("Forbidden: You are not assigned to this student.");
  }

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

  // Referral Attribution
  referrerType?: "Instructor" | "Staff" | "External" | "None";
  referrerId?: string; // Employee ID
  discountRequestId?: string;
}) {
  const currentProfile = await getCurrentAdminProfile();
  if (!currentProfile) throw new Error("Unauthorized: Access is restricted to authorized administrators.");
  const actor = currentProfile.role === "instructor"
    ? await requirePermission("students", "read")
    : await requirePermission("students", "write");
  await connectToDatabase();

  const course = await Course.findById(data.courseId);
  if (!course) throw new Error("Course not found");

  const batch = await Batch.findById(data.batchId);
  if (!batch) throw new Error("Batch not found");

  const isInstructorAdmission = actor.role === "instructor";
  if (isInstructorAdmission) {
    if (!actor.employeeId) throw new Error("Your instructor account is not linked to an employee record.");
    const isAssignedToBatch = batch.instructors.some((instructorId) => String(instructorId) === actor.employeeId);
    const isAssignedToCourse = course.instructors.some((instructorId) => String(instructorId) === actor.employeeId);
    if (!isAssignedToBatch || !isAssignedToCourse || String(batch.course) !== String(course._id)) {
      throw new Error("You can only admit students into your assigned courses and batches.");
    }
  }

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
  // Admission fees and commissions are sourced from course/rule settings.
  const agreedFee = Math.max(0, Number(course.defaultFee || 0));
  let discount = 0;
  let approvedDiscountRequest: IAdmissionDiscountRequestDocument | null = null;
  if (data.discountRequestId) {
    approvedDiscountRequest = await AdmissionDiscountRequest.findById(data.discountRequestId);
    if (!approvedDiscountRequest || approvedDiscountRequest.status !== "Approved") throw new Error("Approved discount request not found.");
    const isRequester = approvedDiscountRequest.requestedBy.email === actor.email.toLowerCase();
    const isAdmin = ["admin", "super_admin"].includes(actor.role);
    if (!isRequester && !isAdmin) throw new Error("You cannot use this discount request.");
    if (String(approvedDiscountRequest.course) !== String(course._id) || String(approvedDiscountRequest.batch) !== String(batch._id)) throw new Error("Discount request does not match this course and batch.");
    if (approvedDiscountRequest.studentPhone !== data.phone.trim()) throw new Error("Discount request does not match this student.");
    discount = Math.min(Math.max(0, approvedDiscountRequest.approvedAmount), agreedFee);
  }
  const finalPayableAmount = Math.max(0, agreedFee - discount);
  const totalCollectedAmount = 0;
  const remainingDue = finalPayableAmount;

  // 4. Resolve Referrer Commission Rate
  let commissionRate = 0;
  let referrerEmployeeId = null;

  const referrerType = isInstructorAdmission ? "Instructor" : (data.referrerType || "None");
  const selectedReferrerId = isInstructorAdmission ? actor.employeeId : data.referrerId;
  if (referrerType === "Instructor" && selectedReferrerId) {
    referrerEmployeeId = selectedReferrerId;
    // Check if custom rule exists for this referrer & course
    const specificRule = await CommissionRule.findOne({
      referrer: selectedReferrerId,
      course: course._id,
      isActive: true,
    });
    if (specificRule) {
      commissionRate = specificRule.percentage;
    } else {
      const globalRule = await CommissionRule.findOne({
        referrer: selectedReferrerId,
        course: null,
        isActive: true,
      });
      commissionRate =
        globalRule?.percentage ??
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
    referrerType,
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

  if (approvedDiscountRequest) {
    approvedDiscountRequest.status = "Used";
    approvedDiscountRequest.student = studentDoc._id;
    approvedDiscountRequest.enrollment = enrollment._id;
    await approvedDiscountRequest.save();
  }

  await logActivityAndNotify({
    actor,
    action: "ADMIT_STUDENT",
    module: "students",
    resourceId: String(studentDoc._id),
    resourceName: studentDoc.fullName,
    details: `Admitted student ${studentDoc.fullName} (${studentDoc.studentId}) to batch ${batch.batchName}. Final payable: ৳${finalPayableAmount}. Referrer: ${referrerType} (${commissionRate}%)`,
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

export async function requestAdmissionDiscount(data: {
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  courseId: string;
  batchId: string;
  requestedAmount: number;
  reason: string;
}) {
  const actor = await requirePermission("students", "read");
  await connectToDatabase();

  const studentName = data.studentName.trim();
  const studentPhone = data.studentPhone.trim();
  const reason = data.reason.trim();
  const requestedAmount = Number(data.requestedAmount);
  if (!studentName || !studentPhone || !reason) {
    throw new Error("Student name, phone, and a discount request reason are required.");
  }
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error("Enter a requested discount amount greater than zero.");
  }

  const [course, batch] = await Promise.all([
    Course.findById(data.courseId).select("title code defaultFee instructors"),
    Batch.findById(data.batchId).select("batchName batchCode course instructors"),
  ]);
  if (!course || !batch || String(batch.course) !== String(course._id)) {
    throw new Error("Select a valid course and batch.");
  }
  if (requestedAmount > Number(course.defaultFee || 0)) {
    throw new Error("Requested discount cannot exceed the course fee.");
  }

  if (["instructor", "staff"].includes(actor.role)) {
    if (!actor.employeeId) throw new Error("Your account is not linked to an employee record.");
    const assignedToCourse = course.instructors.some((id) => String(id) === actor.employeeId);
    const assignedToBatch = batch.instructors.some((id) => String(id) === actor.employeeId);
    if (!assignedToCourse || !assignedToBatch) {
      throw new Error("You can only request discounts for your assigned course and batch.");
    }
  }

  const recipients = await Admin.find({
    role: { $in: ["admin", "super_admin"] },
    isActive: true,
  }).select("email").lean();
  const recipientEmails = [...new Set(recipients.map((recipient) => recipient.email.toLowerCase()))];
  if (recipientEmails.length === 0) throw new Error("No active administrators are available to receive discount requests.");

  const request = await AdmissionDiscountRequest.create({
    studentName, studentPhone, studentEmail: data.studentEmail?.trim().toLowerCase() || "",
    course: course._id, batch: batch._id, requestedAmount, reason,
    requestedBy: { email: actor.email.toLowerCase(), name: actor.name || "", role: actor.role },
  });
  await Notification.create({
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "DISCOUNT_REQUEST",
    module: "students",
    title: "Student discount approval requested",
    message: `${studentName} (${studentPhone}${data.studentEmail?.trim() ? `, ${data.studentEmail.trim()}` : ""}) requests ৳${requestedAmount.toLocaleString()} discount for ${course.title} (${course.code}), batch ${batch.batchName} (${batch.batchCode}). Reason: ${reason}`,
    link: `/students/discount-requests?requestId=${request._id}`,
    recipientEmails,
  });

  await logActivityAndNotify({
    actor,
    action: "REQUEST_ADMISSION_DISCOUNT",
    module: "students",
    resourceId: String(batch._id),
    resourceName: studentName,
    details: `Requested ৳${requestedAmount.toLocaleString()} admission discount for ${studentName} in ${course.title}, batch ${batch.batchName}. Reason: ${reason}`,
  });

  return { success: true };
}

export async function getAdmissionDiscountRequests() {
  const actor = await getCurrentAdminProfile();
  if (!actor || !["admin", "super_admin"].includes(actor.role)) throw new Error("Unauthorized.");
  await connectToDatabase();
  return JSON.parse(JSON.stringify(await AdmissionDiscountRequest.find().populate("course", "title code").populate("batch", "batchName batchCode").sort({ createdAt: -1 }).limit(200).lean()));
}

export async function getAdmissionDiscountRequestForUse(id: string) {
  const actor = await getCurrentAdminProfile();
  if (!actor) throw new Error("Unauthorized.");
  await connectToDatabase();
  const request = await AdmissionDiscountRequest.findById(id).populate("course", "title code").populate("batch", "batchName batchCode").lean();
  if (!request || request.status !== "Approved") throw new Error("Approved discount request not found.");
  if (request.requestedBy.email !== actor.email.toLowerCase() && !["admin", "super_admin"].includes(actor.role)) throw new Error("You cannot use this discount request.");
  return JSON.parse(JSON.stringify(request));
}

export async function reviewAdmissionDiscountRequest(id: string, decision: "Approved" | "Rejected", approvedAmount = 0, adminNotes = "") {
  const actor = await getCurrentAdminProfile();
  if (!actor || !["admin", "super_admin"].includes(actor.role)) throw new Error("Unauthorized.");
  await connectToDatabase();
  const request = await AdmissionDiscountRequest.findById(id).populate("course", "defaultFee");
  if (!request || request.status !== "Pending") throw new Error("Pending discount request not found.");
  const amount = Number(approvedAmount);
  if (decision === "Approved" && (!Number.isFinite(amount) || amount <= 0 || amount > request.requestedAmount || amount > Number((request.course as unknown as {defaultFee:number}).defaultFee || 0))) throw new Error("Approved amount must be positive and cannot exceed the requested discount or course fee.");
  request.status = decision;
  request.approvedAmount = decision === "Approved" ? amount : 0;
  request.adminNotes = adminNotes.trim();
  request.reviewedBy = { email: actor.email.toLowerCase(), name: actor.name || "", date: new Date() };
  await request.save();
  revalidatePath("/students/discount-requests");
  return { success: true };
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
    enrollment.referrer = data.referrerId ? (data.referrerId as unknown as mongoose.Types.ObjectId) : undefined;
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
