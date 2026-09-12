import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Laporan komisi platform (revisi 2026-09-12, service provider posture):
// duit udah kepotong OTOMATIS pas checkout (lihat src/lib/wallet.ts,
// dikredit ke Pool.walletBalance abis commissionPercent-nya kepotong) --
// halaman ini murni informasional (berapa yang UDAH jadi revenue
// platform), bukan tagihan kayak versi connector sebelumnya.
export default async function KomisiPage() {
  await requireRole("ADMIN");

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS" },
    select: {
      amount: true,
      package: {
        select: {
          poolId: true,
          pool: { select: { name: true, commissionPercent: true } },
        },
      },
    },
  });

  const byPool = new Map<
    string,
    { poolName: string; commissionPercent: number; totalRevenue: number }
  >();
  for (const p of payments) {
    const key = p.package.poolId;
    const existing = byPool.get(key) ?? {
      poolName: p.package.pool.name,
      commissionPercent: p.package.pool.commissionPercent,
      totalRevenue: 0,
    };
    existing.totalRevenue += p.amount;
    byPool.set(key, existing);
  }

  const rows = [...byPool.entries()]
    .map(([poolId, v]) => ({
      poolId,
      ...v,
      platformCommission: Math.round((v.totalRevenue * v.commissionPercent) / 100),
    }))
    .sort((a, b) => b.platformCommission - a.platformCommission);

  const totalCommission = rows.reduce((sum, r) => sum + r.platformCommission, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Komisi Platform</h1>
      <p className="mt-1 text-sm text-text-muted">
        Komisi yang udah kepotong otomatis dari tiap transaksi (sisanya masuk saldo kolam).
        Murni laporan -- gak ada yang perlu ditagih, uangnya udah ada di akun platform.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">
            Belum ada pembayaran berhasil.
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {rows.map((r) => (
            <Card key={r.poolId}>
              <CardBody className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-text">{r.poolName}</p>
                  <p className="text-xs text-text-muted">
                    Omzet {formatRupiah(r.totalRevenue)} &times; {r.commissionPercent}%
                  </p>
                </div>
                <p className="text-sm font-semibold text-text">
                  {formatRupiah(r.platformCommission)}
                </p>
              </CardBody>
            </Card>
          ))}
          <Card>
            <CardBody className="flex items-center justify-between gap-3 py-3">
              <p className="text-sm font-semibold text-text">Total semua kolam</p>
              <p className="text-sm font-semibold text-text">{formatRupiah(totalCommission)}</p>
            </CardBody>
          </Card>
        </div>
      )}
    </main>
  );
}
