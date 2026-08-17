// Jatah self-cancel sekarang disimpen per-paket (Package.jatahCancel),
// bukan konstanta global -- lihat PackageTemplate.jatahCancel &
// src/lib/cancel-eligibility.ts.

// Minimal jam sebelum jadwal buat member masih bisa cancel sendiri.
export const CANCEL_WINDOW_HOURS = 2;
