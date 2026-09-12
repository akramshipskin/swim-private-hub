import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import SaldoView from "@/components/saldo-view";
import { updateBankInfo, requestWithdrawal } from "./actions";

export default async function PoolSaldoPage() {
  const session = await requireRole("POOL_OWNER");

  const pool = await prisma.pool.findFirst({
    where: { ownerUserId: session.user.id },
    select: {
      id: true,
      name: true,
      walletBalance: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
      withdrawalRequests: {
        orderBy: { requestedAt: "desc" },
        select: { id: true, amount: true, status: true, requestedAt: true, failureReason: true },
      },
    },
  });

  if (!pool) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum ke-link ke kolam manapun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">{pool.name}</h1>
      <p className="mb-6 text-sm text-text-muted">Saldo & pencairan kolam kamu.</p>
      <SaldoView
        walletBalance={pool.walletBalance}
        bankName={pool.bankName}
        bankAccountNumber={pool.bankAccountNumber}
        bankAccountName={pool.bankAccountName}
        withdrawals={pool.withdrawalRequests.map((w) => ({
          ...w,
          requestedAt: w.requestedAt.toISOString(),
        }))}
        updateBankInfoAction={updateBankInfo}
        requestWithdrawalAction={requestWithdrawal}
      />
    </main>
  );
}
