"use client";

import { useState } from "react";
import { IBatch, ICourse, ISubject, IEmployee } from "@/types";
import {
  createBatch,
  updateBatch,
  closeBatchAcademically,
} from "@/lib/actions/academic.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit2,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface BatchManagementProps {
  initialBatches: IBatch[];
  courses: ICourse[];
  subjects: ISubject[];
  instructors: IEmployee[];
}

export default function BatchManagement({
  initialBatches,
  courses,
  subjects,
  instructors,
}: BatchManagementProps) {
  const [batches, setBatches] = useState<IBatch[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<IBatch | null>(null);

  // Form states
  const [batchCode, setBatchCode] = useState("");
  const [batchName, setBatchName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [status, setStatus] = useState<
    "Upcoming" | "Ongoing" | "Completed" | "Cancelled"
  >("Upcoming");
  const [financialStatus, setFinancialStatus] = useState<
    "Open" | "Settling" | "Settled"
  >("Open");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Handle course selection change: auto-fill subject and instructors from course
  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    const courseObj = courses.find((c) => c._id === selectedCourseId);
    if (courseObj) {
      const subjId =
        typeof courseObj.subject === "string"
          ? courseObj.subject
          : courseObj.subject?._id;
      if (subjId) setSubjectId(subjId);

      const instIds = (courseObj.instructors || []).map((i) =>
        typeof i === "string" ? i : (i as IEmployee)._id
      );
      setSelectedInstructors(instIds);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchName.toLowerCase().includes(search.toLowerCase()) ||
      b.batchCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || b.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setBatchCode("");
    setBatchName("");
    const firstCourse = courses[0];
    setCourseId(firstCourse?._id || "");
    if (firstCourse) {
      const subjId =
        typeof firstCourse.subject === "string"
          ? firstCourse.subject
          : firstCourse.subject?._id;
      setSubjectId(subjId || subjects[0]?._id || "");
      setSelectedInstructors(
        (firstCourse.instructors || []).map((i) =>
          typeof i === "string" ? i : (i as IEmployee)._id
        )
      );
    } else {
      setSubjectId(subjects[0]?._id || "");
      setSelectedInstructors([]);
    }
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setScheduleDescription("Sun, Tue, Thu | 7:00 PM - 9:00 PM");
    setMaxCapacity(30);
    setStatus("Upcoming");
    setFinancialStatus("Open");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (batch: IBatch) => {
    setEditingBatch(batch);
    setBatchCode(batch.batchCode);
    setBatchName(batch.batchName);
    const crsId =
      typeof batch.course === "string" ? batch.course : batch.course?._id;
    const sbjId =
      typeof batch.subject === "string" ? batch.subject : batch.subject?._id;
    setCourseId(crsId || courses[0]?._id || "");
    setSubjectId(sbjId || subjects[0]?._id || "");
    setSelectedInstructors(
      (batch.instructors || []).map((i) =>
        typeof i === "string" ? i : (i as IEmployee)._id
      )
    );
    setStartDate(
      new Date(batch.startDate).toISOString().split("T")[0]
    );
    setEndDate(
      batch.endDate ? new Date(batch.endDate).toISOString().split("T")[0] : ""
    );
    setScheduleDescription(batch.scheduleDescription || "");
    setMaxCapacity(batch.maxCapacity || 30);
    setStatus(batch.status);
    setFinancialStatus(batch.financialStatus);
    setNotes(batch.notes || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode.trim() || !batchName.trim() || !courseId || !subjectId) {
      toast.error("Batch code, name, course, and subject are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBatch) {
        const updated = await updateBatch(editingBatch._id, {
          batchName,
          instructors: selectedInstructors,
          startDate,
          endDate: endDate || undefined,
          scheduleDescription,
          maxCapacity: Number(maxCapacity),
          status,
          financialStatus,
          notes,
        });
        setBatches((prev) =>
          prev.map((b) => (b._id === editingBatch._id ? updated : b))
        );
        toast.success("Batch updated successfully!");
      } else {
        const created = await createBatch({
          batchCode,
          batchName,
          courseId,
          subjectId,
          instructors: selectedInstructors,
          startDate,
          endDate: endDate || undefined,
          scheduleDescription,
          maxCapacity: Number(maxCapacity),
          notes,
        });
        setBatches((prev) => [created, ...prev]);
        toast.success("Batch created successfully!");
      }
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save batch.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAcademically = async (batch: IBatch) => {
    if (!confirm(`Mark "${batch.batchName}" as academically completed? Student dues and instructor payouts will remain manageable.`)) {
      return;
    }
    try {
      await closeBatchAcademically(batch._id);
      setBatches((prev) =>
        prev.map((b) => (b._id === batch._id ? { ...b, status: "Completed" } : b))
      );
      toast.success("Batch marked as Academically Completed!");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to close batch.");
    }
  };

  const toggleInstructorSelection = (id: string) => {
    setSelectedInstructors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Batches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage course batches, class schedules, seat capacity, dues, and batch settlement lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by batch name or batch code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="w-full sm:w-48 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredBatches.map((batch) => {
          const courseObj = batch.course as ICourse;
          const totalEnrollments = batch.totalEnrollments || 0;
          const agreedFees = batch.totalAgreedFees || 0;
          const collected = batch.totalCollected || 0;
          const due = batch.totalDue || 0;

          return (
            <div
              key={batch._id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                      {batch.batchCode}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {courseObj?.title || "Course"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${
                        batch.status === "Ongoing"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : batch.status === "Upcoming"
                          ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30"
                          : batch.status === "Completed"
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                          : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {batch.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${
                        batch.financialStatus === "Settled"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      }`}
                    >
                      {batch.financialStatus === "Settled" ? "Financially Cleared" : "Financials Open"}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  {batch.batchName}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Starts: {new Date(batch.startDate).toLocaleDateString()}
                    {batch.endDate && ` • Ends: ${new Date(batch.endDate).toLocaleDateString()}`}
                  </span>
                </p>

                {batch.scheduleDescription && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{batch.scheduleDescription}</span>
                  </p>
                )}

                {/* Financial & Enrollment Dashboard strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Enrolled
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {totalEnrollments} / {batch.maxCapacity}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Agreed Fees
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      ৳{agreedFees.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Collected
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{collected.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Outstanding
                    </span>
                    <span className={`text-sm font-bold ${due > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                      ৳{due.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(batch)}
                    className="h-8 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>

                  {batch.status !== "Completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseAcademically(batch)}
                      className="h-8 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Complete Academic
                    </Button>
                  )}
                </div>

                <Link href={`/academic/batches/${batch._id}`}>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                  >
                    View Details & Dues <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}

        {filteredBatches.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No batches found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Create a batch to start scheduling classes, admitting students, and tracking payments.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBatch ? "Edit Batch" : "Create New Batch"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Batch Code * (Unique)
                </label>
                <Input
                  placeholder="e.g. FSWD-B01"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
                  required
                  disabled={Boolean(editingBatch)}
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Batch Name *
                </label>
                <Input
                  placeholder="e.g. Batch 01 (Evening)"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  required
                  aria-label="Course"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  aria-label="Subject"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Estimated End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Seat Capacity *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "Upcoming"
                        | "Ongoing"
                        | "Completed"
                        | "Cancelled"
                    )
                  }
                  aria-label="Batch Status"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Schedule Description
                </label>
                <Input
                  placeholder="e.g. Sat, Mon, Wed | 6:00 PM - 8:00 PM (Lab 2)"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                />
              </div>

              {/* Assign Instructors */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Instructors
                </label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  {instructors.map((inst) => (
                    <label
                      key={inst._id}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInstructors.includes(inst._id)}
                        onChange={() => toggleInstructorSelection(inst._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium">{inst.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({inst.employeeId})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Internal Notes
                </label>
                <Textarea
                  placeholder="Classroom allocation, equipment requirements, special rules..."
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
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Saving..." : editingBatch ? "Update Batch" : "Create Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

