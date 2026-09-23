import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { sendPushToRole, sendPushToUser } from "@/lib/push";

// Best-effort: gagal kirim notifikasi tidak boleh menggagalkan pencairan.
export async function notifyAdminsWithdrawalRequested(requesterName: string, amount: number) {
  await sendPushToRole("ADMIN", {
    title: "Pengajuan pencairan baru",
    body: `${requesterName} mengajukan ${formatRupiah(amount)}`,
    url: "/admin/withdrawals",
  }).catch(() => {});
}

export async function notifyWithdrawalOutcome(withdrawalId: string, outcome: "PAID" | "FAILED") {
  try {
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      select: {
        amount: true,
        coachProfile: { select: { userId: true } },
        pool: { select: { ownerships: { select: { ownerId: true } } } },
      },
    });
    if (!request) return;

    const isCoach = !!request.coachProfile;
    const recipients = request.coachProfile
      ? [request.coachProfile.userId]
      : (request.pool?.ownerships.map((o) => o.ownerId) ?? []);
    const url = isCoach ? "/coach/saldo" : "/pool/saldo";
    const message =
      outcome === "PAID"
        ? { title: "Pencairan dibayar", body: `${formatRupiah(request.amount)} sudah ditransfer ke rekening kamu.` }
        : { title: "Pencairan tidak diproses", body: `${formatRupiah(request.amount)} sudah dikembalikan ke saldo kamu.` };

    await Promise.all(recipients.map((userId) => sendPushToUser(userId, { ...message, url })));
  } catch {
    // diam: notifikasi bukan bagian dari transaksi uangnya
  }
}
