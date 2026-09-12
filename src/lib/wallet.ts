import type { Prisma } from "@/generated/prisma/client";

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

  await tx.walletTransaction.createMany({ data: reversals });
}
