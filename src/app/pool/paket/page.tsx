import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import PackPriceForm from "@/components/pack-price-form";
import { updatePoolPrices } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { formatBps, PACK_DURATION_DAYS } from "@/lib/pricing";

export const metadata = { title: "Paket & Harga | Swim Private Hub" };

export default async function PoolPaketPage() {
  const session = await requireRole("POOL_OWNER");
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, pricePack4: true, pricePack8: true, serviceFeeBps: true, _count: { select: { affiliations: true } } },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Paket &amp; Harga</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Pasang harga tiket kolam untuk paket 4 sesi (berlaku {PACK_DURATION_DAYS[4] / 30} bulan) dan 8 sesi (berlaku{" "}
        {PACK_DURATION_DAYS[8] / 30} bulan). Tiket per sesi berlaku untuk 1 peserta, 1 pendamping, dan coach-nya. Member
        membayar harga kolam + harga coach + biaya layanan SPH. Harga baru langsung berlaku untuk pembelian berikutnya;
        paket yang sudah dibeli tidak berubah.
      </p>
      {pools.length === 0 ? (
        <p className="text-sm text-text-muted">Akun ini belum terhubung ke kolam mana pun. Hubungi admin.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pools.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-brand-700">{p.name}</h2>
                <PackPriceForm action={updatePoolPrices} hidden={{ poolId: p.id }} pricePack4={p.pricePack4} pricePack8={p.pricePack8} />
                <p className="text-xs text-text-subtle">
                  Kosongkan salah satu kalau tidak menjual paket itu. Bagian kolam per sesi = harga paket ÷ jumlah sesi,
                  dipotong PPh 0,5% kecuali sudah menyerahkan surat pernyataan omzet di bawah Rp500 juta ke admin. Biaya
                  layanan SPH di kolam ini {formatBps(p.serviceFeeBps)}, dibayar member di atas harga. {p._count.affiliations} coach mengajar di sini.
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
