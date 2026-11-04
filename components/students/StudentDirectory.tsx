"use client";

import { useState } from "react";
import { IStudent, ICourse, IBatch, StudentStatus } from "@/types";
import {
  deleteStudent,
  updateStudent,
  allowDiscountAndActivateStudent,
  rejectDiscountRequest,
} from "@/lib/actions/student.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/components/providers/PermissionContext";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Receipt,
  Edit2,
  Archive,
  Trash2,
  BadgePercent,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface StudentDirectoryProps {
  initialStudents: IStudent[];
  total: number;
  initialPendingDiscountCount?: number;
  initialStatusFilter?: string;
  courses?: ICourse[];
  batches?: IBatch[];
}

export default function StudentDirectory({
  initialStudents,
  total,
  initialPendingDiscountCount = 0,
  initialStatusFilter = "all",
  courses = [],
  batches = [],
}: StudentDirectoryProps) {
  const [students, setStudents] = useState<IStudent[]>(initialStudents);
  const { canWrite, canRead, canAdmitStudents, isAdmin } = usePermissions();
  const [search, setSearch] = useState("");

  const resolvedInitialStatus =
    initialStatusFilter.toLowerCase() === "discount requested" ||
    initialStatusFilter.toLowerCase() === "discount_requested"
      ? "Discount Requested"
      : initialStatusFilter || "all";

  const [statusFilter, setStatusFilter] = useState(resolvedInitialStatus);

  // Standard edit states
  const [editingStudent, setEditingStudent] = useState<IStudent | null>(null);
  const [archivingStudent, setArchivingStudent] = useState<IStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<IStudent | null>(null);
  const [saving, setSaving] = useState(false);
  const [editFields, setEditFields] = useState<{
    fullName: string;
    phone: string;
    email: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    notes: string;
    status: StudentStatus;
  }>({
    fullName: "",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    notes: "",
    status: "Active",
  });

  // Allow discount & activate modal states
  const [discountingStudent, setDiscountingStudent] = useState<IStudent | null>(null);
  const [allowedDiscount, setAllowedDiscount] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [processingDiscount, setProcessingDiscount] = useState(false);

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
      status: student.status || "Active",
    });
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudent || !editFields.fullName.trim() || !editFields.phone.trim()) return;
    setSaving(true);
    try {
      const updated = await updateStudent(editingStudent._id, editFields);
      setStudents((previous) =>
        previous.map((student) =>
          student._id === updated._id ? { ...student, ...updated } : student
        )
      );
      setEditingStudent(null);
      toast.success("Student profile updated.");
    } catch (error) {
      toast.error((error as Error).message || "Could not update student.");
    } finally {
      setSaving(false);
    }
  };

  const openAllowDiscount = (student: IStudent) => {
    setDiscountingStudent(student);
    const crsId =
      student.requestedCourse?._id ||
      courses[0]?._id ||
      "";
    setSelectedCourseId(crsId);

    const available = batches.filter((b) => {
      const bCrsId = typeof b.course === "string" ? b.course : b.course?._id;
      return bCrsId === crsId && b.status !== "Completed" && b.status !== "Cancelled";
    });
    setSelectedBatchId(student.requestedBatch?._id || available[0]?._id || "");

    setAllowedDiscount(
      student.requestedDiscount !== undefined
        ? String(student.requestedDiscount)
        : student.approvedDiscount !== undefined
        ? String(student.approvedDiscount)
        : "0"
    );
    setAdminNotes(
      student.discountReason ? `Discount approved. Request reason: ${student.discountReason}` : ""
    );
  };

  const handleCourseChangeInDiscountModal = (crsId: string) => {
    setSelectedCourseId(crsId);
    const available = batches.filter((b) => {
      const bCrsId = typeof b.course === "string" ? b.course : b.course?._id;
      return bCrsId === crsId && b.status !== "Completed" && b.status !== "Cancelled";
    });
    setSelectedBatchId(available[0]?._id || "");
  };

  const handleAllowDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountingStudent) return;
    const discountVal = Number(allowedDiscount);
    if (!Number.isFinite(discountVal) || discountVal < 0) {
      toast.error("Please enter a valid discount amount.");
      return;
    }
    if (!selectedCourseId || !selectedBatchId) {
      toast.error("Please select a target course and batch for admission.");
      return;
    }

    setProcessingDiscount(true);
    try {
      const res = await allowDiscountAndActivateStudent({
        discountRequestId: discountingStudent.discountRequestId,
        studentId:
          discountingStudent.studentId !== "REQ-DISC"
            ? discountingStudent._id
            : undefined,
        fullName: discountingStudent.fullName,
        phone: discountingStudent.phone,
        email: discountingStudent.email,
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        allowedDiscount: discountVal,
        adminNotes,
      });

      const courseObj = courses.find((c) => c._id === selectedCourseId);
      const standardFee = courseObj?.defaultFee || discountingStudent.requestedCourse?.defaultFee || 0;
      const netPayable = Math.max(0, standardFee - discountVal);

      setStudents((prev) =>
        prev.map((s) => {
          if (s._id === discountingStudent._id || s.phone === discountingStudent.phone) {
            return {
              ...s,
              _id: res.student._id,
              studentId: res.student.studentId,
              status: "Active" as const,
              totalEnrollmentsCount: (s.totalEnrollmentsCount || 0) + 1,
              totalPayableSum: netPayable,
              totalPaidSum: 0,
              totalDueSum: netPayable,
              discountRequestId: undefined,
              requestedDiscount: undefined,
            };
          }
          return s;
        })
      );

      toast.success(
        `Discount of ৳${discountVal.toLocaleString()} approved! ${discountingStudent.fullName} is now Active and enrolled.`
      );
      setDiscountingStudent(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to allow discount and activate.");
    } finally {
      setProcessingDiscount(false);
    }
  };

  const handleRejectDiscountSubmit = async () => {
    if (!discountingStudent || !discountingStudent.discountRequestId) return;
    setProcessingDiscount(true);
    try {
      await rejectDiscountRequest(discountingStudent.discountRequestId, adminNotes);
      setStudents((prev) =>
        prev.map((s) => {
          if (s._id === discountingStudent._id || s.phone === discountingStudent.phone) {
            return {
              ...s,
              status: "Inactive" as const,
              discountRequestId: undefined,
            };
          }
          return s;
        })
      );
      toast.success("Discount request rejected.");
      setDiscountingStudent(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Could not reject discount request.");
    } finally {
      setProcessingDiscount(false);
    }
  };

  const archiveStudent = async () => {
    if (!archivingStudent) return;
    setSaving(true);
    try {
      const updated = await updateStudent(archivingStudent._id, { status: "Archived" });
      setStudents((previous) =>
        previous.map((student) =>
          student._id === updated._id ? { ...student, ...updated } : student
        )
      );
      setArchivingStudent(null);
      toast.success("Student archived. Enrollment and payment history was preserved.");
    } catch (error) {
      toast.error((error as Error).message || "Could not archive student.");
    } finally {
      setSaving(false);
    }
  };

  const removeStudent = async () => {
    if (!deletingStudent) return;
    setSaving(true);
    try {
      await deleteStudent(deletingStudent._id);
      setStudents((previous) =>
        previous.filter((student) => student._id !== deletingStudent._id)
      );
      setDeletingStudent(null);
      toast.success("Student deleted.");
    } catch (error) {
      toast.error((error as Error).message || "Could not delete student.");
    } finally {
      setSaving(false);
    }
  };

  const countActive = students.filter((s) => s.status === "Active").length;
  const countDiscountRequested = Math.max(
    initialPendingDiscountCount,
    students.filter(
      (s) => s.status === "Discount Requested" || Boolean(s.discountRequestId)
    ).length
  );
  const countInactive = students.filter((s) => s.status === "Inactive").length;
  const countArchived = students.filter((s) => s.status === "Archived").length;

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

  const selectedCourseObj = courses.find((c) => c._id === selectedCourseId);
  const availableBatchesForDiscount = batches.filter((b) => {
    const bCrsId = typeof b.course === "string" ? b.course : b.course?._id;
    return bCrsId === selectedCourseId && b.status !== "Completed" && b.status !== "Cancelled";
  });
  const selectedBatchObj = availableBatchesForDiscount.find((b) => b._id === selectedBatchId);
  const modalStandardFee =
    selectedCourseObj?.defaultFee ||
    discountingStudent?.requestedCourse?.defaultFee ||
    0;
  const modalAllowedDiscountNum = Number(allowedDiscount) || 0;
  const modalNetTuition = Math.max(0, modalStandardFee - modalAllowedDiscountNum);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Student Directory
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {total || students.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered students, discount request approvals, course enrollments, and tuition collections.
          </p>
        </div>

        {canAdmitStudents && canRead("academic") && (
        <div className="flex items-center gap-3">
          <Link href="/students/new">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              New Admission
            </Button>
          </Link>
        </div>
        )}
      </div>

      {/* Discount Request Pending Alert Banner */}
      {countDiscountRequested > 0 && statusFilter !== "Discount Requested" && (
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                {countDiscountRequested} student{countDiscountRequested > 1 ? "s have" : " has"} requested tuition discounts
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Review requested amounts, enter authorized discounts manually, and activate their enrollment directly below.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setStatusFilter("Discount Requested")}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 ml-3 shadow-xs"
          >
            Review Requests ({countDiscountRequested})
          </Button>
        </div>
      )}

      {/* Aggregate metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Students
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {students.length}
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Students", count: students.length },
          { id: "Active", label: "Active", count: countActive },
          {
            id: "Discount Requested",
            label: "Discount Requested",
            count: countDiscountRequested,
            highlight: countDiscountRequested > 0,
          },
          { id: "Inactive", label: "Inactive", count: countInactive },
          { id: "Archived", label: "Archived", count: countArchived },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              statusFilter === tab.id
                ? tab.id === "Discount Requested"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : tab.highlight
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/70 hover:bg-amber-100"
                : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.id === "Discount Requested" && <BadgePercent className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === tab.id
                  ? "bg-white/20 text-white"
                  : tab.highlight
                  ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and status select */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by student name, ID (OCT-STU-...), phone number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter students by status"
          className="w-full sm:w-56 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Discount Requested">Discount Requested</option>
          <option value="Inactive">Inactive</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4 w-[22%]">Student</th>
                <th className="py-3 px-4 w-[15%]">Contact</th>
                <th className="py-3 px-4 w-[13%]">Course</th>
                <th className="py-3 px-4 w-[12%] text-right">Payable</th>
                <th className="py-3 px-4 w-[10%] text-right">Paid</th>
                <th className="py-3 px-4 w-[10%] text-right">Due</th>
                <th className="py-3 px-4 w-[10%] text-center">Status</th>
                <th className="py-3 px-4 w-[8%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((student) => {
                const due = student.totalDueSum || 0;
                const isDiscountReq =
                  student.status === "Discount Requested" ||
                  Boolean(student.discountRequestId);

                return (
                  <tr
                    key={student._id}
                    className={`transition-colors ${
                      isDiscountReq
                        ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/30"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {/* Student Name & ID */}
                    <td className="py-3 px-4">
                      {student.studentId !== "REQ-DISC" ? (
                        <Link href={`/students/${student._id}`} className="group inline-block max-w-[200px]">
                          <span className="block truncate font-semibold text-sm text-slate-900 transition-colors group-hover:text-indigo-600 group-hover:underline dark:text-white dark:group-hover:text-indigo-400">
                            {student.fullName}
                          </span>
                        </Link>
                      ) : (
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
                          {student.fullName}
                        </div>
                      )}
                      <span className="font-mono text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono">{student.phone}</span>
                      </div>
                      {student.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Course */}
                    <td className="py-3 px-4">
                      {isDiscountReq && student.requestedCourse ? (
                        <div>
                          <span className="font-medium text-[11px] text-slate-800 dark:text-slate-200 block truncate max-w-[120px]">
                            {student.requestedCourse.title}
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            {student.requestedBatch?.batchName || "Pending"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                          <strong className="text-slate-800 dark:text-slate-200">{student.totalEnrollmentsCount || 0}</strong> Course{(student.totalEnrollmentsCount || 0) !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>

                    {/* Payable */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">
                        ৳{(student.totalPayableSum || 0).toLocaleString()}
                      </span>
                      {isDiscountReq && student.requestedDiscount ? (
                        <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Disc: ৳{student.requestedDiscount.toLocaleString()}
                        </span>
                      ) : null}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ৳{(student.totalPaidSum || 0).toLocaleString()}
                    </td>

                    {/* Due */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-mono text-[11px] ${
                          due > 0
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        ৳{due.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          student.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : student.status === "Discount Requested"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold gap-1"
                            : student.status === "Archived"
                            ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        }`}
                      >
                        {student.status === "Discount Requested" && (
                          <BadgePercent className="w-3 h-3 text-amber-600" />
                        )}
                        {student.status === "Discount Requested" ? "Pending" : student.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Primary CTA for discount requests */}
                        {isDiscountReq && isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => openAllowDiscount(student)}
                            className="h-7 px-2 text-[10px] bg-amber-600 hover:bg-amber-700 text-white gap-1 font-semibold shadow-xs"
                            title="Allow Discount & Activate"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </Button>
                        )}

                        {/* Dropdown for secondary actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {student.status === "Active" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/payments?studentId=${student._id}`} className="gap-2 cursor-pointer text-emerald-600">
                                  <Receipt className="w-3.5 h-3.5" />
                                  Record Payment
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {canWrite("students") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEdit(student)} className="gap-2 cursor-pointer">
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit Student
                                </DropdownMenuItem>
                                {student.status !== "Archived" && (
                                  <DropdownMenuItem
                                    onClick={() => setArchivingStudent(student)}
                                    className="gap-2 cursor-pointer text-rose-600 focus:text-rose-700"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingStudent(student)}
                                  className="gap-2 cursor-pointer text-rose-600 focus:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      {statusFilter === "Discount Requested"
                        ? "No discount requested students found"
                        : "No students found"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {statusFilter === "Discount Requested"
                        ? "All discount requests have been reviewed and activated."
                        : "Admit a student to register them into courses and batches."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.map((student) => {
            const due = student.totalDueSum || 0;
            const isDiscountReq =
              student.status === "Discount Requested" ||
              Boolean(student.discountRequestId);

            return (
              <div
                key={student._id}
                className={`p-4 space-y-3 ${
                  isDiscountReq
                    ? "bg-amber-50/40 dark:bg-amber-950/20"
                    : ""
                }`}
              >
                {/* Top: Name, Status, Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {student.studentId !== "REQ-DISC" ? (
                      <Link href={`/students/${student._id}`} className="font-semibold text-sm text-slate-900 hover:text-indigo-600 hover:underline dark:text-white dark:hover:text-indigo-400">
                        {student.fullName}
                      </Link>
                    ) : (
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {student.fullName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {student.studentId}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          student.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : student.status === "Discount Requested"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold"
                            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        }`}
                      >
                        {student.status === "Discount Requested" ? "Pending Discount" : student.status}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {student.status === "Active" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/payments?studentId=${student._id}`} className="gap-2 cursor-pointer text-emerald-600">
                            <Receipt className="w-3.5 h-3.5" />
                            Record Payment
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canWrite("students") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(student)} className="gap-2 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Student
                          </DropdownMenuItem>
                          {student.status !== "Archived" && (
                            <DropdownMenuItem
                              onClick={() => setArchivingStudent(student)}
                              className="gap-2 cursor-pointer text-rose-600"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingStudent(student)}
                            className="gap-2 cursor-pointer text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="font-mono">{student.phone}</span>
                  </span>
                  {student.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </span>
                  )}
                </div>

                {/* Financial row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                    <span className="text-[9px] font-semibold uppercase text-slate-400 block">Payable</span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      ৳{(student.totalPayableSum || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                    <span className="text-[9px] font-semibold uppercase text-slate-400 block">Paid</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{(student.totalPaidSum || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                    <span className="text-[9px] font-semibold uppercase text-slate-400 block">Due</span>
                    <span className={`font-mono text-xs font-bold ${due > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                      ৳{due.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Discount approve CTA for mobile */}
                {isDiscountReq && isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => openAllowDiscount(student)}
                    className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Allow Discount & Activate
                  </Button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 px-4">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {statusFilter === "Discount Requested"
                  ? "No discount requested students found"
                  : "No students found"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {statusFilter === "Discount Requested"
                  ? "All discount requests have been reviewed and activated."
                  : "Admit a student to register them into courses and batches."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ALLOW DISCOUNT & ACTIVATE MODAL */}
      <Dialog
        open={Boolean(discountingStudent)}
        onOpenChange={(open) => !processingDiscount && !open && setDiscountingStudent(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <BadgePercent className="w-5 h-5 text-amber-600" />
              Allow Tuition Discount & Activate Student
            </DialogTitle>
          </DialogHeader>

          {discountingStudent && (
            <form onSubmit={handleAllowDiscountSubmit} className="space-y-4 pt-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {discountingStudent.fullName}
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {discountingStudent.phone}
                  </span>
                </div>
                {discountingStudent.discountReason && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    <strong className="text-slate-700 dark:text-slate-200">Reason:</strong>{" "}
                    {discountingStudent.discountReason}
                  </p>
                )}
                {discountingStudent.requestedBy && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Requested by: {discountingStudent.requestedBy.name || discountingStudent.requestedBy.email} ({discountingStudent.requestedBy.role})
                  </p>
                )}
              </div>

              {/* Course & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Course *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChangeInDiscountModal(e.target.value)}
                    required
                    aria-label="Target Course"
                    className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select Course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.code}) - ৳{c.defaultFee?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Batch *
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    required
                    aria-label="Target Batch"
                    className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select Active Batch</option>
                    {availableBatchesForDiscount.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchName} ({b.batchCode}) - {b.status}
                      </option>
                    ))}
                  </select>
                  {selectedBatchObj?.scheduleDescription ? (
                    <p className="text-[11px] text-slate-500 mt-1">Schedule: {selectedBatchObj.scheduleDescription}</p>
                  ) : null}
                </div>
              </div>

              {/* Manual Discount Entry & Real-Time Calculation */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Allowed Discount Amount (৳) *
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                    <Input
                      type="number"
                      min="0"
                      max={modalStandardFee}
                      step="1"
                      required
                      value={allowedDiscount}
                      onChange={(e) => setAllowedDiscount(e.target.value)}
                      className="pl-8 font-mono text-base font-bold text-indigo-700 dark:text-indigo-300"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Requested amount was ৳{(discountingStudent.requestedDiscount || 0).toLocaleString()}. You can specify any manual amount.
                  </span>
                </label>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Official Fee</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-200">
                      ৳{modalStandardFee.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Less Discount</span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">
                      -৳{modalAllowedDiscountNum.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-semibold block">Net Payable</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-300 text-sm">
                      ৳{modalNetTuition.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Admin Approval Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved special merit discount authorized by management..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                {discountingStudent.discountRequestId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRejectDiscountSubmit}
                    disabled={processingDiscount}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Reject Request
                  </Button>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDiscountingStudent(null)}
                    disabled={processingDiscount}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processingDiscount || !selectedCourseId || !selectedBatchId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {processingDiscount ? "Activating..." : "Allow Discount & Set to Active"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* STANDARD EDIT STUDENT PROFILE DIALOG */}
      <Dialog
        open={Boolean(editingStudent)}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
          </DialogHeader>
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
                <label
                  key={key}
                  className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  <span>
                    {label}
                    {required ? " *" : ""}
                  </span>
                  <Input
                    value={editFields[key]}
                    required={required}
                    onChange={(event) =>
                      setEditFields((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>Student Status *</span>
                <select
                  value={editFields.status}
                  onChange={(e) =>
                    setEditFields((prev) => ({
                      ...prev,
                      status: e.target.value as StudentStatus,
                    }))
                  }
                  aria-label="Student Status"
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Discount Requested">Discount Requested</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>Notes</span>
              <textarea
                value={editFields.notes}
                onChange={(event) =>
                  setEditFields((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
                className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingStudent(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white"
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(archivingStudent)}
        onOpenChange={(open) => !open && setArchivingStudent(null)}
        title="Archive student?"
        description={`Archive ${
          archivingStudent?.fullName || "this student"
        }? Their enrollment and payment history will remain available.`}
        onConfirm={archiveStudent}
        isLoading={saving}
      />
      <DeleteConfirmDialog
        open={Boolean(deletingStudent)}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Delete student permanently?"
        description={`Delete ${
          deletingStudent?.fullName || "this student"
        }? Students with enrollment or payment history cannot be deleted; archive them to preserve financial records.`}
        onConfirm={removeStudent}
        isLoading={saving}
      />
    </div>
  );
}
