"use client";

import { useState } from "react";
import { ICourse, ISubject, IEmployee } from "@/types";
import {
  createCourse,
  updateCourse,
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
  BookOpen,
  Clock,
  Banknote,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

interface CourseManagementProps {
  initialCourses: ICourse[];
  subjects: ISubject[];
  instructors: IEmployee[];
}

export default function CourseManagement({
  initialCourses,
  subjects,
  instructors,
}: CourseManagementProps) {
  const [courses, setCourses] = useState<ICourse[]>(initialCourses);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ICourse | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [durationMonths, setDurationMonths] = useState(3);
  const [defaultFee, setDefaultFee] = useState(15000);
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(20);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const subjectObj = c.subject as ISubject;
    const matchesSubject =
      subjectFilter === "all" ||
      (typeof c.subject === "string"
        ? c.subject === subjectFilter
        : subjectObj?._id === subjectFilter);
    return matchesSearch && matchesSubject;
  });

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setTitle("");
    setCode("");
    setSubjectId(subjects[0]?._id || "");
    setDescription("");
    setDurationMonths(3);
    setDefaultFee(15000);
    setDefaultCommissionRate(20);
    setSelectedInstructors([]);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (course: ICourse) => {
    setEditingCourse(course);
    setTitle(course.title);
    setCode(course.code);
    const subjId =
      typeof course.subject === "string" ? course.subject : course.subject?._id;
    setSubjectId(subjId || subjects[0]?._id || "");
    setDescription(course.description || "");
    setDurationMonths(course.durationMonths || 3);
    setDefaultFee(course.defaultFee || 0);
    setDefaultCommissionRate(course.defaultCommissionRate ?? 20);
    const instIds = (course.instructors || []).map((i) =>
      typeof i === "string" ? i : (i as IEmployee)._id
    );
    setSelectedInstructors(instIds);
    setIsActive(course.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !subjectId) {
      toast.error("Title, code, and subject are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCourse) {
        const updated = await updateCourse(editingCourse._id, {
          title,
          code,
          subjectId,
          description,
          durationMonths: Number(durationMonths),
          defaultFee: Number(defaultFee),
          defaultCommissionRate: Number(defaultCommissionRate),
          instructors: selectedInstructors,
          isActive,
        });
        setCourses((prev) =>
          prev.map((c) => (c._id === editingCourse._id ? updated : c))
        );
        toast.success("Course updated successfully!");
      } else {
        const created = await createCourse({
          title,
          code,
          subjectId,
          description,
          durationMonths: Number(durationMonths),
          defaultFee: Number(defaultFee),
          defaultCommissionRate: Number(defaultCommissionRate),
          instructors: selectedInstructors,
          isActive,
        });
        setCourses((prev) => [...prev, created]);
        toast.success("Course created successfully!");
      }
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save course.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (course: ICourse) => {
    try {
      const updated = await updateCourse(course._id, {
        isActive: !course.isActive,
      });
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? updated : c))
      );
      toast.success(`Course ${updated.isActive ? "activated" : "deactivated"}!`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to change status.");
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
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage course curriculum, default fees, assigned instructors, and default commission rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <Input
            placeholder="Search by course title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          aria-label="Filter by subject"
          className="w-full sm:w-56 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {/* Courses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const subjectObj = course.subject as ISubject;
          const instCount = course.instructors?.length || 0;

          return (
            <div
              key={course._id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                      {course.code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {subjectObj?.name || "Subject"}
                    </span>
                  </div>

                  <Badge
                    variant={course.isActive ? "default" : "secondary"}
                    className={`text-[11px] cursor-pointer ${
                      course.isActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                        : "bg-slate-500/15 text-slate-600 dark:text-slate-400 hover:bg-slate-500/25 border-slate-500/30"
                    }`}
                    onClick={() => handleToggleStatus(course)}
                  >
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {course.description || "No description provided."}
                </p>

                {/* Metric Pills */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>৳{course.defaultFee?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>{course.durationMonths} Months</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{instCount} Instructors</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {course.defaultCommissionRate ?? 20}%
                    </span>
                    <span>Commission</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Multiple batches supported
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(course)}
                  className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No courses found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first course under a subject to begin admissions and batch scheduling.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Course Title *
                </label>
                <Input
                  placeholder="e.g. Full Stack Web Development with MERN"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Course Code *
                </label>
                <Input
                  placeholder="e.g. FSWD-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  aria-label="Course Subject"
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
                  Duration (Months) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Fee (৳) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="500"
                  value={defaultFee}
                  onChange={(e) => setDefaultFee(Number(e.target.value))}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Commission Rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultCommissionRate}
                  onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Default percentage earned by referring instructors for this course.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Outline course prerequisites, syllabus, and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Assign Instructors */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign Instructors
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
                  {instructors.length === 0 && (
                    <p className="text-xs text-slate-400 py-2 text-center">
                      No instructors found in staff directory.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveCourse"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isActiveCourse"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Active Course (Available for Batch Creation & Admissions)
              </label>
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
                {submitting ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

