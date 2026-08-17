import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand" | "accent";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  neutral: "bg-surface-muted text-text-muted",
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-600",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
