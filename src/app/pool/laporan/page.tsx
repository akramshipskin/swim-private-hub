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
// Nilai sesi = harga paket berbayar / totalSesi. Bagian kolam & coach diambil
// dari ledger (yang benar-benar dikredit), sama seperti halaman Bagi Hasil admin.
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
    select: { id: true, name: true },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum terhubung ke kolam mana pun. Hubungi admin.
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

  const ledger = await prisma.walletTransaction.groupBy({
    by: ["bookingId", "type"],
    where: {
      bookingId: { in: bookingsByPool.flat().map((b) => b.id) },
      type: { in: ["SESSION_REVENUE", "SESSION_PAYOUT"] },
    },
    _sum: { amount: true },
  });
  const credited = (bookingId: string, type: "SESSION_REVENUE" | "SESSION_PAYOUT") =>
    ledger.find((l) => l.bookingId === bookingId && l.type === type)?._sum.amount ?? 0;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Laporan Kolam</h1>
      <p className="mb-6 text-sm text-text-muted">
        Rincian komisi kolam kamu per sesi yang benar-benar ditandai Hadir.
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
              // Angka kolam & coach dari pembukuan (yang benar-benar dikredit saat
              // sesi ditandai Hadir, dengan persen yang berlaku saat itu), bukan
              // dihitung ulang dari persen sekarang. Platform = sisanya.
              const poolAmount = credited(b.id, "SESSION_REVENUE");
              const coachAmount = credited(b.id, "SESSION_PAYOUT");
              const platformAmount = perSessionValue - poolAmount - coachAmount;
              return { booking: b, perSessionValue, coachAmount, poolAmount, platformAmount };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);

          const totalPoolShare = rows.reduce((sum, r) => sum + r.poolAmount, 0);

          return (
            <div key={pool.id}>
              <h2 className="mb-3 text-lg font-semibold text-text">{pool.name}</h2>

              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Sesi Hadir</p>
                    <p className="text-lg font-semibold text-text">{rows.length}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Rata-rata komisi kolam per sesi</p>
                    <p className="text-lg font-semibold text-text">
                      {formatRupiah(rows.length ? Math.round(totalPoolShare / rows.length) : 0)}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Peserta berbeda</p>
                    <p className="text-lg font-semibold text-text">
                      {new Set(rows.map((r) => r.booking.package.dependent.name)).size}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="py-3">
                    <p className="text-xs text-text-subtle">Komisi Kolam Kamu</p>
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
                          <th className="px-4 py-3 font-medium">Peserta</th>
                          <th className="px-4 py-3 text-right font-medium">Komisi Kolam</th>
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
                            <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                              {formatRupiah(r.poolAmount)}
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
        Hanya sesi yang benar-benar ditandai Hadir dan paketnya berbayar (bukan assign manual/gratis)
        yang dihitung di sini — sama seperti dasar hitung saldo kolam. Yang ditampilkan adalah komisi kolam kamu
        sesuai persentase yang berlaku saat sesi itu ditandai Hadir.
      </p>
    </main>
  );
}
