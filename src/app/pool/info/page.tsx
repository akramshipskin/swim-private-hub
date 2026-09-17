import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import PoolInfoForm from "@/components/pool-info-form";

export default async function PoolInfoPage() {
  const session = await requireRole("POOL_OWNER");
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true, address: true, contactPhone: true, openTime: true, closeTime: true, facilities: true },
  });

  return (
    <main className="mx-auto max-w-5xl [&>*]:max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Info Kolam</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Informasi ini tampil ke member di halaman booking, profil coach, dan landing page. Perubahan langsung berlaku.
      </p>
      {pools.length === 0 ? (
        <p className="text-sm text-text-muted">Akun ini belum terhubung ke kolam mana pun. Hubungi admin.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pools.map((p) => (
            <Card key={p.id}>
              <CardBody>
                <h2 className="mb-4 text-lg font-semibold text-text">{p.name}</h2>
                <PoolInfoForm pool={p} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
