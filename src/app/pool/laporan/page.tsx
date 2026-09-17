import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { dateLabel, formatDateLabel, formatTimeWib, resolveDateRange } from "@/lib/datetime";
import { formatRupiah } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

// Laporan komisi & booking per kolam, buat pool owner -- landing page
// promosiin "laporan komisi otomatis, rincian omzet & komisi yang
// jelas" tapi sampe sekarang pool owner cuma punya halaman Saldo (angka
// akhir doang, gak ada rincian per sesi). Halaman ini nutup gap itu.
//
// Rumus PERSIS SAMA kayak creditSessionRevenue/admin/komisi: perSessionValue
// = harga paket berbayar / totalSesi, dipecah pake commissionPercent/
// coachSharePercent MILIK KOLAM (rate SAAT INI, bukan rate historis yang
// kepake pas kredit beneran terjadi -- sama kayak simplifikasi admin/komisi,
// biar angka yang dilihat pool owner konsisten sama yang dilihat admin).
export default async function PoolLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireRole("POOL_OWNER");
  const params = await searchParams;

  const { from, to } = resolveDateRange(params.from, params.to, 6);
  const fromDate = dateLabel(from);
  const toDateExclusive = new Date(dateLabel(to));
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);

  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, commissionPercent: true, coachSharePercent: true },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum ke-link ke kolam manapun. Hubungi admin.
      </main>
    );
  }

  const bookingsByPool = await Promise.all(
    pools.map((pool) =>
      prisma.booking.findMany({
        where: {
          attended: true,
          availability: { poolId: pool.id, date: { gte: fromDate, lt: toDateExclusive } },
        },
        orderBy: { availability: { startTime: "desc" } },
        select: {
          id: true,
          availability: {
            select: { date: true, startTime: true, endTime: true, coach: { select: { name: true } } },
          },
          package: {
            select: {
              totalSesi: true,
              dependent: { select: { name: true } },
              payments: { where: { status: "SUCCESS" }, select: { amount: true }, take: 1 },
            },
          },
        },
      })
    )
  );

  return (
    <main className="w-full [&>*]:max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Laporan Kolam</h1>
      <p className="mb-6 text-sm text-text-muted">
        Rincian omzet & komisi per sesi yang benar-benar Hadir, per kolam kamu.
      </p>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
            <Field label="Dari">
              <DatePicker name="from" defaultValue={from} className="sm:w-56" />
            </Field>
            <Field label="Sampai">
              <DatePicker name="to" defaultValue={to} className="sm:w-56" />
            </Field>
            <Button type="submit">Terapkan</Button>
          </form>
          <p className="mt-3 text-xs text-text-subtle">
            {formatDateLabel(fromDate)} &ndash; {formatDateLabel(dateLabel(to))}
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-10">
        {pools.map((pool, i) => {
          const bookings = bookingsByPool[i];
          const rows = bookings
            .map((b) => {
              const payment = b.package.payments[0];
              if (!payment) return null;
              const perSessionValue = Math.round(payment.amount / b.package.totalSesi);
              const coachAmount = Math.round((perSessionValue * pool.coachSharePercent) / 100);
              const poolAmount = Math.round(
                (perSessionValue * (100 - pool.commissionPercent - pool.coachSharePercent)) / 100
              );
              // Dihitung langsung (bukan perSessionValue - coachAmount - poolAmount) biar
              // sama persis kayak angka yang ditampilin admin/komisi -- 3 pembagian
              // dibulatin independen, jadi gak selalu pas nutup ke perSessionValue.
              const platformAmount = Math.round((perSessionValue * pool.commissionPercent) / 100);
              return { booking: b, perSessionValue, coachAmount, poolAmount, platformAmount };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);

          const totalOmzet = rows.reduce((sum, r) => sum + r.perSessionValue, 0);
          const totalPoolShare = rows.reduce((sum, r) => sum + r.poolAmount, 0);

          return (
            <div key={pool.id}>
              <h2 className="mb-3 text-lg font-semibold text-text">{pool.name}</h2>

              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Sesi Hadir</p>
                    <p className="text-lg font-semibold text-text">{rows.length}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Total Omzet</p>
                    <p className="text-lg font-semibold text-text">{formatRupiah(totalOmzet)}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Bagian Kolam Kamu</p>
                    <p className="text-lg font-semibold text-text">{formatRupiah(totalPoolShare)}</p>
                  </CardBody>
                </Card>
              </div>

              {rows.length === 0 ? (
                <Card>
                  <CardBody className="py-10 text-center text-sm text-text-muted">
                    Belum ada sesi Hadir dengan paket berbayar di rentang tanggal ini.
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                          <th className="px-4 py-3 font-medium">Tanggal</th>
                          <th className="px-4 py-3 font-medium">Coach</th>
                          <th className="px-4 py-3 font-medium">Anak</th>
                          <th className="px-4 py-3 text-right font-medium">Omzet Sesi</th>
                          <th className="px-4 py-3 text-right font-medium">Bagian Kolam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.booking.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-text">{formatDateLabel(r.booking.availability.date)}</p>
                              <p className="text-xs text-text-subtle">
                                {formatTimeWib(r.booking.availability.startTime)}&ndash;
                                {formatTimeWib(r.booking.availability.endTime)}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-text">{r.booking.availability.coach.name}</td>
                            <td className="px-4 py-3 text-text">{r.booking.package.dependent.name}</td>
                            <td className="px-4 py-3 text-right font-mono text-text">
                              {formatRupiah(r.perSessionValue)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                              {formatRupiah(r.poolAmount)}
                              <p className="text-xs font-normal text-text-subtle">
                                komisi {formatRupiah(r.platformAmount)} · coach {formatRupiah(r.coachAmount)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-text-subtle">
        Cuma sesi yang benar-benar ditandai Hadir dan paketnya berbayar (bukan assign manual/gratis)
        yang kehitung di sini — sama seperti dasar hitung saldo kolam.
      </p>
    </main>
  );
}
