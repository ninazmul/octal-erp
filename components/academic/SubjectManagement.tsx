"use client";

import { useState } from "react";
import { ISubject } from "@/types";
import {
  createSubject,
  updateSubject,
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
import { Plus, Search, Edit2, CheckCircle2, XCircle, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

interface SubjectManagementProps {
  initialSubjects: ISubject[];
}

export default function SubjectManagement({
  initialSubjects,
}: SubjectManagementProps) {
  const [subjects, setSubjects] = useState<ISubject[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ISubject | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName("");
    setCode("");
    setDescription("");
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (subject: ISubject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setCode(subject.code);
    setDescription(subject.description || "");
    setIsActive(subject.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Subject name and code are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSubject) {
        const updated = await updateSubject(editingSubject._id, {
          name,
          code,
          description,
          isActive,
        });
        setSubjects((prev) =>
          prev.map((s) => (s._id === editingSubject._id ? updated : s))
        );
        toast.success("Subject updated successfully!");
      } else {
        const created = await createSubject({
          name,
          code,
          description,
          isActive,
        });
        setSubjects((prev) => [...prev, created]);
        toast.success("Subject created successfully!");
      }
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to save subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subject: ISubject) => {
    try {
      const updated = await updateSubject(subject._id, {
        isActive: !subject.isActive,
      });
      setSubjects((prev) =>
        prev.map((s) => (s._id === subject._id ? updated : s))
      );
      toast.success(
        `Subject ${updated.isActive ? "activated" : "deactivated"}!`
      );
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to change status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure academic departments and curriculum subjects (e.g. Web Development, Graphic Design).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <Input
          placeholder="Search by subject name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 text-sm shadow-none p-0 h-8"
        />
      </div>

      {/* Subjects Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <div
            key={subject._id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  {subject.code}
                </span>
                <Badge
                  variant={subject.isActive ? "default" : "secondary"}
                  className={`text-[11px] cursor-pointer ${
                    subject.isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                      : "bg-slate-500/15 text-slate-600 dark:text-slate-400 hover:bg-slate-500/25 border-slate-500/30"
                  }`}
                  onClick={() => handleToggleStatus(subject)}
                >
                  {subject.isActive ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </Badge>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                {subject.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5">
                {subject.description || "No description provided."}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(subject.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(subject)}
                className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>
          </div>
        ))}

        {filteredSubjects.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No subjects found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first subject to start organizing Octal courses and training programs.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Create New Subject"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Name *
              </label>
              <Input
                placeholder="e.g. Web Development"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Code * (Unique)
              </label>
              <Input
                placeholder="e.g. WEB, GD, DM"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description
              </label>
              <Textarea
                placeholder="Brief description of the subject and curriculum..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isActive"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Active Subject
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
                {submitting ? "Saving..." : editingSubject ? "Update Subject" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

