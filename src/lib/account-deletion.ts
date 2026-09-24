import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";

// Hapus akun member (keputusan Hadi 25 Sep): member mengajukan dari Profil,
// admin menyetujui. "Hapus" = identitas dianonimkan -- nama, HP, email, nama
// peserta, IP/rujukan pendaftaran. Riwayat booking/pembayaran/saldo dan arsip
// chat TETAP disimpan (kewajiban catatan transaksi + penyelesaian masalah).

export const ANONYMIZED_NAME = "Pengguna dihapus";
export const ANONYMIZED_DEPENDENT_NAME = "Peserta dihapus";

export class AccountDeletionError extends Error {}

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
  const [upcomingBookings, usablePackages] = await Promise.all([
    prisma.booking.count({ where: { memberId: userId, status: "BOOKED", attended: null, availability: { startTime: { gt: now } } } }),
    prisma.package.findMany({
      where: { memberId: userId, status: "ACTIVE", sisaSesi: { gt: 0 }, OR: [{ expiredDate: null }, { expiredDate: { gte: now } }] },
      select: { sisaSesi: true },
    }),
  ]);
  return { upcomingBookings, remainingSessions: usablePackages.reduce((n, p) => n + p.sisaSesi, 0) };
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
    if (!u) throw new AccountDeletionError("Pengguna tidak ditemukan.");
    if (u.role !== "MEMBER") throw new AccountDeletionError("Hanya akun member yang bisa dihapus lewat fitur ini.");
    if (u.anonymizedAt) throw new AccountDeletionError("Akun ini sudah dihapus.");
    if (!u.deletionRequestedAt) throw new AccountDeletionError("Member ini tidak mengajukan penghapusan akun.");

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
    await tx.dependent.updateMany({ where: { memberId: userId }, data: { name: ANONYMIZED_DEPENDENT_NAME, isActive: false } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
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
  return { cancelledBookings: cancelled };
}
