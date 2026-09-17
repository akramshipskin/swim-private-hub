import type { Prisma } from "@/generated/prisma/client";
import { splitPlatformTax } from "@/lib/policy";

// Semua fungsi di sini WAJIB dipanggil dalam prisma.$transaction (tx) yang
// sama dengan perubahan lain (Booking) yang men-trigger-nya -- kredit/debit
// saldo dan baris WalletTransaction harus atomic bareng-bareng.
//
// Revisi 2026-09-12 (paket lintas-kolam): kolam TIDAK LAGI dikredit pas
// Payment sukses -- paket sekarang bisa dipake booking di kolam manapun,
// jadi gak ada "1 kolam pasti" buat dikredit di muka. Kolam & coach
// DUA-DUANYA dikredit bareng, pas Booking ditandai Hadir, pake
// commissionPercent/coachSharePercent milik KOLAM TEMPAT SESI ITU DIAJAR
// (Booking -> Availability.poolId), bukan kolam tempat paket dibeli.

// Dipanggil pas booking ditandai Hadir. perSessionValue = harga paket asli
// (Payment.amount) / totalSesi -- lihat pemanggil di
// src/app/coach/riwayat-sesi/actions.ts buat cara ngitungnya.
export async function creditSessionRevenue(
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
    select: { commissionPercent: true, coachSharePercent: true },
  });

  const coachAmount = Math.round((perSessionValue * pool.coachSharePercent) / 100);
  // Sisa abis komisi platform DAN bagian coach -- bukan cuma
  // (100-commission)%, karena bagian coach juga keluar dari harga sesi
  // yang sama, bukan dari sisa kolam kayak model lama.
  const poolAmount = Math.round(
    (perSessionValue * (100 - pool.commissionPercent - pool.coachSharePercent)) / 100
  );

  await tx.pool.update({
    where: { id: poolId },
    data: { walletBalance: { increment: poolAmount } },
  });
  if (coachAmount > 0) {
    await tx.coachProfile.update({
      where: { id: coachProfileId },
      data: { walletBalance: { increment: coachAmount } },
    });
  }

  // Sisanya komisi platform, langsung dipisah jadi pendapatan bersih + PPN.
  const { net, tax } = splitPlatformTax(Math.max(0, perSessionValue - poolAmount - coachAmount));

  await tx.walletTransaction.createMany({
    data: [
      { type: "SESSION_REVENUE", poolId, amount: poolAmount, bookingId },
      ...(coachAmount > 0
        ? [
            {
              type: "SESSION_PAYOUT" as const,
              coachProfileId,
              amount: coachAmount,
              bookingId,
            },
          ]
        : []),
      ...(net > 0 ? [{ type: "PLATFORM_REVENUE" as const, amount: net, bookingId }] : []),
      ...(tax > 0 ? [{ type: "PLATFORM_TAX" as const, amount: tax, bookingId }] : []),
    ],
  });
}

// Kebalikan creditSessionRevenue -- dipanggil kalau attendance yang tadinya
// Hadir di-toggle balik jadi Gak Hadir/belum ditandai. Baca nilai yang
// beneran udah dicatat buat bookingId ini (bukan hitung ulang dari
// perSessionValue) -- kalau commissionPercent/coachSharePercent berubah di
// antara kredit awal dan reversal ini, reversal HARUS balikin jumlah yang
// beneran dikredit dulu, bukan jumlah baru yang dihitung ulang.
export async function reverseSessionRevenue(
  tx: Prisma.TransactionClient,
  { bookingId }: { bookingId: string }
) {
  const poolTxn = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_REVENUE", poolId: { not: null } },
  });
  const coachTxn = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_PAYOUT", coachProfileId: { not: null } },
  });
  if (!poolTxn || !poolTxn.poolId) return;

  await tx.pool.update({
    where: { id: poolTxn.poolId },
    data: { walletBalance: { decrement: poolTxn.amount } },
  });
  const reversals: Prisma.WalletTransactionCreateManyInput[] = [
    { type: "SESSION_REVENUE", poolId: poolTxn.poolId, amount: -poolTxn.amount, bookingId },
  ];

  if (coachTxn && coachTxn.coachProfileId) {
    await tx.coachProfile.update({
      where: { id: coachTxn.coachProfileId },
      data: { walletBalance: { decrement: coachTxn.amount } },
    });
    reversals.push({
      type: "SESSION_PAYOUT",
      coachProfileId: coachTxn.coachProfileId,
      amount: -coachTxn.amount,
      bookingId,
    });
  }

  // Bagian platform dibalikin sebesar total bersih yang masih tercatat buat
  // booking ini (kredit dikurangi reversal sebelumnya), jadi toggle berulang
  // gak bikin minus dobel.
  for (const type of ["PLATFORM_REVENUE", "PLATFORM_TAX"] as const) {
    const current = await tx.walletTransaction.aggregate({ where: { bookingId, type }, _sum: { amount: true } });
    const amount = current._sum.amount ?? 0;
    if (amount > 0) reversals.push({ type, amount: -amount, bookingId });
  }

  await tx.walletTransaction.createMany({ data: reversals });
}
