"use client";

import { useState } from "react";
import { IBatch, IEnrollment, ICommissionEntry, ICourse, ISubject, IEmployee, IStudent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ArrowLeft,
  Percent,
} from "lucide-react";
import Link from "next/link";

interface BatchDetailsProps {
  batch: IBatch & {
    enrollments: Array<
      IEnrollment & {
        student: IStudent;
        referrer?: IEmployee;
      }
    >;
    commissions: Array<
      ICommissionEntry & {
        referrer: IEmployee;
      }
    >;
    totalEnrollments: number;
    totalAgreedFees: number;
    totalCollected: number;
    totalDue: number;
    totalCommissionEarned: number;
    totalCommissionPaid: number;
  };
}

export default function BatchDetailsView({ batch }: BatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<"students" | "commissions">("students");

  const courseObj = batch.course as ICourse;
  const subjectObj = batch.subject as ISubject;
  const instructors = (batch.instructors || []) as IEmployee[];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <Link
            href="/academic/batches"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Batches
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {batch.batchName}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              {batch.batchCode}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                batch.status === "Ongoing"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : batch.status === "Upcoming"
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30"
                  : "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
              }`}
            >
              {batch.status}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                batch.financialStatus === "Settled"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              }`}
            >
              Financial: {batch.financialStatus}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Course: <strong className="text-slate-700 dark:text-slate-300">{courseObj?.title}</strong> ({subjectObj?.name})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/students/new?batchId=${batch._id}`}>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm">
              <Users className="w-4 h-4" /> Admit Student to Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Enrollments
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {batch.totalEnrollments} <span className="text-xs text-slate-400 font-normal">/ {batch.maxCapacity} Seats</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Agreed Fees
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{batch.totalAgreedFees.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{batch.totalCollected.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Remaining Due
          </span>
          <div className={`text-xl font-bold mt-1 ${batch.totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
            ৳{batch.totalDue.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Commission Earned
          </span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ৳{batch.totalCommissionEarned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Meta Information Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Class Schedule</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
            {batch.scheduleDescription || "Schedule not specified"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Timeline</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
            {new Date(batch.startDate).toLocaleDateString()}
            {batch.endDate ? ` → ${new Date(batch.endDate).toLocaleDateString()}` : " (Ongoing)"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Assigned Instructors</span>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {instructors.map((inst) => (
              <span
                key={inst._id}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
              >
                {inst.fullName}
              </span>
            ))}
            {instructors.length === 0 && (
              <span className="text-slate-400">None assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Enrolled Students vs Commissions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 px-4 pt-2">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "students"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> Enrolled Students ({batch.enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "commissions"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Percent className="w-4 h-4" /> Commission Entries ({batch.commissions.length})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "students" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Contact</th>
                    <th className="pb-3 px-3">Agreed Fee</th>
                    <th className="pb-3 px-3">Discount</th>
                    <th className="pb-3 px-3">Final Payable</th>
                    <th className="pb-3 px-3">Collected</th>
                    <th className="pb-3 px-3">Due</th>
                    <th className="pb-3 px-3">Referrer</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {batch.enrollments.map((enr) => {
                    const student = enr.student;
                    const due = enr.remainingDue || 0;

                    return (
                      <tr key={enr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {student?.fullName || "Student"}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {student?.studentId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-600 dark:text-slate-300 font-mono">
                            {student?.phone}
                          </div>
                          {student?.email && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {student.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                          ৳{enr.agreedFee?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          ৳{enr.discount?.toLocaleString() || "0"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white font-mono">
                          ৳{enr.finalPayableAmount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          ৳{enr.totalCollectedAmount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className={due > 0 ? "font-bold text-amber-600 dark:text-amber-400" : "text-slate-400"}>
                            ৳{due.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {enr.referrer ? (
                            <div>
                              <span className="font-medium text-slate-700 dark:text-slate-300 block">
                                {enr.referrer.fullName}
                              </span>
                              <span className="text-[10px] text-indigo-500 font-mono">
                                ({enr.commissionRate}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              enr.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            }`}
                          >
                            {enr.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/payments?enrollmentId=${enr._id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                            >
                              Collect Fee
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {batch.enrollments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Referrer / Instructor</th>
                    <th className="pb-3 px-3">Collected Amount</th>
                    <th className="pb-3 px-3">Rate</th>
                    <th className="pb-3 px-3">Earned Commission</th>
                    <th className="pb-3 px-3">Paid Amount</th>
                    <th className="pb-3 px-3">Remaining</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {batch.commissions.map((comm) => (
                    <tr key={comm._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {comm.referrer?.fullName || "Instructor"}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {comm.referrer?.employeeId}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        ৳{comm.collectedAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {comm.commissionRate}%
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        ৳{comm.commissionEarned?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                        ৳{comm.paidAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        ৳{comm.remainingCommission?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                        >
                          {comm.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(comm.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {batch.commissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No commissions generated for this batch yet. Commissions are created automatically when referred student payments are confirmed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

