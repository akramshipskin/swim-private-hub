import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusTone = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
} as const;

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function AdminPembayaranPage() {
  await requireRole("ADMIN");

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { package: { include: { member: { select: { name: true, email: true } } } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Riwayat Pembayaran</h1>

      {payments.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada transaksi.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Paket</th>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Jumlah</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">
                      {p.package.member.name}
                      <span className="block text-xs text-text-subtle">
                        {p.package.member.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{p.package.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-subtle">
                      {p.midtransOrderId}
                    </td>
                    <td className="px-4 py-3 text-text">{formatRupiah(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}
