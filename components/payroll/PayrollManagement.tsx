"use client";

import { useState } from "react";
import { IAccount, PopulatedPayrollObligation } from "@/types";
import { generateMonthlyPayroll } from "@/lib/actions/payroll.actions";
import DisburseSalaryDialog from "./DisburseSalaryDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Search,
  Banknote,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface PayrollManagementProps {
  initialObligations: PopulatedPayrollObligation[];
  currentPeriod: string;
  totalObligations?: number;
  totalPaid?: number;
  totalDue?: number;
  accounts: IAccount[];
  isSuperAdmin: boolean;
}

export default function PayrollManagement({
  initialObligations,
  currentPeriod,
  accounts,
  isSuperAdmin,
}: PayrollManagementProps) {
  const [obligations, setObligations] = useState<PopulatedPayrollObligation[]>(initialObligations);
  const [period, setPeriod] = useState(currentPeriod);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generating, setGenerating] = useState(false);

  // Disbursement modal
  const [activeObligation, setActiveObligation] = useState<PopulatedPayrollObligation | null>(null);
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);

  const filtered = obligations.filter((o) => {
    const emp = typeof o.employee === "object" ? o.employee : null;
    const matchesSearch =
      Boolean(emp?.fullName?.toLowerCase().includes(search.toLowerCase())) ||
      Boolean(emp?.employeeId?.toLowerCase().includes(search.toLowerCase())) ||
      Boolean(emp?.department?.toLowerCase().includes(search.toLowerCase())) ||
      o.payrollId?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      o.status.toLowerCase() === statusFilter.toLowerCase();

    return Boolean(matchesSearch && matchesStatus);
  });

  const totalGross = obligations.reduce(
    (sum, o) => sum + (o.grossPayable || 0),
    0
  );
  const totalDisbursed = obligations.reduce(
    (sum, o) => sum + (o.paidAmount || 0),
    0
  );
  const totalOutstanding = obligations.reduce(
    (sum, o) => sum + (o.dueAmount || 0),
    0
  );

  const handleGeneratePayroll = async () => {
    if (!confirm(`Generate monthly payroll obligations for ${period}? Duplicate obligations will be safely skipped.`)) {
      return;
    }

    setGenerating(true);
    try {
      const result = await generateMonthlyPayroll(period);
      toast.success(
        `Generated ${result.generatedCount} salary obligations for ${result.period} (${result.skippedCount} already existed).`
      );
      // Reload page to re-fetch
      window.location.reload();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenDisburse = (obl: PopulatedPayrollObligation) => {
    setActiveObligation(obl);
    setIsDisburseOpen(true);
  };

  const handleDisbursementSuccess = (updated: PopulatedPayrollObligation) => {
    setObligations((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Monthly Payroll Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate monthly salary obligations, track full/partial disbursements, and monitor outstanding salary liabilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="month"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                window.location.href = `/payroll?period=${e.target.value}`;
              }}
              aria-label="Payroll Month"
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none pr-2"
            />
          </div>

          {isSuperAdmin && (
            <Button
              onClick={handleGeneratePayroll}
              disabled={generating}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : `Generate ${period} Payroll`}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Salary Obligations ({period})
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{totalGross.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {obligations.length} employee obligations generated
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Salaries Paid Out
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalDisbursed.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Actual cash disbursements
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Outstanding Salary Liabilities
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ৳{totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Pending disbursements for {period}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search obligations by employee name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter payroll obligations by status"
          className="w-full sm:w-44 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="settled">Settled</option>
        </select>
      </div>

      {/* Obligations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Designation</th>
                <th className="py-3 px-4">Basic</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Gross Payable</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((obl) => {
                const due = obl.dueAmount || 0;

                return (
                  <tr
                    key={obl._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {obl.employee?.fullName || "Employee"}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {obl.employee?.employeeId}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{obl.employee?.designation}</div>
                      <span className="text-[10px] text-indigo-500">
                        {obl.employee?.department}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      ৳{obl.basicSalary?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      ৳{obl.allowances?.toLocaleString() || "0"}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      ৳{obl.deductions?.toLocaleString() || "0"}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ৳{obl.grossPayable?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ৳{obl.paidAmount?.toLocaleString() || "0"}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          due > 0
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        ৳{due.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          obl.status === "Settled"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : obl.status === "Partial"
                            ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        }`}
                      >
                        {obl.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isSuperAdmin && obl.dueAmount > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDisburse(obl)}
                          className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Banknote className="w-3 h-3" /> Disburse
                        </Button>
                      )}
                      {obl.status === "Settled" && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No payroll records generated for {period}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &ldquo;Generate {period} Payroll&rdquo; to create monthly salary obligations for active employees.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Salary Modal */}
      {activeObligation && (
        <DisburseSalaryDialog
          open={isDisburseOpen}
          onOpenChange={setIsDisburseOpen}
          obligation={activeObligation}
          accounts={accounts}
          onSuccess={handleDisbursementSuccess}
        />
      )}
    </div>
  );
}

