// Pembayaran Midtrans yang tidak pernah dikabari (member tidak memilih metode
// bayar, Snap kedaluwarsa tanpa notifikasi): lewat batas bayar (24 jam) dianggap
// kedaluwarsa supaya saldo member yang terpakai kembali dan pengajuan ganti
// coach tidak tersangkut. Kalau ternyata lunas belakangan, webhook tetap
// mengaktifkan paket / menyelesaikan ganti coach dan menarik saldo lagi.
import { prisma } from "@/lib/prisma";
import { refundMemberBalanceOnce } from "@/lib/member-wallet";
import { PAYMENT_WINDOW_MS } from "@/lib/policy";

// Jeda aman 15 menit di atas batas bayar: transaksi Midtrans dibuat beberapa
// detik setelah Payment, dan notifikasi lunas bisa datang sedikit terlambat.
// Batas yang dilihat member tetap 24 jam (expiry Snap).
export const STALE_PAYMENT_MS = PAYMENT_WINDOW_MS + 15 * 60 * 1000;

const BATCH = 50;

export async function releaseStalePayments(now = new Date()) {
  let released = 0;
  // Diambil per 50 sampai habis (TRD T2): pemeriksa hanya jalan sekali sehari,
  // dan pembayaran yang sengaja ditahan (lunas tapi jumlahnya beda) tidak boleh
  // menghabiskan jatah putaran. Kursor = baris terakhir putaran sebelumnya.
  // Lanjut setelah baris terakhir (createdAt, id) putaran sebelumnya. Bukan
  // kursor Prisma: baris kursor biasanya sudah berubah EXPIRED dan tidak lagi
  // cocok dengan filter, sehingga posisinya bisa melompati satu baris.
  let after: { createdAt: Date; id: string } | undefined;
  const cutoff = new Date(now.getTime() - STALE_PAYMENT_MS);
  for (;;) {
    const stale = await prisma.payment.findMany({
      // Semua pembayaran "Menunggu" yang lewat batas (Hadi 6 Okt, 2A): yang tidak
      // menahan saldo ikut kedaluwarsa, supaya paket "Menunggu Pembayaran" tidak
      // menumpuk. Paling lama dulu.
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
        ...(after ? { OR: [{ createdAt: { gt: after.createdAt } }, { createdAt: after.createdAt, id: { gt: after.id } }] } : {}),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, createdAt: true, rawWebhookPayload: true },
      take: BATCH,
    });
    released += await releaseBatch(stale);
    if (stale.length < BATCH) return released;
    const last = stale[stale.length - 1];
    after = { createdAt: last.createdAt, id: last.id };
  }
}

async function releaseBatch(stale: { id: string; rawWebhookPayload: unknown }[]) {
  let released = 0;
  for (const { id, rawWebhookPayload } of stale) {
    // Midtrans sudah mengabari lunas tetapi jumlahnya tidak cocok: webhook sengaja
    // menahannya PENDING untuk dicek admin. Jangan dikedaluwarsakan diam-diam.
    const status = (rawWebhookPayload as { transaction_status?: string } | null)?.transaction_status;
    if (status === "settlement" || status === "capture") continue;
    // Satu baris yang gagal tidak boleh menahan baris lain di putaran ini.
    const done = await prisma.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({ where: { id, status: "PENDING" }, data: { status: "EXPIRED" } });
      if (claim.count === 0) return false;
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
      return true;
    }).catch((err: unknown) => {
      console.error(`[stale-payments] gagal mengedaluwarsakan pembayaran ${id}: ${(err as Error)?.message ?? "error"}`);
      return false;
    });
    if (done) released++;
  }
  return released;
}
