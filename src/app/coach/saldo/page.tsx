import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import SaldoView from "@/components/saldo-view";
import { formatRupiah } from "@/lib/format";
import { updateBankInfo, requestWithdrawal } from "./actions";
import { openNullable, openSecret } from "@/lib/secret-box";
import Link from "next/link";
import { getOverdueParticipants } from "@/lib/milestone-hold";
import { MILESTONE_NOTE_EVERY_SESSIONS } from "@/lib/policy";
import { releaseDueCommissions } from "@/lib/affiliate";

export const metadata = { title: "Saldo Coach | Swim Private Hub" };

export default async function CoachSaldoPage() {
  const session = await requireRole("COACH");
  // Komisi afiliasi yang jatuh tempo masuk saldo sebelum saldo dibaca.
  await releaseDueCommissions();

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      walletBalance: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
      // Koreksi saldo dari admin (baris tanpa sesi).
      walletTransactions: {
        where: { type: "SESSION_PAYOUT", bookingId: null },
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

  const overdue = await getOverdueParticipants(session.user.id);
  // Potongan PPh 0,5% (paket model harga-dari-coach), disetor SPH atas nama coach.
  const pph = -((
    await prisma.walletTransaction.aggregate({
      where: { type: "PPH_WITHHELD", coachProfile: { userId: session.user.id } },
      _sum: { amount: true },
    })
  )._sum.amount ?? 0);

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Profil coach tidak ditemukan. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Saldo Saya</h1>
      <p className="mb-6 text-sm text-text-muted">
        Bagian kamu dari tiap sesi yang ditandai Hadir (penuh) atau Tidak Hadir karena peserta tidak datang (50%).
        {pph > 0 && <> Potongan PPh 0,5% sejauh ini: {formatRupiah(pph)} (sudah dikurangkan dari saldo, disetor SPH atas namamu).</>}
      </p>
      {overdue.length > 0 && (
        <div role="alert" className="mb-6 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          <p className="font-semibold">Pencairan ditahan sampai catatan milestone diisi</p>
          <p className="mt-1">
            Peserta berikut sudah {MILESTONE_NOTE_EVERY_SESSIONS} sesi Hadir atau lebih tanpa catatan darimu. Saldo tetap
            tersimpan, hanya belum bisa dicairkan. Pengajuan yang sudah masuk tetap diproses.
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {overdue.map((o) => (
              <li key={o.dependentId}>
                <Link href={`/milestone/${o.dependentId}`} className="font-medium underline">
                  {o.name}
                </Link>{" "}
                · {o.sessionsWithoutNote} sesi tanpa catatan
              </li>
            ))}
          </ul>
        </div>
      )}
      <SaldoView
        walletBalance={profile.walletBalance}
        bankName={profile.bankName}
        bankAccountNumber={openNullable(profile.bankAccountNumber)}
        bankAccountName={profile.bankAccountName}
        withdrawals={profile.withdrawalRequests.map((w) => ({
          ...w,
          bankAccountNumber: openSecret(w.bankAccountNumber),
          requestedAt: w.requestedAt.toISOString(),
          processedAt: w.processedAt?.toISOString() ?? null,
        }))}
        adjustments={profile.walletTransactions.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        commissions={profile.affiliateCommissions.map((c) => ({ ...c, releaseAt: c.releaseAt?.toISOString() ?? null, releasedAt: c.releasedAt?.toISOString() ?? null }))}
        updateBankInfoAction={updateBankInfo}
        requestWithdrawalAction={requestWithdrawal}
      />
    </main>
  );
}
