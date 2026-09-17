import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import WithdrawalRow from "./withdrawal-row";

export default async function AdminWithdrawalsPage() {
  await requireRole("ADMIN");

  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      pool: { select: { name: true } },
      coachProfile: { select: { user: { select: { name: true } } } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl [&>*]:max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Pencairan Saldo</h1>
      <p className="mt-1 text-sm text-text-muted">
        Pengajuan cairin dari kolam & coach. Belum ada Midtrans Iris terpasang -- transfer
        manual lewat m-banking, lalu tandai dibayar.
      </p>

      {requests.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">
            Belum ada pengajuan pencairan.
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {requests.map((w) => (
            <WithdrawalRow
              key={w.id}
              w={{
                id: w.id,
                amount: w.amount,
                status: w.status,
                requestedAt: w.requestedAt.toISOString(),
                bankName: w.bankName,
                bankAccountNumber: w.bankAccountNumber,
                bankAccountName: w.bankAccountName,
                holderLabel: w.pool
                  ? `Kolam: ${w.pool.name}`
                  : `Coach: ${w.coachProfile?.user.name ?? "-"}`,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
