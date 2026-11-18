"use client";

import { IPayment, IEnrollment, IStudent, IBatch, ICourse } from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ReceiptViewDialogProps {
  payment: IPayment & {
    student?: IStudent;
    enrollment?: IEnrollment & {
      course?: ICourse;
    };
    batch?: IBatch;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptViewDialog({
  payment,
  open,
  onOpenChange,
}: ReceiptViewDialogProps) {
  const student = payment.student;
  const enrollment = payment.enrollment;
  const course = enrollment?.course;
  const batch = payment.batch;
  const paymentDate = new Date(payment.paymentDate).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const receiptCopy = (copyName: "Student Copy" | "Institute Copy") => (
    <article className="receipt-copy rounded-lg border border-slate-300 bg-white p-4 text-slate-900">
      <header className="flex items-start justify-between gap-4 border-b-2 border-indigo-700 pb-3">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-950">Octal Technical Training Institute</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-700">Tuition payment receipt</p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-800">{copyName}</span>
          <p className="mt-1 font-mono text-xs font-bold">{payment.receiptNo}</p>
          <p className="text-[10px] text-slate-600">{paymentDate}</p>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-[11px]">
        <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Received from</p><p className="font-semibold text-slate-900">{student?.fullName || "Student"}</p><p className="text-slate-600">ID: {student?.studentId || "—"} · Phone: {student?.phone || "—"}</p></div>
        <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Course and batch</p><p className="font-semibold text-slate-900">{course?.title || "Course"}</p><p className="text-slate-600">{batch?.batchName || "—"}{batch?.batchCode ? ` (${batch.batchCode})` : ""} · {enrollment?.enrollmentId || "—"}</p></div>
      </section>

      <section className="mt-3 overflow-hidden rounded border border-slate-300 text-[11px]">
        <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-100 px-3 py-1.5 font-bold text-slate-700"><span>Payment details</span><span>Amount</span></div>
        <div className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2.5"><div><p className="font-semibold">Tuition fee installment</p><p className="text-[10px] text-slate-600">{payment.paymentMethod}{payment.transactionRef ? ` · Ref: ${payment.transactionRef}` : ""}</p></div><p className="font-mono font-bold">৳{payment.amount?.toLocaleString()}</p></div>
        <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-slate-300 px-3 py-2"><span className="font-bold uppercase tracking-wide">Amount received</span><span className="font-mono text-base font-bold">৳{payment.amount?.toLocaleString()}</span></div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-4 text-[10px]">
        <p><span className="font-bold uppercase tracking-wider text-slate-500">Balance due</span><br /><span className="font-mono text-sm font-bold text-slate-900">৳{enrollment?.remainingDue?.toLocaleString() || "0"}</span></p>
        <p><span className="font-bold uppercase tracking-wider text-slate-500">Received by</span><br /><span className="font-semibold text-slate-900">{payment.collectedBy?.name || payment.collectedBy?.email || "—"}</span></p>
      </div>
      <footer className="mt-4 flex items-end justify-between gap-4 border-t border-slate-300 pt-2 text-[9px] text-slate-600"><p>Computer-generated receipt. Please keep this copy for your records.</p><div className="w-36 border-t border-slate-500 pt-1 text-center">Authorized signature</div></footer>
    </article>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="receipt-dialog sm:max-w-2xl p-0 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Printable Area */}
        <div id="receipt-print-area" className="receipt-print-area space-y-4 bg-white p-5 text-slate-900 sm:p-6">
          {receiptCopy("Student Copy")}
          <div className="receipt-cutline flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400"><span className="h-px flex-1 border-t border-dashed border-slate-400" />Cut here<span className="h-px flex-1 border-t border-dashed border-slate-400" /></div>
          {receiptCopy("Institute Copy")}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            size="sm"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

