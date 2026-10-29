"use client";

import { useState } from "react";
import { IEmployee, ICourse } from "@/types";
import { saveCommissionRule } from "@/lib/actions/commission.actions";
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
  Percent,
  Search,
  Plus,
  Settings,
  Banknote,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CommissionManagementProps {
  initialEntries: Record<string, unknown>[];
  total: number;
  rules: Record<string, unknown>[];
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
  const [entries] = useState<Record<string, unknown>[]>(initialEntries);
  const [rules, setRules] = useState<Record<string, unknown>[]>(initialRules);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rule dialog state
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("global");
  const [percentage, setPercentage] = useState<number>(20);
  const [ruleNotes, setRuleNotes] = useState("");
  const [submittingRule, setSubmittingRule] = useState(false);

  const filteredEntries = entries.filter((e) => {
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

  const totalEarned = entries.reduce(
    (sum, e) => sum + (e.commissionEarned || 0),
    0
  );
  const totalPaid = entries.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
  const totalRemaining = entries.reduce(
    (sum, e) => sum + (e.remainingCommission || 0),
    0
  );

  const handleOpenRuleDialog = () => {
    setSelectedInstructorId(instructors[0]?._id || "");
    setSelectedCourseId("global");
    setPercentage(20);
    setRuleNotes("");
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
        referrerId: selectedInstructorId,
        courseId: selectedCourseId === "global" ? null : selectedCourseId,
        percentage,
        notes: ruleNotes,
      });

      // Update local rules list
      setRules((prev) => {
        const idx = prev.findIndex(
          (r) =>
            r.referrer?._id === saved.referrer &&
            r.course?._id === saved.course
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      toast.success("Commission rule configured successfully!");
      setIsRuleDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save rule.");
    } finally {
      setSubmittingRule(false);
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
            <Banknote className="w-4 h-4" /> Commission Entries ({entries.length})
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
                        <td colSpan={9} className="py-8 text-center text-slate-400">
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
                          {new Date(r.effectiveFrom || r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          >
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}

                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
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
            <DialogTitle>Configure Commission Rule</DialogTitle>
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
                {submittingRule ? "Saving..." : "Save Commission Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

