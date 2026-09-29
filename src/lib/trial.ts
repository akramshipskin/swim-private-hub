// Paket trial (keputusan Hadi 29 Sep): per ANAK -- peserta yang belum pernah
// punya paket apa pun boleh beli trial satu kali. Adik yang baru didaftarkan
// tetap boleh walau kakaknya sudah pernah beli paket reguler.
import type { Prisma } from "@/generated/prisma/client";

// Sama dengan batas waktu bayar Midtrans: pembelian trial yang masih bisa
// dibayar ikut menghalangi trial kedua (klik beli dua kali).
export const TRIAL_PENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

// Paket yang membuat peserta TIDAK lagi berhak trial. EXPIRED hanya dihitung
// kalau paketnya pernah aktif (startDate terisi): webhook Midtrans juga
// menandai paket EXPIRED saat pembayaran gagal/dibatalkan/kedaluwarsa, dan
// paket yang tidak pernah dibayar bukan "paket".
export function trialBlockingPackageWhere(now: Date = new Date()): Prisma.PackageWhereInput {
  return {
    OR: [
      { status: "ACTIVE" },
      { status: "EXPIRED", startDate: { not: null } },
      { status: "PENDING_PAYMENT", isTrial: true, createdAt: { gte: new Date(now.getTime() - TRIAL_PENDING_WINDOW_MS) } },
    ],
  };
}

// Template yang dipakai untuk harga "mulai dari" & harga beli 1 sesi: trial
// tidak ikut (harga promosinya merusak kedua angka itu).
export const REGULAR_TEMPLATE_WHERE = { isActive: true, isTrial: false } as const;
