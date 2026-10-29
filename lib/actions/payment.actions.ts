"use server";

import { connectToDatabase } from "@/lib/database";
import Payment from "@/lib/database/models/payment.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import CommissionEntry from "@/lib/database/models/commissionEntry.model";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import Counter from "@/lib/database/models/counter.model";
import { formatSL } from "@/lib/utils";
import {
  requirePermission,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

async function getNextReceiptNo(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_receipt_no",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `REC-${formatSL(counter.seq, 6)}`;
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
// GET PAYMENTS
// ==========================================

export async function getPayments(params?: {
  search?: string;
  status?: string;
  batchId?: string;
  studentId?: string;
  enrollmentId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("payments", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params?.status) query.status = params.status;
  if (params?.batchId) query.batch = params.batchId;
  if (params?.studentId) query.student = params.studentId;
  if (params?.enrollmentId) query.enrollment = params.enrollmentId;
  if (params?.paymentMethod) query.paymentMethod = params.paymentMethod;

  if (params?.startDate || params?.endDate) {
    const dateQuery: Record<string, unknown> = {};
    if (params?.startDate) dateQuery.$gte = new Date(params.startDate);
    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.paymentDate = dateQuery;
  }

  if (params?.search) {
    query.$or = [
      { receiptNo: { $regex: params.search, $options: "i" } },
      { transactionRef: { $regex: params.search, $options: "i" } },
    ];
  }

  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate("student", "fullName studentId phone email")
    .populate({
      path: "enrollment",
      populate: { path: "course", select: "title code" },
    })
    .populate("batch", "batchCode batchName")
    .sort({ paymentDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return JSON.parse(
    JSON.stringify({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  );
}

export async function getPaymentById(id: string) {
  await requirePermission("payments", "read");
  await connectToDatabase();

  const payment = await Payment.findById(id)
    .populate("student", "fullName studentId phone email address")
    .populate({
      path: "enrollment",
      populate: [
        { path: "course", select: "title code defaultFee" },
        { path: "referrer", select: "fullName employeeId" },
      ],
    })
    .populate("batch", "batchCode batchName scheduleDescription")
    .lean();

  if (!payment) throw new Error("Payment not found");
  return JSON.parse(JSON.stringify(payment));
}

// ==========================================
// RECORD PAYMENT (INSTALLMENT / FULL)
// ==========================================

export async function recordPayment(data: {
  enrollmentId: string;
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
  paymentDate?: string | Date;
  status?: "confirmed" | "pending_verification";
  accountId?: string;
  notes?: string;
}) {
  const actor = await requirePermission("payments", "write");
  await connectToDatabase();

  const amount = Number(data.amount);
  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const enrollment = await Enrollment.findById(data.enrollmentId)
    .populate("student", "fullName studentId")
    .populate("batch", "batchCode batchName")
    .populate("course", "title code");

  if (!enrollment) throw new Error("Enrollment record not found");

  const studentObj = enrollment.student as unknown as { _id: string; fullName: string; studentId: string };
  const batchObj = enrollment.batch as unknown as { _id: string; batchName: string; batchCode: string };

  if (amount > enrollment.remainingDue) {
    throw new Error(
      `Payment amount (৳${amount.toLocaleString()}) exceeds the student's remaining due of ৳${enrollment.remainingDue.toLocaleString()}.`
    );
  }

  const paymentStatus = data.status || "confirmed";
  const receiptNo = await getNextReceiptNo();
  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

  // 1. Create Payment Record
  const payment = await Payment.create({
    receiptNo,
    enrollment: enrollment._id,
    student: studentObj._id,
    batch: batchObj._id,
    amount,
    paymentMethod: data.paymentMethod,
    transactionRef: data.transactionRef?.trim() || "",
    status: paymentStatus,
    paymentDate,
    collectedBy: {
      email: actor.email,
      name: actor.name || "",
      userId: actor._id,
    },
    notes: data.notes?.trim() || "",
  });

  // 2. If status is confirmed, apply financial invariants immediately
  if (paymentStatus === "confirmed") {
    // A. Update enrollment financials
    enrollment.totalCollectedAmount += amount;
    enrollment.remainingDue = Math.max(
      0,
      enrollment.finalPayableAmount - enrollment.totalCollectedAmount
    );
    await enrollment.save();

    // B. Trigger Commission Entry if referrer is an instructor
    if (
      enrollment.referrerType === "Instructor" &&
      enrollment.referrer &&
      enrollment.commissionRate > 0
    ) {
      const commissionEarned = Math.round(
        (amount * enrollment.commissionRate) / 100
      );

      await CommissionEntry.create({
        payment: payment._id,
        enrollment: enrollment._id,
        batch: batchObj._id,
        referrer: enrollment.referrer,
        collectedAmount: amount,
        commissionRate: enrollment.commissionRate,
        commissionEarned,
        status: "earned",
        paidAmount: 0,
        remainingCommission: commissionEarned,
      });
    }

    // C. Post to Ledger and update Account balance
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
      const balanceAfter = targetAccount.currentBalance + amount;
      targetAccount.currentBalance = balanceAfter;
      await targetAccount.save();

      const entryNo = await getNextLedgerEntryNo();
      await Ledger.create({
        entryNo,
        account: targetAccount._id,
        type: "CREDIT", // Cash in
        amount,
        balanceAfter,
        sourceModule: "payments",
        sourceReferenceId: receiptNo,
        description: `Student payment ${receiptNo} from ${studentObj.fullName} for ${batchObj.batchName} (${data.paymentMethod})`,
        transactionDate: paymentDate,
        recordedBy: {
          email: actor.email,
          name: actor.name || "",
          userId: actor._id,
        },
      });
    }
  }

  await logActivityAndNotify({
    actor,
    action: "RECORD_PAYMENT",
    module: "payments",
    resourceId: String(payment._id),
    resourceName: receiptNo,
    details: `Collected ৳${amount.toLocaleString()} (${receiptNo}) from ${studentObj.fullName} for batch ${batchObj.batchName}. Status: ${paymentStatus}. Remaining due: ৳${enrollment.remainingDue.toLocaleString()}`,
  });

  revalidatePath("/payments");
  revalidatePath("/students");
  revalidatePath("/academic/batches");
  return JSON.parse(JSON.stringify(payment));
}

// ==========================================
// VERIFY PENDING PAYMENT
// ==========================================

export async function verifyPayment(paymentId: string) {
  const actor = await requirePermission("payments", "write");
  await connectToDatabase();

  const payment = await Payment.findById(paymentId)
    .populate("enrollment")
    .populate("student", "fullName")
    .populate("batch", "batchName");

  if (!payment) throw new Error("Payment record not found");
  if (payment.status === "confirmed") {
    throw new Error("Payment is already confirmed.");
  }

  payment.status = "confirmed";
  payment.verifiedBy = {
    email: actor.email,
    name: actor.name || "",
    userId: actor._id,
    date: new Date(),
  };
  await payment.save();

  // Apply collection to enrollment
  const enrollment = await Enrollment.findById(payment.enrollment);
  if (enrollment) {
    enrollment.totalCollectedAmount += payment.amount;
    enrollment.remainingDue = Math.max(
      0,
      enrollment.finalPayableAmount - enrollment.totalCollectedAmount
    );
    await enrollment.save();

    // Trigger commission
    if (
      enrollment.referrerType === "Instructor" &&
      enrollment.referrer &&
      enrollment.commissionRate > 0
    ) {
      const existingEntry = await CommissionEntry.findOne({ payment: payment._id });
      if (!existingEntry) {
        const commissionEarned = Math.round(
          (payment.amount * enrollment.commissionRate) / 100
        );
        await CommissionEntry.create({
          payment: payment._id,
          enrollment: enrollment._id,
          batch: enrollment.batch,
          referrer: enrollment.referrer,
          collectedAmount: payment.amount,
          commissionRate: enrollment.commissionRate,
          commissionEarned,
          status: "earned",
          paidAmount: 0,
          remainingCommission: commissionEarned,
        });
      }
    }
  }

  // Update Account & Ledger
  const targetAccount =
    (await Account.findOne({ isDefault: true, isActive: true })) ||
    (await Account.findOne({ isActive: true }));

  if (targetAccount) {
    targetAccount.currentBalance += payment.amount;
    await targetAccount.save();

    const entryNo = await getNextLedgerEntryNo();
    await Ledger.create({
      entryNo,
      account: targetAccount._id,
      type: "CREDIT",
      amount: payment.amount,
      balanceAfter: targetAccount.currentBalance,
      sourceModule: "payments",
      sourceReferenceId: payment.receiptNo,
      description: `Verified payment ${payment.receiptNo} of ৳${payment.amount.toLocaleString()}`,
      transactionDate: new Date(),
      recordedBy: {
        email: actor.email,
        name: actor.name || "",
        userId: actor._id,
      },
    });
  }

  await logActivityAndNotify({
    actor,
    action: "VERIFY_PAYMENT",
    module: "payments",
    resourceId: String(payment._id),
    resourceName: payment.receiptNo,
    details: `Verified payment ${payment.receiptNo} of ৳${payment.amount.toLocaleString()}`,
  });

  revalidatePath("/payments");
  revalidatePath("/students");
  return JSON.parse(JSON.stringify(payment));
}

// ==========================================
// REVERSE PAYMENT (AUDITABLE CORRECTION)
// ==========================================

export async function reversePayment(paymentId: string, reason: string) {
  const actor = await requirePermission("payments", "write");
  await connectToDatabase();

  if (!reason?.trim()) {
    throw new Error("A clear justification is required for payment reversals.");
  }

  const payment = await Payment.findById(paymentId)
    .populate("enrollment")
    .populate("student", "fullName");

  if (!payment) throw new Error("Payment not found");
  if (payment.status === "reversed") {
    throw new Error("This payment has already been reversed.");
  }

  const previousStatus = payment.status;
  payment.status = "reversed";
  payment.notes = `${payment.notes || ""} [Reversed by ${actor.email} on ${new Date().toISOString()}: ${reason}]`.trim();
  await payment.save();

  // If previous status was confirmed, roll back enrollment totals and commission
  if (previousStatus === "confirmed") {
    const enrollment = await Enrollment.findById(payment.enrollment);
    if (enrollment) {
      enrollment.totalCollectedAmount = Math.max(
        0,
        enrollment.totalCollectedAmount - payment.amount
      );
      enrollment.remainingDue = Math.max(
        0,
        enrollment.finalPayableAmount - enrollment.totalCollectedAmount
      );
      await enrollment.save();
    }

    // Cancel or adjust commission entry
    const commEntry = await CommissionEntry.findOne({ payment: payment._id });
    if (commEntry) {
      commEntry.status = "adjusted";
      commEntry.remainingCommission = 0;
      await commEntry.save();
    }

    // Post reversing entry in Ledger
    const defaultAccount =
      (await Account.findOne({ isDefault: true, isActive: true })) ||
      (await Account.findOne({ isActive: true }));

    if (defaultAccount) {
      defaultAccount.currentBalance = Math.max(
        0,
        defaultAccount.currentBalance - payment.amount
      );
      await defaultAccount.save();

      const entryNo = await getNextLedgerEntryNo();
      await Ledger.create({
        entryNo,
        account: defaultAccount._id,
        type: "DEBIT", // Outflow reversal
        amount: payment.amount,
        balanceAfter: defaultAccount.currentBalance,
        sourceModule: "adjustment",
        sourceReferenceId: payment.receiptNo,
        description: `Reversal of payment ${payment.receiptNo}. Reason: ${reason}`,
        transactionDate: new Date(),
        recordedBy: {
          email: actor.email,
          name: actor.name || "",
          userId: actor._id,
        },
      });
    }
  }

  await logActivityAndNotify({
    actor,
    action: "REVERSE_PAYMENT",
    module: "payments",
    resourceId: String(payment._id),
    resourceName: payment.receiptNo,
    details: `Reversed payment ${payment.receiptNo} of ৳${payment.amount.toLocaleString()}. Reason: "${reason}"`,
  });

  revalidatePath("/payments");
  revalidatePath("/students");
  return JSON.parse(JSON.stringify(payment));
}

// Get active enrollments with pending dues for payment modal
export async function getEnrollmentsWithDues() {
  await requirePermission("payments", "read");
  await connectToDatabase();

  const enrollments = await Enrollment.find({
    remainingDue: { $gt: 0 },
    status: "Active",
  })
    .populate("student", "fullName studentId phone")
    .populate("course", "title code")
    .populate("batch", "batchCode batchName")
    .sort({ remainingDue: -1 })
    .lean();

  return JSON.parse(JSON.stringify(enrollments));
}

