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
    <Card className={cn("flex flex-col rounded-3xl", className)}>
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

// Kartu utama di puncak dasbor (desain Claude Design 4 Okt, rombak UI opsi A):
// satu tindakan utama per peran. tone "dark" = kartu gelap besar (lime di mode
// gelap); "soft" = kartu lembut, dipakai bila ada kartu gelap lain di sebelahnya.
// kicker = baris kecil di atas judul (mis. nama hari); bila ada, judul tampil besar
// (mis. jam sesi). badge = pil kecil di kanan atas (mis. "dalam 1 hari").
export function NextStepCard({
  eyebrow = "Langkah berikutnya",
  badge,
  kicker,
  title,
  body,
  href,
  cta,
  secondary,
  tone = "dark",
  className,
  children,
}: {
  eyebrow?: string;
  badge?: string;
  kicker?: string;
  title: string;
  body?: React.ReactNode;
  href?: string;
  cta?: string;
  secondary?: { href: string; label: string };
  tone?: "dark" | "soft";
  className?: string;
  children?: React.ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section
      aria-label={eyebrow}
      className={cn(
        "rounded-3xl p-5 sm:p-6",
        dark ? "bg-hero text-hero-ink" : "border border-brand-600/40 bg-brand-50 text-text",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-hero-accent" : "text-brand-700")}>{eyebrow}</p>
        {badge && (
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", dark ? "bg-hero-ink/15 text-hero-ink" : "bg-surface text-text")}>{badge}</span>
        )}
      </div>
      {kicker && <p className={cn("mt-3 text-base font-medium", dark ? "text-hero-muted" : "text-text-muted")}>{kicker}</p>}
      <p className={cn("font-bold tabular-nums leading-tight", kicker ? "mt-1 text-3xl sm:text-4xl" : "mt-2 text-xl sm:text-2xl")}>{title}</p>
      {body && <div className={cn("mt-2 text-sm", dark ? "text-hero-muted" : "text-text-muted")}>{body}</div>}
      {children}
      {(href || secondary) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {href && cta && (
            <Link
              href={href}
              className={cn(
                "inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-sm font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 max-sm:w-full",
                dark ? "bg-hero-accent text-hero hover:opacity-90" : "bg-brand-600 text-white hover:bg-fixed-ink-deep"
              )}
            >
              {cta}
            </Link>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              className={cn("text-sm font-medium underline-offset-2 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center", dark ? "text-hero-ink" : "text-brand-700")}
            >
              {secondary.label} &rarr;
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

// Progres sisa sesi paket: satu segmen per sesi (maks 16; lebih dari itu satu
// batang proporsional). tone "hero" dipakai di dalam kartu gelap.
export function SegmentBar({ sisa, total, tone = "default", className }: { sisa: number; total: number; tone?: "default" | "hero"; className?: string }) {
  const hero = tone === "hero";
  const on = hero ? "bg-hero-accent" : "bg-brand-500";
  const off = hero ? "bg-hero-ink/20" : "bg-surface-muted";
  const left = Math.max(0, Math.min(sisa, total));
  const label = `Sisa ${left} dari ${total} sesi`;
  if (total <= 0) return null;
  if (total > 16) {
    return (
      <div role="img" aria-label={label} className={cn("h-2 overflow-hidden rounded-full", off, className)}>
        <div className={cn("h-full rounded-full", on)} style={{ width: `${(left / total) * 100}%` }} />
      </div>
    );
  }
  return (
    <div role="img" aria-label={label} className={cn("flex gap-1", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-2 flex-1 rounded-full", i < left ? on : off)} />
      ))}
    </div>
  );
}

// Kartu saldo gelap untuk coach dan pemilik kolam. Tombol hanya tautan ke halaman
// Saldo yang sudah ada (aturan penarikan tetap di sana).
export function BalanceCard({
  label,
  amount,
  hint,
  href,
  cta,
  className,
}: {
  label: string;
  amount: string;
  hint?: React.ReactNode;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <section aria-label={label} className={cn("flex flex-col rounded-3xl bg-hero p-5 text-hero-ink sm:p-6", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-hero-accent">{label}</p>
      {/* Angka rupiah tidak boleh pecah di tengah: tidak dibungkus, dan mengecil di
          lebar tablet-kecil/laptop (768-1279) saat kartu berbagi baris dengan kartu lain. */}
      <p className="mt-2 whitespace-nowrap text-3xl font-bold leading-tight tabular-nums sm:max-md:text-4xl md:max-xl:text-2xl xl:text-4xl">{amount}</p>
      {hint && <div className="mt-2 text-sm text-hero-muted">{hint}</div>}
      <Link
        href={href}
        className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-hero-accent px-5 text-sm font-bold text-hero transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 max-sm:w-full md:mt-auto md:self-start"
      >
        {cta}
      </Link>
    </section>
  );
}
