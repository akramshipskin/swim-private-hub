import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card, CardBody } from "@/components/ui/card";
import { formatTimeWib } from "@/lib/datetime";

// Kotak bento dashboard: judul, isi ringkas, tautan "Selengkapnya".
export function BentoCard({
  title,
  href,
  linkLabel = "Selengkapnya",
  className,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          {href && (
            <Link href={href} className="shrink-0 text-sm font-medium text-brand-700 hover:underline">
              {linkLabel} &rarr;
            </Link>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </CardBody>
    </Card>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "warning" | "success" }) {
  return (
    <div>
      <p className="text-sm text-text-muted">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "warning" ? "text-warning-text" : tone === "success" ? "text-success-text" : "text-text"
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}

// Baris "perlu tindakan": angka + label, disorot kalau > 0.
export function ActionRow({ label, count, href, detail }: { label: string; count: number; href: string; detail?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {detail && <p className="text-xs text-text-subtle">{detail}</p>}
      </div>
      <span
        className={cn(
          "min-w-8 rounded-full px-2.5 py-0.5 text-center text-sm font-semibold tabular-nums",
          count > 0 ? "bg-warning-bg text-warning-text" : "bg-surface-muted text-text-subtle"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

export type SessionItem = {
  id: string;
  startTime: Date;
  endTime: Date;
  poolName: string;
  coachName?: string;
  who?: string;
  status?: string;
};

// Daftar sesi ringkas: jam · kolam, lalu coach/peserta.
export function SessionList({ items, empty, limit = 6 }: { items: SessionItem[]; empty: string; limit?: number }) {
  if (items.length === 0) return <p className="text-sm text-text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.slice(0, limit).map((s) => (
        <li key={s.id} className="flex items-start justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text tabular-nums">
              {formatTimeWib(s.startTime)}–{formatTimeWib(s.endTime)} <span className="font-medium text-brand-700">· {s.poolName}</span>
            </p>
            <p className="truncate text-sm text-text-muted">{[s.coachName, s.who].filter(Boolean).join(" · ")}</p>
          </div>
          {s.status && <span className="shrink-0 text-xs text-text-subtle">{s.status}</span>}
        </li>
      ))}
      {items.length > limit && <li className="py-2 text-xs text-text-subtle">+{items.length - limit} sesi lainnya</li>}
    </ul>
  );
}
