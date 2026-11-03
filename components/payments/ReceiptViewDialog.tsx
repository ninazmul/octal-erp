"use client";

import { IPayment, IEnrollment, IStudent, IBatch, ICourse, IEmployee } from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, ReceiptText } from "lucide-react";

interface ReceiptViewDialogProps {
  payment: IPayment & {
    student?: IStudent;
    enrollment?: IEnrollment & {
      course?: ICourse;
      referrer?: IEmployee;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="receipt-dialog sm:max-w-xl p-0 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Printable Area */}
        <div id="receipt-print-area" className="receipt-print-area bg-white text-slate-900">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-slate-300 print:shadow-none">
            <div className="h-2 bg-black" />
            <div className="space-y-6 p-6 sm:p-8">
              <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-5">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-black">Octal Technical Training Institute</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-700">Official tuition payment receipt</p>
                </div>
                <div className="text-right">
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                    <CheckCircle2 className="h-3 w-3" /> {payment.status === "confirmed" ? "Paid" : payment.status.replaceAll("_", " ")}
                  </div>
                  <p className="font-mono text-xs font-bold text-black">Receipt No: {payment.receiptNo}</p>
                  <p className="mt-0.5 text-[11px] text-slate-700">Date: {paymentDate}</p>
                </div>
              </header>

              <section className="rounded border border-black p-4">
                <div className="mb-3 -mx-4 -mt-4 flex items-center gap-2 border-b border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  <ReceiptText className="h-3.5 w-3.5" /> Payment received from
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-base font-bold text-slate-950">{student?.fullName || "Student"}</p>
                    <p className="mt-1 text-xs text-slate-600">Student ID: <span className="font-mono font-semibold">{student?.studentId || "—"}</span></p>
                    <p className="text-xs text-slate-600">Phone: {student?.phone || "—"}</p>
                  </div>
                  <div className="sm:border-l sm:border-black sm:pl-4">
                    <p className="text-sm font-semibold text-slate-900">{course?.title || "Course"}</p>
                    <p className="mt-1 text-xs text-slate-600">Batch: {batch?.batchName || "—"}{batch?.batchCode ? ` (${batch.batchCode})` : ""}</p>
                    <p className="text-xs text-slate-600">Enrollment: <span className="font-mono">{enrollment?.enrollmentId || "—"}</span></p>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded border border-black">
                <div className="grid grid-cols-[1fr_auto] border-b border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <span>Payment description</span><span>Amount</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 text-black">
                  <div><p className="text-sm font-semibold text-slate-900">Tuition fee installment</p><p className="mt-1 text-xs text-slate-500">{payment.paymentMethod}{payment.transactionRef ? ` · Reference ${payment.transactionRef}` : ""}</p></div>
                  <p className="font-mono text-sm font-bold text-slate-900">৳{payment.amount?.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-black bg-black px-4 py-4 text-white">
                  <div><p className="text-xs font-bold uppercase tracking-wide">Amount received</p><p className="mt-1 text-[11px] text-slate-300">Thank you for your payment</p></div>
                  <p className="font-mono text-xl font-extrabold">৳{payment.amount?.toLocaleString()}</p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded border border-black px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Remaining balance</p><p className="mt-1 font-mono text-base font-bold text-black">৳{enrollment?.remainingDue?.toLocaleString() || "0"}</p></div>
                <div className="rounded border border-black px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Received by</p><p className="mt-1 truncate text-sm font-semibold text-black">{payment.collectedBy?.name || payment.collectedBy?.email || "—"}</p></div>
              </section>

              <footer className="flex items-end justify-between gap-6 border-t border-black pt-5 text-[10px] text-black">
                <div><p className="font-semibold">This is a computer-generated receipt.</p><p className="mt-1">Please keep it for your records.</p></div>
                <div className="w-40 border-t border-black pt-1 text-center">Authorized signature</div>
              </footer>
            </div>
          </div>
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

