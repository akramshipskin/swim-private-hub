import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

export const metadata = {
  title: "Riwayat Bayar | Swim Private Hub",
  description: "Semua pembayaran paket les renang kamu beserta statusnya.",
};

const statusLabel: Record<string, string> = {
  SUCCESS: "Berhasil",
  PENDING: "Menunggu pembayaran",
  FAILED: "Gagal / dibatalkan",
};

const statusTone = { SUCCESS: "success", PENDING: "warning", FAILED: "danger" } as const;

// Batas waktu bayar Midtrans -- lewat ini transaksi tidak bisa dibayar lagi,
// dan paketnya sudah tidak tampil di halaman Paket.
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

function dateTimeLabel(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export default async function MemberPembayaranPage() {
  const session = await requireRole("MEMBER");

  const payments = await prisma.payment.findMany({
    where: { package: { memberId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      package: {
        select: {
          name: true,
          totalSesi: true,
          dependent: { select: { name: true, isSelf: true } },
          pool: { select: { name: true } },
        },
      },
    },
  });

  const now = new Date();
  const totalPaid = payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Riwayat Bayar</h1>
      <p className="mt-1 mb-4 text-sm text-text-muted">
        Semua pembayaran paket kamu, termasuk yang belum selesai dibayar. Paket aktif ada di menu Paket.
      </p>

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-text-muted">Total yang sudah dibayar</p>
          <p className="text-xl font-bold text-text">{formatRupiah(totalPaid)}</p>
        </CardBody>
      </Card>

      {payments.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-muted">Belum ada pembayaran.</CardBody>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {payments.map((p) => {
            // Transaksi menunggu yang sudah lewat 24 jam dianggap kedaluwarsa,
            // walau webhook Midtrans-nya belum pernah masuk.
            const expired = p.status === "PENDING" && now.getTime() - p.createdAt.getTime() > PAYMENT_WINDOW_MS;
            return (
              <li key={p.id}>
                <Card>
                  <CardBody className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-text">{p.package.name}</p>
                      <p className="text-sm text-text-muted">
                        {p.package.pool?.name ?? "Kolam tidak diketahui"} · peserta{" "}
                        {p.package.dependent.isSelf ? "kamu sendiri" : p.package.dependent.name}
                      </p>
                      <p className="mt-1 text-sm text-text-subtle">{dateTimeLabel(p.createdAt)}</p>
                      <p className="text-xs text-text-subtle">No. transaksi: {p.midtransOrderId}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className="text-base font-bold text-text">{formatRupiah(p.amount)}</p>
                      {expired ? (
                        <>
                          <Badge tone="neutral">Kedaluwarsa</Badge>
                          <Link href="/member/paket" className="text-sm font-medium text-brand-700 hover:underline">
                            Beli lagi &rarr;
                          </Link>
                        </>
                      ) : (
                        <Badge tone={statusTone[p.status as keyof typeof statusTone] ?? "neutral"}>
                          {statusLabel[p.status] ?? p.status}
                        </Badge>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
