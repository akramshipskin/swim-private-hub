// Jatah self-cancel disimpan per-paket (Package.jatahCancel, dari
// PACK_CANCEL_QUOTA di src/lib/pricing.ts) -- lihat src/lib/cancel-eligibility.ts.

// Minimal jam sebelum jadwal buat member masih bisa cancel sendiri.
export const CANCEL_WINDOW_HOURS = 2;

// Minimal nominal pencairan saldo (kolam & coach). Dipake server
// (withdrawal.ts) DAN tombol "Cairkan" (saldo-view) biar sama persis.
export const MIN_WITHDRAWAL = 50_000;
// Janji di Perjanjian Coach & MOU Kolam: transfer paling lambat sekian hari
// kerja sejak pengajuan. Lewat dari itu, pengajuan ditandai di halaman admin.
export const WITHDRAWAL_MAX_BUSINESS_DAYS = 7;

// PPN atas komisi platform. Komisi dianggap SUDAH termasuk PPN:
// komisi Rp11.100 = pendapatan bersih Rp10.000 + PPN Rp1.100.
// Tarif 11% berlaku untuk sesi yang dikreditkan sejak 30 Sep 2026 (keputusan
// Hadi). Baris ledger lama (12%) TIDAK dihitung ulang; pembalikan membaca
// jumlah yang tercatat, jadi tarif berbeda antar periode aman.
export const PLATFORM_TAX_PERCENT = 11;

export function splitPlatformTax(commission: number) {
  const tax = Math.round((commission * PLATFORM_TAX_PERCENT) / (100 + PLATFORM_TAX_PERCENT));
  return { net: commission - tax, tax };
}

// Batas coach menandai kehadiran, dihitung dari jam sesi selesai (keputusan
// Hadi 29 Sep). Lewat batas ini hanya admin yang bisa menandai.
export const ATTENDANCE_MARK_WINDOW_HOURS = 24;

// Batas member melaporkan status "Tidak Hadir" yang salah, dihitung dari jam
// sesi selesai.
export const ATTENDANCE_REPORT_WINDOW_DAYS = 3;

// Uang platform dari sesi baru boleh ditarik setelah ditahan sekian hari
// (sama dengan jendela laporan member), supaya yang ditarik sudah "aman".
export const PLATFORM_HOLD_DAYS = 3;

// Peserta sudah booking tapi tidak datang: coach tetap dapat sebagian dari
// bagian coach normalnya; kolam Rp0; sisanya platform.
export const NO_SHOW_COACH_SHARE_PERCENT = 50;

const HOUR_MS = 60 * 60 * 1000;

export function coachCanMarkAttendance(endTime: Date, now: Date = new Date()) {
  return now.getTime() <= endTime.getTime() + ATTENDANCE_MARK_WINDOW_HOURS * HOUR_MS;
}

export function memberCanReportAttendance(endTime: Date, now: Date = new Date()) {
  return now.getTime() <= endTime.getTime() + ATTENDANCE_REPORT_WINDOW_DAYS * 24 * HOUR_MS;
}

// Penahanan pencairan coach (Hadi 29 Sep, opsi B): tiap peserta wajib dapat
// catatan milestone dari coach-nya minimal sekali per sekian sesi Hadir.
// Kalau ada peserta yang sudah sekian sesi Hadir (dengan coach itu) tanpa
// catatan, coach tidak bisa mengajukan pencairan baru. Pengajuan yang sudah
// masuk tetap diproses. Hanya sesi mulai MILESTONE_HOLD_START yang dihitung.
export const MILESTONE_NOTE_EVERY_SESSIONS = 2;
export const MILESTONE_HOLD_START = new Date("2026-10-01T00:00:00+07:00");

// Afiliasi (Hadi 29 Sep, diubah 2 Okt): pemilik kode (coach atau kolam) dapat
// sekian persen dari biaya layanan SPH bersih (setelah PPN) paket PERTAMA
// berbayar member yang mendaftar dengan kodenya, sekali per member, dibayar
// dari bagian SPH; sesi coba tidak dihitung. Aturan lama 5% dari jumlah dibayar
// dihapus (Hadi 2 Okt malam, #9); komisi yang sudah tercatat tidak diubah.
// Cair ke saldo setelah sesi pertama member Hadir + sekian hari.
export const AFFILIATE_SERVICE_FEE_SHARE_PERCENT = 50;
export const AFFILIATE_HOLD_DAYS = 3;
