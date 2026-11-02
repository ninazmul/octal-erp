"use client";

import { useState, useEffect } from "react";
import { ICourse, IBatch, IEmployee } from "@/types";
import { admitStudent, requestAdmissionDiscount } from "@/lib/actions/student.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  UserPlus,
  ArrowLeft,
  GraduationCap,
  Users,
  BadgePercent,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface NewAdmissionFormProps {
  courses: ICourse[];
  batches: IBatch[];
  instructors: IEmployee[];
  preselectedBatchId?: string;
  isInstructor?: boolean;
  currentEmployeeId?: string;
  approvedDiscountRequest?: { _id: string; studentName: string; studentPhone: string; studentEmail?: string; course: { _id: string }; batch: { _id: string } } | null;
}

export default function NewAdmissionForm({
  courses,
  batches,
  instructors,
  preselectedBatchId,
  isInstructor = false,
  currentEmployeeId,
  approvedDiscountRequest,
}: NewAdmissionFormProps) {
  const router = useRouter();

  // Student Fields
  const [fullName, setFullName] = useState(approvedDiscountRequest?.studentName || "");
  const [phone, setPhone] = useState(approvedDiscountRequest?.studentPhone || "");
  const [email, setEmail] = useState(approvedDiscountRequest?.studentEmail || "");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");
  const [studentNotes, setStudentNotes] = useState("");

  // Enrollment Fields
  const [selectedCourseId, setSelectedCourseId] = useState(approvedDiscountRequest?.course?._id || "");
  const [selectedBatchId, setSelectedBatchId] = useState(approvedDiscountRequest?.batch?._id || preselectedBatchId || "");

  // Referral Fields
  const [referrerType, setReferrerType] = useState<
    "Instructor" | "Staff" | "External" | "None"
  >("None");
  const [referrerId, setReferrerId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [discountRequestOpen, setDiscountRequestOpen] = useState(false);
  const [requestedDiscount, setRequestedDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [requestingDiscount, setRequestingDiscount] = useState(false);

  // Lock referral attribution to the signed-in instructor.
  useEffect(() => {
    if (isInstructor && currentEmployeeId) {
      setReferrerType("Instructor");
      setReferrerId(currentEmployeeId);
    }
  }, [isInstructor, currentEmployeeId]);

  // Auto-select course and pre-populate fee if preselectedBatchId is passed.
  useEffect(() => {
    if (approvedDiscountRequest) {
      setSelectedCourseId(approvedDiscountRequest.course._id);
      setSelectedBatchId(approvedDiscountRequest.batch._id);
    } else if (preselectedBatchId) {
      const b = batches.find((item) => item._id === preselectedBatchId);
      if (b) {
        const crsId = typeof b.course === "string" ? b.course : b.course?._id;
        if (crsId) {
          setSelectedCourseId(crsId);
        }
      }
    } else if (courses.length > 0) {
      const firstCourse = courses[0];
      setSelectedCourseId(firstCourse._id);
    }
  }, [preselectedBatchId, courses, batches, approvedDiscountRequest]);

  // When course changes, select the first available batch.
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    // Select first matching batch
    const available = batches.filter((b) => {
      const bCrsId = typeof b.course === "string" ? b.course : b.course?._id;
      return bCrsId === courseId && b.status !== "Completed" && b.status !== "Cancelled";
    });
    setSelectedBatchId(available[0]?._id || "");
  };

  const availableBatches = batches.filter((b) => {
    const bCrsId = typeof b.course === "string" ? b.course : b.course?._id;
    return (
      bCrsId === selectedCourseId &&
      b.status !== "Completed" &&
      b.status !== "Cancelled"
    );
  });

  const selectedBatchObj = batches.find((b) => b._id === selectedBatchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !selectedCourseId || !selectedBatchId) {
      toast.error("Student name, phone, course, and batch are required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await admitStudent({
        fullName,
        phone,
        email: email || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined,
        address: address || undefined,
        notes: studentNotes || undefined,
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        referrerType,
        referrerId: referrerType === "Instructor" ? referrerId : undefined,
        discountRequestId: approvedDiscountRequest?._id,
      });

      toast.success(
        `Admitted ${result.student.fullName} (${result.student.studentId}) successfully!`
      );
      router.push(`/students/${result.student._id}`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to admit student.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscountRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !phone.trim() || !selectedCourseId || !selectedBatchId) {
      toast.error("Enter the student details and choose a course and batch first.");
      return;
    }
    setRequestingDiscount(true);
    try {
      await requestAdmissionDiscount({
        studentName: fullName,
        studentPhone: phone,
        studentEmail: email || undefined,
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        requestedAmount: Number(requestedDiscount),
        reason: discountReason,
      });
      toast.success("Discount request sent to the administrators.");
      setDiscountRequestOpen(false);
      setRequestedDiscount("");
      setDiscountReason("");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Could not send discount request.");
    } finally {
      setRequestingDiscount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Directory
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            New Student Admission
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enroll a student into an active batch and submit discount requests for administrator review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Student Personal Details */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> 1. Student Personal Information
          </h2>
          {approvedDiscountRequest && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">An administrator-approved discount request is attached and will be applied when admission is completed.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Tanvir Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number *
              </label>
              <Input
                placeholder="e.g. 017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="e.g. tanvir@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Guardian Name & Phone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Guardian Name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
                <Input
                  placeholder="Guardian Phone"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Residential Address
              </label>
              <Input
                placeholder="House, Road, Area, City..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Course & Batch Selection */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> 2. Academic Course & Batch Assignment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Course *
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                required
                aria-label="Target Course"
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
                Select Batch *
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
                aria-label="Select Batch"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select Active Batch</option>
                {availableBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.batchName} ({b.batchCode}) - {b.status}
                  </option>
                ))}
              </select>

              {availableBatches.length === 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                  No active batches found for this course. Please create a batch first.
                </span>
              )}
            </div>

            {selectedBatchObj && (
              <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-600 dark:text-slate-300">
                  Schedule: <strong>{selectedBatchObj.scheduleDescription || "Regular"}</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Capacity: <strong>{selectedBatchObj.maxCapacity} seats</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Starts: <strong>{new Date(selectedBatchObj.startDate).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Referral Attribution */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> 3. Referral Attribution
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Referrer Attribution */}
            {isInstructor ? (
              <div className="sm:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Referral Attribution</span>
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {instructors.find((instructor) => instructor._id === currentEmployeeId)?.fullName || "Your instructor account"} · Instructor Referral
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Your referral is added automatically. The applicable commission rule will set the rate.</p>
              </div>
            ) : <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Referral Attribution
              </label>
              <select
                value={referrerType}
                onChange={(e) =>
                  setReferrerType(
                    e.target.value as "Instructor" | "Staff" | "External" | "None"
                  )
                }
                aria-label="Referral Attribution"
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="None">None / Direct Admission</option>
                <option value="Instructor">Instructor Referral</option>
                <option value="Staff">Staff Referral</option>
                <option value="External">External Referrer</option>
              </select>
            </div>}

            {!isInstructor && referrerType === "Instructor" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Referring Instructor *
                </label>
                <select
                  value={referrerId}
                  onChange={(e) => setReferrerId(e.target.value)}
                  required={referrerType === "Instructor"}
                  aria-label="Referring Instructor"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select Instructor</option>
                  {instructors.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.fullName} ({inst.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Admission Notes / Payment Agreement Terms
              </label>
              <Textarea
                placeholder="e.g. 50% paid on admission, remaining 50% due by 2nd week..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          {!approvedDiscountRequest && <Button type="button" variant="outline" onClick={() => setDiscountRequestOpen(true)} disabled={submitting || requestingDiscount || !selectedCourseId || !selectedBatchId} className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30">
            <BadgePercent className="w-4 h-4" /> Request Discount
          </Button>}
          <div className="flex items-center justify-end gap-3">
            <Link href="/students">
              <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
            </Link>
            <Button type="submit" disabled={submitting || availableBatches.length === 0} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 shadow-sm">
              {submitting ? "Processing Admission..." : "Complete Admission"}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={discountRequestOpen} onOpenChange={(open) => !requestingDiscount && setDiscountRequestOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Discount Approval</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Send the student and enrollment details to the administrators. They will review the requested amount and decide the approved discount.
          </p>
          <form onSubmit={handleDiscountRequest} className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-semibold">{fullName || "Student name not entered"}</div>
              <div>{courses.find((course) => course._id === selectedCourseId)?.title || "Course"} · {selectedBatchObj?.batchName || "Batch"}</div>
            </div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Requested discount amount (৳) *
              <Input type="number" min="1" max={courses.find((course) => course._id === selectedCourseId)?.defaultFee || undefined} step="1" required value={requestedDiscount} onChange={(event) => setRequestedDiscount(event.target.value)} className="mt-1" />
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for request *
              <Textarea required value={discountReason} onChange={(event) => setDiscountReason(event.target.value)} rows={3} className="mt-1" placeholder="Add the reason for requesting this discount." />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDiscountRequestOpen(false)} disabled={requestingDiscount}>Cancel</Button>
              <Button type="submit" disabled={requestingDiscount || !requestedDiscount || !discountReason.trim()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                {requestingDiscount ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

