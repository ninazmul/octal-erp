"use server";

import { connectToDatabase } from "@/lib/database";
import Subject from "@/lib/database/models/subject.model";
import Course from "@/lib/database/models/course.model";
import Batch from "@/lib/database/models/batch.model";
import Employee from "@/lib/database/models/employee.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import CommissionEntry from "@/lib/database/models/commissionEntry.model";
import { requirePermission, logActivityAndNotify } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ==========================================
// SUBJECT ACTIONS
// ==========================================

export async function getSubjects(params?: { search?: string; status?: string }) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { code: { $regex: params.search, $options: "i" } },
    ];
  }
  if (params?.status === "active") query.isActive = true;
  if (params?.status === "inactive") query.isActive = false;

  // Instructor resource-based scoping: only see subjects on which the instructor is assigned
  if (profile.role === "instructor" || profile.role === "staff") {
    if (!profile.employeeId) return [];
    const [assignedCourseSubjects, assignedBatchSubjects] = await Promise.all([
      Course.find({ instructors: profile.employeeId }).distinct("subject"),
      Batch.find({ instructors: profile.employeeId }).distinct("subject"),
    ]);
    const assignedSubjectIds = Array.from(
      new Set([
        ...assignedCourseSubjects.map((id) => String(id)),
        ...assignedBatchSubjects.map((id) => String(id)),
      ])
    );
    query._id = { $in: assignedSubjectIds };
  }

  const subjects = await Subject.find(query).sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(subjects));
}

export async function createSubject(data: {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to add subjects.");
  }
  await connectToDatabase();

  const existing = await Subject.findOne({ code: data.code.trim().toUpperCase() });
  if (existing) {
    throw new Error(`Subject with code "${data.code}" already exists.`);
  }

  const subject = await Subject.create({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    description: data.description?.trim() || "",
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  await logActivityAndNotify({
    actor,
    action: "CREATE_SUBJECT",
    module: "academic",
    resourceId: String(subject._id),
    resourceName: subject.name,
    details: `Created subject ${subject.name} (${subject.code})`,
  });

  revalidatePath("/academic/subjects");
  return JSON.parse(JSON.stringify(subject));
}

export async function updateSubject(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const actor = await requirePermission("academic", "write");
  if (actor.role === "instructor") {
    throw new Error("Forbidden: Instructors are not permitted to edit subjects.");
  }
  await connectToDatabase();

  const subject = await Subject.findById(id);
  if (!subject) throw new Error("Subject not found");

  if (data.code && data.code.trim().toUpperCase() !== subject.code) {
    const existing = await Subject.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new Error(`Subject code "${data.code}" is already in use.`);
    }
    subject.code = data.code.trim().toUpperCase();
  }

  if (data.name !== undefined) subject.name = data.name.trim();
  if (data.description !== undefined) subject.description = data.description.trim();
  if (data.isActive !== undefined) subject.isActive = data.isActive;

  await subject.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_SUBJECT",
    module: "academic",
    resourceId: String(subject._id),
    resourceName: subject.name,
    details: `Updated subject ${subject.name}`,
  });

  revalidatePath("/academic/subjects");
  return JSON.parse(JSON.stringify(subject));
}

// ==========================================
// COURSE ACTIONS
// ==========================================

export async function getCourses(params?: {
  subjectId?: string;
  search?: string;
  status?: string;
}) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.subjectId) query.subject = params.subjectId;
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
    .populate("subject", "name code")
    .populate("instructors", "fullName employeeId email")
    .sort({ title: 1 })
    .lean();

  return JSON.parse(JSON.stringify(courses));
}

export async function createCourse(data: {
  title: string;
  code: string;
  subjectId: string;
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
  await connectToDatabase();

  const existing = await Course.findOne({ code: data.code.trim().toUpperCase() });
  if (existing) {
    throw new Error(`Course with code "${data.code}" already exists.`);
  }

  const course = await Course.create({
    title: data.title.trim(),
    code: data.code.trim().toUpperCase(),
    subject: data.subjectId,
    description: data.description?.trim() || "",
    durationMonths: data.durationMonths || 3,
    defaultFee: data.defaultFee || 0,
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
    subjectId?: string;
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
  if (data.subjectId !== undefined)
    course.subject = data.subjectId as unknown as mongoose.Types.ObjectId;
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
    .populate("subject", "name code")
    .populate("instructors", "fullName employeeId email")
    .sort({ startDate: -1 })
    .lean();

  // Fetch all summaries in two grouped queries instead of one pair of queries per batch.
  const batchIds = batches.map((batch) => batch._id);
  const [enrollmentSummaries, commissionSummaries] = batchIds.length
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
      ])
    : [[], []];
  const enrollmentsByBatch = new Map(
    enrollmentSummaries.map((summary) => [String(summary._id), summary])
  );
  const commissionsByBatch = new Map(
    commissionSummaries.map((summary) => [String(summary._id), summary])
  );
  const batchSummaries = batches.map((batch) => ({
    ...batch,
    totalEnrollments: enrollmentsByBatch.get(String(batch._id))?.totalEnrollments || 0,
    totalAgreedFees: enrollmentsByBatch.get(String(batch._id))?.totalAgreedFees || 0,
    totalCollected: enrollmentsByBatch.get(String(batch._id))?.totalCollected || 0,
    totalDue: enrollmentsByBatch.get(String(batch._id))?.totalDue || 0,
    totalCommissionEarned: commissionsByBatch.get(String(batch._id))?.totalCommissionEarned || 0,
  }));

  return JSON.parse(JSON.stringify(batchSummaries));
}

export async function getBatchById(id: string) {
  const profile = await requirePermission("academic", "read");
  await connectToDatabase();

  const batch = await Batch.findById(id)
    .populate("course", "title code defaultFee durationMonths")
    .populate("subject", "name code")
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
      commissions,
      totalEnrollments: enrollments.length,
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
  subjectId: string;
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
  const payoutValue = payoutType === "none" ? 0 : Number(data.instructorPayoutValue || 0);
  if (!Number.isFinite(payoutValue) || payoutValue < 0 || (payoutType === "percentage" && payoutValue > 100)) {
    throw new Error("Instructor batch payout must be a valid non-negative amount (percentage up to 100).");
  }

  const batch = await Batch.create({
    batchCode: data.batchCode.trim().toUpperCase(),
    batchName: data.batchName.trim(),
    course: data.courseId,
    subject: data.subjectId,
    instructors: data.instructors,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    scheduleDescription: data.scheduleDescription?.trim() || "",
    maxCapacity: data.maxCapacity || 30,
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

  if (data.batchName !== undefined) batch.batchName = data.batchName.trim();
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
  return JSON.parse(JSON.stringify(batch));
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
