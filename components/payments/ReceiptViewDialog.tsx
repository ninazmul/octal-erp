"use client";

import Image from "next/image";
import { IPayment, IEnrollment, IStudent, IBatch, ICourse, IEmployee } from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2 } from "lucide-react";

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Printable Area */}
        <div id="receipt-print-area" className="p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-white">
                  <Image
                    src="/erp-logo.png"
                    alt="Octal ERP"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  OCTAL ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official Tuition Collection Receipt
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                {payment.receiptNo}
              </span>
              <span className="text-[11px] text-slate-400">
                Date: {new Date(payment.paymentDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Student & Course Box */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Student Details
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                {student?.fullName || "Student"}
              </span>
              <span className="font-mono text-slate-500 block">
                ID: {student?.studentId}
              </span>
              <span className="font-mono text-slate-500 block">
                Phone: {student?.phone}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Course & Batch
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                {course?.title || "Course"}
              </span>
              <span className="text-slate-600 dark:text-slate-300 block">
                Batch: {batch?.batchName} ({batch?.batchCode})
              </span>
              <span className="font-mono text-slate-400 text-[11px] block">
                Enrollment ID: {enrollment?.enrollmentId}
              </span>
            </div>
          </div>

          {/* Payment Line Item Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-2.5 font-semibold text-slate-600 dark:text-slate-300">
              <span className="col-span-2">Description</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="grid grid-cols-3 p-3 border-t border-slate-200 dark:border-slate-800">
              <span className="col-span-2">
                Tuition Fee Installment
                <span className="block text-[11px] text-slate-400">
                  Method: {payment.paymentMethod} {payment.transactionRef && `(Ref: ${payment.transactionRef})`}
                </span>
              </span>
              <span className="text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                ৳{payment.amount?.toLocaleString()}
              </span>
            </div>

            {/* Total */}
            <div className="grid grid-cols-3 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900/40 font-bold">
              <span className="col-span-2 text-indigo-900 dark:text-indigo-200">
                Total Paid In Words: {payment.amount?.toLocaleString()} Taka Only
              </span>
              <span className="text-right font-mono text-indigo-600 dark:text-indigo-400 text-base">
                ৳{payment.amount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Dues Status & Footer */}
          <div className="flex items-center justify-between text-xs pt-2">
            <div>
              <span className="text-slate-400 block text-[11px]">Remaining Batch Due</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                ৳{enrollment?.remainingDue?.toLocaleString() || "0"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Collected By</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {payment.collectedBy?.name || payment.collectedBy?.email}
              </span>
            </div>
          </div>

          {/* Stamp / Verification badge */}
          <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Electronic Receipt
            </span>
            <span>Printed on: {new Date().toLocaleDateString()}</span>
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

