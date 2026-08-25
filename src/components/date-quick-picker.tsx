"use client";

import { useEffect, useState } from "react";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Versi mobile dari AvailabilityDatePicker -- 8 pill tanggal terdekat
// (hari ini + 7), bukan popup kalender. Desktop tetep pake
// AvailabilityDatePicker (butuh lompat jauh ke depan, popup lebih cocok).
// value/onChange sama persis kontraknya, jadi drop-in buat state `date`
// yang sama -- slot beneran ke-refetch pas pill di-klik, bukan mockup.
export function DateQuickPicker({
  value,
  onChange,
  days = 8,
  fetchUrl = "/api/availability/available-dates",
}: {
  value: string;
  onChange: (date: string) => void;
  days?: number;
  fetchUrl?: string;
}) {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const base = new Date(Date.UTC(ty, tm - 1, td));

  const options = Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    return { key: toKey(d), dow: DAY_LABELS[d.getUTCDay()], num: d.getUTCDate() };
  });

  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Window 8 hari bisa nyebrang 2 bulan -- fetch tiap bulan yang
    // kesentuh, gabung hasilnya jadi 1 Set.
    const months = new Set(options.map((o) => o.key.slice(0, 7)));
    let cancelled = false;
    Promise.all(
      [...months].map((ym) => {
        const [y, m] = ym.split("-").map(Number);
        const sep = fetchUrl.includes("?") ? "&" : "?";
        return fetch(`${fetchUrl}${sep}year=${y}&month=${m}`).then((r) => r.json());
      })
    ).then((results) => {
      if (cancelled) return;
      const all = new Set<string>();
      for (const r of results) for (const dateKey of r.dates ?? []) all.add(dateKey);
      setAvailableDates(all);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, days, fetchUrl]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => {
        const isSelected = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`relative flex h-16 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition-colors ${
              isSelected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border bg-surface text-text hover:bg-surface-muted"
            }`}
          >
            <span className={isSelected ? "text-white/80" : "text-text-subtle"}>{o.dow}</span>
            <span className="text-base font-semibold">{o.num}</span>
            {availableDates.has(o.key) && !isSelected && (
              <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-brand-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
