"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";
import { bookingCode } from "./booking-labels";

export type BookingDone = {
  bookingId: string;
  dateLabel: string;
  timeRange: string;
  participantName: string;
  poolName: string;
  coachName: string;
  packageId: string;
  // Jatah batal saat booking dibuat (booking baru tidak mengubahnya); dipakai
  // bila paket sudah tidak ada di data terbaru (sesinya terpakai semua).
  cancelRemainingAtBooking: number;
};

// Layar sukses di dalam papan booking (rombak UI T3). Sisa sesi dibaca dari data
// paket terbaru (setelah halaman disegarkan), bukan dihitung di sini.
export function BookingSuccess({
  done,
  pkg,
  refreshing,
  onBookAnother,
}: {
  done: BookingDone;
  pkg: { packageName: string; sisaSesi: number; cancelRemaining: number } | null;
  refreshing: boolean;
  onBookAnother: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Layar sukses menggantikan papan: mulai dari atas halaman, fokus ke judul
  // supaya pembaca layar langsung mengumumkan hasilnya.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const cancelRemaining = pkg?.cancelRemaining ?? done.cancelRemainingAtBooking;

  return (
    <section aria-labelledby="booking-success-title" className="dialog-panel mx-auto flex max-w-md flex-col gap-5 py-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-fixed-ink">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <h2
        id="booking-success-title"
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight text-text focus:outline-none"
      >
        Jam terkunci untukmu
      </h2>

      <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-text-muted">{done.dateLabel}</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-text">{done.timeRange}</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-text-muted">Peserta</dt>
          <dd className="min-w-0 break-words font-medium text-text">{done.participantName}</dd>
          <dt className="text-text-muted">Kolam</dt>
          <dd className="min-w-0 break-words font-medium text-text">{done.poolName}</dd>
          <dt className="text-text-muted">Coach</dt>
          <dd className="min-w-0 break-words font-medium text-text">{done.coachName}</dd>
        </dl>
        <p className="mt-2 font-mono text-xs text-text-subtle">Kode booking {bookingCode(done.bookingId)}</p>
      </div>

      <div role="status" className="text-sm leading-relaxed text-text-muted">
        {refreshing ? (
          <p>Memuat sisa sesi paket…</p>
        ) : pkg ? (
          <p>
            Sisa sesi {pkg.packageName}: {pkg.sisaSesi}. Sisa jatah batal: {cancelRemaining}.
          </p>
        ) : (
          <p>
            Sesi paket ini sudah terpakai semua. Sisa jatah batal: {cancelRemaining}.{" "}
            <Link href="/member/paket" className="font-medium text-text underline underline-offset-2">
              Beli paket baru
            </Link>
          </p>
        )}
        <p className="mt-1">Pembatalan paling lambat {CANCEL_WINDOW_HOURS} jam sebelum jadwal, lewat menu Booking atau Riwayat Booking.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="h-12 sm:flex-1" onClick={onBookAnother}>
          Booking Sesi Lain
        </Button>
        <Link href="/member/riwayat" className={buttonClass({ variant: "secondary", className: "h-12 sm:flex-1" })}>
          Lihat riwayat
        </Link>
      </div>
    </section>
  );
}
