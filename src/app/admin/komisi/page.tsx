import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Laporan komisi platform.
//
// BUG (ditemuin & dibenerin 2026-09-14): versi sebelumnya masih pake
// model LAMA (pre-revisi 2026-09-12) -- komisi dihitung dari
// Payment.amount (harga PAKET PENUH) x commissionPercent KOLAM TEMPAT
// PAKET DIBELI, seolah komisi kepotong otomatis pas checkout. Itu udah
// gak sesuai arsitektur sekarang: wallet baru dikredit PER SESI pas
// attendance ditandai Hadir (lihat src/lib/wallet.ts), pake persentase
// KOLAM TEMPAT SESI ITU BENERAN DIAJAR (booking.availability.poolId),
// bukan kolam pembelian -- paket sekarang bisa dipake lintas-kolam.
// Versi lama itu bisa nunjukin komisi buat paket yang sesinya BELUM
// dipakai sama sekali, dan nyalahin ke kolam yang keliru.
//
// Versi ini ngitung ulang dari booking yang beneran attended=true,
// pake rumus PERSIS SAMA kayak creditSessionRevenue (perSessionValue =
// harga paket / totalSesi), dikelompokin per kolam TEMPAT SESI DIAJAR.
export default async function KomisiPage() {
  await requireRole("ADMIN");

  const attendedBookings = await prisma.booking.findMany({
    where: { attended: true },
    select: {
      availability: {
        select: {
          poolId: true,
          pool: { select: { name: true, commissionPercent: true } },
        },
      },
      package: {
        select: {
          totalSesi: true,
          payments: { where: { status: "SUCCESS" }, select: { amount: true }, take: 1 },
        },
      },
    },
  });

  const byPool = new Map<
    string,
    { poolName: string; commissionPercent: number; sessionCount: number; totalCommission: number }
  >();

  for (const b of attendedBookings) {
    const successPayment = b.package.payments[0];
    if (!successPayment) continue; // paket di-assign manual/gratis, gak ada uang beneran

    const perSessionValue = Math.round(successPayment.amount / b.package.totalSesi);
    const poolId = b.availability.poolId;
    const commissionPercent = b.availability.pool.commissionPercent;
    const platformAmount = Math.round((perSessionValue * commissionPercent) / 100);

    const existing = byPool.get(poolId) ?? {
      poolName: b.availability.pool.name,
      commissionPercent,
      sessionCount: 0,
      totalCommission: 0,
    };
    existing.sessionCount += 1;
    existing.totalCommission += platformAmount;
    byPool.set(poolId, existing);
  }

  const rows = [...byPool.entries()]
    .map(([poolId, v]) => ({ poolId, ...v }))
    .sort((a, b) => b.totalCommission - a.totalCommission);

  const totalCommission = rows.reduce((sum, r) => sum + r.totalCommission, 0);

  return (
    <main className="mx-auto max-w-5xl [&>*]:max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Komisi Platform</h1>
      <p className="mt-1 text-sm text-text-muted">
        Komisi dari sesi yang beneran Hadir (bukan seluruh nilai paket) -- dikelompokin per
        kolam tempat sesinya diajar, bukan kolam tempat paket dibeli. Sesi yang belum ditandai
        Hadir belum kehitung di sini, sama kayak wallet kolam/coach.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">
            Belum ada sesi yang ditandai Hadir dengan paket berbayar.
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
                    {r.sessionCount} sesi hadir &times; {r.commissionPercent}%
                  </p>
                </div>
                <p className="text-sm font-semibold text-text">
                  {formatRupiah(r.totalCommission)}
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
