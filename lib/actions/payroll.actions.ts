"use server";

import { connectToDatabase } from "@/lib/database";
import Payroll from "@/lib/database/models/payroll.model";
import Employee from "@/lib/database/models/employee.model";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import Counter from "@/lib/database/models/counter.model";
import { formatSL } from "@/lib/utils";
import {
  requireSuperAdmin,
  requireConfidentialSalaryAccess,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

async function getNextPayrollId(period: string): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    `octal_payroll_${period}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAY-${period}-${formatSL(counter.seq, 4)}`;
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
// GET PAYROLL OBLIGATIONS
// ==========================================

export async function getPayrollObligations(params?: {
  period?: string; // "YYYY-MM"
  department?: string;
  status?: string;
  employeeId?: string;
  search?: string;
}) {
  await requireConfidentialSalaryAccess();
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  const currentPeriod =
    params?.period || new Date().toISOString().slice(0, 7); // Default to current YYYY-MM
  if (params?.period !== "all") {
    query.period = currentPeriod;
  }

  if (params?.status) query.status = params.status;
  if (params?.employeeId) query.employee = params.employeeId;

  const obligations = await Payroll.find(query)
    .populate("employee", "fullName employeeId email phone department designation basicSalary")
    .sort({ createdAt: -1 })
    .lean();

  // If department filter or search is passed, filter populated employee
  let filtered = obligations;
  if (params?.department) {
    filtered = filtered.filter(
      (o) => {
        const emp = o.employee as { department?: string; fullName?: string; employeeId?: string } | null;
        return emp?.department === params.department;
      }
    );
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (o) => {
        const emp = o.employee as { department?: string; fullName?: string; employeeId?: string } | null;
        return emp?.fullName?.toLowerCase().includes(s) ||
          emp?.employeeId?.toLowerCase().includes(s) ||
          o.payrollId.toLowerCase().includes(s);
      }
    );
  }

  const totalObligations = filtered.reduce(
    (sum, o) => sum + (o.grossPayable || 0),
    0
  );
  const totalPaid = filtered.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalDue = filtered.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  return JSON.parse(
    JSON.stringify({
      obligations: filtered,
      period: currentPeriod,
      totalObligations,
      totalPaid,
      totalDue,
    })
  );
}

// ==========================================
// AUTOMATED MONTHLY PAYROLL GENERATOR (IDEMPOTENT)
// ==========================================

export async function generateMonthlyPayroll(period: string) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const formattedPeriod = period.trim();
  if (!/^\d{4}-\d{2}$/.test(formattedPeriod)) {
    throw new Error('Period must be in "YYYY-MM" format (e.g. 2026-10).');
  }

  // Find all active employees with basic salary > 0
  const eligibleEmployees = await Employee.find({
    status: { $in: ["Active", "On-Leave"] },
  }).lean();

  let generatedCount = 0;
  let skippedCount = 0;

  for (const emp of eligibleEmployees) {
    // 1. Check if payroll record already exists for this employee + period
    const existing = await Payroll.findOne({
      employee: emp._id,
      period: formattedPeriod,
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // 2. Generate payroll obligation
    const payrollId = await getNextPayrollId(formattedPeriod);
    const grossPayable = Math.max(
      0,
      emp.basicSalary + emp.allowances - emp.deductions
    );

    await Payroll.create({
      payrollId,
      period: formattedPeriod,
      employee: emp._id,
      basicSalary: emp.basicSalary,
      allowances: emp.allowances,
      deductions: emp.deductions,
      bonuses: 0,
      grossPayable,
      paidAmount: 0,
      dueAmount: grossPayable,
      status: "Pending",
      paymentHistory: [],
      generatedAt: new Date(),
    });

    generatedCount++;
  }

  await logActivityAndNotify({
    actor,
    action: "GENERATE_MONTHLY_PAYROLL",
    module: "payroll",
    resourceName: formattedPeriod,
    details: `Generated monthly payroll for ${formattedPeriod}: ${generatedCount} obligations created, ${skippedCount} existing skipped.`,
  });

  revalidatePath("/payroll");
  return {
    period: formattedPeriod,
    generatedCount,
    skippedCount,
    totalEligible: eligibleEmployees.length,
  };
}

// ==========================================
// DISBURSE SALARY PAYMENT (FULL / PARTIAL)
// ==========================================

export async function disburseSalaryPayment(data: {
  payrollId: string;
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
    throw new Error("Salary disbursement amount must be greater than zero.");
  }

  const payroll = await Payroll.findById(data.payrollId).populate(
    "employee",
    "fullName employeeId"
  );
  if (!payroll) throw new Error("Payroll obligation not found");

  if (amount > payroll.dueAmount) {
    throw new Error(
      `Disbursement amount (৳${amount.toLocaleString()}) exceeds the employee's remaining salary due of ৳${payroll.dueAmount.toLocaleString()}.`
    );
  }

  const paymentDate = new Date();

  // 1. Update Payroll Record
  payroll.paidAmount += amount;
  payroll.dueAmount = Math.max(0, payroll.grossPayable - payroll.paidAmount);
  payroll.status = payroll.dueAmount === 0 ? "Settled" : "Partial";

  payroll.paymentHistory.push({
    amount,
    paymentDate,
    paymentMethod: data.paymentMethod,
    transactionRef: data.transactionRef?.trim() || "",
    accountId: data.accountId ? (data.accountId as unknown as mongoose.Types.ObjectId) : null,
    paidBy: {
      email: actor.email,
      name: actor.name || "",
      userId: actor._id,
    },
    notes: data.notes?.trim() || "",
  });

  await payroll.save();

  // 2. Deduct from selected Cash/Bank Account and post DEBIT in Ledger
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
    targetAccount.currentBalance = Math.max(
      0,
      targetAccount.currentBalance - amount
    );
    await targetAccount.save();

    const entryNo = await getNextLedgerEntryNo();
    await Ledger.create({
      entryNo,
      account: targetAccount._id,
      type: "DEBIT", // Outflow
      amount,
      balanceAfter: targetAccount.currentBalance,
      sourceModule: "payroll",
      sourceReferenceId: payroll.payrollId,
      description: `Salary disbursement ${payroll.payrollId} to ${payroll.employee.fullName} (${payroll.employee.employeeId}) for ${payroll.period} via ${data.paymentMethod}`,
      transactionDate: paymentDate,
      recordedBy: {
        email: actor.email,
        name: actor.name || "",
        userId: actor._id,
      },
    });
  }

  await logActivityAndNotify({
    actor,
    action: "DISBURSE_SALARY",
    module: "payroll",
    resourceId: String(payroll._id),
    resourceName: payroll.payrollId,
    details: `Disbursed ৳${amount.toLocaleString()} salary payment to ${payroll.employee.fullName} for period ${payroll.period}. Remaining due: ৳${payroll.dueAmount.toLocaleString()}`,
  });

  revalidatePath("/payroll");
  return JSON.parse(JSON.stringify(payroll));
}
