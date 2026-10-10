import { prisma } from "@/lib/prisma";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { creditMember } from "@/lib/member-wallet";
import { notifyUser } from "@/lib/notify";
import { formatRupiah } from "@/lib/format";
import { AFFILIATE_CLAWBACK_NOTE } from "@/lib/affiliate";

// Kembalikan Dana (Hadi 10 Okt, TRD T1). Transfer uang tunai tetap manual lewat
// dasbor Midtrans; di sini sistem:
//   1. membatalkan booking yang belum mulai (sesi tidak dibayarkan ke kolam/coach),
//   2. mengakhiri paket (sisa sesi 0) dan mencatat jumlah refund,
//   3. mengembalikan bagian yang dulu dibayar dari saldo ke saldo member,
//   4. membatalkan komisi afiliasi yang berasal dari paket ini; yang sudah cair
//      ditarik balik dari saldo pemilik kode (boleh minus, Hadi 11 Okt).
// Sesi yang sudah berjalan tetap milik kolam/coach; Tandai Hadir untuk sesi
// lampau yang belum ditandai ditolak setelah paket direfund.

export class RefundError extends Error {}

export async function refundSummary(packageId: string) {
  const [pkg, cash, changes] = await Promise.all([
    prisma.package.findUnique({ where: { id: packageId }, select: { memberId: true, status: true, saldoUsed: true, refundedAt: true, refundCash: true, refundSaldo: true } }),
    // Tambah bayar ganti coach yang gagal diselesaikan sudah dikembalikan ke
    // saldo member (webhook), jadi tidak dihitung lagi sebagai uang tunai paket.
    prisma.payment.aggregate({
      where: { packageId, status: "SUCCESS", OR: [{ coachChangeRequestId: null }, { coachChangeRequest: { status: "COMPLETED" } }] },
      _sum: { amount: true },
    }),
    prisma.coachChangeRequest.aggregate({ where: { packageId, status: "COMPLETED" }, _sum: { saldoUsed: true } }),
  ]);
  if (!pkg) return null;
  return {
    memberId: pkg.memberId,
    status: pkg.status,
    cashPaid: cash._sum.amount ?? 0,
    saldoPaid: pkg.saldoUsed + (changes._sum.saldoUsed ?? 0),
    refundedAt: pkg.refundedAt,
    refundCash: pkg.refundCash,
    refundSaldo: pkg.refundSaldo,
  };
}

export async function refundPackage({
  packageId,
  adminId,
  cash,
  saldo,
  reference,
  note,
}: {
  packageId: string;
  adminId: string;
  cash: number;
  saldo: number;
  reference: string;
  note: string;
}) {
  if (!Number.isInteger(cash) || cash < 0 || !Number.isInteger(saldo) || saldo < 0) throw new RefundError("Nominal tidak valid.");
  if (cash === 0 && saldo === 0) throw new RefundError("Isi nominal yang dikembalikan.");
  if (cash > 0 && reference.trim().length < 4) throw new RefundError("Isi nomor referensi refund dari Midtrans (minimal 4 karakter).");
  if (note.trim().length < 5) throw new RefundError("Tulis alasan pengembalian (minimal 5 karakter).");
  if (note.trim().length > 300) throw new RefundError("Alasan maksimal 300 karakter.");
  if (reference.trim().length > 100) throw new RefundError("Nomor referensi maksimal 100 karakter.");
  const summary = await refundSummary(packageId);
  if (!summary) throw new RefundError("Paket tidak ditemukan.");
  if (summary.refundedAt) throw new RefundError("Dana paket ini sudah pernah dikembalikan.");
  // Syarat dicek SEBELUM booking dibatalkan: refund yang pasti gagal tidak
  // boleh menghapus jadwal member.
  if (summary.status === "PENDING_PAYMENT") throw new RefundError("Paket ini belum dibayar.");
  if (summary.cashPaid + summary.saldoPaid === 0) throw new RefundError("Paket ini tidak punya pembayaran (paket pemberian admin).");
  if (cash > summary.cashPaid) throw new RefundError(`Uang tunai maksimal ${formatRupiah(summary.cashPaid)} (yang dibayar lewat Midtrans).`);
  if (saldo > summary.saldoPaid) throw new RefundError(`Saldo maksimal ${formatRupiah(summary.saldoPaid)} (yang dibayar dari saldo).`);

  // Booking mendatang dibatalkan dulu (pembatalan admin; slot kembali terbuka).
  await cancelUpcoming(packageId);

  const memberId = await prisma.$transaction(async (tx) => {
    // Urutan kunci sama dengan booking dan ganti coach: akun member dulu, baru
    // paket (mencegah saling tunggu). Kunci paket menahan booking baru dan
    // membuat dua klik admin tidak menghasilkan dua refund.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${summary.memberId} FOR UPDATE`;
    const [row] = await tx.$queryRaw<{ memberId: string; refundedAt: Date | null; status: string }[]>`
      SELECT "memberId", "refundedAt", status::text AS status FROM "Package" WHERE id = ${packageId} FOR UPDATE`;
    if (!row) throw new RefundError("Paket tidak ditemukan.");
    if (row.refundedAt) throw new RefundError("Dana paket ini sudah pernah dikembalikan.");
    if (row.status === "PENDING_PAYMENT") throw new RefundError("Paket ini belum dibayar.");
    const paid = await tx.payment.count({ where: { packageId, status: "SUCCESS" } });
    if (paid === 0) throw new RefundError("Paket ini tidak punya pembayaran (paket pemberian admin).");

    const now = new Date();
    await tx.package.update({
      where: { id: packageId },
      data: { status: "EXPIRED", sisaSesi: 0, refundedAt: now, refundCash: cash, refundSaldo: saldo, refundReference: reference.trim() || null, refundNote: note.trim(), refundedById: adminId },
    });
    if (saldo > 0) await creditMember(tx, row.memberId, saldo, "ADMIN_REFUND", { packageId, note: "Dana paket dikembalikan admin" });
    // Pengajuan ganti coach yang belum selesai ikut dibatalkan.
    await tx.coachChangeRequest.updateMany({ where: { packageId, status: { in: ["PENDING", "AWAITING_PAYMENT"] } }, data: { status: "CANCELLED", adminNote: "Dana paket dikembalikan" } });

    // Komisi afiliasi yang dasarnya pembayaran paket ini (Hadi 11 Okt, 1A).
    const paymentIds = (await tx.payment.findMany({ where: { packageId }, select: { id: true } })).map((p) => p.id);
    // Kunci yang sama dengan pencairan komisi & penarikan SPH: status komisi
    // tidak berubah di tengah jalan.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('platform-withdrawal'))`;
    const commission = await tx.affiliateCommission.findFirst({
      where: { memberId: row.memberId, paymentId: { in: paymentIds }, status: { not: "VOID" } },
      select: { id: true, status: true, amount: true, coachProfileId: true, poolId: true },
    });
    if (commission) {
      await tx.affiliateCommission.update({ where: { id: commission.id }, data: { status: "VOID", releaseAt: null } });
      if (commission.status === "RELEASED") {
        if (commission.coachProfileId) {
          await tx.coachProfile.update({ where: { id: commission.coachProfileId }, data: { walletBalance: { decrement: commission.amount } } });
        } else if (commission.poolId) {
          await tx.pool.update({ where: { id: commission.poolId }, data: { walletBalance: { decrement: commission.amount } } });
        }
        await tx.walletTransaction.createMany({
          data: [
            { type: "AFFILIATE_COMMISSION", coachProfileId: commission.coachProfileId, poolId: commission.poolId, amount: -commission.amount, note: "Komisi afiliasi ditarik (dana paket dikembalikan)" },
            { type: "PLATFORM_REVENUE", amount: commission.amount, note: AFFILIATE_CLAWBACK_NOTE },
          ],
        });
      }
    }
    return row.memberId;
  });

  // Putaran kedua: booking yang sempat masuk di antara pembatalan dan kunci paket.
  // Pembatalan mengembalikan sisa sesi, jadi dikosongkan lagi sesudahnya.
  if (await cancelUpcoming(packageId)) {
    await prisma.package.updateMany({ where: { id: packageId, refundedAt: { not: null } }, data: { sisaSesi: 0 } });
  }

  await notifyUser(
    memberId,
    "Dana paket dikembalikan",
    [cash > 0 ? `${formatRupiah(cash)} dikembalikan ke metode pembayaran asal` : "", saldo > 0 ? `${formatRupiah(saldo)} dikembalikan ke saldo` : ""].filter(Boolean).join(" dan ") + ". Paketnya sudah diakhiri.",
    "/member/pembayaran",
  );
}

async function cancelUpcoming(packageId: string) {
  const upcoming = await prisma.booking.findMany({
    where: { packageId, status: "BOOKED", attended: null, availability: { startTime: { gt: new Date() } } },
    select: { id: true },
  });
  for (const b of upcoming) {
    try {
      await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } });
    } catch (err) {
      if (!(err instanceof CancelError)) throw err;
    }
  }
  return upcoming.length;
}
