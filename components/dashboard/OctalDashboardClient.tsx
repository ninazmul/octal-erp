"use client";

import { OctalFinancialDashboardStats, InstructorDashboardStats, AdminRole, AppModule, ModulePermissions } from "@/types";
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
  BookOpen,
  Users,
  FileBarChart2,
  Settings,
  ShieldCheck,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  stats: OctalFinancialDashboardStats | null;
  instructorStats: InstructorDashboardStats | null;
  role: AdminRole;
  userName: string;
  permissions: ModulePermissions;
}

const MODULE_LINKS: Array<{
  module: AppModule;
  label: string;
  description: string;
  href: string;
  icon: typeof Layers;
}> = [
  { module: "academic", label: "Courses & batches", description: "Review your available academic workspace.", href: "/academic/courses", icon: BookOpen },
  { module: "students", label: "Students & admissions", description: "Open the student directory and admission tools.", href: "/students", icon: Users },
  { module: "payments", label: "Payments", description: "Review collections and payment records.", href: "/payments", icon: Receipt },
  { module: "commissions", label: "Instructor payouts", description: "Review batch earnings and settlements.", href: "/finance/commissions", icon: Percent },
  { module: "staff", label: "Staff directory", description: "View staff profiles and assignments.", href: "/staff", icon: GraduationCap },
  { module: "payroll", label: "Payroll", description: "Review salary obligations and payroll activity.", href: "/payroll", icon: Wallet },
  { module: "expenses", label: "Expenses", description: "Review operational costs and approvals.", href: "/expenses", icon: CreditCard },
  { module: "finance", label: "Accounts & ledger", description: "Manage accounts and review ledger activity.", href: "/finance/accounts", icon: Building },
  { module: "reports", label: "Reports", description: "Open reports available to your account.", href: "/reports", icon: FileBarChart2 },
  { module: "admins", label: "User access", description: "Review administrator accounts and access.", href: "/admins", icon: ShieldCheck },
  { module: "activity_logs", label: "Activity logs", description: "Review recorded system activity.", href: "/activity-logs", icon: ClipboardList },
  { module: "settings", label: "Settings", description: "View organization settings.", href: "/settings", icon: Settings },
];

export default function OctalDashboardClient({
  stats,
  instructorStats,
  role,
  userName,
  permissions,
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
                Track your assigned batches, student performance, monthly salary, and batch payout statements.
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
              Monthly Salary
            </span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              ৳{instructorStats.monthlySalary.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Fixed monthly payroll amount
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Batch Earnings Earned
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
            {instructorStats.assignedBatches.map((batch) => (
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

        {/* Recent batch earnings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm overflow-hidden">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-600" /> Recent Batch Earnings
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">Batch</th>
                  <th className="pb-3 px-3">Payout Basis</th>
                  <th className="pb-3 px-3">Payout Rule</th>
                  <th className="pb-3 px-3">Earned (৳)</th>
                  <th className="pb-3 px-3">Paid (৳)</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {instructorStats.recentCommissions.map((comm) => {
                  const batchName =
                    typeof comm.batch === "object" && comm.batch !== null
                      ? (comm.batch as { batchName?: string }).batchName || "Batch"
                      : "Batch";
                  return (
                    <tr key={comm._id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {batchName}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {comm.payoutType === "percentage" || (!comm.payoutType && comm.commissionRate > 0) ? `${comm.payoutValue ?? comm.commissionRate}% of batch fees` : comm.payoutType === "fixed" ? "Fixed batch total" : "Historical earning"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                        {comm.commissionRate > 0 ? `${comm.commissionRate}%` : "Fixed"}
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
                  );
                })}

                {instructorStats.recentCommissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No batch earnings recorded yet.
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

  if (isInstructor && !instructorStats) {
    return (
      <div className="rounded-3xl border border-indigo-200/70 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 p-8 text-center shadow-sm">
        <GraduationCap className="mx-auto h-9 w-9 text-indigo-500" />
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">Instructor profile is not linked</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Ask a Super Admin to link your account to your instructor profile to see assigned courses and batches.</p>
      </div>
    );
  }

  if (role === "custom" || (!stats && !isInstructor)) {
    const availableModules = MODULE_LINKS.filter(
      ({ module }) => permissions[module] !== "none" &&
        (role === "super_admin" || !["admins", "activity_logs", "settings"].includes(module)),
    );
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-200/70 dark:border-indigo-900 bg-gradient-to-br from-white via-indigo-50 to-sky-100 dark:from-slate-900 dark:via-indigo-950/70 dark:to-slate-900 p-6 sm:p-9 shadow-sm">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <Badge variant="outline" className="mb-3 border-indigo-200 bg-white/70 text-indigo-700 dark:border-indigo-800 dark:bg-slate-900/70 dark:text-indigo-300">
                Custom workspace
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome, {userName}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                Your dashboard is built around the modules and actions assigned to your account.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-4 py-3 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Access profile</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Custom permissions</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your workspace</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose a section to continue.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{availableModules.length} available sections</span>
          </div>
          {availableModules.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {availableModules.map(({ module, label, description, href, icon: Icon }) => (
                <Link key={module} href={href} className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-600 dark:text-indigo-400"><Icon className="h-4 w-4" /></span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{label}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${permissions[module] === "write" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {permissions[module] === "write" ? "Manage" : "View"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100">
                    Open section <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No modules assigned yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ask a Super Admin to assign the sections you need.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (role === "pro" && stats) {
    const workAreas = MODULE_LINKS.filter(({ module }) =>
      ["students", "payments", "commissions", "payroll", "expenses", "finance", "reports"].includes(module),
    );
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-indigo-700 to-violet-800 p-6 sm:p-9 text-white shadow-lg">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <Badge className="mb-3 border border-white/20 bg-white/10 text-white hover:bg-white/10">PRO · Admissions & Accounts</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {userName}</h1>
              <p className="mt-2 max-w-xl text-sm text-sky-100">
                Your daily workspace for student admissions, collections, accounts, and financial operations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/students/new"><Button className="rounded-xl bg-white text-indigo-800 hover:bg-sky-50 font-semibold"><UserPlus className="mr-2 h-4 w-4" />New admission</Button></Link>
              <Link href="/payments"><Button variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"><Receipt className="mr-2 h-4 w-4" />Record payment</Button></Link>
              <Link href="/finance/accounts"><Button variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"><Building className="mr-2 h-4 w-4" />Accounts</Button></Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Active students", value: stats.activeStudentsCount.toLocaleString(), note: "Currently enrolled", icon: Users, color: "text-indigo-600 dark:text-indigo-400" },
            { label: "Student collections", value: `৳${stats.totalStudentCollections.toLocaleString()}`, note: "Confirmed payments", icon: Receipt, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Outstanding dues", value: `৳${stats.totalStudentDues.toLocaleString()}`, note: "Remaining student balances", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
            { label: "Available cash", value: `৳${stats.closingCashBalance.toLocaleString()}`, note: "Cash, bank and MFS", icon: Building, color: "text-sky-600 dark:text-sky-400" },
          ].map(({ label, value, note, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2"><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><Icon className={`h-4 w-4 ${color}`} /></div>
              <p className={`mt-3 text-xl sm:text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{note}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operations</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admissions and finance tools assigned to the PRO role.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {workAreas.map(({ module, label, description, href, icon: Icon }) => (
              <Link key={module} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md">
                <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-3 text-indigo-600 dark:text-indigo-400"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{label}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </Link>
            ))}
          </div>
        </section>
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
                {role === "pro" ? "Admissions & Accounts • Daily Operations" : "Executive Overview • Organization-wide Operations"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {role === "pro" ? "PRO Operations Dashboard" : "Octal Executive Dashboard"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {role === "pro"
                ? "Manage student admissions, collections, accounts, expenses, and payroll from one focused workspace."
                : "A complete view of academic admissions, student collections, instructor settlements, payroll, and organization finances."}
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
              <Button variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white text-xs sm:text-sm">
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

        {/* Quadrant 2: Instructor batch payouts & settlements */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" /> Instructor Batch Payouts
            </h2>
            <Link href="/finance/settlements" className="text-xs text-indigo-600 hover:underline">
              Batch Settlements →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Batch Earnings
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
            <span>Pending Instructor Payouts:</span>
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

