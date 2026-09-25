import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";
import { todayWibDateString, dateLabel, addDaysToDateString, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { groupByHour } from "@/lib/pool-occupancy";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";

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
        where: { date: dateLabel(dateStr), ...NOT_CLOSED },
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          endTime: true,
          status: true,
          coach: { select: { name: true } },
          bookings: {
            where: { status: "BOOKED" },
            select: {
              member: { select: { name: true } },
              package: { select: { dependent: { select: { name: true, isSelf: true } } } },
            },
          },
        },
      },
    },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum terhubung ke kolam mana pun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Kolam</h1>
      <p className="mt-1 text-sm text-text-muted">Pemakaian kolam untuk les privat per jam.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, -1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">&larr; Sebelumnya</Link>
        {/* Di HP form-nya ambil satu baris penuh dan tanggalnya yang melar
            (flex-1), bukan dipatok w-72 -- lebar tetap bikin tombol Lihat
            kedorong keluar layar. Di layar >=sm baru dipatok 72 supaya
            popup kalendernya pas selebar tombolnya, gak nyembul nabrak
            tombol sebelahnya. */}
        <form className="flex w-full items-center gap-2 sm:w-auto">
          <DatePicker name="date" defaultValue={dateStr} className="min-w-0 flex-1 sm:w-72 sm:flex-none" />
          <button type="submit" className="min-h-[44px] shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-fixed-ink-deep">Lihat</button>
        </form>
        <Link href={`/pool/jadwal?date=${addDaysToDateString(dateStr, 1)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">Berikutnya &rarr;</Link>
      </div>
      <p className="mt-3 text-base font-semibold text-text">{formatDateLabel(dateLabel(dateStr))}</p>

      {pools.map((p) => {
        const rows = groupByHour(
          p.availabilities.map((a) => ({
            startTime: a.startTime,
            endTime: a.endTime,
            booked: a.status === "BOOKED",
            coachName: a.coach.name,
            who: a.bookings[0]
              ? a.bookings[0].package.dependent.isSelf
                ? a.bookings[0].member.name
                : `${a.bookings[0].package.dependent.name} (akun ${a.bookings[0].member.name})`
              : undefined,
          })),
          p.openTime,
          p.closeTime
        );
        return (
          <Card key={p.id} className="mt-4 w-full">
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
                          {formatTimeWib(s.startTime)} · Coach {s.coachName}
                          {s.who ? ` · peserta ${s.who}` : ""}
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
