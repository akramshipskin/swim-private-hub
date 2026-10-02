// Pembayaran Midtrans yang tidak pernah dikabari (member tidak memilih metode
// bayar, Snap kedaluwarsa tanpa notifikasi): lewat batas bayar (24 jam) dianggap
// kedaluwarsa supaya saldo member yang terpakai kembali dan pengajuan ganti
// coach tidak tersangkut. Kalau ternyata lunas belakangan, webhook tetap
// mengaktifkan paket / menyelesaikan ganti coach dan menarik saldo lagi.
import { prisma } from "@/lib/prisma";
import { refundMemberBalanceOnce } from "@/lib/member-wallet";
import { PAYMENT_WINDOW_MS } from "@/lib/policy";

export const STALE_PAYMENT_MS = PAYMENT_WINDOW_MS;

export async function releaseStalePayments(now = new Date()) {
  const stale = await prisma.payment.findMany({
    // Hanya pembayaran yang menahan saldo member atau pengajuan ganti coach;
    // pembayaran lama lainnya tidak diubah (data historis).
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(now.getTime() - STALE_PAYMENT_MS) },
      OR: [{ coachChangeRequestId: { not: null } }, { package: { saldoUsed: { gt: 0 } } }],
    },
    select: { id: true },
    take: 50,
  });
  for (const { id } of stale) {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({ where: { id, status: "PENDING" }, data: { status: "EXPIRED" } });
      if (claim.count === 0) return;
      const pay = await tx.payment.findUniqueOrThrow({
        where: { id },
        select: { packageId: true, coachChangeRequestId: true, package: { select: { memberId: true, saldoUsed: true } }, coachChangeRequest: { select: { saldoUsed: true } } },
      });
      if (pay.coachChangeRequestId) {
        await tx.coachChangeRequest.updateMany({ where: { id: pay.coachChangeRequestId, status: "AWAITING_PAYMENT" }, data: { status: "EXPIRED" } });
        await refundMemberBalanceOnce(tx, pay.package.memberId, pay.coachChangeRequest?.saldoUsed ?? 0, { packageId: pay.packageId, coachChangeRequestId: pay.coachChangeRequestId });
      } else {
        await tx.package.updateMany({ where: { id: pay.packageId, status: "PENDING_PAYMENT" }, data: { status: "EXPIRED" } });
        await refundMemberBalanceOnce(tx, pay.package.memberId, pay.package.saldoUsed, { packageId: pay.packageId });
      }
    });
  }
}
