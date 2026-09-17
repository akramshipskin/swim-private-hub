// Jatah self-cancel sekarang disimpen per-paket (Package.jatahCancel),
// bukan konstanta global -- lihat PackageTemplate.jatahCancel &
// src/lib/cancel-eligibility.ts.

// Minimal jam sebelum jadwal buat member masih bisa cancel sendiri.
export const CANCEL_WINDOW_HOURS = 2;

// Minimal nominal pencairan saldo (kolam & coach). Dipake server
// (withdrawal.ts) DAN tombol "Cairkan" (saldo-view) biar sama persis.
export const MIN_WITHDRAWAL = 50_000;
