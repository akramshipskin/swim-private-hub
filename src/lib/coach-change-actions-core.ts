// Logika server pengajuan ganti coach (dipakai server action member & admin).
// Dipisah dari file "use server" supaya bisa dites langsung.
import { prisma } from "@/lib/prisma";
import { isUsablePackage } from "@/lib/active-package";
import {
  COACH_CHANGE_PAY_WINDOW_MS,
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
  coachChangeAmount,
  completeCoachChange,
  remainingSessions,
} from "@/lib/coach-change";
import { DELETION_PENDING_APPROVE_ERROR, DELETION_PENDING_COACH_CHANGE_ERROR } from "@/lib/coach-change-rules";

type Result = { error: string } | { ok: true; status?: string };

function packPrice(c: { pricePack4: number | null; pricePack8: number | null } | null | undefined, totalSesi: number) {
  if (!c) return null;
  return totalSesi === 4 ? c.pricePack4 : totalSesi === 8 ? c.pricePack8 : null;
}

// Coach pengganti yang sah untuk sebuah paket: aktif, mengajar di kolam paket,
// sudah memasang harga ukuran paket itu, bukan coach paket sekarang.
export function eligibleCoachWhere(poolId: string, currentCoachId: string) {
  return {
    id: { not: currentCoachId },
    role: "COACH" as const,
    isActive: true,
    coachProfile: { isActive: true },
    poolAffiliations: { some: { poolId } },
  };
}

export async function submitCoachChange(memberId: string, input: { packageId: string; toCoachId: string; reason: string }): Promise<Result> {
  const reason = input.reason.trim();
  if (reason.length < MIN_REASON_LENGTH) return { error: `Tulis alasannya minimal ${MIN_REASON_LENGTH} huruf.` };
  if (reason.length > MAX_REASON_LENGTH) return { error: `Alasan maksimal ${MAX_REASON_LENGTH} huruf.` };
  const me = await prisma.user.findUnique({ where: { id: memberId }, select: { deletionRequestedAt: true } });
  if (me?.deletionRequestedAt) return { error: DELETION_PENDING_COACH_CHANGE_ERROR };
  // Paket pemberian manual admin (tanpa pembayaran) tidak bisa ganti coach lewat
  // pengajuan: ganti ke coach lebih murah akan mengkredit selisih sebagai saldo
  // uang padahal paketnya tidak dibayar. Admin memberi paket baru saja.
  const pkg = await prisma.package.findFirst({ where: { id: input.packageId, memberId, payments: { some: { status: "SUCCESS" } } } });
  if (!pkg || !pkg.coachId || pkg.poolPrice == null || pkg.isTrial) return { error: "Paket ini tidak bisa diganti coach-nya." };
  if (!isUsablePackage(pkg) && (await remainingSessions(prisma, pkg.id, 0)) === 0) {
    return { error: "Paket ini sudah tidak punya sisa sesi atau sudah kedaluwarsa." };
  }
  const coach = await prisma.user.findFirst({
    where: { ...eligibleCoachWhere(pkg.poolId, pkg.coachId), id: input.toCoachId },
    select: { coachProfile: { select: { pricePack4: true, pricePack8: true } } },
  });
  if (!coach || packPrice(coach.coachProfile, pkg.totalSesi) == null) return { error: "Coach pilihanmu tidak bisa dipilih untuk paket ini." };
  try {
    await prisma.coachChangeRequest.create({
      data: { packageId: pkg.id, memberId, fromCoachId: pkg.coachId, toCoachId: input.toCoachId, reason },
    });
  } catch (err) {
    // Index unik "satu pengajuan terbuka per paket".
    if ((err as { code?: string }).code === "P2002") return { error: "Paket ini sudah punya pengajuan ganti coach yang sedang diproses." };
    throw err;
  }
  return { ok: true };
}

// Member membatalkan pengajuannya sendiri, selama belum ada pembayaran yang berjalan.
export async function cancelCoachChange(memberId: string, requestId: string): Promise<Result> {
  const res = await prisma.coachChangeRequest.updateMany({
    where: { id: requestId, memberId, status: { in: ["PENDING", "AWAITING_PAYMENT"] }, payments: { none: { status: "PENDING" } } },
    data: { status: "CANCELLED" },
  });
  return res.count ? { ok: true } : { error: "Pengajuan ini tidak bisa dibatalkan (sudah diproses atau pembayaran sedang berjalan)." };
}

// Tambahan bayar yang tidak dimulai dalam 24 jam sejak disetujui = batal
// (Hadi 2 Okt). Saldo member belum terpakai di status ini, jadi tidak ada yang
// dikembalikan. Dipanggil saat halaman member/admin dibuka.
export async function expireStaleCoachChanges(now = new Date()) {
  await prisma.coachChangeRequest.updateMany({
    where: {
      status: "AWAITING_PAYMENT",
      decidedAt: { lt: new Date(now.getTime() - COACH_CHANGE_PAY_WINDOW_MS) },
      payments: { none: { status: { in: ["PENDING", "SUCCESS"] } } },
    },
    data: { status: "EXPIRED" },
  });
}

// Admin menyetujui: sisa sesi dihitung ulang dengan harga coach baru. Tidak
// perlu tambah bayar = langsung selesai (selisih ke saldo member); perlu
// tambah bayar = menunggu member membayar (24 jam).
export async function approveCoachChange(requestId: string, now = new Date()): Promise<Result> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "CoachChangeRequest" WHERE id = ${requestId} FOR UPDATE`;
    const req = await tx.coachChangeRequest.findUnique({ where: { id: requestId }, include: { package: true } });
    if (!req || req.status !== "PENDING") return { error: "Pengajuan ini sudah diproses." } as Result;
    // Baris akun dikunci (pengajuan, akun, paket: urutan sama dengan completeCoachChange)
    // supaya pengajuan hapus akun yang bersamaan menunggu dan bacaan ini segar.
    const [owner] = await tx.$queryRaw<{ deletionRequestedAt: Date | null }[]>`SELECT "deletionRequestedAt" FROM "User" WHERE id = ${req.memberId} FOR NO KEY UPDATE`;
    if (owner?.deletionRequestedAt) return { error: DELETION_PENDING_APPROVE_ERROR } as Result;
    const pkg = req.package;
    if (pkg.coachId !== req.fromCoachId || pkg.poolPrice == null || pkg.coachPrice == null || pkg.serviceFee == null) {
      return { error: "Paket ini sudah tidak bisa diganti coach-nya." } as Result;
    }
    if (pkg.status !== "ACTIVE" || (pkg.expiredDate && pkg.expiredDate < now)) {
      return { error: "Paket ini sudah tidak aktif atau sudah kedaluwarsa, tidak bisa diganti coach-nya." } as Result;
    }
    const coach = await tx.user.findFirst({
      where: { ...eligibleCoachWhere(pkg.poolId, pkg.coachId), id: req.toCoachId },
      select: { coachProfile: { select: { pricePack4: true, pricePack8: true } } },
    });
    const newCoachPrice = packPrice(coach?.coachProfile, pkg.totalSesi);
    if (newCoachPrice == null) return { error: "Coach baru sudah tidak aktif, tidak mengajar di kolam ini, atau belum memasang harga paket ini." } as Result;
    const sessions = await remainingSessions(tx, pkg.id, pkg.sisaSesi, now);
    const { amount } = coachChangeAmount(
      { totalSesi: pkg.totalSesi, poolPrice: pkg.poolPrice, coachPrice: pkg.coachPrice, serviceFee: pkg.serviceFee },
      newCoachPrice,
      sessions
    );
    await tx.coachChangeRequest.update({
      where: { id: req.id },
      data: { decidedAt: now, sessions, amount, newCoachPrice, status: amount > 0 ? "AWAITING_PAYMENT" : "PENDING" },
    });
    if (amount > 0) return { ok: true, status: "AWAITING_PAYMENT" } as Result;
    const done = await completeCoachChange(tx, req.id, now);
    if (!done.ok) throw new Error(done.error);
    return { ok: true, status: "COMPLETED" } as Result;
  });
}

export async function rejectCoachChange(requestId: string, note: string, now = new Date()): Promise<Result> {
  const adminNote = note.trim();
  if (adminNote.length < 5) return { error: "Tulis alasan penolakan untuk member (minimal 5 huruf)." };
  const res = await prisma.coachChangeRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", adminNote: adminNote.slice(0, MAX_REASON_LENGTH), decidedAt: now },
  });
  return res.count ? { ok: true } : { error: "Pengajuan ini sudah diproses." };
}
