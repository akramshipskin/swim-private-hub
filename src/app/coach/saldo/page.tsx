import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import SaldoView from "@/components/saldo-view";
import { updateBankInfo, requestWithdrawal } from "./actions";

export default async function CoachSaldoPage() {
  const session = await requireRole("COACH");

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
    select: {
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

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Profil coach gak ditemukan. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl [&>*]:max-w-lg px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Saldo Saya</h1>
      <p className="mb-6 text-sm text-text-muted">
        Bagian kamu dari tiap sesi yang ditandai Hadir.
      </p>
      <SaldoView
        walletBalance={profile.walletBalance}
        bankName={profile.bankName}
        bankAccountNumber={profile.bankAccountNumber}
        bankAccountName={profile.bankAccountName}
        withdrawals={profile.withdrawalRequests.map((w) => ({
          ...w,
          requestedAt: w.requestedAt.toISOString(),
        }))}
        updateBankInfoAction={updateBankInfo}
        requestWithdrawalAction={requestWithdrawal}
      />
    </main>
  );
}
