import { WITHDRAWAL_MAX_BUSINESS_DAYS } from "@/lib/policy";

const wibDate = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

// Jumlah hari kerja (Senin-Jumat, tanggal WIB) SETELAH tanggal pengajuan sampai
// hari ini. Pengajuan Senin -> Selasa = 1, Senin pekan depan = 5.
// ponytail: libur nasional tidak dihitung (dianggap hari kerja), jadi penanda
// bisa muncul 1-2 hari lebih awal saat libur panjang. Upgrade: daftar tanggal libur.
export function businessDaysSince(requestedAt: Date, now: Date = new Date()): number {
  const end = wibDate(now);
  const d = new Date(`${wibDate(requestedAt)}T00:00:00Z`);
  let count = 0;
  for (;;) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.toISOString().slice(0, 10) > end) return count;
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count++;
  }
}

// Pengajuan yang belum selesai dan sudah lewat batas hari kerja.
export function isWithdrawalOverdue(w: { status: string; requestedAt: Date }, now: Date = new Date()): boolean {
  return (w.status === "PENDING" || w.status === "PROCESSING") && businessDaysSince(w.requestedAt, now) > WITHDRAWAL_MAX_BUSINESS_DAYS;
}
