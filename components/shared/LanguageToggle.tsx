"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === "en" ? "bn" : "en";
  const label = language === "en" ? "EN" : "বাং";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setLanguage(nextLanguage)}
      data-no-translate="true"
      className="relative h-10 w-10 shrink-0 rounded-xl border-0 bg-transparent p-0 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      title={language === "en" ? "Switch to Bengali" : "Switch to English"}
      aria-label={language === "en" ? "Switch language to Bengali" : "Switch language to English"}
    >
      <Languages className="absolute left-1 top-0.5 h-5 w-5 stroke-[2.2]" />
      <span className="absolute bottom-0 right-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white shadow-sm">
        {label}
      </span>
    </Button>
  );
}
