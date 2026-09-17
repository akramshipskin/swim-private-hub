// Semua input jam dari coach/member diasumsikan WIB (Asia/Jakarta) --
// semua kolam mitra Phase 1 ada di zona WIB. Pakai offset eksplisit
// +07:00 biar hasil instant-nya benar gak peduli timezone server
// tempat app di-deploy (Vercel default UTC, bisa beda dari timezone
// lokal pas development). Kalau nanti ada kolam di zona lain
// (WITA/WIT), field ini perlu jadi per-Pool, bukan konstanta global.

export function wibDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+07:00`);
}

// Kolom `date` di DB cuma label kalender (Postgres DATE, no timezone),
// jadi disimpan sebagai UTC midnight biar gak ke-truncate mundur/maju
// sehari pas disimpan. Format ulang HARUS pakai timeZone "UTC" (lihat
// formatDateLabel), jangan Asia/Jakarta, atau bakal geser lagi.
export function dateLabel(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Tanggal "hari ini" versi WIB, format YYYY-MM-DD, dipakai buat filter
// query "upcoming" biar gak bergantung timezone server.
export function todayWibDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function formatTimeWib(d: Date): string {
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function isDateKey(s: string | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Rentang tanggal filter laporan dari query string (?from=&to=). Nilai yang
// gak valid jatuh ke default (dulu bikin halaman error 500), rentang
// kebalik (from > to) ditukar (dulu diterima diem-diem & hasilnya selalu
// kosong).
export function resolveDateRange(
  rawFrom: string | undefined,
  rawTo: string | undefined,
  defaultDaysBack: number
): { from: string; to: string } {
  const today = todayWibDateString();
  const fallbackFrom = new Date(`${today}T00:00:00Z`);
  fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - defaultDaysBack);
  let from = isDateKey(rawFrom) ? rawFrom : fallbackFrom.toISOString().slice(0, 10);
  let to = isDateKey(rawTo) ? rawTo : today;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}
