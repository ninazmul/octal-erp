"use server";

import { connectToDatabase } from "@/lib/database";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import {
  requirePermission,
  requireSuperAdmin,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { normalizePagination } from "@/lib/utils";

export async function getAccounts() {
  await requirePermission("finance", "read");
  await connectToDatabase();

  // If no account exists yet, bootstrap the default Main Cash Box
  const count = await Account.countDocuments();
  if (count === 0) {
    await Account.create({
      accountName: "Main Cash Drawer",
      type: "Cash",
      openingBalance: 0,
      currentBalance: 0,
      isDefault: true,
      isActive: true,
      notes: "Default physical cash drawer for Octal center collections.",
    });
  }

  const accounts = await Account.find().sort({ isDefault: -1, accountName: 1 }).lean();
  return JSON.parse(JSON.stringify(accounts));
}

export async function createAccount(data: {
  accountName: string;
  accountNumber?: string;
  type: "Cash" | "Bank" | "MFS";
  bankName?: string;
  openingBalance: number;
  isDefault?: boolean;
  notes?: string;
}) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const openingBalance = Math.max(0, Number(data.openingBalance || 0));

  if (data.isDefault) {
    await Account.updateMany({}, { $set: { isDefault: false } });
  }

  const account = await Account.create({
    accountName: data.accountName.trim(),
    accountNumber: data.accountNumber?.trim() || "",
    type: data.type,
    bankName: data.bankName?.trim() || "",
    openingBalance,
    currentBalance: openingBalance,
    isDefault: Boolean(data.isDefault),
    isActive: true,
    notes: data.notes?.trim() || "",
  });

  await logActivityAndNotify({
    actor,
    action: "CREATE_ACCOUNT",
    module: "finance",
    resourceId: String(account._id),
    resourceName: account.accountName,
    details: `Created ${account.type} account "${account.accountName}" with opening balance ৳${openingBalance.toLocaleString()}`,
  });

  revalidatePath("/finance/accounts");
  return JSON.parse(JSON.stringify(account));
}

export async function updateAccount(
  accountId: string,
  data: {
    accountName?: string;
    accountNumber?: string;
    type?: "Cash" | "Bank" | "MFS";
    bankName?: string;
    isDefault?: boolean;
    notes?: string;
  }
) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();
  const account = await Account.findById(accountId);
  if (!account) throw new Error("Account not found.");

  if (data.isDefault) await Account.updateMany({ _id: { $ne: account._id } }, { $set: { isDefault: false } });
  if (data.accountName !== undefined) account.accountName = data.accountName.trim();
  if (data.accountNumber !== undefined) account.accountNumber = data.accountNumber.trim();
  if (data.type !== undefined) account.type = data.type;
  if (data.bankName !== undefined) account.bankName = data.bankName.trim();
  if (data.isDefault !== undefined) account.isDefault = data.isDefault;
  if (data.notes !== undefined) account.notes = data.notes.trim();
  await account.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_ACCOUNT",
    module: "finance",
    resourceId: String(account._id),
    resourceName: account.accountName,
    details: `Updated account details for ${account.accountName}.`,
  });
  revalidatePath("/finance/accounts");
  return JSON.parse(JSON.stringify(account));
}

export async function deactivateAccount(accountId: string) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();
  const account = await Account.findById(accountId);
  if (!account) throw new Error("Account not found.");
  if (account.isDefault) throw new Error("Set another account as default before removing this account.");
  if (account.currentBalance !== 0) throw new Error("An account with a non-zero balance cannot be removed.");
  const hasLedgerEntries = await Ledger.exists({ account: account._id });
  if (hasLedgerEntries) throw new Error("An account with ledger history cannot be removed. It can remain inactive for audit purposes.");

  account.isActive = false;
  await account.save();
  await logActivityAndNotify({
    actor,
    action: "DEACTIVATE_ACCOUNT",
    module: "finance",
    resourceId: String(account._id),
    resourceName: account.accountName,
    details: `Deactivated account ${account.accountName}.`,
  });
  revalidatePath("/finance/accounts");
  return JSON.parse(JSON.stringify(account));
}

export async function getLedgerEntries(params?: {
  accountId?: string;
  sourceModule?: string;
  limit?: number;
}) {
  await requirePermission("finance", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (params?.accountId) query.account = params.accountId;
  if (params?.sourceModule) query.sourceModule = params.sourceModule;

  const { limit } = normalizePagination(1, params?.limit, 100, 500);
  const entries = await Ledger.find(query)
    .populate("account", "accountName type")
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(entries));
}

