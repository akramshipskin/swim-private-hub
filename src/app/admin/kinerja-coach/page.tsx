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

  const byCoach = new Map<
    string,
    { name: string; valid: number; notHadir: number; unmarked: number }
  >();

  function bucket(coachId: string, name: string) {
    if (!byCoach.has(coachId)) byCoach.set(coachId, { name, valid: 0, notHadir: 0, unmarked: 0 });
    return byCoach.get(coachId)!;
  }

  for (const b of bookings) {
    const coach = b.availability.coach;
    const entry = bucket(coach.id, coach.name);
    if (b.attended === true) entry.valid++;
    else if (b.attended === false) entry.notHadir++;
    else entry.unmarked++;
  }

  const rows = [...byCoach.values()].sort((a, b) => b.valid - a.valid);
  const totalValid = rows.reduce((n, r) => n + r.valid, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Kinerja Coach</h1>
      <p className="mb-6 text-sm text-text-muted">
        Jumlah sesi valid (member beneran hadir) per coach di rentang tanggal -- dasar hitung
        honor.
      </p>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
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

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada booking di rentang tanggal ini.</p>
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
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{r.name}</p>
                      {(r.unmarked > 0 || r.notHadir > 0) && (
                        <p className="mt-0.5 text-xs text-text-subtle">
                          {r.unmarked > 0 && <>{r.unmarked} belum ditandai</>}
                          {r.unmarked > 0 && r.notHadir > 0 && " · "}
                          {r.notHadir > 0 && <>{r.notHadir} gak hadir</>}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text">{r.valid}</td>
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

      <p className="mt-4 text-xs text-text-subtle">
        Booking yang belum ditandai atau ditandai gak hadir gak ikut kehitung sesi valid -- cek
        di Booking &amp; Riwayat Sesi coach.
      </p>
    </main>
  );
}
