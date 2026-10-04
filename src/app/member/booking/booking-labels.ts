// Fungsi murni untuk papan booking dua langkah (rombak UI T3, 4 Okt).
// Hanya tampilan: aturan booking tetap dijaga server (POST /api/booking).

const TZ = "Asia/Jakarta";

// Sama dengan kode booking di dasbor member: 6 karakter terakhir id, huruf besar.
export function bookingCode(id: string): string {
  return id.slice(-6).toUpperCase();
}

// "Senin, 5 Okt · 16.00" (WIB).
export function slotShortLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", timeZone: TZ });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${day} · ${time}`;
}

// Label + status tombol menempel.
// sisaSesi: sisa sesi paket yang akan dipakai (paket coach slot terpilih; tanpa
// pilihan = paket peserta di kolam ini). null = tidak ada paket aktif di kolam ini.
export function bookButtonState({
  sisaSesi,
  selectedStart,
}: {
  sisaSesi: number | null;
  selectedStart: string | null;
}): { label: string; disabled: boolean } {
  if (sisaSesi === null) return { label: "Belum ada paket di kolam ini", disabled: true };
  if (sisaSesi <= 0) return { label: "Sesi paket habis", disabled: true };
  if (!selectedStart) return { label: "Pilih tanggal dan jam", disabled: true };
  return { label: `Booking ${slotShortLabel(selectedStart)}`, disabled: false };
}
