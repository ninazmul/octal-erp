"use client";

import { useState } from "react";
import { IdCard, LoaderCircle } from "lucide-react";
import { getIdCardTemplateForRender, type IdCardRole } from "@/lib/actions/idCard.actions";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export interface IdCardPerson {
  role: IdCardRole;
  name: string;
  id: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  status?: string;
  detailLabel?: string;
  detail?: string;
  extra?: string;
}

export default function IdCardPrintButton({ person, variant = "outline", compact = false }: { person: IdCardPerson; variant?: "outline" | "default"; compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const printCard = async () => {
    const printWindow = window.open("", "_blank", "width=700,height=500");
    if (!printWindow) {
      toast.error("Allow pop-ups to print the ID card.");
      return;
    }
    setLoading(true);
    try {
      const template = await getIdCardTemplateForRender(person.role);
      const safe = (value: unknown) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
      const cssColor = /^#[0-9a-f]{6}$/i.test(template.accentColor) ? template.accentColor : "#173b72";
      const background = template.backgroundImageUrl ? `url('${safe(template.backgroundImageUrl)}')` : "none";
      const photo = person.imageUrl ? `<img class="photo" src="${safe(person.imageUrl)}" alt="">` : `<div class="photo placeholder">${safe(person.name.slice(0, 1).toUpperCase())}</div>`;
      const signature = template.signatureImageUrl ? `<img class="signature" src="${safe(template.signatureImageUrl)}" alt="">` : "";
      const fields = [person.detail && `<div class="field"><span>${safe(person.detailLabel || (person.role === "student" ? "Program" : "Department / Designation"))}</span><strong>${safe(person.detail)}</strong></div>`, person.extra && `<div class="field"><span>${safe(person.role === "student" ? "Batch" : "Employment")}</span><strong>${safe(person.extra)}</strong></div>`, person.phone && `<div class="field"><span>Phone</span><strong>${safe(person.phone)}</strong></div>`, person.email && `<div class="field"><span>Email</span><strong>${safe(person.email)}</strong></div>`].filter(Boolean).join("");
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(person.name)} ID Card</title><style>
        @page{size:100mm 68mm;margin:0}*{box-sizing:border-box}html,body{margin:0;width:100mm;height:68mm;font-family:Arial,Helvetica,sans-serif;color:#1e293b}.card{position:relative;width:85.6mm;height:54mm;margin:7mm auto;overflow:hidden;border:1px solid #cbd5e1;border-radius:3mm;background:#fff ${background} center/cover no-repeat;print-color-adjust:exact;-webkit-print-color-adjust:exact}.wash{position:absolute;inset:0;background:rgba(255,255,255,.88)}.top{position:relative;display:flex;align-items:center;gap:2mm;padding:3mm 4mm 2mm;color:white;background:${cssColor}}.logo{display:none}.brand{min-width:0}.institution{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8pt;font-weight:700;letter-spacing:.02em}.title{margin-top:.7mm;font-size:5.5pt;letter-spacing:.12em;opacity:.9}.body{position:relative;display:flex;gap:3mm;padding:3mm 4mm;height:35mm}.photo{width:20mm;height:25mm;flex:none;object-fit:cover;border:1px solid #cbd5e1;border-radius:1.5mm;background:white}.placeholder{display:flex;align-items:center;justify-content:center;color:${cssColor};font-size:18pt;font-weight:700}.info{min-width:0;flex:1}.name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${cssColor};font-size:10pt;font-weight:700}.id{margin-top:.6mm;color:#64748b;font-family:monospace;font-size:6pt}.fields{display:grid;grid-template-columns:1fr 1fr;gap:1.8mm 3mm;margin-top:2mm}.field{min-width:0}.field span{display:block;color:#64748b;font-size:4.7pt;text-transform:uppercase;letter-spacing:.04em}.field strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:.3mm;font-size:5.7pt}.bottom{position:absolute;right:4mm;bottom:2mm;left:4mm;display:flex;align-items:end;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:1mm}.meta{max-width:55mm;color:#64748b;font-size:4.5pt;line-height:1.35}.sign{text-align:center;color:#334155;font-size:4.5pt}.signature{display:block;width:20mm;height:6mm;object-fit:contain;margin:0 auto .5mm}.signline{width:22mm;border-top:1px solid #64748b;margin:2mm auto .7mm}.signatory{font-weight:700}.role{position:absolute;top:0;right:0;padding:1mm 2mm;background:white;color:${cssColor};font-size:5pt;font-weight:700;text-transform:uppercase}@media print{body{width:100mm;height:68mm}.card{margin:7mm auto;break-inside:avoid}}</style></head><body><article class="card"><div class="wash"></div><header class="top"><div class="brand"><div class="institution">${safe(template.institutionName)}</div><div class="title">${safe(template.cardTitle)}</div></div><div class="role">${safe(person.role)}</div></header><main class="body">${photo}<div class="info"><div class="name">${safe(person.name)}</div><div class="id">ID: ${safe(person.id)}</div><div class="fields">${fields}</div></div></main><footer class="bottom"><div class="meta">${safe(template.addressLine)}${template.addressLine && template.contactLine ? "<br>" : ""}${safe(template.contactLine)}<br>${safe(person.status || "")}</div><div class="sign">${signature}<div class="signline"></div><div class="signatory">${safe(template.signatoryName || template.signatoryTitle)}</div>${template.signatoryName ? `<div>${safe(template.signatoryTitle)}</div>` : ""}</div></footer></article><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      toast.error((error as Error).message || "Could not generate ID card.");
    } finally {
      setLoading(false);
    }
  };

  return <Button type="button" variant={variant} disabled={loading} onClick={printCard} className={compact ? "h-8 gap-1.5 px-2.5 text-xs" : "gap-2"}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <IdCard className="h-4 w-4" />}{compact ? "ID Card" : "Print ID Card"}</Button>;
}
