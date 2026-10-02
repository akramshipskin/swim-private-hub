// Ganti coach di tengah paket (Hadi 2 Okt): hanya ke coach lain di kolam yang
// sama, lewat pengajuan dengan alasan, diputuskan admin (coach lama diberi
// tahu). Sisa sesi dihitung ulang dengan harga coach baru: lebih murah =
// selisih masuk saldo member; lebih mahal = berlaku setelah tambahan dibayar
// (tidak dibayar 24 jam = batal).
import type { Prisma } from "@/generated/prisma/client";
import { creditMember } from "@/lib/member-wallet";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { formatRupiah } from "@/lib/format";

export { COACH_CHANGE_PAY_WINDOW_MS, MIN_REASON_LENGTH, MAX_REASON_LENGTH } from "@/lib/coach-change-rules";

type PkgPrices = { totalSesi: number; poolPrice: number; coachPrice: number; serviceFee: number };

// Nilai per sesi paket model harga-dari-coach (sama dengan dasar pembagian
// uang tiap sesi di wallet).
export function sessionValue(p: PkgPrices) {
  return Math.floor((p.poolPrice + p.coachPrice + p.serviceFee) / p.totalSesi);
}

// Harga paket setelah ganti coach: harga coach baru untuk ukuran paket yang
// sama, biaya layanan dengan tarif yang sama seperti saat beli.
export function repricePackage(p: PkgPrices, newCoachPackPrice: number): PkgPrices {
  const oldBase = p.poolPrice + p.coachPrice;
  const serviceFee = oldBase > 0 ? Math.round((p.serviceFee * (p.poolPrice + newCoachPackPrice)) / oldBase) : 0;
  return { ...p, coachPrice: newCoachPackPrice, serviceFee };
}

// Selisih untuk `sessions` sisa sesi: positif = member tambah bayar, negatif =
// masuk saldo member.
export function coachChangeAmount(p: PkgPrices, newCoachPackPrice: number, sessions: number) {
  const perSession = sessionValue(repricePackage(p, newCoachPackPrice)) - sessionValue(p);
  // `|| 0`: 0 sisa sesi x selisih negatif = -0, disimpan dan ditampilkan sebagai 0.
  return { perSession, amount: perSession * sessions || 0 };
}

// Sisa sesi yang belum dijalani: sesi belum dibooking + booking yang belum
// mulai dan belum ditandai (akan dipindah ke coach baru).
export async function remainingSessions(tx: Prisma.TransactionClient, packageId: string, sisaSesi: number, now = new Date()) {
  const future = await tx.booking.count({
    where: { packageId, status: "BOOKED", attended: null, availability: { startTime: { gt: now } } },
  });
  return sisaSesi + future;
}

// Harga yang dipakai membagi uang sebuah sesi di paket model harga-dari-coach,
// menurut WAKTU sesi: sesi sebelum sebuah ganti coach selesai memakai harga
// paket sebelum ganti itu (harus diajar coach lama saat itu); sesi setelah
// ganti coach terakhir memakai harga paket sekarang. Booking coach lama yang
// belum mulai dibatalkan saat ganti coach selesai, jadi tiap sesi jatuh tepat
// di satu periode. null = paket tanpa harga tersimpan (model lama) atau coach sesi
// tidak cocok dengan periodenya.
export async function pricesForSessionCoach(
  tx: Prisma.TransactionClient,
  pkg: { id: string; coachId: string | null; poolPrice: number | null; coachPrice: number | null; serviceFee: number | null },
  coachId: string,
  sessionStart: Date
) {
  if (pkg.poolPrice == null || pkg.coachPrice == null || pkg.serviceFee == null) return null;
  const next = await tx.coachChangeRequest.findFirst({
    // gte: booking yang mulai TEPAT saat ganti coach selesai tidak dibatalkan
    // (pembatalan hanya startTime > sekarang), jadi masih milik coach lama.
    where: { packageId: pkg.id, status: "COMPLETED", completedAt: { gte: sessionStart } },
    orderBy: { completedAt: "asc" },
    select: { fromCoachId: true, oldCoachPrice: true, oldServiceFee: true },
  });
  if (next) {
    if (next.fromCoachId !== coachId || next.oldCoachPrice == null || next.oldServiceFee == null) return null;
    return { poolPrice: pkg.poolPrice, coachPrice: next.oldCoachPrice, serviceFee: next.oldServiceFee };
  }
  if (pkg.coachId !== coachId) return null;
  return { poolPrice: pkg.poolPrice, coachPrice: pkg.coachPrice, serviceFee: pkg.serviceFee };
}

export type CompleteResult = { ok: true; credited: number } | { ok: false; error: string };

// Menyelesaikan ganti coach (dipanggil saat admin menyetujui pengajuan yang
// tidak perlu tambah bayar, atau saat tambahan bayar lunas). Booking yang belum
// mulai dengan coach lama dibatalkan (sesinya kembali ke paket), lalu paket
// dipindah ke coach baru dengan harga baru. Kelebihan bayar (sisa sesi
// berkurang sejak disetujui) dan selisih coach lebih murah masuk saldo member.
export async function completeCoachChange(
  tx: Prisma.TransactionClient,
  requestId: string,
  now = new Date()
): Promise<CompleteResult> {
  // Kunci pengajuan: persetujuan ganda / notifikasi Midtrans ganda antre di sini.
  await tx.$executeRaw`SELECT 1 FROM "CoachChangeRequest" WHERE id = ${requestId} FOR UPDATE`;
  const req = await tx.coachChangeRequest.findUnique({ where: { id: requestId } });
  if (!req) return { ok: false, error: "Pengajuan tidak ditemukan." };
  // EXPIRED tetap boleh: tambahan bayar yang mulai sebelum batas 24 jam dan
  // lunas sesudahnya tetap dihormati (uangnya sudah masuk).
  if (req.status === "COMPLETED" || req.status === "REJECTED" || req.status === "CANCELLED") {
    return { ok: false, error: "Pengajuan ini sudah selesai/ditolak/dibatalkan." };
  }
  // Kunci paket: tanda hadir, booking, dan pembatalan antre di belakang ini.
  await tx.$executeRaw`SELECT 1 FROM "Package" WHERE id = ${req.packageId} FOR UPDATE`;
  const pkg = await tx.package.findUniqueOrThrow({ where: { id: req.packageId } });
  if (pkg.coachId !== req.fromCoachId || pkg.poolPrice == null || pkg.coachPrice == null || pkg.serviceFee == null) {
    return { ok: false, error: "Paket ini sudah tidak bisa diganti coach-nya." };
  }
  if (pkg.status !== "ACTIVE" || (pkg.expiredDate && pkg.expiredDate < now)) {
    return { ok: false, error: "Paket ini sudah tidak aktif atau sudah kedaluwarsa." };
  }
  // Lihat submitCoachChange: paket tanpa pembayaran (pemberian admin) tidak ikut.
  if ((await tx.payment.count({ where: { packageId: pkg.id, status: "SUCCESS" } })) === 0) {
    return { ok: false, error: "Paket pemberian admin tidak bisa diganti coach lewat pengajuan." };
  }
  const toCoach = await tx.user.findFirst({
    where: { id: req.toCoachId, role: "COACH", isActive: true, coachProfile: { isActive: true }, poolAffiliations: { some: { poolId: pkg.poolId } } },
    select: { name: true },
  });
  if (!toCoach) return { ok: false, error: "Coach baru sudah tidak aktif atau tidak mengajar di kolam ini lagi." };
  if (req.newCoachPrice == null) return { ok: false, error: "Pengajuan belum disetujui." };

  // Harga coach baru = harga saat disetujui (bukan harga terkini), supaya
  // perubahan harga coach di tengah jalan tidak mengubah tagihan yang dibayar.
  const prices = { totalSesi: pkg.totalSesi, poolPrice: pkg.poolPrice, coachPrice: pkg.coachPrice, serviceFee: pkg.serviceFee };
  const newPrices = repricePackage(prices, req.newCoachPrice);
  const { perSession } = coachChangeAmount(prices, req.newCoachPrice, 1);
  const sessionsNow = await remainingSessions(tx, pkg.id, pkg.sisaSesi, now);
  const approvedSessions = req.sessions ?? sessionsNow;
  // Sisa sesi bertambah sejak disetujui (admin mengembalikan sesi): tambahan
  // yang dibayar tidak cukup untuk harga coach baru. Jangan selesaikan.
  if (perSession > 0 && sessionsNow > approvedSessions) {
    return { ok: false, error: "Sisa sesi berubah sejak disetujui. Ajukan ulang supaya selisihnya dihitung ulang." };
  }

  // Booking yang belum mulai dengan coach lama: dibatalkan, sesi kembali.
  const future = await tx.booking.findMany({
    where: { packageId: pkg.id, status: "BOOKED", attended: null, availability: { startTime: { gt: now } } },
    select: { id: true, availabilityId: true },
  });
  for (const b of future) {
    const c = await tx.booking.updateMany({
      where: { id: b.id, status: "BOOKED", attended: null },
      data: { status: "CANCELLED", cancelledBy: "ADMIN", cancelledAt: now },
    });
    if (c.count === 0) continue;
    await tx.availability.update({ where: { id: b.availabilityId }, data: { status: "AVAILABLE" } });
    await tx.package.update({ where: { id: pkg.id }, data: { sisaSesi: { increment: 1 } } });
  }

  await tx.package.update({
    where: { id: pkg.id },
    data: {
      coachId: req.toCoachId,
      coachPrice: newPrices.coachPrice,
      serviceFee: newPrices.serviceFee,
      name: `${pkg.isTrial ? "Sesi coba" : `Paket ${pkg.totalSesi} sesi`} · ${toCoach.name}`,
    },
  });

  // Uang ke saldo member: selisih coach lebih murah (dihitung dari sisa sesi
  // sekarang), atau kelebihan tambah bayar kalau sisa sesi berkurang sejak disetujui.
  let credited = 0;
  if (perSession < 0) credited = -perSession * sessionsNow;
  else if (perSession > 0 && sessionsNow < approvedSessions) credited = perSession * (approvedSessions - sessionsNow);
  if (credited > 0) {
    await creditMember(tx, req.memberId, credited, "COACH_CHANGE_CREDIT", {
      packageId: pkg.id,
      coachChangeRequestId: req.id,
      note: perSession < 0 ? "Selisih ganti ke coach lebih murah" : "Kelebihan tambah bayar ganti coach",
    });
  }
  await tx.coachChangeRequest.update({
    where: { id: req.id },
    data: { status: "COMPLETED", completedAt: now, sessions: sessionsNow, oldCoachPrice: pkg.coachPrice, oldServiceFee: pkg.serviceFee },
  });
  return { ok: true, credited };
}

// Pemberitahuan setelah transaksi selesai (gagal kirim tidak menggagalkan apa pun).
export async function notifyCoachChangeResult(requestId: string, result: "completed" | "refunded" | "expired" | "rejected") {
  const req = await prisma.coachChangeRequest.findUnique({
    where: { id: requestId },
    select: {
      memberId: true,
      fromCoachId: true,
      toCoachId: true,
      adminNote: true,
      fromCoach: { select: { name: true } },
      toCoach: { select: { name: true } },
      package: { select: { dependent: { select: { name: true } } } },
    },
  });
  if (!req) return;
  const who = req.package.dependent.name;
  const credit = await prisma.memberWalletTransaction.aggregate({
    where: { coachChangeRequestId: requestId, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  const credited = credit._sum.amount ?? 0;
  if (result === "completed") {
    await notifyUser(
      req.memberId,
      "Ganti coach selesai",
      `Paket ${who} sekarang dengan ${req.toCoach.name}.${credited > 0 ? ` ${formatRupiah(credited)} masuk ke saldomu.` : ""} Booking ulang jadwalnya ya.`,
      "/member/booking"
    );
    // Coach lama diberi tahu (keputusan Hadi 2 Okt).
    await notifyUser(req.fromCoachId, "Peserta pindah coach", `${who} pindah ke coach lain. Jadwal yang belum berjalan dengan ${who} sudah dibatalkan.`, "/coach/jadwal");
    await notifyUser(req.toCoachId, "Peserta baru", `${who} pindah ke kamu dan akan booking jadwal.`, "/coach/jadwal");
  } else if (result === "refunded") {
    await notifyUser(req.memberId, "Ganti coach gagal", `Ganti coach untuk ${who} tidak bisa diselesaikan, tambahan bayarmu masuk ke saldo. ${req.adminNote ?? ""}`.trim(), "/member/paket");
  } else if (result === "expired") {
    await notifyUser(req.memberId, "Ganti coach batal", `Tambahan bayar ganti coach untuk ${who} tidak selesai, pengajuan dibatalkan.`, "/member/paket");
  } else {
    await notifyUser(req.memberId, "Pengajuan ganti coach ditolak", `${req.adminNote ?? "Hubungi admin untuk penjelasan."}`, "/member/paket");
  }
}
