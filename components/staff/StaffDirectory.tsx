"use client";

import { useState } from "react";
import { IEmployee, EmployeeDepartment } from "@/types";
import EmployeeFormDialog from "./EmployeeFormDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Search,
  Plus,
  Phone,
  Mail,
  Edit2,
  Users,
} from "lucide-react";
import Link from "next/link";

interface StaffDirectoryProps {
  initialEmployees: IEmployee[];
  isSuperAdmin: boolean;
}

export default function StaffDirectory({
  initialEmployees,
  isSuperAdmin,
}: StaffDirectoryProps) {
  const [employees, setEmployees] = useState<IEmployee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);

  const departments: Array<EmployeeDepartment | "all"> = [
    "all",
    "Academic",
    "Administration",
    "Finance",
    "Front Desk",
    "Marketing",
    "IT",
    "Support",
  ];

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.includes(search) ||
      emp.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      selectedDepartment === "all" || emp.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const totalMonthlyPayrollCommitment = employees
    .filter((e) => e.status === "Active" && e.netSalary !== null)
    .reduce((sum, e) => sum + (e.netSalary || 0), 0);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (emp: IEmployee) => {
    setEditingEmployee(emp);
    setIsDialogOpen(true);
  };

  const handleSuccess = (emp: IEmployee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((item) => item._id === emp._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = emp;
        return updated;
      }
      return [emp, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Complete Staff & Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            All Octal personnel across Academic, Reception, Administration, Finance, IT, and Marketing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/payroll">
            <Button variant="outline" className="rounded-xl text-xs sm:text-sm gap-1.5">
              Monthly Payroll
            </Button>
          </Link>
          {isSuperAdmin && (
            <Button
              onClick={handleOpenCreate}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Staff Members
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {employees.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Faculty & Instructors
          </span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {employees.filter((e) => e.isInstructor).length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Operations & Admin Staff
          </span>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {employees.filter((e) => !e.isInstructor).length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Monthly Payroll Commitment
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalMonthlyPayrollCommitment > 0
              ? `৳${totalMonthlyPayrollCommitment.toLocaleString()}`
              : "Restricted"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <Input
              placeholder="Search by employee name, ID (OCT-EMP-...), designation, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
            />
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 capitalize ${
                selectedDepartment === dept
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              {dept === "all" ? "All Departments" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div
            key={emp._id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  {emp.employeeId}
                </span>

                <div className="flex items-center gap-1.5">
                  {emp.isInstructor && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20"
                    >
                      Instructor
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      emp.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    }`}
                  >
                    {emp.status}
                  </Badge>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                {emp.fullName}
              </h3>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                {emp.designation} • {emp.department}
              </p>

              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
              </div>

              {/* Salary Structure Box (if authorized) */}
              {emp.netSalary !== null && emp.netSalary !== undefined && (
                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Monthly Net Salary:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ৳{emp.netSalary.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {emp.employmentType}
              </span>

              {isSuperAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(emp)}
                  className="h-8 px-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile & Salary
                </Button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No staff members found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add personnel across academic, administrative, reception, or finance departments.
            </p>
          </div>
        )}
      </div>

      {/* Employee Dialog */}
      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        employee={editingEmployee}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
