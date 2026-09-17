import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PoolShareForm from "./pool-share-form";
import AffiliateCoachForm from "./affiliate-coach-form";
import PoolActiveToggle from "./pool-active-toggle";
import PoolInfoForm from "@/components/pool-info-form";

export default async function AdminKolamPage() {
  await requireRole("ADMIN");

  const [pools, coaches] = await Promise.all([
    prisma.pool.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        commissionPercent: true,
        coachSharePercent: true,
        walletBalance: true,
        description: true,
        address: true,
        contactPhone: true,
        openTime: true,
        closeTime: true,
        facilities: true,
        ownerships: {
          select: { owner: { select: { name: true, phone: true } } },
          orderBy: { createdAt: "asc" },
        },
        packageTemplates: {
          orderBy: { totalSesi: "asc" },
          select: { id: true, name: true, price: true, totalSesi: true, durationDays: true, isActive: true },
        },
        affiliations: {
          select: { id: true, coachId: true, coach: { select: { name: true } } },
          orderBy: { coach: { name: "asc" } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "COACH" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Rincian asal saldo per kolam: pendapatan sesi dipisah menurut jenis paket
  // yang dipakai (paket kolam ini / beli 1 sesi / paket kolam lain dari masa
  // lintas-kolam sebelum 17 Sep 2026), lalu dikurangi pencairan.
  const [revenueTxns, paidOut] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { type: "SESSION_REVENUE", poolId: { not: null } },
      select: { poolId: true, amount: true, bookingId: true },
    }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { not: null }, status: "PAID" }, _sum: { amount: true } }),
  ]);
  const bookingIds = [...new Set(revenueTxns.map((t) => t.bookingId).filter((id): id is string => !!id))];
  const bookingPkgs = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, package: { select: { poolId: true, isSingleSession: true } } },
  });
  const pkgByBooking = new Map(bookingPkgs.map((b) => [b.id, b.package]));
  function revenueBreakdown(poolId: string) {
    const out = { own: 0, single: 0, legacy: 0 };
    for (const t of revenueTxns) {
      if (t.poolId !== poolId) continue;
      const pkg = t.bookingId ? pkgByBooking.get(t.bookingId) : undefined;
      if (pkg?.isSingleSession) out.single += t.amount;
      else if (pkg && pkg.poolId !== poolId) out.legacy += t.amount;
      else out.own += t.amount;
    }
    return out;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Kelola Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">
        Persentase pembagian per kolam — bisa diubah kapan saja, tidak butuh migrasi. Sisanya
        (100% - komisi - bagian coach) otomatis jadi bagian kolam.
      </p>

      {pools.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-text-muted">
            Belum ada kolam. Jalankan <code>npm run onboard:pools</code>.
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {pools.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-col gap-4 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-text">{p.name}</h2>
                      <Badge tone={p.isActive ? "success" : "warning"}>{p.isActive ? "Aktif" : "Belum disetujui"}</Badge>
                    </div>
                    <p className="text-sm text-text-muted">{p.address ?? "Alamat belum diisi"}</p>
                    <p className="text-sm text-text-muted">
                      Pemilik: {p.ownerships.length === 0 ? "belum ada" : p.ownerships.map((o) => `${o.owner.name}${o.owner.phone ? ` (${o.owner.phone})` : ""}`).join(", ")}
                    </p>
                  </div>
                  <PoolActiveToggle poolId={p.id} poolName={p.name} isActive={p.isActive} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-muted p-3">
                    <p className="text-sm font-semibold text-text">Harga paket</p>
                    {p.packageTemplates.length === 0 ? (
                      <p className="text-sm text-warning-text">Belum ada paket di katalog.</p>
                    ) : (
                      <ul className="mt-1 flex flex-col gap-1">
                        {p.packageTemplates.map((t) => (
                          <li key={t.id} className="flex justify-between gap-2 text-sm">
                            <span className={t.isActive ? "text-text" : "text-text-subtle line-through"}>
                              {t.name} · {t.totalSesi} sesi · {t.durationDays} hari
                            </span>
                            <span className="font-semibold text-text">{formatRupiah(t.price)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {(() => {
                    const r = revenueBreakdown(p.id);
                    const paid = paidOut.find((x) => x.poolId === p.id)?._sum.amount ?? 0;
                    return (
                      <div className="rounded-xl bg-surface-muted p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-text">Saldo kolam (bisa dicairkan)</p>
                          <p className="text-lg font-bold text-text">{formatRupiah(p.walletBalance)}</p>
                        </div>
                        <p className="text-xs text-text-subtle">Bagian kolam dari tiap sesi yang ditandai Hadir, dikurangi pencairan.</p>
                        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm">
                          <dt className="text-text-muted">Dari paket kolam ini</dt><dd className="text-right text-text">{formatRupiah(r.own)}</dd>
                          <dt className="text-text-muted">Dari beli 1 sesi (member kolam lain)</dt><dd className="text-right text-text">{formatRupiah(r.single)}</dd>
                          {r.legacy > 0 && (<><dt className="text-text-muted">Paket kolam lain (sebelum 17 Sep)</dt><dd className="text-right text-text">{formatRupiah(r.legacy)}</dd></>)}
                          <dt className="text-text-muted">Sudah dicairkan</dt><dd className="text-right text-text">−{formatRupiah(paid)}</dd>
                        </dl>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-text">Pembagian per sesi</p>
                <PoolShareForm
                  poolId={p.id}
                  commissionPercent={p.commissionPercent}
                  coachSharePercent={p.coachSharePercent}
                />
                </div>
                <details className="rounded-lg border border-border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium text-text">
                    Info &amp; fasilitas kolam ({p.facilities.length} fasilitas)
                  </summary>
                  <div className="mt-3">
                    <PoolInfoForm pool={p} />
                  </div>
                </details>
                <AffiliateCoachForm
                  poolId={p.id}
                  allCoaches={coaches}
                  affiliations={p.affiliations.map((a) => ({
                    id: a.id,
                    coachId: a.coachId,
                    coachName: a.coach.name,
                  }))}
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
