import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import SaldoView from "@/components/saldo-view";
import { formatRupiah } from "@/lib/format";
import { updateBankInfo, requestWithdrawal } from "./actions";
import { openNullable, openSecret } from "@/lib/secret-box";
import { releaseDueCommissions } from "@/lib/affiliate";

export const metadata = { title: "Saldo | Swim Private Hub" };

export default async function PoolSaldoPage() {
  const session = await requireRole("POOL_OWNER");
  // Komisi afiliasi yang jatuh tempo masuk saldo sebelum saldo dibaca.
  await releaseDueCommissions();

  // 1 user sekarang bisa punya banyak kolam (PoolOwnership, many-to-many)
  // -- render tiap kolam sebagai section sendiri, bukan pilih 1 kolam
  // implisit kayak dulu (findFirst). Action di-bind per poolId biar
  // form "Cairkan"/"Simpan Rekening" di tiap section nembak kolam yang
  // bener, gak ketuker.
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      walletBalance: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
      // Koreksi saldo dari admin (baris tanpa sesi).
      walletTransactions: {
        where: { type: "SESSION_REVENUE", bookingId: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, note: true, createdAt: true },
      },
      affiliateCommissions: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, status: true, releaseAt: true, releasedAt: true },
      },
      withdrawalRequests: {
        orderBy: { requestedAt: "desc" },
        select: { id: true, amount: true, status: true, requestedAt: true, processedAt: true, failureReason: true, bankName: true, bankAccountNumber: true, bankAccountName: true, midtransReferenceId: true, transferReference: true },
      },
    },
  });

  // Potongan PPh 0,5% (paket model harga-dari-coach), disetor SPH atas nama kolam.
  const pph = await prisma.walletTransaction.groupBy({
    by: ["poolId"],
    where: { type: "PPH_WITHHELD", poolId: { in: pools.map((p) => p.id) } },
    _sum: { amount: true },
  });
  const pphOf = (poolId: string) => -(pph.find((x) => x.poolId === poolId)?._sum.amount ?? 0);

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum terhubung ke kolam mana pun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Saldo</h1>
      <p className="mb-6 text-sm text-text-muted">Saldo & penarikan tiap kolam kamu.</p>
      <div className="flex flex-col gap-10">
        {pools.map((pool) => (
          <div key={pool.id}>
            <h2 className="mb-3 text-lg font-semibold text-text">{pool.name}</h2>
            {pphOf(pool.id) > 0 && (
              <p className="mb-3 text-sm text-text-muted">
                Potongan PPh 0,5% sejauh ini: {formatRupiah(pphOf(pool.id))} (sudah dikurangkan dari saldo, disetor SPH atas nama kolam).
              </p>
            )}
            <SaldoView
              walletBalance={pool.walletBalance}
              bankName={pool.bankName}
              bankAccountNumber={openNullable(pool.bankAccountNumber)}
              bankAccountName={pool.bankAccountName}
              withdrawals={pool.withdrawalRequests.map((w) => ({
                ...w,
                bankAccountNumber: openSecret(w.bankAccountNumber),
                requestedAt: w.requestedAt.toISOString(),
          processedAt: w.processedAt?.toISOString() ?? null,
              }))}
              adjustments={pool.walletTransactions.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
              commissions={pool.affiliateCommissions.map((c) => ({ ...c, releaseAt: c.releaseAt?.toISOString() ?? null, releasedAt: c.releasedAt?.toISOString() ?? null }))}
              updateBankInfoAction={updateBankInfo.bind(null, pool.id)}
              requestWithdrawalAction={requestWithdrawal.bind(null, pool.id)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
