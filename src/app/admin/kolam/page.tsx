import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import PoolShareForm from "./pool-share-form";
import AffiliateCoachForm from "./affiliate-coach-form";

export default async function AdminKolamPage() {
  await requireRole("ADMIN");

  const [pools, coaches] = await Promise.all([
    prisma.pool.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        commissionPercent: true,
        coachSharePercent: true,
        walletBalance: true,
        ownerUser: { select: { name: true, phone: true } },
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Kelola Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">
        Persentase pembagian per kolam -- bisa diubah kapan aja, gak butuh migrasi. Sisanya
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
              <CardBody className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{p.name}</p>
                    <p className="text-xs text-text-subtle">
                      {p.ownerUser?.name ?? "-"} · {p.ownerUser?.phone ?? "-"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text">
                    Saldo: {formatRupiah(p.walletBalance)}
                  </p>
                </div>
                <PoolShareForm
                  poolId={p.id}
                  commissionPercent={p.commissionPercent}
                  coachSharePercent={p.coachSharePercent}
                />
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
