"use client";

import { useState } from "react";
import { IAccount } from "@/types";
import { disburseSalaryPayment } from "@/lib/actions/payroll.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Banknote } from "lucide-react";
import toast from "react-hot-toast";

interface DisburseSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation: Record<string, unknown> | null;
  accounts: IAccount[];
  onSuccess: (updated: Record<string, unknown>) => void;
}

export default function DisburseSalaryDialog({
  open,
  onOpenChange,
  obligation,
  accounts,
  onSuccess,
}: DisburseSalaryDialogProps) {
  const [amount, setAmount] = useState<number>(obligation?.dueAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Bank Transfer" | "bKash" | "Nagad" | "Rocket" | "Card" | "Other"
  >("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ""
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!obligation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid disbursement amount.");
      return;
    }

    if (amount > obligation.dueAmount) {
      toast.error(
        `Disbursement amount exceeds outstanding salary (৳${obligation.dueAmount.toLocaleString()}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const updated = await disburseSalaryPayment({
        payrollId: obligation._id,
        amount,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        accountId: accountId || undefined,
        notes: notes || undefined,
      });

      toast.success(
        `Disbursed ৳${amount.toLocaleString()} salary payment to ${obligation.employee?.fullName}!`
      );
      onSuccess(updated);
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to disburse salary.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            Disburse Salary Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Employee Summary Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Employee:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {obligation.employee?.fullName} ({obligation.employee?.employeeId})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Department & Period:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {obligation.employee?.department} • {obligation.period}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Total Obligation / Due:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                ৳{obligation.grossPayable.toLocaleString()} (Due: ৳{obligation.dueAmount.toLocaleString()})
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Disbursement Amount (৳) *
            </label>
            <Input
              type="number"
              min="1"
              max={obligation.dueAmount}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as
                    | "Cash"
                    | "Bank Transfer"
                    | "bKash"
                    | "Nagad"
                    | "Rocket"
                    | "Card"
                    | "Other"
                )
              }
              aria-label="Payment Method"
              className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Bank Transfer">Bank Transfer (EFTN / BEFTN)</option>
              <option value="bKash">bKash Salary Disbursement</option>
              <option value="Nagad">Nagad</option>
              <option value="Cash">Cash Drawer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Disburse From Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              aria-label="Disburse Account"
              className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountName} ({acc.type}) - Bal: ৳{acc.currentBalance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Transaction Reference / Slip #
            </label>
            <Input
              placeholder="e.g. SAL-OCT-2026-001"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Notes
            </label>
            <Textarea
              placeholder="Payment remarks or salary adjustments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Processing..." : "Confirm & Disburse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

