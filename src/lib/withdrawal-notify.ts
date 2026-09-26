import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { sendPushToRole, sendPushToUser, sendPushToUsers } from "@/lib/push";

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

// Koreksi saldo oleh admin (src/lib/wallet-adjustment.ts): kabari coach /
// semua pemilik kolam, isinya nominal + alasan. Best-effort seperti di atas.
export async function notifyWalletAdjustment(
  target: { poolId: string } | { coachProfileId: string },
  amount: number,
  reason: string
) {
  try {
    const recipients =
      "coachProfileId" in target
        ? [(await prisma.coachProfile.findUnique({ where: { id: target.coachProfileId }, select: { userId: true } }))?.userId]
        : (await prisma.poolOwnership.findMany({ where: { poolId: target.poolId }, select: { ownerId: true } })).map((o) => o.ownerId);
    const ids = recipients.filter((id): id is string => !!id);
    if (ids.length === 0) return;
    const signed = `${amount < 0 ? "−" : "+"}${formatRupiah(Math.abs(amount))}`;
    const note = reason.length > 100 ? `${reason.slice(0, 99)}…` : reason;
    await sendPushToUsers(ids, {
      title: amount < 0 ? "Saldo kamu dikurangi admin" : "Saldo kamu ditambah admin",
      body: `${signed} · ${note}`,
      url: "coachProfileId" in target ? "/coach/saldo" : "/pool/saldo",
    });
  } catch {
    // diam: koreksinya sudah tercatat, notifikasi hanya pelengkap
  }
}
