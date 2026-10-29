"use client";

import { useState } from "react";
import { IAccount, ILedgerEntry } from "@/types";
import { createAccount } from "@/lib/actions/account.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface AccountManagementProps {
  initialAccounts: IAccount[];
  initialLedgerEntries: ILedgerEntry[];
  isSuperAdmin: boolean;
}

export default function AccountManagement({
  initialAccounts,
  initialLedgerEntries,
  isSuperAdmin,
}: AccountManagementProps) {
  const [accounts, setAccounts] = useState<IAccount[]>(initialAccounts);
  const [ledgerEntries] = useState<ILedgerEntry[]>(initialLedgerEntries);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [type, setType] = useState<"Cash" | "Bank" | "MFS">("Cash");
  const [bankName, setBankName] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalCashBalance = accounts.reduce(
    (sum, a) => sum + (a.currentBalance || 0),
    0
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      toast.error("Account name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAccount({
        accountName,
        accountNumber,
        type,
        bankName,
        openingBalance,
        isDefault,
        notes,
      });

      setAccounts((prev) => [...prev, created]);
      toast.success(`Account "${created.accountName}" created!`);
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Cash & Bank Accounts Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time cash drawers, bank balances, MFS merchant accounts, and verified double-entry transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc._id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    acc.type === "Cash"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : acc.type === "Bank"
                      ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                      : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                  }`}
                >
                  {acc.type}
                </Badge>

                {acc.isDefault && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Default
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                {acc.accountName}
              </h3>
              {acc.bankName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {acc.bankName} {acc.accountNumber && `• ${acc.accountNumber}`}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Liquid Balance
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  ৳{acc.currentBalance?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Opening: ৳{acc.openingBalance?.toLocaleString()}</span>
              <span>Reconciled</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Journal Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Double-Entry Financial Journal
            </h2>
            <p className="text-xs text-slate-400">
              Auditable credit/debit transaction trail linked to verified receipts, salary disbursements, and expenses.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Total Liquid Cash: ৳{totalCashBalance.toLocaleString()}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Entry No</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Module & Reference</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ledgerEntries.map((led) => (
                <tr key={led._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {led.entryNo}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {(typeof led.account === "object" && led.account?.accountName) || "Account"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        led.type === "CREDIT"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-500/15 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {led.type === "CREDIT" ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> INFLOW
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> OUTFLOW
                        </>
                      )}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-mono font-bold text-sm ${
                      led.type === "CREDIT"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {led.type === "CREDIT" ? "+" : "-"}৳{led.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    ৳{led.balanceAfter?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {led.sourceModule}
                    </Badge>
                    {led.sourceReferenceId && (
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                        {led.sourceReferenceId}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {led.description}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(led.transactionDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Building className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No ledger transactions posted yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Journal entries are generated automatically as student fees are collected or expenses paid.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Cash or Bank Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Name *
              </label>
              <Input
                placeholder="e.g. City Bank Operating, bKash Merchant"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "Cash" | "Bank" | "MFS")}
                aria-label="Account Type"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Cash Drawer</option>
                <option value="Bank">Bank Account</option>
                <option value="MFS">Mobile Financial Services (MFS)</option>
              </select>
            </div>

            {type === "Bank" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Bank Name & Account Number
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="e.g. City Bank PLC"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <Input
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Opening Balance (৳) *
              </label>
              <Input
                type="number"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                required
                className="font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultAccount"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isDefaultAccount"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Set as Default Deposit Account for Student Collections
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Notes
              </label>
              <Input
                placeholder="Branch name, signatory info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

