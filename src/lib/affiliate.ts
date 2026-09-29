// Afiliasi: kode per coach/kolam, komisi sekali per member (keputusan Hadi
// 29 Sep, lihat AffiliateCommission di schema.prisma).
//
// Siklus komisi:
//   sesi Hadir pertama (dari paket berbayar) -> PENDING, releaseAt = sesi
//   selesai + AFFILIATE_HOLD_DAYS. Sesi itu dikoreksi jadi Tidak Hadir
//   sebelum cair -> kembali WAITING (atau pindah ke sesi Hadir lain milik
//   member itu). Lewat releaseAt -> RELEASED: saldo pemilik kode bertambah,
//   pendapatan SPH berkurang senilai sama. Yang sudah RELEASED tidak ditarik.
//
// Tidak ada cron: komisi yang jatuh tempo dicairkan "malas" oleh
// releaseDueCommissions(), dipanggil dari halaman saldo/dashboard dan
// sebelum pengajuan pencairan.
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { AFFILIATE_COMMISSION_PERCENT, AFFILIATE_HOLD_DAYS } from "@/lib/policy";

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeAffiliateCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function commissionAmount(paymentAmount: number) {
  return Math.floor((paymentAmount * AFFILIATE_COMMISSION_PERCENT) / 100);
}

// "Nadia Putri" -> "NADIA" + 2 angka. Nama tanpa huruf latin -> "SPH".
export function codeCandidate(name: string, random: () => number = Math.random) {
  const letters = name.split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "SPH";
  return `${letters}${String(Math.floor(random() * 90) + 10)}`;
}

type Owner = { coachProfileId: string } | { poolId: string };

// Kode dibuat saat pertama kali ditampilkan ke pemiliknya. Bentrok kode
// (P2002 di kolom code) = coba kandidat lain; bentrok pemilik (2 tab
// bersamaan) = pakai kode yang sudah dibuat tab lain.
export async function getOrCreateAffiliateCode(owner: Owner, name: string): Promise<string> {
  const existing = await prisma.affiliateCode.findUnique({ where: owner as Prisma.AffiliateCodeWhereUniqueInput, select: { code: true } });
  if (existing) return existing.code;
  for (let i = 0; i < 20; i++) {
    const code = i < 10 ? codeCandidate(name) : `${codeCandidate(name)}${i}`;
    try {
      return (await prisma.affiliateCode.create({ data: { code, ...owner }, select: { code: true } })).code;
    } catch (err) {
      if ((err as { code?: string }).code !== "P2002") throw err;
      const mine = await prisma.affiliateCode.findUnique({ where: owner as Prisma.AffiliateCodeWhereUniqueInput, select: { code: true } });
      if (mine) return mine.code;
    }
  }
  throw new Error("Gagal membuat kode afiliasi, coba lagi.");
}

async function qualify(tx: Prisma.TransactionClient, memberId: string, booking: { id: string; endTime: Date }) {
  const releaseAt = new Date(booking.endTime.getTime() + AFFILIATE_HOLD_DAYS * DAY_MS);
  const existing = await tx.affiliateCommission.findUnique({ where: { memberId }, select: { status: true } });
  if (existing) {
    if (existing.status === "WAITING") {
      await tx.affiliateCommission.updateMany({
        where: { memberId, status: "WAITING" },
        data: { status: "PENDING", bookingId: booking.id, releaseAt },
      });
    }
    return;
  }
  const member = await tx.user.findUnique({
    where: { id: memberId },
    select: { referralCode: { select: { coachProfileId: true, poolId: true } } },
  });
  const code = member?.referralCode;
  if (!code) return;
  const firstPayment = await tx.payment.findFirst({
    where: { status: "SUCCESS", package: { memberId } },
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, amount: true },
  });
  const amount = firstPayment ? commissionAmount(firstPayment.amount) : 0;
  if (!firstPayment || amount <= 0) return;
  // skipDuplicates: dua sesi member yang sama ditandai Hadir barengan tidak
  // boleh menggagalkan tandai hadir (unik per member).
  await tx.affiliateCommission.createMany({
    data: [
      {
        memberId,
        coachProfileId: code.coachProfileId,
        poolId: code.poolId,
        paymentId: firstPayment.id,
        amount,
        status: "PENDING",
        bookingId: booking.id,
        releaseAt,
      },
    ],
    skipDuplicates: true,
  });
}

// Dipanggil creditSessionRevenue saat sesi (berbayar) ditandai Hadir.
export async function onSessionAttended(tx: Prisma.TransactionClient, bookingId: string) {
  const b = await tx.booking.findUnique({
    where: { id: bookingId },
    select: { memberId: true, availability: { select: { endTime: true } } },
  });
  if (!b) return;
  await qualify(tx, b.memberId, { id: bookingId, endTime: b.availability.endTime });
}

// Dipanggil reverseSessionRevenue saat tanda Hadir dibalik. Komisi yang masih
// menunggu dan dipicu sesi ini batal; kalau member punya sesi Hadir lain,
// hitungan pindah ke sesi itu (Hadi 29 Sep: "tunggu Hadir berikutnya").
export async function onSessionUnattended(tx: Prisma.TransactionClient, bookingId: string) {
  const reset = await tx.affiliateCommission.updateMany({
    where: { bookingId, status: "PENDING" },
    data: { status: "WAITING", bookingId: null, releaseAt: null },
  });
  if (reset.count === 0) return;
  const b = await tx.booking.findUnique({ where: { id: bookingId }, select: { memberId: true } });
  if (!b) return;
  const other = await tx.booking.findFirst({
    where: { memberId: b.memberId, attended: true, status: "BOOKED", id: { not: bookingId } },
    orderBy: { availability: { startTime: "asc" } },
    select: { id: true, availability: { select: { endTime: true } } },
  });
  if (other) await qualify(tx, b.memberId, { id: other.id, endTime: other.availability.endTime });
}

// Cairkan semua komisi yang sudah lewat masa tahan. Aman dipanggil berulang
// & barengan: tiap komisi diklaim dengan CAS status PENDING -> RELEASED di
// transaksi yang sama dengan kredit saldonya.
export async function releaseDueCommissions(now: Date = new Date()) {
  const due = await prisma.affiliateCommission.findMany({
    where: { status: "PENDING", releaseAt: { lte: now } },
    select: { id: true },
    take: 200,
  });
  let released = 0;
  for (const { id } of due) {
    const ok = await prisma.$transaction(async (tx) => {
      const claim = await tx.affiliateCommission.updateMany({
        where: { id, status: "PENDING", releaseAt: { lte: now } },
        data: { status: "RELEASED", releasedAt: now },
      });
      if (claim.count === 0) return false;
      const c = await tx.affiliateCommission.findUniqueOrThrow({
        where: { id },
        select: { amount: true, coachProfileId: true, poolId: true },
      });
      if (c.coachProfileId) {
        await tx.coachProfile.update({ where: { id: c.coachProfileId }, data: { walletBalance: { increment: c.amount } } });
      } else if (c.poolId) {
        await tx.pool.update({ where: { id: c.poolId }, data: { walletBalance: { increment: c.amount } } });
      }
      await tx.walletTransaction.createMany({
        data: [
          { type: "AFFILIATE_COMMISSION", coachProfileId: c.coachProfileId, poolId: c.poolId, amount: c.amount, note: "Komisi afiliasi" },
          { type: "PLATFORM_REVENUE", amount: -c.amount, note: "Komisi afiliasi dibayar" },
        ],
      });
      return true;
    });
    if (ok) released++;
  }
  return released;
}
