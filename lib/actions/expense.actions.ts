"use server";

import { connectToDatabase } from "@/lib/database";
import Expense from "@/lib/database/models/expense.model";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import Counter from "@/lib/database/models/counter.model";
import { escapeRegex, formatSL, normalizePagination } from "@/lib/utils";
import {
  requirePermission,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

async function getNextExpenseNo(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_expense_no",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `EXP-${formatSL(counter.seq, 6)}`;
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
// GET EXPENSES
// ==========================================

export async function getExpenses(params?: {
  category?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("expenses", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params?.category) query.category = params.category;
  if (params?.status) query.status = params.status;

  if (params?.startDate || params?.endDate) {
    const dateQuery: Record<string, unknown> = {};
    if (params?.startDate) dateQuery.$gte = new Date(params.startDate);
    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.expenseDate = dateQuery;
  }

  const searchTerm = params?.search?.trim();
  if (searchTerm) {
    const search = new RegExp(escapeRegex(searchTerm), "i");
    query.$or = [
      { expenseNo: search },
      { title: search },
      { recipientName: search },
      { description: search },
    ];
  }

  const { page, limit } = normalizePagination(params?.page, params?.limit);
  const skip = (page - 1) * limit;

  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query)
    .sort({ expenseDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalIncurred = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  const totalDue = expenses.reduce((sum, e) => sum + (e.dueAmount || 0), 0);

  return JSON.parse(
    JSON.stringify({
      expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalIncurred,
      totalPaid,
      totalDue,
    })
  );
}

// ==========================================
// CREATE EXPENSE OBLIGATION
// ==========================================

export async function createExpense(data: {
  category: string;
  title: string;
  amount: number;
  expenseDate?: string | Date;
  dueDate?: string | Date;
  recipientName?: string;
  description?: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: "monthly" | "quarterly" | "yearly";
  isPaidImmediately?: boolean;
  accountId?: string;
}) {
  const actor = await requirePermission("expenses", "write");
  await connectToDatabase();

  const amount = Number(data.amount);
  if (!amount || amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }

  const expenseNo = await getNextExpenseNo();
  const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();

  const initialPaid = data.isPaidImmediately ? amount : 0;
  const initialDue = data.isPaidImmediately ? 0 : amount;
  const initialStatus = data.isPaidImmediately ? "Fully Paid" : "Unpaid";

  const paymentHistory = data.isPaidImmediately
    ? [
        {
          amount,
          paymentDate: expenseDate,
          paymentMethod: data.paymentMethod || "Cash",
          accountId: data.accountId ? (data.accountId as unknown as mongoose.Types.ObjectId) : null,
          paidBy: {
            email: actor.email,
            name: actor.name || "",
            userId: actor._id,
          },
          notes: "Settled on creation",
        },
      ]
    : [];

  const expense = await Expense.create({
    expenseNo,
    category: data.category,
    title: data.title.trim(),
    description: data.description?.trim() || "",
    amount,
    paidAmount: initialPaid,
    dueAmount: initialDue,
    expenseDate,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    recipientName: data.recipientName?.trim() || "",
    paymentMethod: data.paymentMethod || "Cash",
    isRecurring: Boolean(data.isRecurring),
    recurrenceFrequency: data.recurrenceFrequency || "monthly",
    status: initialStatus,
    paymentHistory,
    createdBy: {
      email: actor.email,
      name: actor.name || "",
      userId: actor._id,
    },
  });

  // If paid immediately, deduct cash from account and record in Ledger!
  if (data.isPaidImmediately) {
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
        type: "DEBIT", // Cash out
        amount,
        balanceAfter: targetAccount.currentBalance,
        sourceModule: "expenses",
        sourceReferenceId: expenseNo,
        description: `Operational expense ${expenseNo}: ${data.title} (${data.category})`,
        transactionDate: expenseDate,
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
    action: "CREATE_EXPENSE",
    module: "expenses",
    resourceId: String(expense._id),
    resourceName: expenseNo,
    details: `Created expense ${expenseNo} (${data.title}) of ৳${amount.toLocaleString()} in "${data.category}". Paid immediately: ${data.isPaidImmediately ? "Yes" : "No"}`,
  });

  revalidatePath("/expenses");
  return JSON.parse(JSON.stringify(expense));
}

export async function updateExpense(
  expenseId: string,
  data: {
    category: string;
    title: string;
    amount: number;
    expenseDate?: string | Date;
    dueDate?: string | Date;
    recipientName?: string;
    description?: string;
  }
) {
  const actor = await requirePermission("expenses", "write");
  await connectToDatabase();

  const expense = await Expense.findById(expenseId);
  if (!expense) throw new Error("Expense not found.");
  if (expense.paidAmount > 0 || expense.status === "Cancelled") {
    throw new Error("Paid or cancelled expenses cannot be edited. Use an adjustment entry instead.");
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }

  expense.category = data.category as typeof expense.category;
  expense.title = data.title.trim();
  expense.amount = amount;
  expense.dueAmount = amount;
  expense.expenseDate = data.expenseDate ? new Date(data.expenseDate) : expense.expenseDate;
  expense.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
  expense.recipientName = data.recipientName?.trim() || "";
  expense.description = data.description?.trim() || "";
  expense.status = "Unpaid";
  await expense.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_EXPENSE",
    module: "expenses",
    resourceId: String(expense._id),
    resourceName: expense.expenseNo,
    details: `Updated unpaid expense ${expense.expenseNo} (${expense.title})`,
  });
  revalidatePath("/expenses");
  revalidatePath("/reports");
  return JSON.parse(JSON.stringify(expense));
}

export async function cancelExpense(expenseId: string) {
  const actor = await requirePermission("expenses", "write");
  await connectToDatabase();

  const expense = await Expense.findById(expenseId);
  if (!expense) throw new Error("Expense not found.");
  if (expense.paidAmount > 0) {
    throw new Error("An expense with recorded payments cannot be deleted. Keep it for audit and accounting history.");
  }
  if (expense.status === "Cancelled") return JSON.parse(JSON.stringify(expense));

  expense.status = "Cancelled";
  expense.dueAmount = 0;
  await expense.save();
  await logActivityAndNotify({
    actor,
    action: "CANCEL_EXPENSE",
    module: "expenses",
    resourceId: String(expense._id),
    resourceName: expense.expenseNo,
    details: `Cancelled unpaid expense ${expense.expenseNo} (${expense.title})`,
  });
  revalidatePath("/expenses");
  revalidatePath("/reports");
  return JSON.parse(JSON.stringify(expense));
}

// ==========================================
// PAY EXPENSE OBLIGATION (DISBURSEMENT)
// ==========================================

export async function payExpense(data: {
  expenseId: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  accountId?: string;
  notes?: string;
}) {
  const actor = await requirePermission("expenses", "write");
  await connectToDatabase();

  const amount = Number(data.amount);
  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const expense = await Expense.findById(data.expenseId);
  if (!expense) throw new Error("Expense not found");

  if (amount > expense.dueAmount) {
    throw new Error(
      `Payment amount (৳${amount.toLocaleString()}) exceeds the outstanding balance of ৳${expense.dueAmount.toLocaleString()}.`
    );
  }

  const paymentDate = new Date();

  expense.paidAmount += amount;
  expense.dueAmount = Math.max(0, expense.amount - expense.paidAmount);
  expense.status = expense.dueAmount === 0 ? "Fully Paid" : "Partial";

  expense.paymentHistory.push({
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

  await expense.save();

  // Deduct cash from account and record DEBIT in Ledger
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
      sourceModule: "expenses",
      sourceReferenceId: expense.expenseNo,
      description: `Expense payment for ${expense.expenseNo} (${expense.title}) via ${data.paymentMethod}`,
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
    action: "PAY_EXPENSE",
    module: "expenses",
    resourceId: String(expense._id),
    resourceName: expense.expenseNo,
    details: `Disbursed ৳${amount.toLocaleString()} for expense ${expense.expenseNo} (${expense.title}). Remaining due: ৳${expense.dueAmount.toLocaleString()}`,
  });

  revalidatePath("/expenses");
  return JSON.parse(JSON.stringify(expense));
}

