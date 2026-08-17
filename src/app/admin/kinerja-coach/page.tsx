import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { dateLabel, formatDateLabel, todayWibDateString } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function daysAgoWib(n: number): string {
  const today = new Date(`${todayWibDateString()}T00:00:00+07:00`);
  today.setDate(today.getDate() - n);
  return today.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default async function KinerjaCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const from = params.from || daysAgoWib(6);
  const to = params.to || todayWibDateString();

  const fromDate = dateLabel(from);
  const toDateExclusive = new Date(dateLabel(to));
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { date: { gte: fromDate, lt: toDateExclusive } },
    },
    include: { availability: { include: { coach: { select: { id: true, name: true } } } } },
  });

  const validByCoach = new Map<string, { name: string; count: number }>();
  let unmarkedCount = 0;
  let notHadirCount = 0;

  for (const b of bookings) {
    if (b.attended === true) {
      const coach = b.availability.coach;
      if (!validByCoach.has(coach.id)) {
        validByCoach.set(coach.id, { name: coach.name, count: 0 });
      }
      validByCoach.get(coach.id)!.count++;
    } else if (b.attended === false) {
      notHadirCount++;
    } else {
      unmarkedCount++;
    }
  }

  const rows = [...validByCoach.values()].sort((a, b) => b.count - a.count);
  const totalValid = rows.reduce((n, r) => n + r.count, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Kinerja Coach</h1>
      <p className="mb-6 text-sm text-text-muted">
        Jumlah sesi valid (member beneran hadir) per coach di rentang tanggal -- dasar hitung
        honor.
      </p>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <Field label="Dari">
              <Input type="date" name="from" defaultValue={from} className="w-full sm:w-40" />
            </Field>
            <Field label="Sampai">
              <Input type="date" name="to" defaultValue={to} className="w-full sm:w-40" />
            </Field>
            <Button type="submit">Terapkan</Button>
          </form>
          <p className="mt-3 text-xs text-text-subtle">
            {formatDateLabel(fromDate)} &ndash; {formatDateLabel(dateLabel(to))}
          </p>
        </CardBody>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">
              Belum ada sesi valid (attended) di rentang tanggal ini.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                  <th className="px-4 py-3 font-medium">Coach</th>
                  <th className="px-4 py-3 text-right font-medium">Sesi Valid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-text">{r.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-text">Total</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                    {totalValid}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {(unmarkedCount > 0 || notHadirCount > 0) && (
        <p className="mt-4 text-xs text-text-subtle">
          {unmarkedCount > 0 && (
            <>
              {unmarkedCount} booking di rentang ini belum ditandai hadir/gak hadir -- gak ikut
              kehitung sampai ditandai (cek di Booking &amp; Riwayat Sesi coach).
              <br />
            </>
          )}
          {notHadirCount > 0 && <>{notHadirCount} booking ditandai gak hadir, gak dihitung.</>}
        </p>
      )}
    </main>
  );
}
