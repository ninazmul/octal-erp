"use client";

import { useState } from "react";
import { IdCard, LoaderCircle } from "lucide-react";
import { getIdCardTemplateForRender, getIdCardTemplatesForRender, type IdCardRole } from "@/lib/actions/idCard.actions";
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
  extraLabel?: string;
  extra?: string;
}

export default function IdCardPrintButton({ person, people, variant = "outline", compact = false }: { person?: IdCardPerson; people?: IdCardPerson[]; variant?: "outline" | "default"; compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const printCard = async () => {
    const printPeople = people || (person ? [person] : []);
    if (!printPeople.length) return;
    setLoading(true);
    let printFrame: HTMLIFrameElement | null = null;
    try {
      let cards: Array<{ template: Awaited<ReturnType<typeof getIdCardTemplateForRender>>["template"]; display: IdCardPerson }>;
      const bulkRole = printPeople[0].role;
      if (printPeople.every((item) => item.role === bulkRole && Boolean(item.recordId))) {
        const result = await getIdCardTemplatesForRender(bulkRole, printPeople.map((item) => item.recordId!));
        cards = printPeople.map((item, index) => ({ template: result.template, display: { ...item, ...result.people[index] } }));
      } else {
        cards = await Promise.all(printPeople.map(async (item) => {
          const { template, person: savedPerson } = await getIdCardTemplateForRender(item.role, item.recordId);
          return { template, display: { ...item, ...savedPerson } };
        }));
      }
      const { template } = cards[0];
      const safe = (value: unknown) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
      const cssColor = /^#[0-9a-f]{6}$/i.test(template.accentColor) ? template.accentColor : "#173b72";
      const logoUrl = `${window.location.origin}/assets/images/octal-logo.png`;
      const cardMarkup = cards.map(({ template: cardTemplate, display }) => {
        const photo = display.imageUrl ? `<img class="photo" src="${safe(display.imageUrl)}" alt="">` : `<div class="photo placeholder">${safe(display.name.slice(0, 1).toUpperCase())}</div>`;
        const signature = cardTemplate.signatureImageUrl ? `<img class="signature" src="${safe(cardTemplate.signatureImageUrl)}" alt="">` : "";
        const cardBackground = cardTemplate.backgroundImageUrl ? `url('${safe(cardTemplate.backgroundImageUrl)}')` : "none";
        return `<article class="card front" style="background-image:${cardBackground}"><div class="wash"></div><header class="top"><img class="logo" src="${logoUrl}" alt="Octal logo"><div class="brand"><div class="institution">${safe(cardTemplate.institutionName)}</div><div class="title">${safe(cardTemplate.cardTitle)}</div></div></header><main class="front-content">${photo}<div class="name">${safe(display.name)}</div><div class="id">ID: ${safe(display.id)}</div>${display.detail ? `<div class="front-detail">${safe(display.role === "student" ? display.detail : `${display.detailLabel || "Designation"}: ${display.detail}`)}</div>` : ""}${display.extra ? `<div class="front-detail">${safe(display.extraLabel || (display.role === "student" ? "Batch" : "Department"))}: ${safe(display.extra)}</div>` : ""}<div class="front-sign">${signature}<div class="signline"></div><div class="signatory">${cardTemplate.signatoryName ? `<span>${safe(cardTemplate.signatoryTitle)}</span><strong>${safe(cardTemplate.signatoryName)}</strong>` : `<strong>${safe(cardTemplate.signatoryTitle)}</strong>`}</div></div></main></article><article class="card back" style="background-image:${cardBackground}"><div class="wash"></div><header class="top"><img class="logo" src="${logoUrl}" alt="Octal logo"><div class="brand"><div class="institution">${safe(cardTemplate.institutionName)}</div><div class="title">INFORMATION</div></div></header><main class="back-content"><div class="back-center"><div class="back-intro"><div class="return-label">If found</div><p class="message">${safe(cardTemplate.backMessage)}</p></div><div class="details"><strong>${safe(cardTemplate.institutionName)}</strong>${safe(cardTemplate.addressLine)}${cardTemplate.addressLine && cardTemplate.contactLine ? "<br>" : ""}${safe(cardTemplate.contactLine)}</div></div></main></article>`;
      }).join("");
      const documentTitle = printPeople.length === 1 ? `${safe(cards[0].display.name)} ID Card` : `${printPeople.length} ID Cards`;
      const printDocument = `<!doctype html><html><head><meta charset="utf-8"><title>${documentTitle}</title><style>
        @page{size:68mm 100mm;margin:0}
        *{box-sizing:border-box}
        html,body{margin:0;width:68mm;height:auto;min-height:100mm;font-family:Arial,Helvetica,sans-serif;color:#1e293b}
        .card{position:relative;width:54mm;height:85.6mm;margin:7.2mm auto;overflow:hidden;border:1px solid #cbd5e1;border-radius:3mm;background:#fff center/cover no-repeat;print-color-adjust:exact;-webkit-print-color-adjust:exact;break-inside:avoid}
        .wash{position:absolute;inset:0;background:transparent}
        .top{position:relative;display:flex;min-height:22mm;flex-direction:column;align-items:center;justify-content:center;gap:1mm;padding:2mm 3mm;color:${cssColor};text-align:center;background:transparent}
        .logo{display:block;width:19mm;height:9mm;object-fit:contain;border:1px solid rgba(255,255,255,.8);border-radius:1.5mm;background:#fff;padding:1mm}
        .front .top{min-height:26mm;padding:5mm 3mm 2mm}
        .front .logo{width:21mm;height:10mm}
        .brand{min-width:0;max-width:100%}
        .institution{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7pt;font-weight:700;letter-spacing:.02em}
        .title{margin-top:.5mm;font-size:5pt;letter-spacing:.1em;opacity:.95}
        .front-content{position:relative;display:flex;height:59mm;flex-direction:column;align-items:center;justify-content:flex-start;gap:.5mm;padding:.6mm 3mm;text-align:center}
        .photo{width:24mm;height:31mm;flex:none;object-fit:cover;border:1px solid #cbd5e1;border-radius:2mm;background:white}
        .placeholder{display:flex;align-items:center;justify-content:center;color:${cssColor};font-size:18pt;font-weight:700}
        .name{max-width:100%;color:${cssColor};font-size:8pt;font-weight:700;line-height:1.1;overflow-wrap:anywhere}
        .id,.front-detail{max-width:100%;color:#475569;font-size:6pt;font-weight:600;line-height:1.15;overflow-wrap:anywhere}
        .id{font-family:monospace}
        .role{position:absolute;top:1.5mm;right:1.5mm;padding:.8mm 1.4mm;border-radius:1mm;background:white;color:${cssColor};font-size:4.5pt;font-weight:700;text-transform:uppercase}
        .back{display:flex;flex-direction:column}
        .back .top{min-height:23mm;padding:6mm 3mm 2mm}
        .back-content{position:relative;display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;padding:4mm 4mm 8mm;text-align:center}
        .back-center{display:flex;width:100%;flex-direction:column;align-items:center;gap:8mm}
        .back-intro{width:100%}
        .return-label{color:${cssColor};font-size:7pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .message{margin-top:2mm;color:#334155;font-size:7pt;line-height:1.55}
        .details{width:100%;color:#475569;font-size:6pt;line-height:1.6}
        .details strong{display:block;margin-bottom:.7mm;color:${cssColor};font-size:6.3pt}
        .sign{min-width:20mm;margin-top:3mm;text-align:center;color:#334155;font-size:5pt}
        .signature{display:block;width:19mm;height:7mm;object-fit:contain;margin:0 auto .5mm}
        .signline{width:20mm;border-top:1px solid #64748b;margin:1mm auto .6mm}
        .signatory{font-weight:700}
        .front-sign{min-width:20mm;margin-top:auto;padding-top:.4mm;text-align:center;color:#334155;font-size:5pt;line-height:1.15}
        .front-sign .signature{width:23mm;height:6.5mm;margin:0 auto}
        .front-sign .signline{width:18mm;margin:.2mm auto .4mm}
        .front-sign .signatory{display:flex;justify-content:center;gap:1mm;max-width:100%;overflow-wrap:anywhere}
        .front{break-after:page;page-break-after:always}
        @media print{html,body{width:68mm;height:auto;min-height:100mm}.card{margin:7.2mm auto;break-inside:avoid}}
      </style></head><body>${cardMarkup}</body></html>`;
      printFrame = document.createElement("iframe");
      printFrame.setAttribute("aria-hidden", "true");
      printFrame.title = "ID card print document";
      printFrame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
      document.body.appendChild(printFrame);
      const frame = printFrame;
      const frameWindow = frame.contentWindow;
      const frameDocument = frame.contentDocument;
      if (!frameWindow || !frameDocument) throw new Error("Could not prepare the print document.");
      frameDocument.open();
      frameDocument.write(printDocument);
      frameDocument.close();
      await Promise.all(Array.from(frameDocument.images).map((image) => image.decode().catch(() => undefined)));
      frameWindow.addEventListener("afterprint", () => {
        frame.remove();
        window.focus();
      }, { once: true });
      window.setTimeout(() => frame.remove(), 120000);
      frameWindow.focus();
      frameWindow.print();
    } catch (error) {
      printFrame?.remove();
      toast.error((error as Error).message || "Could not generate ID card.");
    } finally {
      setLoading(false);
    }
  };

  const printPeople = people || (person ? [person] : []);
  const buttonLabel = people ? `Print ${people.length} ID Cards` : compact ? "ID Card" : "Print ID Card";
  return <Button type="button" variant={variant} disabled={loading || printPeople.length === 0} onClick={printCard} className={compact ? "h-8 gap-1.5 px-2.5 text-xs" : "gap-2"}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <IdCard className="h-4 w-4" />}{loading ? "Preparing…" : buttonLabel}</Button>;
}
