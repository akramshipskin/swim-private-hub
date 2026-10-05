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

export const SLOT_GONE_MESSAGE = "Jam yang kamu pilih sudah tidak tersedia. Pilih jam lain.";
export const SLOT_TAKEN_MESSAGE = "Jam yang kamu pilih baru saja diambil member lain. Pilih jam lain.";

// Nasib jam yang dipilih member (langkah 1 booking dua langkah) setiap papan
// dirender. Hanya tampilan: server (POST /api/booking) tetap yang menjaga aturan.
// - selection terikat ke selKey (tanggal|kolam|peserta): kunci berubah = dikosongkan tanpa pesan.
// - data jadwal terbaru (polling 5 detik) menunjukkan jam hilang / tidak bisa dipilih lagi =
//   dikosongkan, dengan pesan bila jamnya hilang atau diambil member lain.
// - selama permintaan booking berjalan (booking = true) pilihan tidak diusik.
export function resolveSelection<T extends { id: string; status: string; bookedByMe: boolean }>({
  selection,
  selKey,
  slots,
  booking,
  isSelectable,
}: {
  selection: { id: string; key: string } | null;
  selKey: string;
  slots: T[] | null;
  booking: boolean;
  isSelectable: (s: T) => boolean;
}): { selected: T | null; clear: boolean; message: string | null } {
  const selected = selection && selection.key === selKey && slots ? (slots.find((s) => s.id === selection.id) ?? null) : null;
  if (!selection || booking) return { selected, clear: false, message: null };
  if (selection.key !== selKey) return { selected, clear: true, message: null };
  if (slots && !(selected && isSelectable(selected))) {
    if (!selected) return { selected, clear: true, message: SLOT_GONE_MESSAGE };
    if (selected.status === "BOOKED" && !selected.bookedByMe) return { selected, clear: true, message: SLOT_TAKEN_MESSAGE };
    return { selected, clear: true, message: null };
  }
  return { selected, clear: false, message: null };
}
