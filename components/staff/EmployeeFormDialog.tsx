"use client";

import { useState, useEffect } from "react";
import { IEmployee, EmployeeDepartment, EmploymentType, EmployeeStatus } from "@/types";
import { createEmployee, updateEmployee } from "@/lib/actions/staff.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: IEmployee | null;
  onSuccess: (emp: IEmployee) => void;
}

export default function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<EmployeeDepartment>("Academic");
  const [designation, setDesignation] = useState("");
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>("Full-time");
  const [status, setStatus] = useState<EmployeeStatus>("Active");
  const [basicSalary, setBasicSalary] = useState<number>(20000);
  const [allowances, setAllowances] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [isInstructor, setIsInstructor] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setEmail(employee.email);
      setPhone(employee.phone);
      setDepartment(employee.department);
      setDesignation(employee.designation);
      setEmploymentType(employee.employmentType);
      setStatus(employee.status);
      setBasicSalary(employee.basicSalary || 0);
      setAllowances(employee.allowances || 0);
      setDeductions(employee.deductions || 0);
      setIsInstructor(employee.isInstructor);
      setNotes(employee.notes || "");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setDepartment("Academic");
      setDesignation("");
      setEmploymentType("Full-time");
      setStatus("Active");
      setBasicSalary(20000);
      setAllowances(0);
      setDeductions(0);
      setIsInstructor(true);
      setNotes("");
    }
  }, [employee, open]);

  const netSalary = Math.max(0, basicSalary + allowances - deductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !designation.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (employee) {
        const updated = await updateEmployee(employee._id, {
          fullName,
          phone,
          department,
          designation,
          employmentType,
          status,
          basicSalary,
          allowances,
          deductions,
          isInstructor,
          notes,
        });
        toast.success(`Updated employee ${updated.fullName}!`);
        onSuccess(updated);
      } else {
        const created = await createEmployee({
          fullName,
          email,
          phone,
          department,
          designation,
          employmentType,
          status,
          basicSalary,
          allowances,
          deductions,
          isInstructor,
          notes,
        });
        toast.success(`Registered employee ${created.fullName} (${created.employeeId})!`);
        onSuccess(created);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee Profile & Salary" : "Register New Employee"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Mahfuzur Rahman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Email *
              </label>
              <Input
                type="email"
                placeholder="mahfuz@octalerp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={Boolean(employee)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number *
              </label>
              <Input
                placeholder="018XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => {
                  const dept = e.target.value as EmployeeDepartment;
                  setDepartment(dept);
                  if (dept === "Academic") setIsInstructor(true);
                }}
                aria-label="Department"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Academic">Academic (Faculty & Instructors)</option>
                <option value="Administration">Administration & Management</option>
                <option value="Finance">Finance & Accounts</option>
                <option value="Front Desk">Front Desk & Reception</option>
                <option value="Marketing">Marketing & Admissions</option>
                <option value="IT">IT & Systems</option>
                <option value="Support">Support & Logistics</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Designation *
              </label>
              <Input
                placeholder="e.g. Senior Instructor, Receptionist, Accountant"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(e.target.value as EmploymentType)
                }
                aria-label="Employment Type"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            {/* Salary Structure Configuration */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-3">
                Monthly Salary Structure (Confidential)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Basic Salary (৳) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    required
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Allowances (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={allowances}
                    onChange={(e) => setAllowances(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Deductions (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Net Monthly (৳)
                  </label>
                  <div className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    ৳{netSalary.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isInstructorCheckbox"
                checked={isInstructor}
                onChange={(e) => setIsInstructor(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isInstructorCheckbox"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Is Course Instructor (Eligible for Batch assignments and Referral Commissions)
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Notes
              </label>
              <Textarea
                placeholder="Emergency contact, educational qualifications, contract notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? "Saving..." : employee ? "Update Employee" : "Save Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

