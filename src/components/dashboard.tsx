import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card, CardBody } from "@/components/ui/card";
import { formatTimeWib } from "@/lib/datetime";
import { buttonClass } from "@/components/ui/button";

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
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <h2 className="min-w-0 text-base font-semibold text-text">{title}</h2>
          {href && (
            <Link href={href} className="shrink-0 text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
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
    <div className="min-w-0">
      <p className="text-sm text-text-muted">{label}</p>
      <p
        className={cn(
          "text-xl leading-tight font-bold tabular-nums break-words sm:text-2xl",
          tone === "warning" ? "text-warning-text" : tone === "success" ? "text-success-text" : "text-text"
        )}
      >
        {/* formatRupiah pakai non-breaking space setelah "Rp", jadi di kolom
            sempit (320px) break-words motong DI TENGAH angka ("Rp 750.00"/"0").
            Spasi biasa di sini bikin pindah barisnya di antara Rp dan angka. */}
        {typeof value === "string" ? value.replace(/ /g, " ") : value}
      </p>
      {hint && <p className="text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}

// Baris "perlu tindakan": angka + label, disorot kalau > 0.
export function ActionRow({ label, count, href, detail }: { label: string; count: number; href: string; detail?: string }) {
  return (
    <Link href={href} className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted">
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

// Kartu "Langkah berikutnya" di puncak dasbor (rombak UI 4 Okt, opsi A): satu
// tindakan utama per peran, supaya pengguna langsung tahu harus apa.
export function NextStepCard({
  eyebrow = "Langkah berikutnya",
  title,
  body,
  href,
  cta,
  secondary,
}: {
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  href?: string;
  cta?: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <section aria-label={eyebrow} className="rounded-2xl border border-brand-600/40 bg-brand-50 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      <p className="mt-1 text-lg font-semibold text-text sm:text-xl">{title}</p>
      {body && <div className="mt-1 text-sm text-text-muted">{body}</div>}
      {(href || secondary) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {href && cta && (
            <Link href={href} className={buttonClass({ className: "max-sm:w-full" })}>
              {cta}
            </Link>
          )}
          {secondary && (
            <Link href={secondary.href} className="text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
              {secondary.label} &rarr;
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
