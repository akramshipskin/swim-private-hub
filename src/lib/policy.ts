// Jatah self-cancel sekarang disimpen per-paket (Package.jatahCancel),
// bukan konstanta global -- lihat PackageTemplate.jatahCancel &
// src/lib/cancel-eligibility.ts.

// Minimal jam sebelum jadwal buat member masih bisa cancel sendiri.
export const CANCEL_WINDOW_HOURS = 2;

// Markup harga beli 1 sesi di kolam lain, dari harga per sesi paket kolam
// itu -- biar beli paket tetep lebih murah dari eceran.
export const DROP_IN_MARKUP_PERCENT = 20;

// Masa berlaku paket 1 sesi (hari, dihitung dari pembayaran sukses).
export const DROP_IN_DURATION_DAYS = 14;

// Minimal nominal pencairan saldo (kolam & coach). Dipake server
// (withdrawal.ts) DAN tombol "Cairkan" (saldo-view) biar sama persis.
export const MIN_WITHDRAWAL = 50_000;

// PPN atas komisi platform. Komisi dianggap SUDAH termasuk PPN:
// komisi Rp11.200 = pendapatan bersih Rp10.000 + PPN Rp1.200.
export const PLATFORM_TAX_PERCENT = 12;

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
