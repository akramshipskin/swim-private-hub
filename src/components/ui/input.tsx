import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-xs font-medium text-text-muted", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-[44px] rounded-xl border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-subtle",
        "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        "disabled:bg-surface-muted disabled:text-text-subtle",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    // Native <select> punya padding/tinggi bawaan OS sendiri (paling
    // kentara di iOS) yang gak bisa disamain persis sama <input> cuma
    // pake CSS biasa -- appearance-none matiin chrome bawaan itu biar
    // box-nya bener-bener ngikutin CSS kita, tapi otomatis ngilangin
    // panah dropdown native-nya, jadi digambar ulang manual di sini.
    <div className={cn("relative", className)}>
      <select
        className="min-h-[44px] w-full appearance-none rounded-xl border border-border bg-white px-3 py-2 pr-8 text-sm text-text focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-surface-muted disabled:text-text-subtle"
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
