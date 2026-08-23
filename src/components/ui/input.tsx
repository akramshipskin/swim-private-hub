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
    <select
      className={cn(
        "w-full min-h-[44px] rounded-xl border border-border bg-white px-3 py-2 text-sm text-text",
        "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        "disabled:bg-surface-muted disabled:text-text-subtle",
        className
      )}
      {...props}
    />
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
