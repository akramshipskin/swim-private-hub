"use client";

import { useEffect, useRef, useState } from "react";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
}

// Native <input type="date"> gak bisa dikustomisasi popup kalendernya
// (render OS/browser, no API buat kasih dot/highlight per tanggal).
// Calendar custom ini yang gantiin, fetch tanggal mana yang ada slot
// AVAILABLE per bulan yang lagi dibuka, terus kasih titik penanda.
export function AvailabilityDatePicker({
  value,
  onChange,
  fetchUrl = "/api/availability/available-dates",
  legendLabel = "ada slot ready",
  defaultOpen = false,
}: {
  value: string;
  onChange: (date: string) => void;
  /** Endpoint yang dipanggil per bulan, harus balikin { dates: string[] } (YYYY-MM-DD). */
  fetchUrl?: string;
  /** Teks di bawah kalender buat jelasin arti titik penanda. */
  legendLabel?: string;
  /** Popup langsung kebuka pas mount -- dipake pas komponen ini dirender
   *  on-demand (misal fallback "kalender lain" di DateQuickPicker mobile),
   *  biar gak perlu 2x klik (klik buat munculin, klik lagi buat buka). */
  defaultOpen?: boolean;
}) {
  const selected = parseKey(value);
  const [open, setOpen] = useState(defaultOpen);
  const [viewY, setViewY] = useState(selected.y);
  const [viewM, setViewM] = useState(selected.m);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const sep = fetchUrl.includes("?") ? "&" : "?";
    fetch(`${fetchUrl}${sep}year=${viewY}&month=${viewM + 1}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAvailableDates(new Set(data.dates ?? []));
      });
    return () => {
      cancelled = true;
    };
  }, [viewY, viewM, fetchUrl]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function prevMonth() {
    if (viewM === 0) {
      setViewY((y) => y - 1);
      setViewM(11);
    } else {
      setViewM((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewM === 11) {
      setViewY((y) => y + 1);
      setViewM(0);
    } else {
      setViewM((m) => m + 1);
    }
  }

  const firstWeekday = new Date(Date.UTC(viewY, viewM, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedWeekday = new Date(Date.UTC(selected.y, selected.m, selected.d)).getUTCDay();
  const label = `${DAY_LABELS[selectedWeekday]}, ${selected.d} ${MONTH_LABELS[selected.m]} ${selected.y}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-text hover:bg-surface-muted"
      >
        {label}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-subtle">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.1 1.02l-4.25 4.5a.75.75 0 01-1.1 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-72 rounded-xl border border-border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-md p-1 text-text-muted hover:bg-surface-muted"
              aria-label="Bulan sebelumnya"
            >
              ‹
            </button>
            <p className="text-sm font-medium text-text">
              {MONTH_LABELS[viewM]} {viewY}
            </p>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-md p-1 text-text-muted hover:bg-surface-muted"
              aria-label="Bulan berikutnya"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-text-subtle">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty-${i}`} />;
              const key = toKey(viewY, viewM, day);
              const hasSlot = availableDates.has(key);
              const isSelected = key === value;
              const isToday = key === todayKey;
              const isPast = key < todayKey;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isPast}
                  aria-disabled={isPast}
                  onClick={() => {
                    if (isPast) return;
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                    isPast
                      ? "cursor-not-allowed text-text-subtle/40"
                      : isSelected
                        ? "bg-brand-600 font-semibold text-white"
                        : isToday
                          ? "font-semibold text-brand-700"
                          : "text-text hover:bg-surface-muted"
                  }`}
                >
                  {day}
                  {hasSlot && !isSelected && !isPast && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-text-subtle">
            <span className="h-1 w-1 rounded-full bg-brand-500" /> {legendLabel}
          </p>
        </div>
      )}
    </div>
  );
}
