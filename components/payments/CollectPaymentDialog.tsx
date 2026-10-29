"use client";

import { useState } from "react";
import { IEnrollment, IStudent, IBatch, ICourse, IAccount, PopulatedPayment } from "@/types";
import { recordPayment } from "@/lib/actions/payment.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Receipt } from "lucide-react";
import toast from "react-hot-toast";

interface CollectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentsWithDues: Array<
    IEnrollment & {
      student: IStudent;
      course: ICourse;
      batch: IBatch;
    }
  >;
  accounts: IAccount[];
  preselectedEnrollmentId?: string;
  onPaymentSuccess?: (payment: PopulatedPayment) => void;
}

export default function CollectPaymentDialog({
  open,
  onOpenChange,
  enrollmentsWithDues,
  accounts,
  preselectedEnrollmentId,
  onPaymentSuccess,
}: CollectPaymentDialogProps) {
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    preselectedEnrollmentId || enrollmentsWithDues[0]?._id || ""
  );
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Bank Transfer" | "bKash" | "Nagad" | "Rocket" | "Card" | "Other"
  >("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ""
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedEnrollment = enrollmentsWithDues.find(
    (e) => e._id === selectedEnrollmentId
  );

  const handleEnrollmentChange = (id: string) => {
    setSelectedEnrollmentId(id);
    const enr = enrollmentsWithDues.find((e) => e._id === id);
    if (enr) {
      setAmount(enr.remainingDue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId || !amount || amount <= 0) {
      toast.error("Please select an enrollment and enter a valid payment amount.");
      return;
    }

    if (selectedEnrollment && amount > selectedEnrollment.remainingDue) {
      toast.error(
        `Payment amount exceeds remaining due (৳${selectedEnrollment.remainingDue.toLocaleString()}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payment = await recordPayment({
        enrollmentId: selectedEnrollmentId,
        amount,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        accountId: accountId || undefined,
        notes: notes || undefined,
      });

      toast.success(`Payment recorded successfully! Receipt: ${payment.receiptNo}`);
      onOpenChange(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(payment as unknown as PopulatedPayment);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Record Student Tuition Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Student & Enrollment *
            </label>
            <select
              value={selectedEnrollmentId}
              onChange={(e) => handleEnrollmentChange(e.target.value)}
              required
              aria-label="Select Student and Enrollment"
              className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select Student / Batch Due</option>
              {enrollmentsWithDues.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.student?.fullName} ({e.student?.studentId}) - {e.batch?.batchName} [Due: ৳{e.remainingDue.toLocaleString()}]
                </option>
              ))}
            </select>
          </div>

          {selectedEnrollment && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Final Payable</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                  ৳{selectedEnrollment.finalPayableAmount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Already Paid</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳{selectedEnrollment.totalCollectedAmount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Remaining Due</span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                  ৳{selectedEnrollment.remainingDue?.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Amount (৳) *
              </label>
              <Input
                type="number"
                min="100"
                step="100"
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
                <option value="Cash">Cash Drawer</option>
                <option value="bKash">bKash Merchant / Personal</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">POS Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Transaction Reference / TrxID
              </label>
              <Input
                placeholder="e.g. 9J45K99L, Slip #1029"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Deposit Into Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                aria-label="Deposit Account"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName} ({acc.type}) - Bal: ৳{acc.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Remarks / Notes
              </label>
              <Textarea
                placeholder="Installment 1 of 2, discount approved by Admin..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
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
              disabled={submitting || !selectedEnrollmentId || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
            >
              {submitting ? "Processing..." : "Confirm & Issue Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

