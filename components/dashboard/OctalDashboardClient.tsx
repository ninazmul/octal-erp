"use client";

import { OctalFinancialDashboardStats, InstructorDashboardStats, AdminRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Layers,
  Wallet,
  CreditCard,
  Building,
  Percent,
  TrendingUp,
  ArrowRight,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  stats: OctalFinancialDashboardStats | null;
  instructorStats: InstructorDashboardStats | null;
  role: AdminRole;
  userName: string;
}

export default function OctalDashboardClient({
  stats,
  instructorStats,
  role,
  userName,
}: DashboardClientProps) {
  const isInstructor = role === "instructor";

  // INSTRUCTOR PORTAL DASHBOARD
  if (isInstructor && instructorStats) {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
                Instructor Academic & Earnings Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                Welcome, {instructorStats.instructorName || userName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
                Track your assigned batches, student performance, student referral attribution, and commission settlements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/academic/batches">
                <Button className="rounded-xl bg-white text-indigo-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm shadow">
                  View My Batches
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Instructor Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned Batches
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {instructorStats.assignedBatchesCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {instructorStats.assignedStudentsCount} active students
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Referred Students
            </span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {instructorStats.referredStudentsCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              ৳{instructorStats.totalReferralCollections.toLocaleString()} collected
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Commission Earned
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ৳{instructorStats.totalCommissionEarned.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
              ৳{instructorStats.totalCommissionPaid.toLocaleString()} paid out
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Payout Settlement
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              ৳{instructorStats.pendingSettlementAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Awaiting batch settlement payout
            </span>
          </div>
        </div>

        {/* Assigned Batches List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> My Assigned Batches
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instructorStats.assignedBatches.map((batch: Record<string, unknown>) => (
              <div
                key={batch._id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {batch.batchCode}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {batch.batchName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {batch.scheduleDescription || "Regular schedule"}
                  </p>
                </div>

                <Link href={`/academic/batches/${batch._id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                    View <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}

            {instructorStats.assignedBatches.length === 0 && (
              <p className="text-xs text-slate-400 col-span-2 py-6 text-center">
                You are not currently assigned to any active batches.
              </p>
            )}
          </div>
        </div>

        {/* Recent Commission Entries */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-hidden">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-600" /> Recent Referral Earnings
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">Batch</th>
                  <th className="pb-3 px-3">Student Collection</th>
                  <th className="pb-3 px-3">Commission %</th>
                  <th className="pb-3 px-3">Earned (৳)</th>
                  <th className="pb-3 px-3">Paid (৳)</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {instructorStats.recentCommissions.map((comm: Record<string, unknown>) => (
                  <tr key={comm._id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {comm.batch?.batchName || "Batch"}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      ৳{comm.collectedAmount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                      {comm.commissionRate}%
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ৳{comm.commissionEarned?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600">
                      ৳{comm.paidAmount?.toLocaleString() || "0"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {comm.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {instructorStats.recentCommissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No referral commission entries recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // GLOBAL EXECUTIVE DASHBOARD (SUPER ADMIN & ADMIN)
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
                Operational ERP • Real-Time Financial Position
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Octal Management Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Centralized view of academic admissions, student collections, instructor settlements, monthly payroll, and net cashflow reserves.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/students/new">
              <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-sm">
                <UserPlus className="w-4 h-4" /> New Admission
              </Button>
            </Link>
            <Link href="/payments">
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-sm">
                <Receipt className="w-4 h-4" /> Collect Fee
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="rounded-xl text-slate-200 border-slate-700 hover:bg-slate-800 text-xs sm:text-sm">
                Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Financial Position Hero Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Closing Cash Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Liquid Cash Balance
            </span>
            <Building className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{stats.closingCashBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total verified funds across Cash Drawers, Bank Accounts, and MFS.
          </p>
        </div>

        {/* Total Outstanding Liabilities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Outstanding Liabilities
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            ৳{stats.totalOutstandingLiabilities.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Commissions (৳{stats.approvedUnpaidCommissions.toLocaleString()}) + Salaries (৳{stats.outstandingSalaryBalances.toLocaleString()}) + Expenses (৳{stats.unpaidExpenseObligations.toLocaleString()})
          </p>
        </div>

        {/* Estimated Reserve After Commitments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Estimated Cash Reserve After Commitments
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div
            className={`text-3xl font-extrabold font-mono ${
              stats.estimatedReserveAfterCommitments >= 0
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-red-500"
            }`}
          >
            ৳{stats.estimatedReserveAfterCommitments.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Indicative safety reserve: Liquid cash minus all outstanding commitments.
          </p>
        </div>
      </div>

      {/* Operational Modules 4-Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quadrant 1: Student Collections & Tuition Dues */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Student Collections & Dues
            </h2>
            <Link href="/payments" className="text-xs text-indigo-600 hover:underline">
              View Payments →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Total Collections
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ৳{stats.totalStudentCollections.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Verified tuition received
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Outstanding Dues
              </span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                ৳{stats.totalStudentDues.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Pending collection from students
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{stats.activeStudentsCount} Active Enrolled Students</span>
            <span>{stats.activeBatchesCount} Active Batches Running</span>
          </div>
        </div>

        {/* Quadrant 2: Instructor Commissions & Settlements */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" /> Instructor Commissions & Payouts
            </h2>
            <Link href="/finance/settlements" className="text-xs text-indigo-600 hover:underline">
              Batch Settlements →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Commissions Earned
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                ৳{stats.instructorCommissionsEarned.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Earned from student payments
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Disbursed Payouts
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ৳{stats.instructorCommissionsPaid.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Actual cash paid out
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Pending Commission Payouts:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              ৳{stats.approvedUnpaidCommissions.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quadrant 3: Complete Staff & Monthly Payroll */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-sky-600" /> Staff Management & Payroll
            </h2>
            <Link href="/payroll" className="text-xs text-indigo-600 hover:underline">
              Payroll Module →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Salary Obligations
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                ৳{stats.totalSalaryObligations.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Gross monthly commitments
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Salaries Paid Out
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ৳{stats.salariesPaid.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Disbursed to employees
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{stats.totalEmployeesCount} Active Staff Members</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              Due: ৳{stats.outstandingSalaryBalances.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quadrant 4: Operational Expenses & Overhead */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" /> Operational Expenses
            </h2>
            <Link href="/expenses" className="text-xs text-indigo-600 hover:underline">
              Expenses Module →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Total Incurred
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                ৳{stats.totalOtherExpenses.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Rent, utilities, internet, etc.
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Unpaid Bills / Liabilities
              </span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                ৳{stats.unpaidExpenseObligations.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Pending vendor payments
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Double-Entry Cash Ledger:</span>
            <Link href="/finance/accounts" className="text-indigo-600 font-semibold hover:underline">
              View Cash & Bank Accounts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

