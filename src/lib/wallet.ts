import type { Prisma } from "@/generated/prisma/client";

// Semua fungsi di sini WAJIB dipanggil dalam prisma.$transaction (tx) yang
// sama dengan perubahan lain (Payment/Booking) yang men-trigger-nya --
// kredit/debit saldo dan baris WalletTransaction harus atomic sama-sama,
// gak boleh salah satu doang yang kesimpen kalau ada error di tengah.

// Pool dapet (100% - commissionPercent) dari harga paket, dikredit pas
// Payment SUCCESS. Ini SEBELUM dipotong bagian coach per sesi -- itu baru
// kepotong belakangan pas tiap booking ditandai Hadir (creditCoachPayout).
export async function creditPoolFromPackageSale(
  tx: Prisma.TransactionClient,
  { poolId, paymentId, grossAmount }: { poolId: string; paymentId: string; grossAmount: number }
) {
  const pool = await tx.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: { commissionPercent: true },
  });
  const poolAmount = Math.round((grossAmount * (100 - pool.commissionPercent)) / 100);

  await tx.pool.update({
    where: { id: poolId },
    data: { walletBalance: { increment: poolAmount } },
  });
  await tx.walletTransaction.create({
    data: {
      type: "PACKAGE_SALE",
      poolId,
      amount: poolAmount,
      paymentId,
    },
  });
}

// Pool bayar Coach bagiannya buat 1 sesi yang baru ditandai Hadir --
// perSessionValue dihitung dari Payment.amount / Package.totalSesi (harga
// paket, bukan harga template saat ini -- template bisa berubah harga
// belakangan, paket yang udah dibeli gak boleh ikut berubah).
export async function payoutCoachForSession(
  tx: Prisma.TransactionClient,
  {
    poolId,
    coachProfileId,
    bookingId,
    perSessionValue,
  }: { poolId: string; coachProfileId: string; bookingId: string; perSessionValue: number }
) {
  const pool = await tx.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: { coachSharePercent: true },
  });
  const coachAmount = Math.round((perSessionValue * pool.coachSharePercent) / 100);
  if (coachAmount === 0) return;

  await tx.pool.update({
    where: { id: poolId },
    data: { walletBalance: { decrement: coachAmount } },
  });
  await tx.coachProfile.update({
    where: { id: coachProfileId },
    data: { walletBalance: { increment: coachAmount } },
  });
  await tx.walletTransaction.createMany({
    data: [
      { type: "SESSION_PAYOUT", poolId, amount: -coachAmount, bookingId },
      { type: "SESSION_PAYOUT", coachProfileId, amount: coachAmount, bookingId },
    ],
  });
}

// Kebalikan payoutCoachForSession -- dipanggil kalau attendance yang
// tadinya Hadir di-toggle balik jadi Gak Hadir/belum ditandai. Baca nilai
// SESSION_PAYOUT yang beneran udah dicatat buat bookingId ini (bukan
// hitung ulang dari perSessionValue) -- kalau coachSharePercent berubah
// di antara kredit awal dan reversal ini, reversal HARUS balikin jumlah
// yang beneran dikredit dulu, bukan jumlah baru yang dihitung ulang.
export async function reverseCoachPayoutForSession(
  tx: Prisma.TransactionClient,
  { bookingId }: { bookingId: string }
) {
  const original = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_PAYOUT", coachProfileId: { not: null } },
  });
  if (!original || !original.coachProfileId) return;

  const poolTxn = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_PAYOUT", poolId: { not: null } },
  });
  if (!poolTxn || !poolTxn.poolId) return;

  const coachAmount = original.amount;

  await tx.pool.update({
    where: { id: poolTxn.poolId },
    data: { walletBalance: { increment: coachAmount } },
  });
  await tx.coachProfile.update({
    where: { id: original.coachProfileId },
    data: { walletBalance: { decrement: coachAmount } },
  });
  await tx.walletTransaction.createMany({
    data: [
      { type: "SESSION_PAYOUT", poolId: poolTxn.poolId, amount: coachAmount, bookingId },
      { type: "SESSION_PAYOUT", coachProfileId: original.coachProfileId, amount: -coachAmount, bookingId },
    ],
  });
}
