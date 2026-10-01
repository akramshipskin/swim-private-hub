import type { Prisma } from "@/generated/prisma/client";
import { NO_SHOW_COACH_SHARE_PERCENT, splitPlatformTax } from "@/lib/policy";
import { onSessionAttended, onSessionUnattended } from "@/lib/affiliate";
import { pphAmount, sessionSplit } from "@/lib/pricing";

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

// Dipanggil pas booking ditandai Hadir (attended=true) atau Tidak Hadir
// (attended=false, bagi hasil sesi tidak datang). perSessionValue = harga paket asli
// (Payment.amount) / totalSesi -- lihat pemanggil di
// src/app/coach/riwayat-sesi/actions.ts buat cara ngitungnya.
export async function creditSessionRevenue(
  tx: Prisma.TransactionClient,
  {
    poolId,
    coachProfileId,
    bookingId,
    perSessionValue,
    attended = true,
    pricing,
  }: {
    poolId: string;
    coachProfileId: string;
    bookingId: string;
    perSessionValue: number;
    attended?: boolean;
    // Paket model harga-dari-coach (Package.poolPrice/coachPrice terisi):
    // dibagi per rupiah dari harga yang disalin saat beli, bukan persen kolam.
    pricing?: { paid: number; totalSesi: number; poolPrice: number; coachPrice: number };
  }
) {
  if (pricing) {
    await creditFixedSplit(tx, { poolId, coachProfileId, bookingId, attended, pricing });
    if (attended) await onSessionAttended(tx, bookingId);
    return;
  }
  const pool = await tx.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: { commissionPercent: true, coachSharePercent: true },
  });

  const normalCoachAmount = Math.round((perSessionValue * pool.coachSharePercent) / 100);
  if (!attended) {
    // Peserta sudah booking tapi tidak datang (keputusan Hadi 29 Sep): coach
    // dapat sebagian dari bagian normalnya, kolam Rp0, sisanya platform.
    const coachAmount = Math.floor((normalCoachAmount * NO_SHOW_COACH_SHARE_PERCENT) / 100);
    if (coachAmount > 0) {
      await tx.coachProfile.update({
        where: { id: coachProfileId },
        data: { walletBalance: { increment: coachAmount } },
      });
    }
    const { net, tax } = splitPlatformTax(perSessionValue - coachAmount);
    await tx.walletTransaction.createMany({
      data: [
        ...(coachAmount > 0 ? [{ type: "SESSION_PAYOUT" as const, coachProfileId, amount: coachAmount, bookingId }] : []),
        ...(net > 0 ? [{ type: "PLATFORM_REVENUE" as const, amount: net, bookingId }] : []),
        ...(tax > 0 ? [{ type: "PLATFORM_TAX" as const, amount: tax, bookingId }] : []),
      ],
    });
    return;
  }

  const coachAmount = normalCoachAmount;
  // Sisa abis komisi platform DAN bagian coach -- bukan cuma
  // (100-commission)%, karena bagian coach juga keluar dari harga sesi
  // yang sama, bukan dari sisa kolam kayak model lama.
  // Dibatasi supaya coach+kolam gak pernah melebihi nilai sesi: kalau
  // komisi platform 0%, dua pembulatan ke atas bisa bikin total +Rp1
  // (uang yang gak pernah masuk). Sisa pembulatan tetap jatuh ke platform.
  const poolAmount = Math.min(
    Math.round((perSessionValue * (100 - pool.commissionPercent - pool.coachSharePercent)) / 100),
    perSessionValue - coachAmount
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
  // Sesi berbayar pertama yang Hadir memicu hitungan komisi afiliasi.
  await onSessionAttended(tx, bookingId);
}

// Model harga-dari-coach: kolam & coach dapat bagian tetap per sesi, dipotong
// PPh 0,5% (kecuali bebas potongan); sisanya (biaya layanan + pembulatan) SPH.
async function creditFixedSplit(
  tx: Prisma.TransactionClient,
  {
    poolId,
    coachProfileId,
    bookingId,
    attended,
    pricing,
  }: {
    poolId: string;
    coachProfileId: string;
    bookingId: string;
    attended: boolean;
    pricing: { paid: number; totalSesi: number; poolPrice: number; coachPrice: number };
  }
) {
  const split = sessionSplit({ ...pricing, attended });
  const [pool, coach] = await Promise.all([
    tx.pool.findUniqueOrThrow({ where: { id: poolId }, select: { pphExempt: true } }),
    tx.coachProfile.findUniqueOrThrow({ where: { id: coachProfileId }, select: { pphExempt: true } }),
  ]);
  const poolPph = pphAmount(split.pool, pool.pphExempt);
  const coachPph = pphAmount(split.coach, coach.pphExempt);

  if (attended) {
    await tx.pool.update({ where: { id: poolId }, data: { walletBalance: { increment: split.pool - poolPph } } });
  }
  if (split.coach > 0) {
    await tx.coachProfile.update({
      where: { id: coachProfileId },
      data: { walletBalance: { increment: split.coach - coachPph } },
    });
  }
  const { net, tax } = splitPlatformTax(split.platform);
  await tx.walletTransaction.createMany({
    data: [
      ...(attended ? [{ type: "SESSION_REVENUE" as const, poolId, amount: split.pool, bookingId }] : []),
      ...(poolPph > 0 ? [{ type: "PPH_WITHHELD" as const, poolId, amount: -poolPph, bookingId }] : []),
      ...(split.coach > 0 ? [{ type: "SESSION_PAYOUT" as const, coachProfileId, amount: split.coach, bookingId }] : []),
      ...(coachPph > 0 ? [{ type: "PPH_WITHHELD" as const, coachProfileId, amount: -coachPph, bookingId }] : []),
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
// Keputusan Hadi 29 Sep (menggantikan D3 24 Sep): pembalikan TIDAK ditolak
// walau uang sesi itu sudah dicairkan. Saldo coach/kolam boleh minus; minus
// itu otomatis tertutup oleh bagi hasil sesi berikutnya, dan selama saldo
// kurang dari nominal pencairan, pencairan tertahan (CAS di withdrawal.ts).
export async function reverseSessionRevenue(
  tx: Prisma.TransactionClient,
  { bookingId }: { bookingId: string }
) {
  // Dibalikin sebesar total BERSIH yang masih tercatat buat booking ini
  // (kredit dikurangi reversal sebelumnya) per jenis -- bukan baris pertama
  // yang ketemu, yang setelah toggle Hadir berulang bisa berupa baris minus.
  const net = async (type: "SESSION_REVENUE" | "SESSION_PAYOUT" | "PLATFORM_REVENUE" | "PLATFORM_TAX") =>
    (await tx.walletTransaction.aggregate({ where: { bookingId, type }, _sum: { amount: true } }))._sum.amount ?? 0;

  const reversals: Prisma.WalletTransactionCreateManyInput[] = [];

  const poolTxn = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_REVENUE", poolId: { not: null } },
  });
  const poolNet = await net("SESSION_REVENUE");
  if (poolTxn?.poolId && poolNet > 0) {
    await tx.pool.update({
      where: { id: poolTxn.poolId },
      data: { walletBalance: { decrement: poolNet } },
    });
    reversals.push({ type: "SESSION_REVENUE", poolId: poolTxn.poolId, amount: -poolNet, bookingId });
  }

  const coachTxn = await tx.walletTransaction.findFirst({
    where: { bookingId, type: "SESSION_PAYOUT", coachProfileId: { not: null } },
  });
  const coachNet = await net("SESSION_PAYOUT");
  if (coachTxn?.coachProfileId && coachNet > 0) {
    await tx.coachProfile.update({
      where: { id: coachTxn.coachProfileId },
      data: { walletBalance: { decrement: coachNet } },
    });
    reversals.push({ type: "SESSION_PAYOUT", coachProfileId: coachTxn.coachProfileId, amount: -coachNet, bookingId });
  }

  // Potongan PPh (paket model harga-dari-coach) dikembalikan ke dompet yang
  // dipotong, sebesar total bersih yang masih tercatat.
  for (const side of ["pool", "coach"] as const) {
    const key = side === "pool" ? "poolId" : "coachProfileId";
    const row = await tx.walletTransaction.findFirst({ where: { bookingId, type: "PPH_WITHHELD", [key]: { not: null } } });
    const owner = side === "pool" ? row?.poolId : row?.coachProfileId;
    if (!owner) continue;
    const withheld = -((await tx.walletTransaction.aggregate({ where: { bookingId, type: "PPH_WITHHELD", [key]: owner }, _sum: { amount: true } }))._sum.amount ?? 0);
    if (withheld <= 0) continue;
    if (side === "pool") await tx.pool.update({ where: { id: owner }, data: { walletBalance: { increment: withheld } } });
    else await tx.coachProfile.update({ where: { id: owner }, data: { walletBalance: { increment: withheld } } });
    reversals.push({ type: "PPH_WITHHELD", [key]: owner, amount: withheld, bookingId });
  }

  for (const type of ["PLATFORM_REVENUE", "PLATFORM_TAX"] as const) {
    const amount = await net(type);
    if (amount > 0) reversals.push({ type, amount: -amount, bookingId });
  }

  if (reversals.length > 0) await tx.walletTransaction.createMany({ data: reversals });
  await onSessionUnattended(tx, bookingId);
}
