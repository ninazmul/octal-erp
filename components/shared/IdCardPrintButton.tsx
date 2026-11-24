"use client";

import { useState } from "react";
import { IdCard, LoaderCircle } from "lucide-react";
import { getIdCardTemplateForRender, type IdCardRole } from "@/lib/actions/idCard.actions";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export interface IdCardPerson {
  role: IdCardRole;
  recordId?: string;
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
      const { template, person: savedPerson } = await getIdCardTemplateForRender(person.role, person.recordId);
      const display = { ...person, ...savedPerson };
      const safe = (value: unknown) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
      const cssColor = /^#[0-9a-f]{6}$/i.test(template.accentColor) ? template.accentColor : "#173b72";
      const background = template.backgroundImageUrl ? `url('${safe(template.backgroundImageUrl)}')` : "none";
      const photo = display.imageUrl ? `<img class="photo" src="${safe(display.imageUrl)}" alt="">` : `<div class="photo placeholder">${safe(display.name.slice(0, 1).toUpperCase())}</div>`;
      const signature = template.signatureImageUrl ? `<img class="signature" src="${safe(template.signatureImageUrl)}" alt="">` : "";
      const logoUrl = `${window.location.origin}/assets/images/octal.png`;
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(display.name)} ID Card</title><style>
        @page{size:68mm 100mm;margin:0}
        *{box-sizing:border-box}
        html,body{margin:0;width:68mm;height:100mm;font-family:Arial,Helvetica,sans-serif;color:#1e293b}
        .card{position:relative;width:54mm;height:85.6mm;margin:7.2mm auto;overflow:hidden;border:1px solid #cbd5e1;border-radius:3mm;background:#fff ${background} center/cover no-repeat;print-color-adjust:exact;-webkit-print-color-adjust:exact;break-inside:avoid}
        .wash{position:absolute;inset:0;background:rgba(255,255,255,.88)}
        .top{position:relative;display:flex;min-height:22mm;flex-direction:column;align-items:center;justify-content:center;gap:1mm;padding:2mm 3mm;color:white;text-align:center;background:${cssColor}}
        .logo{display:block;width:19mm;height:9mm;object-fit:contain;border:1px solid rgba(255,255,255,.8);border-radius:1.5mm;background:#fff;padding:1mm}
        .front .top{min-height:24mm}
        .front .logo{width:21mm;height:10mm}
        .brand{min-width:0;max-width:100%}
        .institution{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7pt;font-weight:700;letter-spacing:.02em}
        .title{margin-top:.5mm;font-size:5pt;letter-spacing:.1em;opacity:.95}
        .front-content{position:relative;display:flex;height:60mm;flex-direction:column;align-items:center;justify-content:flex-start;gap:.45mm;padding:.6mm 3mm;text-align:center}
        .photo{width:38mm;height:36mm;flex:none;object-fit:cover;border:1px solid #cbd5e1;border-radius:2mm;background:white}
        .placeholder{display:flex;align-items:center;justify-content:center;color:${cssColor};font-size:18pt;font-weight:700}
        .name{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${cssColor};font-size:8pt;font-weight:700}
        .id,.front-detail{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;font-size:6pt;font-weight:600}
        .id{font-family:monospace}
        .role{position:absolute;top:1.5mm;right:1.5mm;padding:.8mm 1.4mm;border-radius:1mm;background:white;color:${cssColor};font-size:4.5pt;font-weight:700;text-transform:uppercase}
        .back{display:flex;flex-direction:column}
        .back .top{min-height:20mm}
        .back-content{position:relative;display:flex;flex:1;flex-direction:column;align-items:center;justify-content:space-between;padding:5mm 4mm 3mm;text-align:center}
        .return-label{color:${cssColor};font-size:7pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .message{margin-top:2mm;color:#334155;font-size:7pt;line-height:1.55}
        .details{width:100%;border-top:1px solid #cbd5e1;padding-top:2mm;color:#475569;font-size:6pt;line-height:1.5}
        .details strong{display:block;margin-bottom:.7mm;color:${cssColor};font-size:6.3pt}
        .sign{min-width:20mm;margin-top:3mm;text-align:center;color:#334155;font-size:5pt}
        .signature{display:block;width:19mm;height:7mm;object-fit:contain;margin:0 auto .5mm}
        .signline{width:20mm;border-top:1px solid #64748b;margin:1mm auto .6mm}
        .signatory{font-weight:700}
        .front-sign{min-width:20mm;margin-top:auto;padding-top:.4mm;text-align:center;color:#334155;font-size:5pt;line-height:1.15}
        .front-sign .signature{width:16mm;height:4mm;margin:0 auto}
        .front-sign .signline{width:18mm;margin:.2mm auto .4mm}
        .front{break-after:page;page-break-after:always}
        @media print{body{width:68mm;height:100mm}.card{margin:7.2mm auto;break-inside:avoid}}
      </style></head><body>
        <article class="card front"><div class="wash"></div><header class="top"><img class="logo" src="${logoUrl}" alt="Octal logo"><div class="brand"><div class="institution">Octal TTI</div><div class="title">${safe(template.cardTitle)}</div></div></header><main class="front-content">${photo}<div class="name">${safe(display.name)}</div><div class="id">ID: ${safe(display.id)}</div>${display.detail ? `<div class="front-detail">${safe(display.detailLabel || (display.role === "student" ? "Course" : "Designation"))}: ${safe(display.detail)}</div>` : ""}${display.extra ? `<div class="front-detail">${safe(display.extraLabel || (display.role === "student" ? "Batch" : "Department"))}: ${safe(display.extra)}</div>` : ""}<div class="front-sign">${signature}<div class="signline"></div><div class="signatory">${safe(template.signatoryName || template.signatoryTitle)}</div>${template.signatoryName ? `<div>${safe(template.signatoryTitle)}</div>` : ""}</div></main></article>
        <article class="card back"><div class="wash"></div><header class="top"><img class="logo" src="${logoUrl}" alt="Octal logo"><div class="brand"><div class="institution">${safe(template.institutionName)}</div><div class="title">INFORMATION</div></div></header><main class="back-content"><div><div class="return-label">If found</div><p class="message">${safe(template.backMessage)}</p></div><div class="details"><strong>${safe(template.institutionName)}</strong>${safe(template.addressLine)}${template.addressLine && template.contactLine ? "<br>" : ""}${safe(template.contactLine)}</div></main></article>
        <script>window.onload=async()=>{await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));setTimeout(()=>window.print(),250)}</script></body></html>`);
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
