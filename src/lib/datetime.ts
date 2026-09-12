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
