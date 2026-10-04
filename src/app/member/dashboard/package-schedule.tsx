"use client";

import { useState } from "react";
import { BentoCard, SegmentBar, SessionList } from "@/components/dashboard";
import { cn } from "@/lib/cn";

export type DashPackage = {
  id: string;
  pool: string;
  dependent: string;
  name: string;
  sisa: number;
  total: number;
  jatahBatal: number;
  expiredLabel: string;
};

export type DashSession = {
  id: string;
  startTime: Date;
  endTime: Date;
  poolName: string;
  coachName: string;
  who: string;
  status: string;
};

// Kartu "Paket aktif" + "Jadwal berikutnya" dengan chip peserta di atasnya.
// Chip hanya menyaring tampilan; "Semua" (bawaan) = persis seperti sebelumnya.
export function PackageSchedule({ peserta, packages, sessions }: { peserta: string[]; packages: DashPackage[]; sessions: DashSession[] }) {
  const [who, setWho] = useState<string | null>(null);
  const pk = who ? packages.filter((p) => p.dependent === who) : packages;
  const ss = who ? sessions.filter((s) => s.who === who) : sessions;
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
      active ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-surface text-text hover:bg-surface-muted"
    );
  return (
    <>
      {peserta.length > 1 && (
        <div className="md:col-span-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="group" aria-label="Pilih peserta">
          <button type="button" aria-pressed={who === null} onClick={() => setWho(null)} className={chip(who === null)}>
            Semua peserta
          </button>
          {peserta.map((n) => (
            <button key={n} type="button" aria-pressed={who === n} onClick={() => setWho(n)} className={chip(who === n)}>
              {n}
            </button>
          ))}
        </div>
      )}
      <BentoCard title="Paket aktif" href="/member/paket" className="md:col-span-3">
        {pk.length === 0 ? (
          <p className="text-sm text-text-muted">{packages.length === 0 ? "Belum ada paket aktif. Beli paket di menu Paket." : `${who} belum punya paket aktif.`}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pk.map((p) => (
              <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-brand-700">{p.pool}</p>
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                  <p className="min-w-0 text-sm text-text">
                    {p.dependent} · {p.name}
                  </p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-text">
                    Sisa {p.sisa}/{p.total} sesi
                  </p>
                </div>
                <SegmentBar sisa={p.sisa} total={p.total} className="mt-2" />
                <p className="mt-2 text-xs text-text-muted">
                  Jatah batal {p.jatahBatal}
                  {p.expiredLabel && ` · ${p.expiredLabel}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>

      <BentoCard title="Jadwal berikutnya" href="/member/riwayat" className="md:col-span-3">
        <SessionList items={ss} empty="Belum ada jadwal. Booking sesi di menu Booking." />
      </BentoCard>
    </>
  );
}
