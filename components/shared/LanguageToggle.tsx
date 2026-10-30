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
      className="relative h-9 w-9 shrink-0 rounded-xl border-0 bg-transparent p-0 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
      title={language === "en" ? "Switch to Bengali" : "Switch to English"}
      aria-label={language === "en" ? "Switch language to Bengali" : "Switch language to English"}
    >
      <Languages className="absolute left-0.5 top-0 h-[18px] w-[18px] stroke-[2.2]" />
      <span className="absolute bottom-0.5 right-0 z-10 flex h-[18px] min-w-[25px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[9px] font-bold leading-none text-white shadow-sm">
        {label}
      </span>
    </Button>
  );
}
