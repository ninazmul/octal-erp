"use client";

import { useState } from "react";
import { IStudent } from "@/types";
import { updateStudent } from "@/lib/actions/student.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/components/providers/PermissionContext";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Receipt,
  Edit2,
  Archive,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface StudentDirectoryProps {
  initialStudents: IStudent[];
  total: number;
}

export default function StudentDirectory({
  initialStudents,
  total,
}: StudentDirectoryProps) {
  const [students, setStudents] = useState<IStudent[]>(initialStudents);
  const { canWrite } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingStudent, setEditingStudent] = useState<IStudent | null>(null);
  const [archivingStudent, setArchivingStudent] = useState<IStudent | null>(null);
  const [saving, setSaving] = useState(false);
  const [editFields, setEditFields] = useState({ fullName: "", phone: "", email: "", guardianName: "", guardianPhone: "", address: "", notes: "" });

  const openEdit = (student: IStudent) => {
    setEditingStudent(student);
    setEditFields({
      fullName: student.fullName,
      phone: student.phone,
      email: student.email || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      address: student.address || "",
      notes: student.notes || "",
    });
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudent || !editFields.fullName.trim() || !editFields.phone.trim()) return;
    setSaving(true);
    try {
      const updated = await updateStudent(editingStudent._id, editFields);
      setStudents((previous) => previous.map((student) => student._id === updated._id ? { ...student, ...updated } : student));
      setEditingStudent(null);
      toast.success("Student profile updated.");
    } catch (error) {
      toast.error((error as Error).message || "Could not update student.");
    } finally {
      setSaving(false);
    }
  };

  const archiveStudent = async () => {
    if (!archivingStudent) return;
    setSaving(true);
    try {
      const updated = await updateStudent(archivingStudent._id, { status: "Archived" });
      setStudents((previous) => previous.map((student) => student._id === updated._id ? { ...student, ...updated } : student));
      setArchivingStudent(null);
      toast.success("Student archived. Enrollment and payment history was preserved.");
    } catch (error) {
      toast.error((error as Error).message || "Could not archive student.");
    } finally {
      setSaving(false);
    }
  };

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
                        {canWrite("students") && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(student)} className="h-8 px-2 text-[11px] gap-1">
                              <Edit2 className="w-3 h-3" /> Edit
                            </Button>
                            {student.status !== "Archived" && (
                              <Button size="sm" variant="ghost" onClick={() => setArchivingStudent(student)} className="h-8 px-2 text-[11px] text-rose-600 hover:text-rose-700 gap-1" aria-label={`Archive ${student.fullName}`}>
                                <Archive className="w-3.5 h-3.5" /> Archive
                              </Button>
                            )}
                          </>
                        )}
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

      <Dialog open={Boolean(editingStudent)} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Edit Student Profile</DialogTitle></DialogHeader>
          <form onSubmit={saveStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ["fullName", "Full Name", true],
                ["phone", "Phone", true],
                ["email", "Email", false],
                ["guardianName", "Guardian Name", false],
                ["guardianPhone", "Guardian Phone", false],
                ["address", "Address", false],
              ] as const).map(([key, label, required]) => (
                <label key={key} className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>{label}{required ? " *" : ""}</span>
                  <Input value={editFields[key]} required={required} onChange={(event) => setEditFields((previous) => ({ ...previous, [key]: event.target.value }))} />
                </label>
              ))}
            </div>
            <label className="block space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>Notes</span>
              <textarea value={editFields.notes} onChange={(event) => setEditFields((previous) => ({ ...previous, notes: event.target.value }))} className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingStudent(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 text-white">{saving ? "Saving…" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        open={Boolean(archivingStudent)}
        onOpenChange={(open) => !open && setArchivingStudent(null)}
        title="Archive student?"
        description={`Archive ${archivingStudent?.fullName || "this student"}? Their enrollment and payment history will remain available.`}
        onConfirm={archiveStudent}
        isLoading={saving}
      />
    </div>
  );
}

