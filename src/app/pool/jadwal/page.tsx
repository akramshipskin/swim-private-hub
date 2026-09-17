import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { todayWibDateString, dateLabel, addDaysToDateString, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { groupByHour } from "@/lib/pool-occupancy";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Jadwal per jam buat pemilik kolam: jam mana dipakai les privat (dan oleh
// siapa), jam mana ada slot kosong, jam mana tidak ada les sama sekali.
export default async function PoolJadwalPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await requireRole("POOL_OWNER");
  const { date } = await searchParams;
  const dateStr = date && DATE.test(date) ? date : todayWibDateString();

  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      openTime: true,
      closeTime: true,
      availabilities: {
        where: { date: dateLabel(dateStr) },
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          endTime: true,
          status: true,
          coach: { select: { name: true } },
          bookings: { where: { status: "BOOKED" }, select: { package: { select: { dependent: { select: { name: true } } } } } },
        },
      },
    },
  });

  return (
    <main className="w-full [&>*]:max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">Pemakaian kolam untuk les privat per jam.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, -1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">&larr; Sebelumnya</Link>
        <form className="flex items-center gap-2">
          <label htmlFor="jadwal-date" className="sr-only">Tanggal</label>
          <input id="jadwal-date" type="date" name="date" defaultValue={dateStr} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text" />
          <button type="submit" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">Lihat</button>
        </form>
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, 1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">Berikutnya &rarr;</Link>
      </div>
      <p className="mt-3 text-base font-semibold text-text">{formatDateLabel(dateLabel(dateStr))}</p>

      {pools.map((p) => {
        const rows = groupByHour(
          p.availabilities.map((a) => ({
            startTime: a.startTime,
            endTime: a.endTime,
            booked: a.status === "BOOKED",
            coachName: a.coach.name,
            who: a.bookings[0]?.package.dependent.name,
          })),
          p.openTime,
          p.closeTime
        );
        return (
          <Card key={p.id} className="mt-4">
            <CardBody>
              <h2 className="mb-3 text-lg font-semibold text-text">{p.name}</h2>
              <ul className="flex flex-col divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.hour} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4">
                    <span className="w-24 shrink-0 text-sm font-semibold tabular-nums text-text">
                      {String(r.hour).padStart(2, "0")}:00–{String(r.hour + 1).padStart(2, "0")}:00
                    </span>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {r.booked.length === 0 && r.open.length === 0 && <span className="text-sm text-text-subtle">Tidak ada les</span>}
                      {r.booked.map((s, i) => (
                        <Badge key={`b${i}`} tone="brand">
                          Les: {s.coachName}{s.who ? ` · ${s.who}` : ""} ({formatTimeWib(s.startTime)})
                        </Badge>
                      ))}
                      {r.open.map((s, i) => (
                        <Badge key={`o${i}`} tone="neutral">Slot kosong: {s.coachName}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        );
      })}
    </main>
  );
}
