import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // hover:bg-[#0a0a08] (bukan hover:bg-brand-700) SENGAJA hex literal --
  // brand-700 dibalik jadi lime TERANG di dark mode (buat teks di atas
  // surface gelap), jadi kalau dipake sebagai background hover di sini,
  // tombol malah nyala terang bukannya gelap dikit. Fixed 1 warna di kedua
  // tema, sama pola kayak CTA band di landing-view.tsx.
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-[#0a0a08] hover:-translate-y-px active:translate-y-0 disabled:bg-disabled-bg disabled:shadow-none disabled:translate-y-0",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-muted active:bg-surface-muted disabled:text-disabled-text",
  danger:
    "bg-surface text-danger-text border border-danger-text/25 hover:bg-danger-bg active:bg-danger-bg disabled:text-danger-text/40 disabled:border-danger-text/15",
  ghost:
    "bg-transparent text-brand-600 hover:bg-brand-50 active:bg-brand-100 disabled:text-disabled-text",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "min-h-[44px] px-4 py-2.5 text-sm rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
