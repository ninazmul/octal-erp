"use client";

import { useState } from "react";
import { IBatch, IEmployee, IAccount, PopulatedSettlement, IBatchSettlementStatement } from "@/types";
import {
  getBatchSettlementStatement,
  createSettlement,
  approveSettlement,
  disburseCommissionPayout,
} from "@/lib/actions/commission.actions";
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
  FileCheck,
  Plus,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface SettlementManagementProps {
  initialSettlements: PopulatedSettlement[];
  batches: IBatch[];
  instructors: IEmployee[];
  accounts: IAccount[];
  isSuperAdmin: boolean;
}

export default function SettlementManagement({
  initialSettlements,
  batches,
  instructors,
  accounts,
  isSuperAdmin,
}: SettlementManagementProps) {
  const [settlements, setSettlements] = useState<PopulatedSettlement[]>(initialSettlements);
  const [search, setSearch] = useState("");

  // Create settlement dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [statementData, setStatementData] = useState<IBatchSettlementStatement | null>(null);
  const [deductions, setDeductions] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payout disbursement dialog state
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [activeSettlement, setActiveSettlement] = useState<PopulatedSettlement | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Bank Transfer" | "bKash" | "Nagad" | "Rocket" | "Card" | "Other"
  >("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ""
  );
  const [disbursing, setDisbursing] = useState(false);

  const handleOpenCreate = () => {
    setSelectedBatchId(batches[0]?._id || "");
    setSelectedInstructorId(instructors[0]?._id || "");
    setDeductions(0);
    setNotes("");
    setStatementData(null);
    setIsCreateOpen(true);
  };

  const handleFetchStatement = async () => {
    if (!selectedBatchId || !selectedInstructorId) return;
    setLoadingStatement(true);
    try {
      const data = await getBatchSettlementStatement(
        selectedBatchId,
        selectedInstructorId
      );
      setStatementData(data);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to calculate settlement statement.");
      setStatementData(null);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !selectedInstructorId) {
      toast.error("Please select both a batch and an instructor.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSettlement({
        batchId: selectedBatchId,
        instructorId: selectedInstructorId,
        deductions,
        notes,
      });

      setSettlements((prev) => [created, ...prev]);
      toast.success(`Settlement statement ${created.settlementNo} created!`);
      setIsCreateOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create settlement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (s: PopulatedSettlement) => {
    try {
      await approveSettlement(s._id);
      setSettlements((prev) =>
        prev.map((item) =>
          item._id === s._id ? { ...item, status: "Approved" } : item
        )
      );
      toast.success(`Settlement ${s.settlementNo} approved!`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to approve settlement.");
    }
  };

  const handleOpenPayout = (s: PopulatedSettlement) => {
    setActiveSettlement(s);
    setPayoutAmount(s.dueAmount);
    setPaymentMethod("Bank Transfer");
    setTransactionRef("");
    setIsPayoutOpen(true);
  };

  const handleDisbursePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSettlement || !payoutAmount || payoutAmount <= 0) return;

    setDisbursing(true);
    try {
      const payout = await disburseCommissionPayout({
        settlementId: activeSettlement._id,
        amount: payoutAmount,
        paymentMethod,
        transactionRef,
        accountId,
      });

      setSettlements((prev) =>
        prev.map((item) => {
          if (item._id === activeSettlement._id) {
            const newPaid = item.paidAmount + payoutAmount;
            const newDue = Math.max(0, item.netPayable - newPaid);
            return {
              ...item,
              paidAmount: newPaid,
              dueAmount: newDue,
              status: newDue === 0 ? "Disbursed" : "Approved",
            };
          }
          return item;
        })
      );

      toast.success(`Payout disbursed successfully! Payout No: ${payout.payoutNo}`);
      setIsPayoutOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to disburse payout.");
    } finally {
      setDisbursing(false);
    }
  };

  const filtered = settlements.filter((s) => {
    const matchesSearch =
      s.settlementNo.toLowerCase().includes(search.toLowerCase()) ||
      s.instructor?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.batch?.batchName?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Batch Settlement Statements & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reconcile verified student collections for a batch, calculate net commissions, approve statements, and disburse payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/finance/commissions">
            <Button variant="outline" className="rounded-xl text-xs sm:text-sm">
              Commission Entries
            </Button>
          </Link>
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Prepare Settlement
          </Button>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Input
            placeholder="Search settlements by settlement no, instructor, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Settlement No</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Eligible Collections</th>
                <th className="py-3 px-4">Gross Commission</th>
                <th className="py-3 px-4">Net Payable</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {s.settlementNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {s.instructor?.fullName}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {s.instructor?.employeeId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {s.batch?.batchName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    ৳{s.totalEligibleCollections?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                    ৳{s.grossCommission?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ৳{s.netPayable?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ৳{s.paidAmount?.toLocaleString() || "0"}
                    </span>
                    <span className="text-slate-400"> / </span>
                    <span className={s.dueAmount > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>
                      ৳{s.dueAmount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        s.status === "Disbursed"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : s.status === "Approved"
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.status === "Draft" && isSuperAdmin && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(s)}
                          className="h-7 px-2 text-[11px] bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          Approve Statement
                        </Button>
                      )}

                      {s.status === "Approved" && isSuperAdmin && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPayout(s)}
                          className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Banknote className="w-3 h-3" /> Disburse Payout
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No settlements generated yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Prepare a batch settlement to reconcile verified student collections and pay instructors.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prepare Settlement Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prepare Batch Settlement Statement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSettlement} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Batch *
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
                aria-label="Select Batch"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select Batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.batchName} ({b.batchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Instructor *
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                required
                aria-label="Select Instructor"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select Instructor</option>
                {instructors.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.fullName} ({inst.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleFetchStatement}
              disabled={loadingStatement || !selectedBatchId || !selectedInstructorId}
              className="w-full text-xs font-medium"
            >
              {loadingStatement ? "Computing Collections..." : "Reconcile Batch Collections"}
            </Button>

            {statementData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Eligible Collections:</span>
                  <span className="font-mono font-semibold">
                    {statementData.eligibleCollectionsCount} payments (৳{statementData.totalEligibleCollections.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Commission Earned:</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    ৳{statementData.grossCommission.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid Out:</span>
                  <span className="font-mono font-semibold text-slate-600">
                    ৳{statementData.alreadyPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                  <span>Net Payable:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ৳{(statementData.netPayable - (deductions || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Approved Deductions (৳)
              </label>
              <Input
                type="number"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Statement Notes
              </label>
              <Input
                placeholder="Final clearance notes, special incentives..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !statementData || statementData.netPayable <= 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Submitting..." : "Generate Statement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disburse Payout Dialog */}
      {activeSettlement && (
        <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Disburse Commission Payout ({activeSettlement.settlementNo})
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleDisbursePayout} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 block">Recipient:</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  {activeSettlement.instructor?.fullName} ({activeSettlement.instructor?.employeeId})
                </span>
                <span className="text-slate-500 block mt-1">
                  Batch: <strong>{activeSettlement.batch?.batchName}</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disbursement Amount (৳) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max={activeSettlement.dueAmount}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
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
                  <option value="bKash">bKash Payout</option>
                  <option value="Nagad">Nagad Payout</option>
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
                  Bank Reference / TrxID
                </label>
                <Input
                  placeholder="e.g. TR-2026-OCT-8812"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayoutOpen(false)}
                  disabled={disbursing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={disbursing || !payoutAmount}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {disbursing ? "Disbursing..." : "Confirm Payout"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

