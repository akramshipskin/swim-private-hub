"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";

// Isian file bergaya brand (Hadi 12 Okt, penilaian UI/UX): isian bawaan browser
// menampilkan "Choose file / No file chosen" berbahasa Inggris di Chrome.
// Isian asli tetap ada (tersembunyi tapi bisa difokus), jadi required, accept,
// dan pengiriman formulir tidak berubah.
export function FileInput({ id, className, disabled, onChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div
      className={cn(
        "relative flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-border bg-surface px-2 py-1.5",
        disabled && "bg-surface-muted",
        className
      )}
    >
      <input
        id={inputId}
        type="file"
        disabled={disabled}
        onChange={(e) => {
          setFileName(e.target.files?.[0]?.name ?? null);
          onChange?.(e);
        }}
        className="peer sr-only"
        {...props}
      />
      <label
        htmlFor={inputId}
        aria-hidden="true"
        className={buttonClass({
          variant: "secondary",
          size: "sm",
          className: cn("peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500", disabled ? "cursor-not-allowed text-disabled-text" : "cursor-pointer"),
        })}
      >
        Pilih File
      </label>
      <span className="min-w-0 break-all text-sm text-text-muted">{fileName ?? "Belum ada file dipilih"}</span>
    </div>
  );
}
