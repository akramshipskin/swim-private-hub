// Jam buka kolam (Hadi 2 Okt malam, #6/#7): dijaga 2 lapis -- slot baru di luar
// jam buka ditolak saat coach membuka slot, dan booking slot di luar jam buka
// ditolak saat member booking. Kolam tanpa jam buka tidak bisa dibuka slot
// barunya; slot lama di kolam itu tetap bisa dibooking.
// ponytail: satu jam buka-tutup untuk semua hari (belum per hari), sama
// dengan kolom Pool.openTime/closeTime.

type Hours = { openTime: string | null; closeTime: string | null };

// "HH:mm" jam WIB dari sebuah waktu.
function wibHHmm(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 3600_000);
  return `${String(wib.getUTCHours()).padStart(2, "0")}:${String(wib.getUTCMinutes()).padStart(2, "0")}`;
}

export function hasPoolHours(pool: Hours): pool is { openTime: string; closeTime: string } {
  return !!pool.openTime && !!pool.closeTime && pool.openTime < pool.closeTime;
}

// Sesi [start, end) harus di dalam [openTime, closeTime] pada hari yang sama (WIB).
// Kolam tanpa jam buka yang valid = tidak dibatasi (dipakai untuk booking slot lama).
export function withinPoolHours(pool: Hours, start: Date, end: Date): boolean {
  if (!hasPoolHours(pool)) return true;
  const s = wibHHmm(start);
  const e = wibHHmm(end);
  // Sesi yang melewati tengah malam (e <= s) tidak pernah di dalam jam buka harian.
  return end.getTime() - start.getTime() < 24 * 3600_000 && e > s && s >= pool.openTime && e <= pool.closeTime;
}

// "06.00–20.00" untuk pesan ke pengguna.
export function poolHoursLabel(pool: Hours): string {
  return hasPoolHours(pool) ? `${pool.openTime.replace(":", ".")}–${pool.closeTime.replace(":", ".")}` : "belum diisi";
}
