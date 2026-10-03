import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import PackPriceForm from "@/components/pack-price-form";
import { updateCoachPrices } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { formatBps, pack8SavingPercent, packQuote, PACK_DURATION_DAYS } from "@/lib/pricing";

export const metadata = { title: "Harga | Swim Private Hub" };

export default async function CoachHargaPage() {
  const session = await requireRole("COACH");
  const [profile, pools] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { pricePack4: true, pricePack8: true } }),
    prisma.pool.findMany({
      where: { isActive: true, affiliations: { some: { coachId: session.user.id } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, pricePack4: true, pricePack8: true, serviceFeeBps: true },
    }),
  ]);
  if (!profile) {
    return <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">Profil coach tidak ditemukan. Hubungi admin.</main>;
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Harga</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Pasang harga jasamu untuk paket 4 sesi (berlaku {PACK_DURATION_DAYS[4] / 30} bulan) dan 8 sesi (berlaku{" "}
        {PACK_DURATION_DAYS[8] / 30} bulan). Satu harga untuk semua kolam. Harga baru langsung berlaku untuk pembelian
        berikutnya; paket yang sudah dibeli tidak berubah. Biasanya paket 8 sesi dibuat lebih murah per sesinya supaya
        member tertarik mengambil paket yang lebih panjang.
      </p>
      <Card className="mb-6">
        <CardBody>
          <PackPriceForm action={updateCoachPrices} pricePack4={profile.pricePack4} pricePack8={profile.pricePack8} />
          <p className="mt-3 text-xs text-text-subtle">
            Kosongkan salah satu kalau kamu tidak menjual paket itu. Bagianmu per sesi = harga paket ÷ jumlah sesi, dipotong
            PPh 0,5% kecuali kamu sudah menyerahkan surat pernyataan omzet di bawah Rp 500 juta ke admin.
          </p>
        </CardBody>
      </Card>

      <h2 className="mb-1 text-lg font-semibold text-text">Harga yang dilihat member</h2>
      <p className="mb-3 text-sm text-text-muted">Harga kolam + hargamu + biaya layanan SPH, di tiap kolam tempat kamu mengajar.</p>
      {pools.length === 0 ? (
        <p className="text-sm text-text-muted">Kamu belum terdaftar mengajar di kolam mana pun. Hubungi admin.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {pools.map((pool) => {
            const four = packQuote(pool, profile, 4);
            const eight = packQuote(pool, profile, 8);
            const saving = four && eight ? pack8SavingPercent(four, eight) : 0;
            return (
              <li key={pool.id}>
                <Card>
                  <CardBody className="flex flex-col gap-2">
                    <h3 className="text-base font-semibold text-brand-700">{pool.name}</h3>
                    {[four, eight].map((q, i) =>
                      q ? (
                        <p key={i} className="text-sm text-text">
                          Paket {q.totalSesi} sesi: <b>{formatRupiah(q.total)}</b>{" "}
                          <span className="text-text-muted">
                            (kolam {formatRupiah(q.poolPrice)} + kamu {formatRupiah(q.coachPrice)} + layanan {formatBps(pool.serviceFeeBps)}{" "}
                            {formatRupiah(q.serviceFee)})
                          </span>
                        </p>
                      ) : (
                        <p key={i} className="text-sm text-text-muted">
                          Paket {i === 0 ? 4 : 8} sesi: belum dijual, karena {(i === 0 ? pool.pricePack4 : pool.pricePack8) == null ? "harga kolam" : "hargamu"} untuk paket ini belum diisi.
                        </p>
                      )
                    )}
                    {saving > 0 && <p className="text-xs text-success-text">Paket 8 sesi {saving}% lebih hemat per sesi.</p>}
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
