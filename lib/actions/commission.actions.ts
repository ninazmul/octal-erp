"use server";

import { connectToDatabase } from "@/lib/database";
import CommissionRule from "@/lib/database/models/commissionRule.model";
import CommissionEntry from "@/lib/database/models/commissionEntry.model";
import Settlement from "@/lib/database/models/settlement.model";
import Payout from "@/lib/database/models/payout.model";
import Batch from "@/lib/database/models/batch.model";
import Employee from "@/lib/database/models/employee.model";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import Counter from "@/lib/database/models/counter.model";
import { formatSL } from "@/lib/utils";
import {
  requirePermission,
  requireSuperAdmin,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { normalizePagination } from "@/lib/utils";

async function getNextSettlementNo(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_settlement_no",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SET-${formatSL(counter.seq, 6)}`;
}

async function getNextPayoutNo(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_payout_no",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PO-${formatSL(counter.seq, 6)}`;
}

async function getNextLedgerEntryNo(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_ledger_no",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `LED-${formatSL(counter.seq, 6)}`;
}

// ==========================================
// COMMISSION RULES CONFIGURATION
// ==========================================

export async function getCommissionRules() {
  await requirePermission("commissions", "read");
  await connectToDatabase();

  const rules = await CommissionRule.find()
    .populate("referrer", "fullName employeeId email phone")
    .populate("course", "title code")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(rules));
}

export async function saveCommissionRule(data: {
  referrerId: string;
  courseId?: string | null;
  percentage: number;
  calculationBasis?: "collections" | "enrollment_fee";
  notes?: string;
}) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const percentage = Math.max(0, Math.min(100, Number(data.percentage)));
  const referrer = await Employee.findById(data.referrerId);
  if (!referrer) throw new Error("Instructor / referrer not found");

  const query: Record<string, unknown> = { referrer: data.referrerId };
  if (data.courseId) query.course = data.courseId;
  else query.course = null;

  let rule = await CommissionRule.findOne(query);
  if (rule) {
    rule.percentage = percentage;
    if (data.notes !== undefined) rule.notes = data.notes.trim();
    rule.isActive = true;
    await rule.save();
  } else {
    rule = await CommissionRule.create({
      referrer: data.referrerId,
      course: data.courseId || null,
      percentage,
      calculationBasis: data.calculationBasis || "collections",
      effectiveFrom: new Date(),
      isActive: true,
      notes: data.notes?.trim() || "",
    });
  }

  await logActivityAndNotify({
    actor,
    action: "CONFIGURE_COMMISSION_RULE",
    module: "commissions",
    resourceId: String(rule._id),
    resourceName: referrer.fullName,
    details: `Configured commission rate ${percentage}% for ${referrer.fullName} (${referrer.employeeId}) ${data.courseId ? "on specific course" : "globally"}`,
  });

  revalidatePath("/finance/commissions");
  return JSON.parse(JSON.stringify(rule));
}

// ==========================================
// GET COMMISSION ENTRIES
// ==========================================

export async function getCommissionEntries(params?: {
  instructorId?: string;
  batchId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const profile = await requirePermission("commissions", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params?.status) query.status = params.status;
  if (params?.batchId) query.batch = params.batchId;

  // Instructor scoping: can only see their own commissions
  if (profile.role === "instructor") {
    if (!profile.employeeId) {
      return { entries: [], total: 0, page: 1, totalPages: 0 };
    }
    query.referrer = profile.employeeId;
  } else if (params?.instructorId) {
    query.referrer = params.instructorId;
  }

  const { page, limit } = normalizePagination(params?.page, params?.limit);
  const skip = (page - 1) * limit;

  const total = await CommissionEntry.countDocuments(query);
  const entries = await CommissionEntry.find(query)
    .populate("referrer", "fullName employeeId email")
    .populate({
      path: "payment",
      select: "receiptNo amount paymentDate paymentMethod",
    })
    .populate({
      path: "enrollment",
      populate: { path: "student", select: "fullName studentId" },
    })
    .populate("batch", "batchCode batchName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return JSON.parse(
    JSON.stringify({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  );
}

// ==========================================
// BATCH SETTLEMENT & STATEMENTS
// ==========================================

export async function getBatchSettlementStatement(batchId: string, instructorId: string) {
  const profile = await requirePermission("commissions", "read");
  await connectToDatabase();

  if (profile.role === "instructor" && profile.employeeId !== instructorId) {
    throw new Error("Forbidden: You can only view your own commission statement.");
  }

  const batch = await Batch.findById(batchId)
    .populate("course", "title code")
    .lean();
  if (!batch) throw new Error("Batch not found");

  const instructor = await Employee.findById(instructorId).lean();
  if (!instructor) throw new Error("Instructor not found");
  if (
    profile.role === "instructor" &&
    !batch.instructors.some((assignedInstructor) => String(assignedInstructor) === String(instructor._id))
  ) {
    throw new Error("Forbidden: You are not assigned to this batch.");
  }

  // Eligible confirmed commission entries for this instructor and batch
  const eligibleEntries = await CommissionEntry.find({
    batch: batchId,
    referrer: instructorId,
    status: { $in: ["earned", "awaiting_settlement", "approved_payable"] },
  })
    .populate("payment", "receiptNo amount paymentDate")
    .populate({
      path: "enrollment",
      populate: { path: "student", select: "fullName studentId" },
    })
    .lean();

  const totalEligibleCollections = eligibleEntries.reduce(
    (sum, e) => sum + (e.collectedAmount || 0),
    0
  );
  const grossCommission = eligibleEntries.reduce(
    (sum, e) => sum + (e.commissionEarned || 0),
    0
  );
  const alreadyPaid = eligibleEntries.reduce(
    (sum, e) => sum + (e.paidAmount || 0),
    0
  );
  const netPayable = Math.max(0, grossCommission - alreadyPaid);

  return JSON.parse(
    JSON.stringify({
      batch,
      instructor,
      eligibleEntries,
      eligibleCollectionsCount: eligibleEntries.length,
      totalEligibleCollections,
      grossCommission,
      alreadyPaid,
      netPayable,
    })
  );
}

export async function getSettlements(params?: {
  batchId?: string;
  instructorId?: string;
  status?: string;
}) {
  const profile = await requirePermission("commissions", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.batchId) query.batch = params.batchId;
  if (params?.status) query.status = params.status;

  if (profile.role === "instructor") {
    if (!profile.employeeId) return [];
    query.instructor = profile.employeeId;
  } else if (params?.instructorId) {
    query.instructor = params.instructorId;
  }

  const settlements = await Settlement.find(query)
    .populate("batch", "batchCode batchName")
    .populate("instructor", "fullName employeeId email phone")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(settlements));
}

export async function createSettlement(data: {
  batchId: string;
  instructorId: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  deductions?: number;
  notes?: string;
}) {
  const actor = await requirePermission("commissions", "write");
  await connectToDatabase();

  const statement = await getBatchSettlementStatement(
    data.batchId,
    data.instructorId
  );

  if (statement.netPayable <= 0) {
    throw new Error("No eligible payable commission remains for this settlement.");
  }

  const deductions = Math.max(0, Number(data.deductions || 0));
  const netPayableAfterDeductions = Math.max(0, statement.netPayable - deductions);

  const settlementNo = await getNextSettlementNo();
  const settlement = await Settlement.create({
    settlementNo,
    batch: data.batchId,
    instructor: data.instructorId,
    periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
    periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
    eligibleCollectionsCount: statement.eligibleCollectionsCount,
    totalEligibleCollections: statement.totalEligibleCollections,
    grossCommission: statement.grossCommission,
    deductions,
    netPayable: netPayableAfterDeductions,
    paidAmount: 0,
    dueAmount: netPayableAfterDeductions,
    status: "Draft",
    notes: data.notes?.trim() || "",
  });

  // Link entries to this settlement
  await CommissionEntry.updateMany(
    {
      batch: data.batchId,
      referrer: data.instructorId,
      status: { $in: ["earned", "awaiting_settlement"] },
    },
    {
      $set: {
        settlementId: settlement._id,
        status: "awaiting_settlement",
      },
    }
  );

  await logActivityAndNotify({
    actor,
    action: "CREATE_SETTLEMENT",
    module: "commissions",
    resourceId: String(settlement._id),
    resourceName: settlementNo,
    details: `Generated settlement statement ${settlementNo} for ${statement.instructor.fullName} in batch ${statement.batch.batchName}. Net payable: ৳${netPayableAfterDeductions.toLocaleString()}`,
  });

  revalidatePath("/finance/settlements");
  return JSON.parse(JSON.stringify(settlement));
}

export async function approveSettlement(settlementId: string) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const settlement = await Settlement.findById(settlementId)
    .populate("instructor", "fullName")
    .populate("batch", "batchName");

  if (!settlement) throw new Error("Settlement not found");

  settlement.status = "Approved";
  settlement.approvedBy = {
    email: actor.email,
    name: actor.name || "",
    userId: actor._id,
    date: new Date(),
  };
  await settlement.save();

  await CommissionEntry.updateMany(
    { settlementId: settlement._id },
    { $set: { status: "approved_payable" } }
  );

  await logActivityAndNotify({
    actor,
    action: "APPROVE_SETTLEMENT",
    module: "commissions",
    resourceId: String(settlement._id),
    resourceName: settlement.settlementNo,
    details: `Approved settlement ${settlement.settlementNo} of ৳${settlement.netPayable.toLocaleString()}`,
  });

  revalidatePath("/finance/settlements");
  return JSON.parse(JSON.stringify(settlement));
}

// ==========================================
// DISBURSE COMMISSION PAYOUT
// ==========================================

export async function disburseCommissionPayout(data: {
  settlementId: string;
  amount: number;
  paymentMethod:
    | "Cash"
    | "Bank Transfer"
    | "bKash"
    | "Nagad"
    | "Rocket"
    | "Card"
    | "Other";
  transactionRef?: string;
  accountId?: string;
  notes?: string;
}) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const amount = Number(data.amount);
  if (!amount || amount <= 0) {
    throw new Error("Payout amount must be greater than zero.");
  }

  const settlement = await Settlement.findById(data.settlementId)
    .populate("instructor", "fullName employeeId")
    .populate("batch", "batchCode batchName");

  if (!settlement) throw new Error("Settlement not found");
  if (settlement.status !== "Approved") {
    throw new Error("Settlement must be Approved by Super Admin before disbursing payout.");
  }

  const instructorObj = settlement.instructor as unknown as { _id: string; fullName: string };
  const batchObj = settlement.batch as unknown as { _id: string; batchName: string };

  if (amount > settlement.dueAmount) {
    throw new Error(
      `Disbursement amount (৳${amount.toLocaleString()}) exceeds the settlement due of ৳${settlement.dueAmount.toLocaleString()}.`
    );
  }

  const payoutNo = await getNextPayoutNo();
  const payoutDate = new Date();

  // 1. Create Payout Record
  const payout = await Payout.create({
    payoutNo,
    instructor: instructorObj._id,
    settlement: settlement._id,
    batchBreakdown: [
      {
        batchId: String(batchObj._id),
        batchName: batchObj.batchName,
        amount,
      },
    ],
    amount,
    paymentMethod: data.paymentMethod,
    transactionRef: data.transactionRef?.trim() || "",
    accountId: data.accountId || null,
    payoutDate,
    paidBy: {
      email: actor.email,
      name: actor.name || "",
      userId: actor._id,
    },
    notes: data.notes?.trim() || "",
  });

  // 2. Update Settlement Paid / Due
  settlement.paidAmount += amount;
  settlement.dueAmount = Math.max(0, settlement.netPayable - settlement.paidAmount);
  if (settlement.dueAmount === 0) {
    settlement.status = "Disbursed";
  }
  await settlement.save();

  // 3. Mark Commission Entries
  await CommissionEntry.updateMany(
    { settlementId: settlement._id },
    {
      $set: {
        status: settlement.dueAmount === 0 ? "fully_paid" : "partially_paid",
        paidAmount: amount,
        remainingCommission: settlement.dueAmount,
      },
    }
  );

  // 4. Update Cash Account and record DEBIT in Ledger
  let targetAccount = null;
  if (data.accountId) {
    targetAccount = await Account.findById(data.accountId);
  }
  if (!targetAccount) {
    targetAccount = await Account.findOne({ isDefault: true, isActive: true });
  }
  if (!targetAccount) {
    targetAccount = await Account.findOne({ isActive: true });
  }

  if (targetAccount) {
    const balanceAfter = Math.max(0, targetAccount.currentBalance - amount);
    targetAccount.currentBalance = balanceAfter;
    await targetAccount.save();

    const entryNo = await getNextLedgerEntryNo();
    await Ledger.create({
      entryNo,
      account: targetAccount._id,
      type: "DEBIT", // Cash out
      amount,
      balanceAfter,
      sourceModule: "commissions",
      sourceReferenceId: payoutNo,
      description: `Commission payout ${payoutNo} to ${instructorObj.fullName} for batch ${batchObj.batchName} (${data.paymentMethod})`,
      transactionDate: payoutDate,
      recordedBy: {
        email: actor.email,
        name: actor.name || "",
        userId: actor._id,
      },
    });
  }

  await logActivityAndNotify({
    actor,
    action: "DISBURSE_COMMISSION_PAYOUT",
    module: "commissions",
    resourceId: String(payout._id),
    resourceName: payoutNo,
    details: `Disbursed ৳${amount.toLocaleString()} commission payout (${payoutNo}) to ${instructorObj.fullName} for batch ${batchObj.batchName}. Remaining settlement balance: ৳${settlement.dueAmount.toLocaleString()}`,
  });

  revalidatePath("/finance/settlements");
  revalidatePath("/finance/commissions");
  return JSON.parse(JSON.stringify(payout));
}

