import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import PoolShareForm from "./pool-share-form";

export default async function AdminKolamPage() {
  await requireRole("ADMIN");

  const pools = await prisma.pool.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      commissionPercent: true,
      coachSharePercent: true,
      walletBalance: true,
      ownerUser: { select: { name: true, phone: true } },
    },
  });

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
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
