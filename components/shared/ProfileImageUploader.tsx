"use client";

import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import { X, UserRound } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileImageUploaderProps {
  endpoint: "studentImageUploader" | "employeeImageUploader";
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

export default function ProfileImageUploader({ endpoint, value, onChange, onUploadingChange, disabled = false }: ProfileImageUploaderProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {value ? <Image src={value} alt="Profile photo preview" fill sizes="64px" unoptimized className="object-cover" /> : <UserRound className="h-7 w-7 text-slate-300 dark:text-slate-600" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Profile photo</p>
        <p className="mb-2 text-xs text-slate-500">Upload one image, up to 4 MB.</p>
        <div className="flex flex-wrap items-center gap-2">
          <UploadButton
            endpoint={endpoint}
            disabled={disabled}
            onUploadBegin={() => onUploadingChange?.(true)}
            onClientUploadComplete={(files) => {
              onUploadingChange?.(false);
              const url = files[0]?.ufsUrl;
              if (url) {
                onChange(url);
                toast.success("Profile photo uploaded.");
              }
            }}
            onUploadError={(error) => { onUploadingChange?.(false); toast.error(error.message || "Image upload failed."); }}
            appearance={{
              button: "h-8 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 ut-uploading:cursor-not-allowed ut-uploading:bg-indigo-400",
              allowedContent: "hidden",
            }}
          />
          {value && <button type="button" disabled={disabled} onClick={() => onChange("")} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5"/> Remove</button>}
        </div>
      </div>
    </div>
  );
}
