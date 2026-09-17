import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import SaldoView from "@/components/saldo-view";
import { updateBankInfo, requestWithdrawal } from "./actions";

export default async function PoolSaldoPage() {
  const session = await requireRole("POOL_OWNER");

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
      withdrawalRequests: {
        orderBy: { requestedAt: "desc" },
        select: { id: true, amount: true, status: true, requestedAt: true, processedAt: true, failureReason: true, bankName: true, bankAccountNumber: true, bankAccountName: true, midtransReferenceId: true },
      },
    },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum ke-link ke kolam manapun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Saldo Kolam</h1>
      <p className="mb-6 text-sm text-text-muted">Saldo & pencairan tiap kolam kamu.</p>
      <div className="flex flex-col gap-10">
        {pools.map((pool) => (
          <div key={pool.id}>
            <h2 className="mb-3 text-lg font-semibold text-text">{pool.name}</h2>
            <SaldoView
              walletBalance={pool.walletBalance}
              bankName={pool.bankName}
              bankAccountNumber={pool.bankAccountNumber}
              bankAccountName={pool.bankAccountName}
              withdrawals={pool.withdrawalRequests.map((w) => ({
                ...w,
                requestedAt: w.requestedAt.toISOString(),
          processedAt: w.processedAt?.toISOString() ?? null,
              }))}
              updateBankInfoAction={updateBankInfo.bind(null, pool.id)}
              requestWithdrawalAction={requestWithdrawal.bind(null, pool.id)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
