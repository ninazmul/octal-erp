"use client";

import { useState } from "react";
import { IStudent, IEnrollment, IPayment, ICourse, IBatch, IEmployee } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Receipt,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

interface StudentProfileViewProps {
  student: IStudent & {
    enrollments: Array<
      IEnrollment & {
        course: ICourse;
        batch: IBatch;
        referrer?: IEmployee;
      }
    >;
    payments: Array<
      IPayment & {
        batch: IBatch;
      }
    >;
    totalPayableSum: number;
    totalPaidSum: number;
    totalDueSum: number;
  };
}

export default function StudentProfileView({
  student,
}: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"enrollments" | "payments">("enrollments");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Directory
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {student.fullName}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              {student.studentId}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                student.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-600 border-slate-500/20"
              }`}
            >
              {student.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3.5 h-3.5" /> {student.phone}
            </span>
            {student.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {student.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Admitted: {new Date(student.admissionDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/payments?studentId=${student._id}`}>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm">
              <Receipt className="w-4 h-4" /> Record Payment
            </Button>
          </Link>
          <Link href={`/students/new`}>
            <Button variant="outline" className="rounded-xl text-xs sm:text-sm">
              Enroll in Another Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Payable Fees
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{student.totalPayableSum?.toLocaleString() || "0"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Sum of agreed fees minus approved discounts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Collected Fees
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{student.totalPaidSum?.toLocaleString() || "0"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Verified confirmed collections
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Remaining Outstanding Due
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              student.totalDueSum > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400"
            }`}
          >
            ৳{student.totalDueSum?.toLocaleString() || "0"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {student.totalDueSum > 0 ? "Pending collection" : "All dues cleared"}
          </span>
        </div>
      </div>

      {/* Contact & Guardian Details Card */}
      {(student.guardianName || student.address || student.notes) && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {student.guardianName && (
            <div>
              <span className="text-slate-400 block font-medium">Guardian Info</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {student.guardianName} {student.guardianPhone && `(${student.guardianPhone})`}
              </span>
            </div>
          )}

          {student.address && (
            <div>
              <span className="text-slate-400 block font-medium">Residential Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {student.address}
              </span>
            </div>
          )}

          {student.notes && (
            <div>
              <span className="text-slate-400 block font-medium">Admission Notes</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {student.notes}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs: Enrollments vs Payment Receipts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800 px-4 pt-2">
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "enrollments"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Course Enrollments ({student.enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "payments"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Receipt className="w-4 h-4" /> Payment History ({student.payments.length})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "enrollments" && (
            <div className="space-y-4">
              {student.enrollments.map((enr) => {
                const course = enr.course;
                const batch = enr.batch;
                const due = enr.remainingDue || 0;

                return (
                  <div
                    key={enr._id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                          {enr.enrollmentId}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {course?.title || "Course"}
                        </h3>
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
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>
                          Batch: <strong>{batch?.batchName}</strong> ({batch?.batchCode})
                        </span>
                        {enr.referrer && (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            Referrer: {enr.referrer.fullName} ({enr.commissionRate}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial summary numbers */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Payable
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ৳{enr.finalPayableAmount?.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Collected
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{enr.totalCollectedAmount?.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Due
                        </span>
                        <span
                          className={`font-bold ${
                            due > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          ৳{due.toLocaleString()}
                        </span>
                      </div>

                      <Link href={`/payments?enrollmentId=${enr._id}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Collect
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {student.enrollments.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No enrollments on record for this student.
                </p>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Receipt No</th>
                    <th className="pb-3 px-3">Batch</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Payment Method</th>
                    <th className="pb-3 px-3">Transaction Ref</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {student.payments.map((pmt) => (
                    <tr key={pmt._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {pmt.receiptNo}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {pmt.batch?.batchName || "Batch"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ৳{pmt.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {pmt.paymentMethod}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {pmt.transactionRef || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(pmt.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            pmt.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {pmt.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}

                  {student.payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No payments collected from this student yet.
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

