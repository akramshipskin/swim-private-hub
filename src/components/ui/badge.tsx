import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand" | "accent";

// Border tipis pake warna teks tone-nya sendiri (opacity rendah) --
// tanpa ini, badge pastel (bg-success-bg dst) nyaris ilang kontrasnya
// pas ditaruh langsung di atas page background yang juga pastel
// (--background deket banget ke --color-success-bg), gak cuma di atas
// Card putih.
const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success-text border border-success-text/15",
  warning: "bg-warning-bg text-warning-text border border-warning-text/15",
  danger: "bg-danger-bg text-danger-text border border-danger-text/15",
  neutral: "bg-surface-muted text-text-muted border border-border",
  brand: "bg-brand-50 text-brand-700 border border-brand-700/15",
  accent: "bg-accent-50 text-accent-600 border border-accent-600/15",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
