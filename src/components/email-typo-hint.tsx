"use client";

import { suggestEmailFix } from "@/lib/email-typo";

// Peringatan di bawah isian email bila domainnya terlihat salah ketik.
export function EmailTypoHint({ value, onUse, className = "" }: { value: string; onUse: (fixed: string) => void; className?: string }) {
  const fix = suggestEmailFix(value);
  if (!fix) return null;
  return (
    <p role="status" className={`mt-1.5 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text ${className}`}>
      Email ini mungkin salah ketik. Maksudmu <span className="font-medium">{fix}</span>?{" "}
      <button type="button" onClick={() => onUse(fix)} className="-my-3 inline-block py-3 font-semibold underline">
        Pakai Ini
      </button>
    </p>
  );
}
