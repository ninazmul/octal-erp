"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import { getIdCardTemplates, saveIdCardTemplate, type IdCardRole, type IdCardTemplateInput } from "@/lib/actions/idCard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IdCard, Save, UserRound } from "lucide-react";
import toast from "react-hot-toast";

const blank = (role: IdCardRole): IdCardTemplateInput => ({
  role,
  idCardFee: 0,
  institutionName: "Octal Technical Training Institute",
  cardTitle: role === "student" ? "STUDENT IDENTITY CARD" : "STAFF IDENTITY CARD",
  backMessage: "If found, please return this card to the institute at the contact details below.",
  contactLine: "",
  addressLine: "",
  backgroundImageUrl: "",
  signatureImageUrl: "",
  signatoryName: "",
  signatoryTitle: "Authorized by",
  accentColor: "#173b72",
});

export default function IdCardTemplateSettings() {
  const [role, setRole] = useState<IdCardRole>("student");
  const [templates, setTemplates] = useState<Record<IdCardRole, IdCardTemplateInput>>({ student: blank("student"), staff: blank("staff") });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");

  useEffect(() => {
    getIdCardTemplates().then((result) => setTemplates(result)).catch((error) => toast.error(error.message || "Could not load card settings.")).finally(() => setLoading(false));
  }, []);

  const current = templates[role];
  const update = <K extends keyof IdCardTemplateInput>(field: K, value: IdCardTemplateInput[K]) => setTemplates((previous) => ({ ...previous, [role]: { ...previous[role], [field]: value } }));
  const save = async () => {
    setSaving(true);
    try {
      const updated = await saveIdCardTemplate(current);
      setTemplates((previous) => ({ ...previous, [role]: updated }));
      toast.success(`${role === "student" ? "Student" : "Staff"} ID card design saved.`);
    } catch (error) {
      toast.error((error as Error).message || "Could not save ID card design.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><IdCard className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">ID card design</h2>
          <p className="mt-1 text-sm text-slate-500">Set separate backgrounds, signatures, and return messages. Printing creates front and back pages; use duplex printing and flip on the short edge.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {(["student", "staff"] as const).map((item) => <button key={item} type="button" onClick={() => setRole(item)} className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${role === item ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>{item}</button>)}
        </div>
      </div>
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading card templates…</p> : <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Institution name</span><Input value={current.institutionName} onChange={(e) => update("institutionName", e.target.value)} /></label>
            {role === "student" && <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Student ID card fee (৳)</span><Input type="number" min="0" step="1" value={current.idCardFee} onChange={(e) => update("idCardFee", Number(e.target.value))} /><span className="block text-[11px] text-slate-400">Added to the payable amount for paid batch admissions.</span></label>}
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Card heading</span><Input value={current.cardTitle} onChange={(e) => update("cardTitle", e.target.value)} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300 sm:col-span-2"><span>Back message if card is found</span><Input value={current.backMessage} onChange={(e) => update("backMessage", e.target.value)} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Contact details</span><Input value={current.contactLine} onChange={(e) => update("contactLine", e.target.value)} placeholder="Phone · website" /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Address</span><Input value={current.addressLine} onChange={(e) => update("addressLine", e.target.value)} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Signatory name</span><Input value={current.signatoryName} onChange={(e) => update("signatoryName", e.target.value)} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Signatory title</span><Input value={current.signatoryTitle} onChange={(e) => update("signatoryTitle", e.target.value)} /></label>
            <label className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300"><span>Accent color</span><Input type="color" value={current.accentColor} onChange={(e) => update("accentColor", e.target.value)} className="h-10 w-16 p-1" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["backgroundImageUrl", "signatureImageUrl"] as const).map((field) => <div key={field} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{field === "backgroundImageUrl" ? "Card background" : "Signature artwork"}</p>
              {current[field] && <div className="relative mb-2 h-24 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950">{field === "backgroundImageUrl" ? <Image src={current[field]} alt="Card background preview" fill unoptimized className="object-cover" /> : <Image src={current[field]} alt="Signature preview" fill unoptimized className="object-contain p-2" />}</div>}
              <UploadButton endpoint="idCardAssetUploader" onClientUploadComplete={(files) => { const url = files[0]?.ufsUrl; if (url) { update(field, url); toast.success("Card artwork uploaded."); } }} onUploadError={(error) => { toast.error(error.message); }} appearance={{ button: "h-8 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white", allowedContent: "hidden" }} />
            </div>)}
          </div>
          <Button onClick={save} disabled={saving} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"><Save className="h-4 w-4" />{saving ? "Saving…" : "Save design"}</Button>
        </div>
        <div className="self-start rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card preview</p><div className="flex rounded-md border border-slate-200 p-0.5 dark:border-slate-700">{(["front", "back"] as const).map((side) => <button type="button" key={side} onClick={() => setPreviewSide(side)} className={`rounded px-2 py-1 text-[10px] font-semibold capitalize ${previewSide === side ? "bg-indigo-600 text-white" : "text-slate-500"}`}>{side}</button>)}</div></div>
          <div className="relative mx-auto aspect-[0.631] w-full max-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-700">
            {current.backgroundImageUrl && <Image src={current.backgroundImageUrl} alt="" fill unoptimized className="object-cover opacity-100" />}
            {previewSide === "front" ? <div className="relative flex h-full flex-col items-center justify-between text-center" style={{ color: current.accentColor }}>
              <div className="-mx-3 -mt-3 flex w-[calc(100%+1.5rem)] flex-col items-center px-3 pb-2 pt-5" style={{ color: current.accentColor }}>
                <Image src="/assets/images/octal-logo.png" alt="Octal logo" width={120} height={48} className="mb-1 h-8 w-20 rounded bg-white p-1 object-contain" />
                <p className="max-w-full truncate text-[9px] font-bold uppercase tracking-wide">{current.institutionName || "Institution"}</p>
                <p className="mt-0.5 text-[7px] font-semibold">{current.cardTitle}</p>
              </div>
              <div className="flex flex-col items-center gap-1"><div className="relative flex h-[109px] w-[84px] items-center justify-center overflow-hidden rounded border bg-white/80"><UserRound className="h-8 w-8 opacity-40" /></div><div className="space-y-1 leading-tight"><p className="max-w-full whitespace-normal break-words text-[9px] font-bold">{role === "student" ? "Student name" : "Staff name"}</p><p className="max-w-full whitespace-normal break-words text-[7px]">ID: {role === "student" ? "OCT-260001" : "OCT-EMP-001"}</p>{role === "student" ? <p className="max-w-full whitespace-normal break-words text-[7px]">Web Development</p> : <><p className="max-w-full whitespace-normal break-words text-[7px]">Designation: Instructor</p><p className="max-w-full whitespace-normal break-words text-[7px]">Department: Academic</p></>}</div></div>
              <div className="flex min-h-12 w-full flex-col items-center justify-end text-[6px]">{current.signatureImageUrl && <div className="relative h-6 w-20"><Image src={current.signatureImageUrl} alt="Signature" fill unoptimized className="object-contain" /></div>}<div className="w-16 border-t border-slate-500 pt-1 font-semibold"><span>{current.signatoryTitle}</span>{current.signatoryName ? ` ${current.signatoryName}` : ""}</div></div>
            </div> : <div className="relative flex h-full flex-col items-center px-1 py-3 text-center" style={{ color: current.accentColor }}>
              <div><Image src="/assets/images/octal-logo.png" alt="Octal logo" width={100} height={40} className="mx-auto mb-1 h-7 w-16 rounded object-contain" /><p className="text-[8px] font-bold">{current.institutionName}</p></div>
              <div className="my-auto flex w-full flex-col items-center gap-6"><div><p className="text-[8px] font-bold uppercase">If found</p><p className="mt-1 text-[7px] leading-relaxed text-slate-600">{current.backMessage}</p></div><div className="w-full space-y-1 text-[7px] leading-relaxed text-slate-600"><p className="font-semibold text-slate-700">{current.institutionName}</p><p>{current.addressLine}</p><p>{current.contactLine}</p></div></div>
            </div>}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Student and staff cards use the same layout with profile-specific details.</p>
        </div>
      </div>}
    </section>
  );
}
