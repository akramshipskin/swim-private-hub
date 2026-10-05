// Angka aturan ganti coach (aman dipakai di komponen browser: tanpa akses database).
export const COACH_CHANGE_PAY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 500;

// Hadi 6 Okt (jawaban A pertanyaan terbuka 1): selama akun diajukan untuk dihapus,
// ganti coach ditolak di semua pintu (ajukan, ganti gratis, tambah bayar, persetujuan admin).
export const DELETION_PENDING_COACH_CHANGE_ERROR =
  "Kamu sedang mengajukan penghapusan akun, jadi ganti coach belum bisa dilakukan. Batalkan pengajuan hapus akun di Profil dulu.";
export const DELETION_PENDING_APPROVE_ERROR =
  "Member ini sedang mengajukan penghapusan akun. Tolak pengajuan ganti coach ini, atau minta member membatalkan pengajuan hapus akun dulu.";
