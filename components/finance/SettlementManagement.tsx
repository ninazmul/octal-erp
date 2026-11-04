"use client";

import { useState } from "react";
import {
  IBatch,
  IEmployee,
  IAccount,
  PopulatedSettlement,
  IBatchSettlementStatement,
  ICommissionTrackingData,
} from "@/types";
import {
  getBatchSettlementStatement,
  createSettlement,
  approveSettlement,
  disburseCommissionPayout,
  updateDraftSettlement,
  cancelDraftSettlement,
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
  Edit2,
  Trash2,
  Layers,
  UserCheck,
  Search,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface SettlementManagementProps {
  initialSettlements: PopulatedSettlement[];
  batches: IBatch[];
  instructors: IEmployee[];
  accounts: IAccount[];
  trackingData: ICommissionTrackingData;
  isSuperAdmin: boolean;
}

export default function SettlementManagement({
  initialSettlements,
  batches,
  instructors,
  accounts,
  trackingData,
  isSuperAdmin,
}: SettlementManagementProps) {
  const [settlements, setSettlements] = useState<PopulatedSettlement[]>(initialSettlements);
  const [activeTab, setActiveTab] = useState<"settlements" | "batches" | "instructors">("settlements");
  const [search, setSearch] = useState("");

  // Create / Edit settlement dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [statementData, setStatementData] = useState<IBatchSettlementStatement | null>(null);
  const [deductions, setDeductions] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<PopulatedSettlement | null>(null);
  const [cancellingSettlement, setCancellingSettlement] = useState<PopulatedSettlement | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
    setEditingSettlement(null);
    setSelectedBatchId(batches[0]?._id || "");
    setSelectedInstructorId(instructors[0]?._id || "");
    setDeductions(0);
    setNotes("");
    setStatementData(null);
    setIsCreateOpen(true);
  };

  const handleOpenCreateWithBatch = async (batchId: string, instructorId?: string) => {
    setEditingSettlement(null);
    setSelectedBatchId(batchId);
    const targetInstId = instructorId || instructors[0]?._id || "";
    setSelectedInstructorId(targetInstId);
    setDeductions(0);
    setNotes("");
    setStatementData(null);
    setIsCreateOpen(true);

    if (batchId && targetInstId) {
      setLoadingStatement(true);
      try {
        const data = await getBatchSettlementStatement(batchId, targetInstId);
        setStatementData(data);
      } catch {
        setStatementData(null);
      } finally {
        setLoadingStatement(false);
      }
    }
  };

  const handleOpenCreateWithInstructor = async (instructorId: string, batchId?: string) => {
    setEditingSettlement(null);
    setSelectedInstructorId(instructorId);
    const targetBatchId = batchId || batches[0]?._id || "";
    setSelectedBatchId(targetBatchId);
    setDeductions(0);
    setNotes("");
    setStatementData(null);
    setIsCreateOpen(true);

    if (targetBatchId && instructorId) {
      setLoadingStatement(true);
      try {
        const data = await getBatchSettlementStatement(targetBatchId, instructorId);
        setStatementData(data);
      } catch {
        setStatementData(null);
      } finally {
        setLoadingStatement(false);
      }
    }
  };

  const handleOpenEdit = (settlement: PopulatedSettlement) => {
    setEditingSettlement(settlement);
    setSelectedBatchId(String(settlement.batch?._id || settlement.batch));
    setSelectedInstructorId(String(settlement.instructor?._id || settlement.instructor));
    setDeductions(settlement.deductions);
    setNotes(settlement.notes || "");
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
      if (editingSettlement) {
        const updated = await updateDraftSettlement(editingSettlement._id, { deductions, notes });
        setSettlements((prev) =>
          prev.map((item) =>
            item._id === updated._id
              ? { ...item, ...updated, batch: item.batch, instructor: item.instructor }
              : item
          )
        );
        toast.success(`Settlement ${editingSettlement.settlementNo} updated.`);
        setIsCreateOpen(false);
        setEditingSettlement(null);
        return;
      }
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

  const handleCancelSettlement = async () => {
    if (!cancellingSettlement) return;
    setIsCancelling(true);
    try {
      const updated = await cancelDraftSettlement(cancellingSettlement._id);
      setSettlements((prev) =>
        prev.map((item) =>
          item._id === updated._id ? { ...item, status: "Cancelled", dueAmount: 0 } : item
        )
      );
      toast.success(`Settlement ${cancellingSettlement.settlementNo} cancelled.`);
      setCancellingSettlement(null);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to cancel settlement.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleApprove = async (s: PopulatedSettlement) => {
    try {
      await approveSettlement(s._id);
      setSettlements((prev) =>
        prev.map((item) => (item._id === s._id ? { ...item, status: "Approved" } : item))
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

  // Filtered lists for each tab
  const filteredSettlements = settlements.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.settlementNo.toLowerCase().includes(q) ||
      s.instructor?.fullName?.toLowerCase().includes(q) ||
      s.batch?.batchName?.toLowerCase().includes(q)
    );
  });

  const filteredBatches = trackingData.batchTracking.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.batchName.toLowerCase().includes(q) ||
      b.batchCode.toLowerCase().includes(q) ||
      b.courseTitle.toLowerCase().includes(q) ||
      b.instructors.some((inst) => inst.fullName.toLowerCase().includes(q))
    );
  });

  const filteredInstructors = trackingData.instructorTracking.filter((inst) => {
    const q = search.toLowerCase();
    return (
      inst.fullName.toLowerCase().includes(q) ||
      inst.employeeId.toLowerCase().includes(q) ||
      inst.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Instructor Batch Payouts & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track batch earnings per admission, prepare statements, approve them, and record instructor payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Prepare Settlement
          </Button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider block">Total Earned</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{trackingData.summary.totalEarned.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">From batch collections</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider block">Total Settled</span>
            <FileCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            ৳{trackingData.summary.totalSettled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">In active statements</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider block">Disbursed Payouts</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{trackingData.summary.totalPaidOut.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Paid to instructors</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider block">Outstanding Due</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ৳{trackingData.summary.totalOutstandingDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pending payment</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("settlements")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
            activeTab === "settlements"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Settlement Statements</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "settlements" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {settlements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
            activeTab === "batches"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Track by Batch</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "batches" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {trackingData.batchTracking.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("instructors")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
            activeTab === "instructors"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Track by Instructor</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "instructors" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {trackingData.instructorTracking.length}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <Input
          placeholder={
            activeTab === "settlements"
              ? "Search settlements by settlement no, instructor, or batch..."
              : activeTab === "batches"
              ? "Search by batch code, batch name, course title, or assigned instructor..."
              : "Search instructors by name, employee ID, or phone..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
        />
      </div>

      {/* TAB 1: SETTLEMENT STATEMENTS */}
      {activeTab === "settlements" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Settlement No</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Eligible Collections</th>
                  <th className="py-3 px-4">Gross Batch Earnings</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Paid / Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSettlements.map((s) => (
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
                            : s.status === "Cancelled"
                            ? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        }`}
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === "Draft" && isSuperAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(s)}
                              className="h-7 px-2 text-[11px] gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancellingSettlement(s)}
                              className="h-7 px-2 text-[11px] gap-1 text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(s)}
                              className="h-7 px-2 text-[11px] bg-sky-600 hover:bg-sky-700 text-white"
                            >
                              Approve Statement
                            </Button>
                          </>
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

                {filteredSettlements.length === 0 && (
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
      )}

      {/* TAB 2: TRACK BY BATCH */}
      {activeTab === "batches" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Batch Code & Name</th>
                  <th className="py-3 px-4">Course & Declared Rate</th>
                  <th className="py-3 px-4">Assigned Instructors</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-right">Collections</th>
                  <th className="py-3 px-4 text-right">Earned</th>
                  <th className="py-3 px-4 text-right">Paid Out</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredBatches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {b.batchName}
                      </div>
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {b.batchCode}
                      </span>
                      <Badge variant="outline" className="ml-2 text-[9px] py-0 px-1">
                        {b.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {b.courseTitle}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {b.instructorPayoutType === "percentage" ? `${b.instructorPayoutValue}% per admission` : b.instructorPayoutType === "fixed" ? `৳${b.instructorPayoutValue.toLocaleString()} per admission` : "Monthly salary only"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {b.instructors.length > 0 ? (
                          b.instructors.map((inst) => (
                            <div key={inst._id} className="text-slate-700 dark:text-slate-300 font-medium">
                              {inst.fullName} ({inst.employeeId})
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No instructor assigned</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {b.totalEnrollments}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      ৳{b.totalCollected.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      ৳{b.totalCommissionEarned.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ৳{b.totalCommissionPaid.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={
                          b.pendingDue > 0
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        ৳{b.pendingDue.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleOpenCreateWithBatch(
                            b.batchId,
                            b.instructors[0]?._id
                          )
                        }
                        className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                      >
                        Reconcile & Settle
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No batch tracking records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRACK BY INSTRUCTOR */}
      {activeTab === "instructors" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Instructor Name & ID</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned Batches</th>
                  <th className="py-3 px-4 text-right">Collections Generated</th>
                  <th className="py-3 px-4 text-right">Total Batch Earnings</th>
                  <th className="py-3 px-4 text-right">Disbursed Payouts</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInstructors.map((inst) => (
                  <tr key={inst.instructorId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {inst.fullName}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {inst.employeeId} • {inst.designation}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div>{inst.phone}</div>
                      {inst.email && <div className="text-[10px] text-slate-400">{inst.email}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {inst.assignedBatches.length > 0 ? (
                          inst.assignedBatches.map((b) => (
                            <Badge key={b.batchId} variant="outline" className="text-[10px] font-mono">
                              {b.batchCode}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No batches</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      ৳{inst.totalCollections.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      ৳{inst.totalCommissionEarned.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ৳{inst.totalPaidOut.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={
                          inst.pendingDue > 0
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        ৳{inst.pendingDue.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleOpenCreateWithInstructor(
                            inst.instructorId,
                            inst.assignedBatches[0]?.batchId
                          )
                        }
                        className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                      >
                        Generate Settlement
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredInstructors.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No instructor tracking records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prepare Settlement Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSettlement ? "Edit Draft Settlement" : "Prepare Batch Settlement Statement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSettlement} className="space-y-4 pt-2">
            {!editingSettlement && (
              <>
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
                        {b.batchName} ({b.batchCode}) — {b.instructorPayoutType === "percentage" ? `${b.instructorPayoutValue}% per admission` : b.instructorPayoutType === "fixed" ? `৳${b.instructorPayoutValue} per admission` : "monthly salary only"}
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
              </>
            )}

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
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div>
                    <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 block">
                      Instructor Batch Payout
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      Earned once for each student admission
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold text-indigo-700 dark:text-indigo-300">
                    {statementData.batchPayoutType === "percentage" ? `${statementData.batchPayoutValue}%` : statementData.batchPayoutType === "fixed" ? `৳${statementData.batchPayoutValue.toLocaleString()}` : "No batch payout"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Eligible Admissions:</span>
                  <span className="font-mono font-semibold">
                    {statementData.eligibleCollectionsCount} students (fee total ৳{statementData.totalEligibleCollections.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Batch Earnings:</span>
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

                {/* Detailed admission earnings breakdown */}
                {statementData.eligibleEntries && statementData.eligibleEntries.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 text-[11px] uppercase tracking-wider">
                      Admission Earnings Breakdown ({statementData.eligibleEntries.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 sticky top-0">
                          <tr>
                            <th className="py-1 px-2">Student</th>
                            <th className="py-1 px-2">Enrollment</th>
                            <th className="py-1 px-2 text-right">Student Fee</th>
                            <th className="py-1 px-2 text-right">Payout Rule</th>
                            <th className="py-1 px-2 text-right">Earning</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {statementData.eligibleEntries.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                              <td className="py-1 px-2 font-medium">
                                {(e.enrollment as unknown as { student?: { fullName?: string } })?.student?.fullName || "Student"}
                              </td>
                              <td className="py-1 px-2 font-mono text-slate-500">
                                {(e.enrollment as unknown as { enrollmentId?: string })?.enrollmentId || "—"}
                              </td>
                              <td className="py-1 px-2 font-mono text-right">
                                ৳{(e.enrollment as unknown as { finalPayableAmount?: number })?.finalPayableAmount?.toLocaleString() || "0"}
                              </td>
                              <td className="py-1 px-2 font-mono text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                                {statementData.batchPayoutType === "percentage" ? `${statementData.batchPayoutValue}%` : "Fixed"}
                              </td>
                              <td className="py-1 px-2 font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                ৳{(e.commissionEarned || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                disabled={
                  submitting ||
                  (editingSettlement
                    ? deductions > editingSettlement.grossCommission
                    : !statementData || statementData.netPayable <= 0)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Saving..." : editingSettlement ? "Save Changes" : "Generate Statement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!cancellingSettlement}
        onOpenChange={(open) => !open && setCancellingSettlement(null)}
        title="Cancel draft settlement?"
        description="This will cancel the unpaid draft and release its commission entries for a future settlement. Approved or paid settlements cannot be cancelled."
        onConfirm={handleCancelSettlement}
        isLoading={isCancelling}
      />

      {/* Disburse Payout Dialog */}
      {activeSettlement && (
        <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Disburse Instructor Payout ({activeSettlement.settlementNo})
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
