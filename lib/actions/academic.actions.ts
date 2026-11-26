"use server";

import { connectToDatabase } from "@/lib/database";
import Course from "@/lib/database/models/course.model";
import Batch from "@/lib/database/models/batch.model";
import FreeBatchAdmission from "@/lib/database/models/freeBatchAdmission.model";
import Employee from "@/lib/database/models/employee.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import CommissionEntry from "@/lib/database/models/commissionEntry.model";
import AdmissionDiscountRequest from "@/lib/database/models/admissionDiscountRequest.model";
import { requirePermission, logActivityAndNotify } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ==========================================
// COURSE ACTIONS
// ==========================================

export async function getCourses(params?: { search?: string; status?: string }) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.status === "active") query.isActive = true;
  if (params?.status === "inactive") query.isActive = false;

  if (params?.search) {
    query.$or = [
      { title: { $regex: params.search, $options: "i" } },
      { code: { $regex: params.search, $options: "i" } },
    ];
  }

  // Instructor resource-based scoping: only see assigned courses (directly or via assigned batch)
  if (profile.role === "instructor" || profile.role === "staff") {
    if (!profile.employeeId) return [];
    const batchCourseIds = await Batch.find({ instructors: profile.employeeId }).distinct("course");
    query.$or = [
      { instructors: profile.employeeId },
      { _id: { $in: batchCourseIds } },
    ];
  }

  const courses = await Course.find(query)
    .populate("instructors", "fullName employeeId email")
    .sort({ title: 1 })
    .lean();

  return JSON.parse(JSON.stringify(courses));
}

export async function createCourse(data: {
  title: string;
  code: string;
  description?: string;
  durationMonths: number;
  defaultFee: number;
  instructors?: string[];
  isActive?: boolean;
}) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to add courses.");
  }
  const durationMonths = Number(data.durationMonths);
  const defaultFee = Number(data.defaultFee);
  if (!Number.isFinite(durationMonths) || durationMonths < 0.5 || durationMonths > 48 || Math.abs(durationMonths * 2 - Math.round(durationMonths * 2)) > 1e-8) {
    throw new Error("Course duration must be between 0.5 and 48 months in half-month increments.");
  }
  if (!Number.isFinite(defaultFee) || defaultFee < 0) {
    throw new Error("Course fee must be a valid non-negative amount.");
  }
  await connectToDatabase();

  const existing = await Course.findOne({ code: data.code.trim().toUpperCase() });
  if (existing) {
    throw new Error(`Course with code "${data.code}" already exists.`);
  }

  const course = await Course.create({
    title: data.title.trim(),
    code: data.code.trim().toUpperCase(),
    description: data.description?.trim() || "",
    durationMonths,
    defaultFee,
    instructors: data.instructors || [],
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  await logActivityAndNotify({
    actor,
    action: "CREATE_COURSE",
    module: "academic",
    resourceId: String(course._id),
    resourceName: course.title,
    details: `Created course ${course.title} (${course.code})`,
  });

  revalidatePath("/academic/courses");
  return JSON.parse(JSON.stringify(course));
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    code?: string;
    description?: string;
    durationMonths?: number;
    defaultFee?: number;
    instructors?: string[];
    isActive?: boolean;
  }
) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to edit courses.");
  }
  await connectToDatabase();

  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");

  if (data.code && data.code.trim().toUpperCase() !== course.code) {
    const existing = await Course.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new Error(`Course code "${data.code}" is already in use.`);
    }
    course.code = data.code.trim().toUpperCase();
  }

  if (data.title !== undefined) course.title = data.title.trim();
  if (data.description !== undefined) course.description = data.description.trim();
  if (data.durationMonths !== undefined) course.durationMonths = data.durationMonths;
  if (data.defaultFee !== undefined) course.defaultFee = data.defaultFee;
  if (data.instructors !== undefined)
    course.instructors = (data.instructors || []) as unknown as mongoose.Types.ObjectId[];
  if (data.isActive !== undefined) course.isActive = data.isActive;

  await course.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_COURSE",
    module: "academic",
    resourceId: String(course._id),
    resourceName: course.title,
    details: `Updated course ${course.title}`,
  });

  revalidatePath("/academic/courses");
  return JSON.parse(JSON.stringify(course));
}

// ==========================================
// BATCH ACTIONS
// ==========================================

export async function getBatches(params?: {
  courseId?: string;
  status?: string;
  financialStatus?: string;
  search?: string;
}) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.courseId) query.course = params.courseId;
  if (params?.status) query.status = params.status;
  if (params?.financialStatus) query.financialStatus = params.financialStatus;

  if (params?.search) {
    query.$or = [
      { batchName: { $regex: params.search, $options: "i" } },
      { batchCode: { $regex: params.search, $options: "i" } },
    ];
  }

  // Instructor resource-based scoping: only see assigned batches
  if (profile.role === "instructor" || profile.role === "staff") {
    if (!profile.employeeId) return [];
    query.instructors = profile.employeeId;
  }

  const batches = await Batch.find(query)
    .populate("course", "title code defaultFee")
    .populate("instructors", "fullName employeeId email")
    .sort({ startDate: -1 })
    .lean();

  // Fetch all summaries in two grouped queries instead of one pair of queries per batch.
  const batchIds = batches.map((batch) => batch._id);
  const [enrollmentSummaries, commissionSummaries, freeAdmissionSummaries] = batchIds.length
    ? await Promise.all([
        Enrollment.aggregate([
          { $match: { batch: { $in: batchIds } } },
          {
            $group: {
              _id: "$batch",
              totalEnrollments: { $sum: 1 },
              totalAgreedFees: { $sum: { $ifNull: ["$finalPayableAmount", 0] } },
              totalCollected: { $sum: { $ifNull: ["$totalCollectedAmount", 0] } },
              totalDue: { $sum: { $ifNull: ["$remainingDue", 0] } },
            },
          },
        ]),
        CommissionEntry.aggregate([
          { $match: { batch: { $in: batchIds } } },
          {
            $group: {
              _id: "$batch",
              totalCommissionEarned: { $sum: { $ifNull: ["$commissionEarned", 0] } },
            },
          },
        ]),
        FreeBatchAdmission.aggregate([
          { $match: { batch: { $in: batchIds } } },
          { $group: { _id: "$batch", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } } },
        ]),
      ])
    : [[], [], []];
  const enrollmentsByBatch = new Map(
    enrollmentSummaries.map((summary) => [String(summary._id), summary])
  );
  const commissionsByBatch = new Map(
    commissionSummaries.map((summary) => [String(summary._id), summary])
  );
  const freeAdmissionsByBatch = new Map(
    freeAdmissionSummaries.map((summary) => [String(summary._id), summary])
  );
  const batchSummaries = batches.map((batch) => ({
    ...batch,
    totalEnrollments: batch.feeType === "Free"
      ? freeAdmissionsByBatch.get(String(batch._id))?.count || 0
      : enrollmentsByBatch.get(String(batch._id))?.totalEnrollments || 0,
    totalFreeAdmissions: freeAdmissionsByBatch.get(String(batch._id))?.count || 0,
    completedFreeAdmissions: freeAdmissionsByBatch.get(String(batch._id))?.completed || 0,
    totalAgreedFees: batch.feeType === "Free" ? 0 : enrollmentsByBatch.get(String(batch._id))?.totalAgreedFees || 0,
    totalCollected: batch.feeType === "Free" ? 0 : enrollmentsByBatch.get(String(batch._id))?.totalCollected || 0,
    totalDue: batch.feeType === "Free" ? 0 : enrollmentsByBatch.get(String(batch._id))?.totalDue || 0,
    totalCommissionEarned: commissionsByBatch.get(String(batch._id))?.totalCommissionEarned || 0,
  }));

  return JSON.parse(JSON.stringify(batchSummaries));
}

export async function getBatchById(id: string) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const batch = await Batch.findById(id)
    .populate("course", "title code defaultFee durationMonths")
    .populate("instructors", "fullName employeeId email phone")
    .lean();

  if (!batch) throw new Error("Batch not found");

  // Validate instructor access
  if (profile.role === "instructor" || profile.role === "staff") {
    if (!profile.employeeId) throw new Error("Forbidden: Instructor profile is not linked to an employee.");
    const isAssigned = batch.instructors?.some(
      (inst: { _id: unknown; employeeId?: string }) =>
        String(inst._id) === profile.employeeId || inst.employeeId === profile.employeeId
    );
    if (!isAssigned) {
      throw new Error("Forbidden: You are not assigned to this batch.");
    }
  }

  // Fetch enrollments for this batch
  const enrollments = await Enrollment.find({ batch: id })
    .populate("student", "fullName studentId phone email status")
    .sort({ createdAt: -1 })
    .lean();

  const freeAdmissions = batch.feeType === "Free"
    ? await FreeBatchAdmission.find({ batch: id })
        .populate("student", "fullName studentId phone email")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  // Compute metrics
  const totalAgreedFees = enrollments.reduce((sum, e) => sum + (e.finalPayableAmount || 0), 0);
  const totalCollected = enrollments.reduce((sum, e) => sum + (e.totalCollectedAmount || 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + (e.remainingDue || 0), 0);

  const commissions = await CommissionEntry.find({ batch: id })
    .populate("referrer", "fullName employeeId")
    .populate("enrollment", "enrollmentId finalPayableAmount")
    .sort({ createdAt: -1 })
    .lean();

  const totalCommissionEarned = commissions.reduce(
    (sum, c) => sum + (c.commissionEarned || 0),
    0
  );
  const totalCommissionPaid = commissions.reduce(
    (sum, c) => sum + (c.paidAmount || 0),
    0
  );

  return JSON.parse(
    JSON.stringify({
      ...batch,
      enrollments,
      freeAdmissions,
      commissions,
      totalEnrollments: batch.feeType === "Free" ? freeAdmissions.length : enrollments.length,
      totalFreeAdmissions: freeAdmissions.length,
      completedFreeAdmissions: freeAdmissions.filter((admission) => admission.status === "Completed").length,
      totalAgreedFees,
      totalCollected,
      totalDue,
      totalCommissionEarned,
      totalCommissionPaid,
    })
  );
}

export async function createBatch(data: {
  batchCode: string;
  batchName: string;
  courseId: string;
  feeType?: "Paid" | "Free";
  courseType?: "NSDA" | "BTEB" | "Custom";
  registrationAmount?: number;
  instructors: string[];
  startDate: string | Date;
  endDate?: string | Date;
  scheduleDescription?: string;
  maxCapacity?: number;
  notes?: string;
  instructorPayoutType?: "none" | "percentage" | "fixed";
  instructorPayoutValue?: number;
}) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to create batches.");
  }
  await connectToDatabase();
  if ((data.instructors || []).filter(Boolean).length > 1) {
    throw new Error("A batch can have only one assigned instructor.");
  }

  const existing = await Batch.findOne({ batchCode: data.batchCode.trim().toUpperCase() });
  if (existing) {
    throw new Error(`Batch code "${data.batchCode}" is already in use.`);
  }

  const payoutType = data.instructorPayoutType || "none";
  const registrationAmount = Number(data.registrationAmount || 0);
  if (!Number.isFinite(registrationAmount) || registrationAmount < 0) throw new Error("Registration amount must be a valid non-negative amount.");
  const payoutValue = payoutType === "none" ? 0 : Number(data.instructorPayoutValue || 0);
  if (!Number.isFinite(payoutValue) || payoutValue < 0 || (payoutType === "percentage" && payoutValue > 100)) {
    throw new Error("Instructor batch payout must be a valid non-negative amount (percentage up to 100).");
  }

  const batch = await Batch.create({
    batchCode: data.batchCode.trim().toUpperCase(),
    batchName: data.batchName.trim(),
    course: data.courseId,
    feeType: data.feeType || "Paid",
    courseType: data.courseType || "Custom",
    registrationAmount,
    instructors: data.instructors,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    scheduleDescription: data.scheduleDescription?.trim() || "",
    maxCapacity: data.maxCapacity || 12,
    status: "Upcoming",
    financialStatus: "Open",
    notes: data.notes?.trim() || "",
    instructorPayoutType: payoutType,
    instructorPayoutValue: payoutValue,
  });

  await logActivityAndNotify({
    actor,
    action: "CREATE_BATCH",
    module: "academic",
    resourceId: String(batch._id),
    resourceName: batch.batchName,
    details: `Created batch ${batch.batchName} (${batch.batchCode})`,
  });

  revalidatePath("/academic/batches");
  return JSON.parse(JSON.stringify(batch));
}

export async function updateBatch(
  id: string,
  data: {
    batchName?: string;
    feeType?: "Paid" | "Free";
    courseType?: "NSDA" | "BTEB" | "Custom";
    registrationAmount?: number;
    instructors?: string[];
    startDate?: string | Date;
    endDate?: string | Date;
    scheduleDescription?: string;
    maxCapacity?: number;
    status?: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
    financialStatus?: "Open" | "Settling" | "Settled";
    notes?: string;
    instructorPayoutType?: "none" | "percentage" | "fixed";
    instructorPayoutValue?: number;
  }
) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to edit batches.");
  }
  await connectToDatabase();
  if (data.instructors && data.instructors.filter(Boolean).length > 1) {
    throw new Error("A batch can have only one assigned instructor.");
  }

  const batch = await Batch.findById(id);
  if (!batch) throw new Error("Batch not found");

  if (data.feeType !== undefined && data.feeType !== (batch.feeType || "Paid")) {
    const [hasEnrollments, hasFreeAdmissions, hasOpenDiscountRequests] = await Promise.all([
      Enrollment.exists({ batch: batch._id }),
      FreeBatchAdmission.exists({ batch: batch._id }),
      AdmissionDiscountRequest.exists({ batch: batch._id, status: { $in: ["Pending", "Approved"] } }),
    ]);
    if (hasEnrollments || hasFreeAdmissions || hasOpenDiscountRequests) {
      throw new Error("Batch type cannot be changed after an admission or open discount request exists.");
    }
    batch.feeType = data.feeType;
  }

  if (data.batchName !== undefined) batch.batchName = data.batchName.trim();
  if (data.courseType !== undefined) batch.courseType = data.courseType;
  if (data.registrationAmount !== undefined) {
    const amount = Number(data.registrationAmount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Registration amount must be a valid non-negative amount.");
    batch.registrationAmount = amount;
  }
  if (data.instructorPayoutType !== undefined) {
    batch.instructorPayoutType = data.instructorPayoutType;
  }
  if (data.instructorPayoutValue !== undefined) {
    const value = Number(data.instructorPayoutValue);
    const type = data.instructorPayoutType || batch.instructorPayoutType;
    if (!Number.isFinite(value) || value < 0 || (type === "percentage" && value > 100)) {
      throw new Error("Instructor batch payout must be a valid non-negative amount (percentage up to 100).");
    }
    batch.instructorPayoutValue = value;
  }
  if (data.instructors !== undefined)
    batch.instructors = (data.instructors || []) as unknown as mongoose.Types.ObjectId[];
  if (data.startDate !== undefined) batch.startDate = new Date(data.startDate);
  if (data.endDate !== undefined)
    batch.endDate = data.endDate ? new Date(data.endDate) : undefined;
  if (data.scheduleDescription !== undefined)
    batch.scheduleDescription = data.scheduleDescription.trim();
  if (data.maxCapacity !== undefined) batch.maxCapacity = data.maxCapacity;
  if (data.status !== undefined) batch.status = data.status;
  if (data.financialStatus !== undefined) batch.financialStatus = data.financialStatus;
  if (data.notes !== undefined) batch.notes = data.notes.trim();

  await batch.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_BATCH",
    module: "academic",
    resourceId: String(batch._id),
    resourceName: batch.batchName,
    details: `Updated batch ${batch.batchName} status to ${batch.status}`,
  });

  revalidatePath("/academic/batches");
  revalidatePath(`/academic/batches/${id}`);
  return JSON.parse(JSON.stringify(batch));
}

export async function completeFreeBatchAdmission(admissionId: string) {
  const actor = await requirePermission("students", "write");
  await connectToDatabase();
  const admission = await FreeBatchAdmission.findById(admissionId).populate("batch", "batchName feeType");
  if (!admission) throw new Error("Free batch admission not found.");
  const batch = admission.batch as unknown as { _id: mongoose.Types.ObjectId; batchName: string; feeType: string };
  if (batch.feeType !== "Free") throw new Error("This admission does not belong to a free batch.");
  if (admission.status === "Completed") throw new Error("This free batch admission is already completed.");

  admission.status = "Completed";
  admission.completedBy = {
    email: actor.email,
    name: actor.name || "",
    userId: String(actor._id),
    date: new Date(),
  };
  await admission.save();
  await logActivityAndNotify({
    actor,
    action: "COMPLETE_FREE_BATCH_ADMISSION",
    module: "students",
    resourceId: String(admission._id),
    resourceName: String(admission.student),
    details: `Approved free admission in batch ${batch.batchName}.`,
  });

  revalidatePath("/academic/batches");
  revalidatePath(`/academic/batches/${batch._id}`);
  revalidatePath("/students");
  return JSON.parse(JSON.stringify(admission));
}

// Mark academic completion separate from financial settlement
export async function closeBatchAcademically(id: string) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to close batches.");
  }
  await connectToDatabase();

  const batch = await Batch.findById(id);
  if (!batch) throw new Error("Batch not found");

  batch.status = "Completed";
  await batch.save();

  await logActivityAndNotify({
    actor,
    action: "COMPLETE_BATCH_ACADEMIC",
    module: "academic",
    resourceId: String(batch._id),
    resourceName: batch.batchName,
    details: `Academically completed batch ${batch.batchName}. Financial status remains ${batch.financialStatus}.`,
  });

  revalidatePath("/academic/batches");
  return JSON.parse(JSON.stringify(batch));
}

// Helper to get instructors for course & batch assignments
export async function getInstructorOptions() {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {
    $or: [{ isInstructor: true }, { department: "Academic" }],
    status: { $ne: "Terminated" },
  };
  if (profile.role === "instructor") {
    if (!profile.employeeId) return [];
    query._id = profile.employeeId;
    delete query.$or;
  }

  const instructors = await Employee.find(query)
    .select("_id fullName employeeId email phone designation")
    .sort({ fullName: 1 })
    .lean();

  return JSON.parse(JSON.stringify(instructors));
}
