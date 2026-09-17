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
