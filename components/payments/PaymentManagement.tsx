"use client";

import { useState } from "react";
import { IAccount } from "@/types";
import {
  verifyPayment,
  reversePayment,
} from "@/lib/actions/payment.actions";
import CollectPaymentDialog from "./CollectPaymentDialog";
import ReceiptViewDialog from "./ReceiptViewDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Search,
  Plus,
  Printer,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

interface PaymentManagementProps {
  initialPayments: Record<string, unknown>[];
  total: number;
  enrollmentsWithDues: Record<string, unknown>[];
  accounts: IAccount[];
  preselectedEnrollmentId?: string;
  preselectedStudentId?: string;
}

export default function PaymentManagement({
  initialPayments,
  total,
  enrollmentsWithDues,
  accounts,
  preselectedEnrollmentId,
  preselectedStudentId,
}: PaymentManagementProps) {
  const [payments, setPayments] = useState<Record<string, unknown>[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [isCollectOpen, setIsCollectOpen] = useState(
    Boolean(preselectedEnrollmentId || preselectedStudentId)
  );
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Record<string, unknown> | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesMethod =
      methodFilter === "all" ||
      p.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalConfirmedRevenue = payments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalCashRevenue = payments
    .filter((p) => p.status === "confirmed" && p.paymentMethod === "Cash")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalDigitalRevenue = payments
    .filter((p) => p.status === "confirmed" && p.paymentMethod !== "Cash")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleOpenReceipt = (pmt: Record<string, unknown>) => {
    setSelectedReceiptPayment(pmt);
    setIsReceiptOpen(true);
  };

  const handleVerify = async (pmt: Record<string, unknown>) => {
    try {
      await verifyPayment(pmt._id);
      setPayments((prev) =>
        prev.map((item) => (item._id === pmt._id ? { ...item, status: "confirmed" } : item))
      );
      toast.success(`Payment ${pmt.receiptNo} verified!`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to verify payment.");
    }
  };

  const handleReverse = async (pmt: Record<string, unknown>) => {
    const reason = prompt(`Enter reason for reversing payment ${pmt.receiptNo}:`);
    if (!reason || !reason.trim()) return;

    try {
      await reversePayment(pmt._id, reason.trim());
      setPayments((prev) =>
        prev.map((item) => (item._id === pmt._id ? { ...item, status: "reversed" } : item))
      );
      toast.success(`Payment ${pmt.receiptNo} reversed.`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to reverse payment.");
    }
  };

  const handlePaymentSuccess = (newPayment: Record<string, unknown>) => {
    setPayments((prev) => [newPayment, ...prev]);
    setSelectedReceiptPayment(newPayment);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Tuition Collections & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collect course fee installments, issue printable receipts, and track verified cashflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCollectOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Collections
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalConfirmedRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {total} Total Transactions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Cash Drawer Collections
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{totalCashRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Physical cash in hand
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Digital / MFS / Bank
          </span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ৳{totalDigitalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            bKash, Nagad, Bank
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Pending Students
          </span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {enrollmentsWithDues.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Active enrollments with dues
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by receipt number (REC-...), student name, or TrxID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by verification status"
          className="w-full sm:w-44 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending_verification">Pending</option>
          <option value="reversed">Reversed</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          aria-label="Filter by payment method"
          className="w-full sm:w-44 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="bank transfer">Bank Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & TrxID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((pmt) => (
                <tr
                  key={pmt._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {pmt.receiptNo}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {pmt.student?.fullName || "Student"}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {pmt.student?.studentId}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {pmt.batch?.batchName}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ৳{pmt.amount?.toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {pmt.paymentMethod}
                    </span>
                    {pmt.transactionRef ? (
                      <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[130px]">
                        Ref: {pmt.transactionRef}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {new Date(pmt.paymentDate).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        pmt.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : pmt.status === "pending_verification"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }`}
                    >
                      {pmt.status.replace("_", " ")}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenReceipt(pmt)}
                        className="h-7 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </Button>

                      {pmt.status === "pending_verification" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(pmt)}
                          className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-200 dark:border-emerald-800"
                        >
                          Verify
                        </Button>
                      )}

                      {pmt.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReverse(pmt)}
                          className="h-7 px-1.5 text-[11px] text-slate-400 hover:text-red-600"
                          title="Reverse Payment"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No payments found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Record a student installment to track receipts and commissions.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <CollectPaymentDialog
        open={isCollectOpen}
        onOpenChange={setIsCollectOpen}
        enrollmentsWithDues={enrollmentsWithDues}
        accounts={accounts}
        preselectedEnrollmentId={preselectedEnrollmentId}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptViewDialog
          open={isReceiptOpen}
          onOpenChange={setIsReceiptOpen}
          payment={selectedReceiptPayment}
        />
      )}
    </div>
  );
}

