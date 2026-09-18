"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/input";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Rentang tahun yang bisa dipilih lewat dropdown. Batas bawah 80 tahun ke
// belakang supaya tanggal lahir coach kepake tanpa harus mundur satu-satu
// per bulan (Hadi 18 Sep v3); batas atas 5 tahun ke depan buat field yang
// nunjuk masa depan (mis. "Berlaku Sampai").
const YEAR_BACK = 80;
const YEAR_FORWARD = 5;

function yearOptions(current: number, today: number) {
  const min = Math.min(today - YEAR_BACK, current);
  const max = Math.max(today + YEAR_FORWARD, current);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

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

// Sengaja bukan <input type="date"> -- itu widget native OS (paling
// kentara di iOS), gak nurut CSS width/max-width sama sekali (kebukti
// berkali-kali dari device asli), jadi bisa nabrak keluar card kalau
// kotaknya sempit. Kalender ini kita gambar sendiri, sama gaya visual
// kayak AvailabilityDatePicker yang dipake member/booking, tapi lebih
// generik: gak fetch tanggal available/dot marker, gak ngunci tanggal
// lampau (filter admin butuh pilih tanggal lampau), dan bisa kosong
// (buat field opsional kayak "Berlaku Sampai").
export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pilih tanggal",
  className,
  clearable = false,
  popupAlign = "left",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
  /** "right" buat trigger yang nempel di ujung kanan card -- popup w-72
   *  yang nempel kiri bisa nembus keluar & bikin halaman geser. */
  popupAlign?: "left" | "right";
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const base = value ? parseKey(value) : parseKey(todayKey);
  const [viewY, setViewY] = useState(base.y);
  const [viewM, setViewM] = useState(base.m);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  let label: string = placeholder;
  if (value) {
    const s = parseKey(value);
    const weekday = new Date(Date.UTC(s.y, s.m, s.d)).getUTCDay();
    label = `${DAY_LABELS[weekday]}, ${s.d} ${MONTH_LABELS[s.m]} ${s.y}`;
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted",
          "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          value ? "text-text" : "text-text-subtle"
        )}
      >
        <span className="truncate">{label}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-text-subtle">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.1 1.02l-4.25 4.5a.75.75 0 01-1.1 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            // Popup ngikut lebar trigger (w-full), dengan lantai 18rem supaya
            // grid 7 kolom tanggal gak kejepit, dan plafon selebar layar
            // dikurangi margin supaya gak nembus keluar di HP. Sebelumnya
            // lebarnya dipatok tanpa lihat trigger, jadi nyembul ke kanan dan
            // nabrak tombol di sebelahnya (Hadi 18 Sep v3, Jadwal Kolam).
            "absolute z-20 mt-1 w-full min-w-[18rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg",
            popupAlign === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="shrink-0 rounded-md px-1.5 py-1 text-text-muted hover:bg-surface-muted"
              aria-label="Bulan sebelumnya"
            >
              ‹
            </button>
            {/* Bulan & tahun sebagai dropdown, bukan cuma panah maju-mundur:
                lompat ke tahun lahir lewat panah butuh puluhan klik. */}
            <Select
              aria-label="Bulan"
              value={viewM}
              onChange={(e) => setViewM(Number(e.target.value))}
              className="min-w-0 flex-1"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Tahun"
              value={viewY}
              onChange={(e) => setViewY(Number(e.target.value))}
              className="w-[5.5rem] shrink-0"
            >
              {yearOptions(viewY, Number(todayKey.slice(0, 4))).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={nextMonth}
              className="shrink-0 rounded-md px-1.5 py-1 text-text-muted hover:bg-surface-muted"
              aria-label="Bulan berikutnya"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 justify-items-center gap-1 text-center text-[11px] font-medium text-text-subtle">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 justify-items-center gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty-${i}`} />;
              const key = toKey(viewY, viewM, day);
              const isSelected = key === value;
              const isToday = key === todayKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setValue(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                    isSelected
                      ? "bg-brand-600 font-semibold text-white"
                      : isToday
                        ? "font-semibold text-brand-700"
                        : "text-text hover:bg-surface-muted"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {clearable && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
              className="mt-2 text-xs font-medium text-text-subtle hover:text-text-muted hover:underline"
            >
              Kosongkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
