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
  await requirePermission("academic", "read");
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

  // Instructor resource-based scoping: only see assigned courses
  if (profile.role === "instructor" && profile.employeeId) {
    query.instructors = profile.employeeId;
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
  defaultCommissionRate?: number;
  isActive?: boolean;
}) {
  const actor = await requirePermission("academic", "write");
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
    defaultCommissionRate: data.defaultCommissionRate ?? 20,
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
    defaultCommissionRate?: number;
    isActive?: boolean;
  }
) {
  const actor = await requirePermission("academic", "write");
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
  if (data.defaultCommissionRate !== undefined)
    course.defaultCommissionRate = data.defaultCommissionRate;
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
  if (profile.role === "instructor" && profile.employeeId) {
    query.instructors = profile.employeeId;
  }

  const batches = await Batch.find(query)
    .populate("course", "title code defaultFee")
    .populate("subject", "name code")
    .populate("instructors", "fullName employeeId email")
    .sort({ startDate: -1 })
    .lean();

  // Aggregate real-time statistics per batch
  const batchSummaries = await Promise.all(
    batches.map(async (batch) => {
      const enrollments = await Enrollment.find({ batch: batch._id }).lean();
      const totalEnrollments = enrollments.length;
      const totalAgreedFees = enrollments.reduce((sum, e) => sum + (e.finalPayableAmount || 0), 0);
      const totalCollected = enrollments.reduce((sum, e) => sum + (e.totalCollectedAmount || 0), 0);
      const totalDue = enrollments.reduce((sum, e) => sum + (e.remainingDue || 0), 0);

      const commissions = await CommissionEntry.find({ batch: batch._id }).lean();
      const totalCommissionEarned = commissions.reduce(
        (sum, c) => sum + (c.commissionEarned || 0),
        0
      );

      return {
        ...batch,
        totalEnrollments,
        totalAgreedFees,
        totalCollected,
        totalDue,
        totalCommissionEarned,
      };
    })
  );

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
  if (profile.role === "instructor" && profile.employeeId) {
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
    .populate("referrer", "fullName employeeId")
    .sort({ createdAt: -1 })
    .lean();

  // Compute metrics
  const totalAgreedFees = enrollments.reduce((sum, e) => sum + (e.finalPayableAmount || 0), 0);
  const totalCollected = enrollments.reduce((sum, e) => sum + (e.totalCollectedAmount || 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + (e.remainingDue || 0), 0);

  const commissions = await CommissionEntry.find({ batch: id })
    .populate("referrer", "fullName employeeId")
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
}) {
  const actor = await requirePermission("academic", "write");
  await connectToDatabase();

  const existing = await Batch.findOne({ batchCode: data.batchCode.trim().toUpperCase() });
  if (existing) {
    throw new Error(`Batch code "${data.batchCode}" is already in use.`);
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
  }
) {
  const actor = await requirePermission("academic", "write");
  await connectToDatabase();

  const batch = await Batch.findById(id);
  if (!batch) throw new Error("Batch not found");

  if (data.batchName !== undefined) batch.batchName = data.batchName.trim();
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
  await requirePermission("academic", "read");
  await connectToDatabase();

  const instructors = await Employee.find({
    $or: [{ isInstructor: true }, { department: "Academic" }],
    status: { $ne: "Terminated" },
  })
    .select("_id fullName employeeId email phone designation")
    .sort({ fullName: 1 })
    .lean();

  return JSON.parse(JSON.stringify(instructors));
}
