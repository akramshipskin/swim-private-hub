import { prisma } from "@/lib/prisma";

// Koreksi saldo coach/kolam oleh admin (keputusan Hadi 26 Sep 2026).
//
// Bukan "edit angka saldo": setiap koreksi = satu baris baru di ledger
// (SESSION_REVENUE untuk kolam / SESSION_PAYOUT untuk coach, tanpa bookingId
// -- konvensi "koreksi manual" yang sudah dibaca halaman laporan admin), jadi
// riwayatnya utuh dan tampil ke coach/kolam di halaman Saldo.
//
// Saldo BOLEH minus (uang yang ternyata salah sudah telanjur dicairkan).
// Tidak perlu logika pelunasan khusus: kredit sesi berikutnya menambah
// saldo yang minus itu sampai tertutup, dan pencairan otomatis tertahan
// selama saldo < minimal (CAS walletBalance >= nominal di withdrawal.ts).

export class AdjustmentError extends Error {}

// Batas teknis, bukan aturan bisnis: kolom saldo bertipe INT (maks ~2,1 miliar).
export const MAX_ADJUSTMENT = 1_000_000_000;

export type AdjustmentTarget = { poolId: string } | { coachProfileId: string };

export async function createWalletAdjustment({
  target,
  amount,
  reason,
  fromPlatform,
  adminId,
  idempotencyKey,
}: {
  target: AdjustmentTarget;
  // Positif = saldo ditambah, negatif = saldo dikurangi.
  amount: number;
  reason: string;
  // true: uangnya pindah dari/ke pendapatan platform (misal kompensasi dari
  // platform). false: membetulkan salah catat, tidak ada pihak lawan.
  fromPlatform: boolean;
  adminId: string;
  idempotencyKey: string;
}) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new AdjustmentError("Nominal koreksi harus angka bulat dan tidak boleh 0.");
  }
  if (Math.abs(amount) > MAX_ADJUSTMENT) {
    throw new AdjustmentError("Nominal koreksi terlalu besar.");
  }
  const note = reason.trim();
  if (note.length < 5) throw new AdjustmentError("Alasan koreksi wajib diisi (minimal 5 karakter).");
  if (note.length > 500) throw new AdjustmentError("Alasan koreksi maksimal 500 karakter.");
  if (!idempotencyKey) throw new AdjustmentError("Formulir tidak lengkap, muat ulang halaman.");

  try {
    return await prisma.$transaction(async (tx) => {
      // Baris ledger dulu: kiriman ganda gagal di unique idempotencyKey
      // sebelum saldo sempat berubah.
      const row = await tx.walletTransaction.create({
        data: {
          type: "poolId" in target ? "SESSION_REVENUE" : "SESSION_PAYOUT",
          ...target,
          amount,
          note,
          createdById: adminId,
          idempotencyKey,
        },
      });
      if ("poolId" in target) {
        await tx.pool.update({ where: { id: target.poolId }, data: { walletBalance: { increment: amount } } });
      } else {
        await tx.coachProfile.update({ where: { id: target.coachProfileId }, data: { walletBalance: { increment: amount } } });
      }
      if (fromPlatform) {
        await tx.walletTransaction.create({
          data: { type: "PLATFORM_REVENUE", amount: -amount, note, createdById: adminId },
        });
      }
      return row;
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    // Kiriman kedua dari formulir yang sama: koreksi pertama sudah tercatat.
    if (code === "P2002") return null;
    if (code === "P2025") throw new AdjustmentError("Kolam/coach tidak ditemukan.");
    throw err;
  }
}
