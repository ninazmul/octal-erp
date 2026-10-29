"use client";

import { useState } from "react";
import { ExpenseCategory, IAccount, IExpense } from "@/types";
import { createExpense } from "@/lib/actions/expense.actions";
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
import { CreditCard } from "lucide-react";
import toast from "react-hot-toast";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: IAccount[];
  onSuccess: (exp: IExpense) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent",
  "Electricity & Utilities",
  "Internet & Communications",
  "Marketing & Advertising",
  "Equipment & Supplies",
  "Academic & Training Materials",
  "Software & Subscriptions",
  "Transport",
  "Maintenance",
  "Salaries & Payroll",
  "Other Operating Costs",
];

export default function CreateExpenseDialog({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: CreateExpenseDialogProps) {
  const [category, setCategory] = useState<ExpenseCategory>("Rent");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [recipientName, setRecipientName] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isPaidImmediately, setIsPaidImmediately] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || amount <= 0) {
      toast.error("Please enter a valid title and expense amount.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createExpense({
        category,
        title,
        amount,
        recipientName: recipientName || undefined,
        expenseDate,
        dueDate: dueDate || undefined,
        description: description || undefined,
        isPaidImmediately,
        paymentMethod,
        accountId: isPaidImmediately ? accountId : undefined,
        isRecurring: false,
      });

      toast.success(`Expense ${created.expenseNo} recorded successfully!`);
      onSuccess(created);
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Record Operational Expense / Obligation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                required
                aria-label="Expense Category"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Amount (৳) *
              </label>
              <Input
                type="number"
                min="1"
                step="50"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Title / Expense Name *
              </label>
              <Input
                placeholder="e.g. October Center Space Rent, High-Speed Optical Fiber Internet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Vendor / Recipient Name
              </label>
              <Input
                placeholder="e.g. Landlord, ISP Provider, Stationery Shop"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Incurred Date *
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description / Memo
              </label>
              <Textarea
                placeholder="Invoice details, voucher reference..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Payment status options */}
            <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPaidImmediately"
                  checked={isPaidImmediately}
                  onChange={(e) => setIsPaidImmediately(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isPaidImmediately"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Pay Immediately (Deduct from Cash/Bank Account now)
                </label>
              </div>

              {isPaidImmediately && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      aria-label="Immediate Payment Method"
                      className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="Cash">Cash Drawer</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Deduct From Account
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      aria-label="Immediate Deduct Account"
                      className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.accountName} (৳{acc.currentBalance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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
              disabled={submitting || !title.trim() || !amount}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? "Saving..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

