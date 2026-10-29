"use client";

import { useState } from "react";
import { IStudent } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Receipt,
} from "lucide-react";
import Link from "next/link";

interface StudentDirectoryProps {
  initialStudents: IStudent[];
  total: number;
}

export default function StudentDirectory({
  initialStudents,
  total,
}: StudentDirectoryProps) {
  const [students] = useState<IStudent[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPayableAll = students.reduce(
    (sum, s) => sum + (s.totalPayableSum || 0),
    0
  );
  const totalCollectedAll = students.reduce(
    (sum, s) => sum + (s.totalPaidSum || 0),
    0
  );
  const totalDueAll = students.reduce(
    (sum, s) => sum + (s.totalDueSum || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered students, course enrollments, tuition fee collection status, and outstanding dues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/students/new">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              New Admission
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Students
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {total}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Payable Fees
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ৳{totalPayableAll.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalCollectedAll.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Outstanding Dues
          </span>
          <div className={`text-xl font-bold mt-1 ${totalDueAll > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
            ৳{totalDueAll.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and status filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by student name, ID (OCT-STU-...), or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter students by status"
          className="w-full sm:w-48 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Batches</th>
                <th className="py-3 px-4">Total Payable</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Remaining Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((student) => {
                const due = student.totalDueSum || 0;

                return (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {student.fullName}
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {student.studentId}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {student.phone}
                      </div>
                      {student.email && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate max-w-[150px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          {student.email}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {student.totalEnrollmentsCount || 0}
                      </span>
                      <span className="text-slate-400 text-[11px]"> Courses</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      ৳{student.totalPayableSum?.toLocaleString() || "0"}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ৳{student.totalPaidSum?.toLocaleString() || "0"}
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
                          student.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        }`}
                      >
                        {student.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/payments?studentId=${student._id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Pay
                          </Button>
                        </Link>

                        <Link href={`/students/${student._id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-indigo-600 dark:text-indigo-400"
                          >
                            Profile <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No students found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Admit a student to register them into courses and batches.
                    </p>
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

