import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { dateLabel, formatDateLabel, resolveDateRange } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

export default async function KinerjaCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const { from, to } = resolveDateRange(params.from, params.to, 6);

  const fromDate = dateLabel(from);
  const toDateExclusive = new Date(dateLabel(to));
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { date: { gte: fromDate, lt: toDateExclusive } },
    },
    include: { availability: { include: { coach: { select: { id: true, name: true } }, pool: { select: { name: true } } } } },
  });

  // Per coach, lalu dipecah per kolam tempat sesi berlangsung.
  type Counts = { valid: number; notHadir: number; unmarked: number };
  const byCoach = new Map<string, { name: string; total: Counts; pools: Map<string, Counts> }>();
  const empty = (): Counts => ({ valid: 0, notHadir: 0, unmarked: 0 });
  for (const b of bookings) {
    const coach = b.availability.coach;
    if (!byCoach.has(coach.id)) byCoach.set(coach.id, { name: coach.name, total: empty(), pools: new Map() });
    const entry = byCoach.get(coach.id)!;
    const poolName = b.availability.pool.name;
    if (!entry.pools.has(poolName)) entry.pools.set(poolName, empty());
    const key: keyof Counts = b.attended === true ? "valid" : b.attended === false ? "notHadir" : "unmarked";
    entry.total[key]++;
    entry.pools.get(poolName)![key]++;
  }

  const rows = [...byCoach.values()].sort((a, b) => b.total.valid - a.total.valid);
  const totalValid = rows.reduce((n, r) => n + r.total.valid, 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Kinerja Coach</h1>
      <p className="mb-6 text-sm text-text-muted">
        Jumlah sesi valid (member benar-benar hadir) per coach di rentang tanggal — dasar hitung
        komisi coach.
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

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada booking di rentang tanggal ini.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text">
            Total sesi valid: <b>{totalValid}</b>
          </p>
          {rows.map((r) => (
            <Card key={r.name}>
              <CardBody>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-text">{r.name}</h2>
                  <p className="text-sm text-text-muted">
                    <b className="text-2xl text-text">{r.total.valid}</b> sesi valid
                    {r.total.unmarked > 0 && <span className="text-warning-text"> · {r.total.unmarked} belum ditandai</span>}
                    {r.total.notHadir > 0 && <> · {r.total.notHadir} tidak hadir</>}
                  </p>
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[...r.pools.entries()].map(([poolName, c]) => (
                    <li key={poolName} className="rounded-lg border border-border px-3 py-2">
                      <p className="text-sm font-semibold text-brand-700">{poolName}</p>
                      <p className="text-sm text-text">
                        {c.valid} valid · {c.unmarked} belum ditandai · {c.notHadir} tidak hadir
                      </p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-text-subtle">
        Booking yang belum ditandai atau ditandai tidak hadir tidak ikut dihitung sesi valid — cek
        di Booking &amp; Riwayat Sesi coach.
      </p>
    </main>
  );
}
