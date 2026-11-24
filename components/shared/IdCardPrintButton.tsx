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
      const logoUrl = `${window.location.origin}/erp-logo.png`;
      const fields = [person.detail && `<div class="field"><span>${safe(person.detailLabel || (person.role === "student" ? "Program" : "Department / Designation"))}</span><strong>${safe(person.detail)}</strong></div>`, person.extra && `<div class="field"><span>${safe(person.role === "student" ? "Batch" : "Employment")}</span><strong>${safe(person.extra)}</strong></div>`, person.phone && `<div class="field"><span>Phone</span><strong>${safe(person.phone)}</strong></div>`, person.email && `<div class="field"><span>Email</span><strong>${safe(person.email)}</strong></div>`].filter(Boolean).join("");
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(person.name)} ID Card</title><style>
        @page{size:68mm 100mm;margin:0}
        *{box-sizing:border-box}
        html,body{margin:0;width:68mm;height:100mm;font-family:Arial,Helvetica,sans-serif;color:#1e293b}
        .card{position:relative;width:54mm;height:85.6mm;margin:7.2mm auto;overflow:hidden;border:1px solid #cbd5e1;border-radius:3mm;background:#fff ${background} center/cover no-repeat;print-color-adjust:exact;-webkit-print-color-adjust:exact}
        .wash{position:absolute;inset:0;background:rgba(255,255,255,.88)}
        .top{position:relative;display:flex;min-height:22mm;flex-direction:column;align-items:center;justify-content:center;gap:1mm;padding:2mm 3mm;color:white;text-align:center;background:${cssColor}}
        .logo{display:block;width:9mm;height:9mm;object-fit:contain;border:1px solid rgba(255,255,255,.8);border-radius:1.5mm;background:#fff}
        .brand{min-width:0;max-width:100%}
        .institution{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7pt;font-weight:700;letter-spacing:.02em}
        .title{margin-top:.5mm;font-size:5pt;letter-spacing:.1em;opacity:.95}
        .body{position:relative;display:flex;height:47mm;flex-direction:column;align-items:center;gap:1.3mm;padding:2mm 3mm;text-align:center}
        .photo{width:20mm;height:23mm;flex:none;object-fit:cover;border:1px solid #cbd5e1;border-radius:1.5mm;background:white}
        .placeholder{display:flex;align-items:center;justify-content:center;color:${cssColor};font-size:18pt;font-weight:700}
        .info{width:100%;min-width:0}
        .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${cssColor};font-size:9pt;font-weight:700}
        .id{margin-top:.5mm;color:#64748b;font-family:monospace;font-size:5.5pt}
        .fields{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm 2mm;margin-top:2mm;text-align:left}
        .field{min-width:0}.field span{display:block;color:#64748b;font-size:4.5pt;text-transform:uppercase;letter-spacing:.04em}
        .field strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:.3mm;font-size:5.3pt}
        .bottom{position:absolute;right:3mm;bottom:2mm;left:3mm;display:flex;align-items:end;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:1mm}
        .meta{max-width:27mm;color:#64748b;font-size:4.3pt;line-height:1.35}
        .sign{min-width:18mm;text-align:center;color:#334155;font-size:4.2pt}
        .signature{display:block;width:16mm;height:5mm;object-fit:contain;margin:0 auto .3mm}
        .signline{width:17mm;border-top:1px solid #64748b;margin:1mm auto .5mm}
        .signatory{font-weight:700}.role{position:absolute;top:1.5mm;right:1.5mm;padding:.8mm 1.4mm;border-radius:1mm;background:white;color:${cssColor};font-size:4.5pt;font-weight:700;text-transform:uppercase}
        @media print{body{width:68mm;height:100mm}.card{margin:7.2mm auto;break-inside:avoid}}
      </style></head><body><article class="card"><div class="wash"></div><header class="top"><img class="logo" src="${logoUrl}" alt="Octal logo"><div class="brand"><div class="institution">${safe(template.institutionName)}</div><div class="title">${safe(template.cardTitle)}</div></div><div class="role">${safe(person.role)}</div></header><main class="body">${photo}<div class="info"><div class="name">${safe(person.name)}</div><div class="id">ID: ${safe(person.id)}</div><div class="fields">${fields}</div></div></main><footer class="bottom"><div class="meta">${safe(template.addressLine)}${template.addressLine && template.contactLine ? "<br>" : ""}${safe(template.contactLine)}<br>${safe(person.status || "")}</div><div class="sign">${signature}<div class="signline"></div><div class="signatory">${safe(template.signatoryName || template.signatoryTitle)}</div>${template.signatoryName ? `<div>${safe(template.signatoryTitle)}</div>` : ""}</div></footer></article><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
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
