import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { STALE_PAYMENT_MS } from "@/lib/stale-payments";

// Hapus akun member (keputusan Hadi 25 Sep): member mengajukan dari Profil,
// admin menyetujui. "Hapus" = identitas dianonimkan -- nama, HP, email, nama
// peserta, IP/rujukan pendaftaran. Riwayat booking/pembayaran/saldo dan arsip
// chat TETAP disimpan (kewajiban catatan transaksi + penyelesaian masalah).

export const ANONYMIZED_NAME = "Pengguna dihapus";
export const ANONYMIZED_DEPENDENT_NAME = "Peserta dihapus";
export const ANONYMIZED_NOTE = "(catatan dihapus)";

export class AccountDeletionError extends Error {}

// Pembayaran yang masih berjalan = Midtrans "Menunggu" yang belum lewat batas
// bayar (termasuk tambahan bayar ganti coach). Menyetujui hapus akun saat itu
// membuat uang yang sedang di jalan jatuh ke akun yang sudah dianonimkan
// (Hadi 6 Okt, 1A: diblokir).
export const PENDING_PAYMENT_DELETION_ERROR =
  "Masih ada pembayaran yang menunggu dibayar. Tunggu sampai lunas atau waktu bayarnya habis (sekitar 24 jam), lalu setujui lagi.";

function inFlightPaymentsWhere(memberId: string, now: Date) {
  return {
    status: "PENDING" as const,
    createdAt: { gte: new Date(now.getTime() - STALE_PAYMENT_MS) },
    package: { memberId },
  };
}

export async function requestAccountDeletion(userId: string) {
  const res = await prisma.user.updateMany({
    where: { id: userId, role: "MEMBER", anonymizedAt: null, deletionRequestedAt: null },
    data: { deletionRequestedAt: new Date() },
  });
  return res.count > 0;
}

export async function cancelAccountDeletion(userId: string) {
  const res = await prisma.user.updateMany({
    where: { id: userId, anonymizedAt: null, deletionRequestedAt: { not: null } },
    data: { deletionRequestedAt: null },
  });
  return res.count > 0;
}

// Ringkasan untuk layar persetujuan admin: apa yang ikut hilang.
export async function deletionImpact(userId: string) {
  const now = new Date();
  const [upcomingBookings, usablePackages, user, pendingPayments] = await Promise.all([
    prisma.booking.count({ where: { memberId: userId, status: "BOOKED", attended: null, availability: { startTime: { gt: now } } } }),
    prisma.package.findMany({
      where: { memberId: userId, status: "ACTIVE", sisaSesi: { gt: 0 }, OR: [{ expiredDate: null }, { expiredDate: { gte: now } }] },
      select: { sisaSesi: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { memberBalance: true } }),
    prisma.payment.count({ where: inFlightPaymentsWhere(userId, now) }),
  ]);
  return {
    upcomingBookings,
    pendingPayments,
    remainingSessions: usablePackages.reduce((n, p) => n + p.sisaSesi, 0),
    // Hadi 2 Okt: saldo member bisa dipakai sampai habis lewat admin sebelum
    // akun ditutup; kalau member tetap minta dihapus, sisa saldo hangus (tetap
    // tercatat di buku besar akun yang dianonimkan, tidak bisa dipakai lagi).
    memberBalance: user?.memberBalance ?? 0,
  };
}

export async function anonymizeMember(userId: string) {
  // Password acak yang tidak pernah diketahui siapa pun (akun tidak bisa dipakai lagi).
  const deadHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  await prisma.$transaction(async (tx) => {
    // Kunci baris user: booking yang sedang berjalan (FOR SHARE di
    // /api/booking) selesai dulu, jadi pembatalan di bawah ikut mencakupnya;
    // booking sesudahnya ditolak karena akun sudah nonaktif.
    const [u] = await tx.$queryRaw<{ role: string; deletionRequestedAt: Date | null; anonymizedAt: Date | null }[]>`
      SELECT role, "deletionRequestedAt", "anonymizedAt" FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (!u) throw new AccountDeletionError("Akun tidak ditemukan.");
    if (u.role !== "MEMBER") throw new AccountDeletionError("Hanya akun member yang bisa dihapus lewat fitur ini.");
    if (u.anonymizedAt) throw new AccountDeletionError("Akun ini sudah dihapus.");
    if (!u.deletionRequestedAt) throw new AccountDeletionError("Member ini tidak mengajukan penghapusan akun.");
    // Pembayaran BARU sudah ditolak sejak pengajuan hapus akun (checkout, ganti
    // coach); yang tersisa hanya yang dimulai sebelum pengajuan. Dicek di dalam
    // kunci akun, sebelum apa pun diubah.
    if ((await tx.payment.count({ where: inFlightPaymentsWhere(userId, new Date()) })) > 0) {
      throw new AccountDeletionError(PENDING_PAYMENT_DELETION_ERROR);
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        name: ANONYMIZED_NAME,
        phone: null,
        email: null,
        passwordHash: deadHash,
        isActive: false,
        mustChangePassword: false,
        sessionVersion: { increment: 1 },
        registeredIp: null,
        registeredReferer: null,
        totpSecret: null,
        totpEnabledAt: null,
        totpLastStep: null,
        anonymizedAt: new Date(),
      },
    });
    // Tanggal lahir peserta ikut dihapus (data pribadi anak), dan isi catatan
    // milestone dikosongkan karena bisa memuat nama/detail anak. Keterampilan yang
    // tercapai & sertifikat level tidak memuat identitas, jadi dibiarkan.
    await tx.dependent.updateMany({ where: { memberId: userId }, data: { name: ANONYMIZED_DEPENDENT_NAME, isActive: false, birthDate: null } });
    await tx.milestoneNote.updateMany({ where: { dependent: { memberId: userId } }, data: { note: ANONYMIZED_NOTE } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    // Riwayat lonceng memuat nama/nominal sesi: hilang bersama akunnya.
    await tx.inAppNotification.deleteMany({ where: { userId } });
    // Cookie pelacak iklan Meta yang tersimpan saat checkout.
    await tx.payment.updateMany({ where: { package: { memberId: userId }, NOT: { metaTracking: { equals: Prisma.DbNull } } }, data: { metaTracking: Prisma.DbNull } });
  });

  // Booking yang belum dimulai dibatalkan sebagai pembatalan admin (slot coach
  // kembali terbuka). Sisa sesi paket ikut hangus bersama akunnya.
  const upcoming = await prisma.booking.findMany({
    where: { memberId: userId, status: "BOOKED", attended: null, availability: { startTime: { gt: new Date() } } },
    select: { id: true },
  });
  let cancelled = 0;
  for (const b of upcoming) {
    try {
      await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } });
      cancelled++;
    } catch (err) {
      if (!(err instanceof CancelError)) throw err;
    }
  }
  // Pembatalan di atas mengirim kabar ke akun ini dan ikut tercatat di lonceng;
  // hapus lagi supaya akun yang sudah dianonimkan tidak menyisakan riwayat.
  if (cancelled > 0) await prisma.inAppNotification.deleteMany({ where: { userId } });
  return { cancelledBookings: cancelled };
}
