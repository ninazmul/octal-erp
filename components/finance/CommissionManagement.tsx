"use client";

import { useState } from "react";
import { IEmployee, ICourse, PopulatedCommissionEntry, PopulatedCommissionRule } from "@/types";
import { deactivateCommissionRule, saveCommissionRule, updateCommissionEntry, voidCommissionEntry } from "@/lib/actions/commission.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Percent,
  Search,
  Plus,
  Settings,
  Banknote,
  ArrowRight,
  Edit2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CommissionManagementProps {
  initialEntries: PopulatedCommissionEntry[];
  total: number;
  rules: PopulatedCommissionRule[];
  instructors: IEmployee[];
  courses: ICourse[];
  isSuperAdmin: boolean;
}

export default function CommissionManagement({
  initialEntries,
  rules: initialRules,
  instructors,
  courses,
  isSuperAdmin,
}: CommissionManagementProps) {
  const [activeTab, setActiveTab] = useState<"entries" | "rules">("entries");
  const [commissionEntries, setCommissionEntries] = useState<PopulatedCommissionEntry[]>(initialEntries);
  const [rules, setRules] = useState<PopulatedCommissionRule[]>(initialRules);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rule dialog state
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("global");
  const [percentage, setPercentage] = useState<number>(20);
  const [ruleNotes, setRuleNotes] = useState("");
  const [submittingRule, setSubmittingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<PopulatedCommissionRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<PopulatedCommissionRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PopulatedCommissionEntry | null>(null);
  const [voidingEntry, setVoidingEntry] = useState<PopulatedCommissionEntry | null>(null);
  const [entryCorrection, setEntryCorrection] = useState({ collectedAmount: 0, commissionRate: 0, reason: "" });
  const [entryActionLoading, setEntryActionLoading] = useState(false);

  const filteredEntries = commissionEntries.filter((e) => {
    const matchesSearch =
      e.referrer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.referrer?.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      e.enrollment?.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.batch?.batchName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      e.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalEarned = commissionEntries.reduce(
    (sum, e) => sum + (e.status === "adjusted" ? 0 : (e.commissionEarned || 0)),
    0
  );
  const totalPaid = commissionEntries.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  const totalRemaining = commissionEntries.reduce(
    (sum, e) => sum + (e.remainingCommission || 0),
    0
  );

  const handleOpenRuleDialog = () => {
    setEditingRule(null);
    setSelectedInstructorId(instructors[0]?._id || "");
    setSelectedCourseId("global");
    setPercentage(20);
    setRuleNotes("");
    setIsRuleDialogOpen(true);
  };

  const handleEditRule = (rule: PopulatedCommissionRule) => {
    setEditingRule(rule);
    setSelectedInstructorId(rule.referrer?._id || "");
    setSelectedCourseId(rule.course?._id || "global");
    setPercentage(rule.percentage);
    setRuleNotes(rule.notes || "");
    setIsRuleDialogOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructorId) {
      toast.error("Please select an instructor.");
      return;
    }

    setSubmittingRule(true);
    try {
      const saved = await saveCommissionRule({
        ruleId: editingRule?._id,
        referrerId: selectedInstructorId,
        courseId: selectedCourseId === "global" ? null : selectedCourseId,
        percentage,
        notes: ruleNotes,
      });

      const populatedSaved = {
        ...saved,
        referrer: instructors.find((instructor) => instructor._id === selectedInstructorId) || saved.referrer,
        course: courses.find((course) => course._id === selectedCourseId) || null,
      };
      setRules((prev) => {
        const idx = editingRule ? prev.findIndex((rule) => rule._id === editingRule._id) : prev.findIndex(
          (r) =>
            r.referrer?._id === selectedInstructorId &&
            (r.course?._id || "global") === selectedCourseId
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = populatedSaved;
          return updated;
        }
        return [populatedSaved, ...prev];
      });

      toast.success(editingRule ? "Commission rule updated." : "Commission rule configured successfully!");
      setEditingRule(null);
      setIsRuleDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save rule.");
    } finally {
      setSubmittingRule(false);
    }
  };

  const handleSaveEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEntry) return;
    setEntryActionLoading(true);
    try {
      const updated = await updateCommissionEntry(editingEntry._id, { commissionRate: entryCorrection.commissionRate, reason: entryCorrection.reason });
      setCommissionEntries((current) => current.map((entry) => entry._id === updated._id ? { ...entry, ...updated, referrer: entry.referrer, batch: entry.batch, payment: entry.payment, enrollment: entry.enrollment } : entry));
      setEditingEntry(null);
      toast.success("Commission entry updated.");
    } catch (error) {
      toast.error((error as Error).message || "Could not update commission entry.");
    } finally {
      setEntryActionLoading(false);
    }
  };

  const handleVoidEntry = async () => {
    if (!voidingEntry) return;
    setEntryActionLoading(true);
    try {
      const updated = await voidCommissionEntry(voidingEntry._id, entryCorrection.reason);
      setCommissionEntries((current) => current.map((entry) => entry._id === updated._id ? { ...entry, status: "adjusted", remainingCommission: 0 } : entry));
      setVoidingEntry(null);
      toast.success("Commission entry removed from payable commissions.");
    } catch (error) {
      toast.error((error as Error).message || "Could not remove commission entry.");
    } finally {
      setEntryActionLoading(false);
    }
  };

  const handleDeactivateRule = async () => {
    if (!deletingRule) return;
    setDeleting(true);
    try {
      await deactivateCommissionRule(deletingRule._id);
      setRules((previous) => previous.map((rule) => rule._id === deletingRule._id ? { ...rule, isActive: false } : rule));
      setDeletingRule(null);
      toast.success("Commission rule deactivated. Existing entries were preserved.");
    } catch (error) {
      toast.error((error as Error).message || "Could not remove commission rule.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Percent className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Instructor Commissions & Referral Earnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track earned referral commissions from student payments, configure rates, and review settlement eligibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/finance/settlements">
            <Button
              variant="outline"
              className="rounded-xl text-xs sm:text-sm gap-1.5"
            >
              Batch Settlements <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {isSuperAdmin && (
            <Button
              onClick={handleOpenRuleDialog}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
            >
              <Settings className="w-4 h-4" /> Configure Rates
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Earned Commissions
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{totalEarned.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Generated from verified collections
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Disbursed Payouts
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Paid out to instructors
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Awaiting Payout / Settlement
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ৳{totalRemaining.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Active company liability
          </span>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 px-4 pt-2">
          <button
            onClick={() => setActiveTab("entries")}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "entries"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Banknote className="w-4 h-4" /> Commission Entries ({commissionEntries.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "rules"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" /> Commission Rules ({rules.length})
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "entries" && (
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
                  <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                  <Input
                    placeholder="Search by instructor name, student, or batch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-7 bg-transparent"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter commission entries by status"
                  className="w-full sm:w-44 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="earned">Earned</option>
                  <option value="awaiting_settlement">Awaiting Settlement</option>
                  <option value="approved_payable">Approved</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="adjusted">Adjusted / Removed</option>
                </select>
              </div>

              {/* Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Instructor / Referrer</th>
                      <th className="pb-3 px-3">Student & Batch</th>
                      <th className="pb-3 px-3">Payment Receipt</th>
                      <th className="pb-3 px-3">Collected</th>
                      <th className="pb-3 px-3">Rate</th>
                      <th className="pb-3 px-3">Earned</th>
                      <th className="pb-3 px-3">Paid</th>
                      <th className="pb-3 px-3">Remaining</th>
                      <th className="pb-3 px-3">Status</th>
                      {isSuperAdmin && <th className="pb-3 px-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredEntries.map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {e.referrer?.fullName || "Instructor"}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {e.referrer?.employeeId}
                          </span>
                        </td>
                        {isSuperAdmin && <td className="py-3 px-3 text-right">
                          {!e.settlementId && e.paidAmount === 0 && ["earned", "awaiting_settlement"].includes(e.status) ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] gap-1" onClick={() => { setEditingEntry(e); setEntryCorrection({ collectedAmount: e.collectedAmount, commissionRate: e.commissionRate, reason: "" }); }}><Edit2 className="w-3 h-3" /> Edit</Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-rose-600" aria-label="Remove commission entry" onClick={() => { setVoidingEntry(e); setEntryCorrection((current) => ({ ...current, reason: "" })); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          ) : <span className="text-[10px] text-slate-400">Locked by payout history</span>}
                        </td>}

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {e.enrollment?.student?.fullName}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {e.batch?.batchName}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                          {e.payment?.receiptNo || "Receipt"}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          ৳{e.collectedAmount?.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {e.commissionRate}%
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          ৳{e.commissionEarned?.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                          ৳{e.paidAmount?.toLocaleString() || "0"}
                        </td>

                        <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          ৳{e.remainingCommission?.toLocaleString() || "0"}
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                          >
                            {e.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}

                    {filteredEntries.length === 0 && (
                      <tr>
                        <td colSpan={isSuperAdmin ? 10 : 9} className="py-8 text-center text-slate-400">
                          No commission entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Configure specific or global commission percentages per referring instructor.
                </span>
                <Button
                  size="sm"
                  onClick={handleOpenRuleDialog}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Instructor</th>
                      <th className="pb-3 px-3">Scope / Course</th>
                      <th className="pb-3 px-3">Commission Rate</th>
                      <th className="pb-3 px-3">Basis</th>
                      <th className="pb-3 px-3">Effective Date</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {rules.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {r.referrer?.fullName}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {r.referrer?.employeeId}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {r.course?.title ? (
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              {r.course.title}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-500">
                              All Courses (Global Rule)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          {r.percentage}%
                        </td>
                        <td className="py-3 px-3 text-slate-500 capitalize">
                          Actual Collections
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(r.effectiveFrom || r.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${r.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20"}`}
                          >
                            {r.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isSuperAdmin && <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEditRule(r)} className="h-8 px-2 text-[11px] gap-1"><Edit2 className="w-3 h-3" /> Edit</Button>
                            {r.isActive && <Button size="sm" variant="ghost" onClick={() => setDeletingRule(r)} className="h-8 px-2 text-rose-600" aria-label="Delete commission rule"><Trash2 className="w-3.5 h-3.5" /></Button>}
                          </div>}
                        </td>
                      </tr>
                    ))}

                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No custom rules configured yet. The system uses the course default rate (20%) when no rule is specified.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configure Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Commission Rule" : "Configure Commission Rule"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRule} className="space-y-4 pt-2">
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

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Course Scope
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                aria-label="Course Scope"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="global">All Courses (Global Default)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Commission Rate (%) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                required
                className="font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Notes / Agreement Details
              </label>
              <Input
                placeholder="e.g. Approved by Management for 2026 Batch Season"
                value={ruleNotes}
                onChange={(e) => setRuleNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRuleDialogOpen(false)}
                disabled={submittingRule}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRule}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submittingRule ? "Saving..." : editingRule ? "Update Commission Rule" : "Save Commission Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        open={Boolean(deletingRule)}
        onOpenChange={(open) => !open && setDeletingRule(null)}
        title="Delete commission rule?"
        description="Deactivate this rule? Historical commission entries will remain unchanged, and the default rate will apply to future collections."
        onConfirm={handleDeactivateRule}
        isLoading={deleting}
      />

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Correct Commission Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEntry} className="space-y-4 pt-2">
            <label className="block text-xs font-medium">Payment collection amount (৳)<Input type="number" value={entryCorrection.collectedAmount} readOnly /></label>
            <label className="block text-xs font-medium">Commission rate (%)<Input type="number" min="0" max="100" step="0.01" value={entryCorrection.commissionRate} onChange={(e) => setEntryCorrection((v) => ({ ...v, commissionRate: Number(e.target.value) }))} /></label>
            <label className="block text-xs font-medium">Correction reason *<Input required value={entryCorrection.reason} onChange={(e) => setEntryCorrection((v) => ({ ...v, reason: e.target.value }))} /></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button><Button type="submit" disabled={entryActionLoading || !entryCorrection.reason.trim()}>{entryActionLoading ? "Saving..." : "Save Correction"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!voidingEntry} onOpenChange={(open) => !open && setVoidingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Remove Commission Entry</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">This marks the unpaid entry as adjusted and keeps its audit record. Paid or settlement-linked entries are locked.</p>
          <label className="block text-xs font-medium">Reason for removal *<Input required value={entryCorrection.reason} onChange={(e) => setEntryCorrection((v) => ({ ...v, reason: e.target.value }))} /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setVoidingEntry(null)}>Cancel</Button><Button type="button" variant="destructive" disabled={entryActionLoading || !entryCorrection.reason.trim()} onClick={handleVoidEntry}>{entryActionLoading ? "Removing..." : "Remove Entry"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

