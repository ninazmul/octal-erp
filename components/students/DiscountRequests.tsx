"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BadgePercent, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reviewAdmissionDiscountRequest } from "@/lib/actions/student.actions";

type DiscountRequest = {
  _id: string; studentName: string; studentPhone: string; studentEmail?: string;
  requestedAmount: number; approvedAmount: number; reason: string; adminNotes?: string; status: string;
  createdAt: string; course?: { title: string; code: string }; batch?: { batchName: string; batchCode: string };
};

export default function DiscountRequests({ requests }: { requests: DiscountRequest[] }) {
  const [rows, setRows] = useState(requests);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const review = async (row: DiscountRequest, decision: "Approved" | "Rejected") => {
    setBusy(row._id);
    try {
      await reviewAdmissionDiscountRequest(row._id, decision, Number(amounts[row._id]), notes[row._id] || "");
      setRows((current) => current.map((item) => item._id === row._id ? { ...item, status: decision, approvedAmount: decision === "Approved" ? Number(amounts[row._id]) : 0, adminNotes: notes[row._id] || "" } : item));
      toast.success(decision === "Approved" ? "Discount approved." : "Discount request rejected.");
    } catch (error) { toast.error((error as Error).message || "Could not update request."); }
    finally { setBusy(null); }
  };

  return <div className="space-y-5">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white"><BadgePercent className="h-5 w-5 text-indigo-600"/> Admission Discount Requests</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review requests from staff and instructors. Approved discounts are applied during admission.</p>
    </header>
    {rows.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No discount requests yet.</div> : <div className="space-y-4">
      {rows.map((row) => <article key={row._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold text-slate-900 dark:text-white">{row.studentName} <span className="font-normal text-slate-500">· {row.studentPhone}</span></h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.course?.title} ({row.course?.code}) · {row.batch?.batchName} ({row.batch?.batchCode})</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Requested: ৳{row.requestedAmount.toLocaleString()} · {row.reason}</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{row.status}</span>
        </div>
        {row.status === "Pending" ? <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold">Approved amount (৳)<Input type="number" min="1" max={row.requestedAmount} step="1" value={amounts[row._id] ?? String(row.requestedAmount)} onChange={(e) => setAmounts({ ...amounts, [row._id]: e.target.value })} className="mt-1" /></label>
          <label className="text-xs font-semibold">Admin note (optional)<Textarea rows={1} value={notes[row._id] || ""} onChange={(e) => setNotes({ ...notes, [row._id]: e.target.value })} className="mt-1" /></label>
          <div className="flex gap-2"><Button type="button" disabled={busy === row._id} onClick={() => review(row, "Approved")} className="gap-1 bg-indigo-600 text-white hover:bg-indigo-700"><Check className="h-4 w-4"/>Approve</Button><Button type="button" variant="outline" disabled={busy === row._id} onClick={() => review(row, "Rejected")} className="gap-1"><X className="h-4 w-4"/>Reject</Button></div>
        </div> : <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">{row.status === "Approved" && <><span>Approved amount: ৳{row.approvedAmount.toLocaleString()}</span><Link className="text-indigo-600 hover:underline dark:text-indigo-400" href={`/students/new?discountRequestId=${row._id}`}>Complete admission</Link></>}{row.adminNotes && <span>{row.adminNotes}</span>}</div>}
      </article>)}
    </div>}
  </div>;
}
