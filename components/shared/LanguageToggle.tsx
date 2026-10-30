"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === "en" ? "bn" : "en";
  const label = language === "en" ? "বাংলা" : "EN";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setLanguage(nextLanguage)}
      data-no-translate="true"
      className="h-9 min-w-9 px-2 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all gap-1.5"
      title={language === "en" ? "Switch to Bengali" : "Switch to English"}
      aria-label={language === "en" ? "Switch language to Bengali" : "Switch language to English"}
    >
      <Languages className="h-4 w-4" />
      <span className="text-[11px] font-bold">{label}</span>
    </Button>
  );
}
