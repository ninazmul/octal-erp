"use client";

import { useState } from "react";
import { IAccount } from "@/types";
import { payExpense } from "@/lib/actions/expense.actions";
import CreateExpenseDialog from "./CreateExpenseDialog";
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
  CreditCard,
  Plus,
  Search,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

interface ExpenseManagementProps {
  initialExpenses: Record<string, unknown>[];
  total: number;
  totalIncurred: number;
  totalPaid: number;
  totalDue: number;
  accounts: IAccount[];
  isAuthorized: boolean;
}

export default function ExpenseManagement({
  initialExpenses,
  accounts,
}: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<Record<string, unknown>[]>(initialExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Pay modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Record<string, unknown> | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ""
  );
  const [paying, setPaying] = useState(false);

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.expenseNo.toLowerCase().includes(search.toLowerCase()) ||
      (e.recipientName && e.recipientName.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || e.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      e.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalIncurred = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  const totalDue = expenses.reduce((sum, e) => sum + (e.dueAmount || 0), 0);

  const handleOpenPay = (exp: Record<string, unknown>) => {
    setSelectedExpense(exp);
    setPayAmount(exp.dueAmount);
    setPaymentMethod("Cash");
    setTransactionRef("");
    setIsPayOpen(true);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !payAmount || payAmount <= 0) return;

    setPaying(true);
    try {
      const updated = await payExpense({
        expenseId: selectedExpense._id,
        amount: payAmount,
        paymentMethod,
        transactionRef,
        accountId,
      });

      setExpenses((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      toast.success(
        `Disbursed ৳${payAmount.toLocaleString()} for expense ${selectedExpense.expenseNo}!`
      );
      setIsPayOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Operational Expense Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track categorized center operating costs, vendor obligations, rent, utilities, and cashflow disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Incurred Expenses
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{totalIncurred.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {expenses.length} operating obligations
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Expenses Settled (Cash Out)
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Actual cash disbursements from accounts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Unpaid Expense Liabilities
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ৳{totalDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Unpaid bills & liabilities
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by expense title, EXP-..., or vendor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by expense category"
          className="w-full sm:w-48 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="Rent">Rent</option>
          <option value="Electricity & Utilities">Utilities</option>
          <option value="Internet & Communications">Internet</option>
          <option value="Marketing & Advertising">Marketing</option>
          <option value="Equipment & Supplies">Equipment</option>
          <option value="Software & Subscriptions">Software</option>
          <option value="Salaries & Payroll">Salaries</option>
          <option value="Other Operating Costs">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by expense status"
          className="w-full sm:w-40 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="fully paid">Fully Paid</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Expense No & Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Remaining Due</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((exp) => (
                <tr
                  key={exp._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {exp.title}
                    </div>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                      {exp.expenseNo}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    <Badge variant="outline" className="text-[10px]">
                      {exp.category}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {exp.recipientName || "—"}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ৳{exp.amount?.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ৳{exp.paidAmount?.toLocaleString() || "0"}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <span
                      className={
                        exp.dueAmount > 0
                          ? "font-bold text-amber-600 dark:text-amber-400"
                          : "text-slate-400"
                      }
                    >
                      ৳{exp.dueAmount?.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {new Date(exp.expenseDate).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        exp.status === "Fully Paid"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : exp.status === "Partial"
                          ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      }`}
                    >
                      {exp.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {exp.dueAmount > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPay(exp)}
                        className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Banknote className="w-3 h-3" /> Pay Due
                      </Button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No expenses found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Record operational bills, rent, internet, and office expenses.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateExpenseDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        accounts={accounts}
        onSuccess={(created) => setExpenses((prev) => [created, ...prev])}
      />

      {/* Pay Modal */}
      {selectedExpense && (
        <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Disburse Payment ({selectedExpense.expenseNo})
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleConfirmPay} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 block">Expense Title:</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {selectedExpense.title}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold block mt-1">
                  Remaining Due: ৳{selectedExpense.dueAmount?.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disbursement Amount (৳) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedExpense.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
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
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  aria-label="Disbursement Payment Method"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Cash">Cash Drawer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disburse From Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  aria-label="Disburse From Account"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} (৳{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reference / Voucher Number
                </label>
                <Input
                  placeholder="e.g. VCH-00192"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayOpen(false)}
                  disabled={paying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={paying || !payAmount}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {paying ? "Disbursing..." : "Confirm Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

