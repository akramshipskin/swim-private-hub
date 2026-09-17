import { requireRole } from "@/lib/require-role";
import { SearchForm, matchesQuery } from "@/components/search-form";
import { prisma } from "@/lib/prisma";
import AddSlotForm from "./add-slot-form";
import DeleteSlotButton from "./delete-slot-button";
import CancelBookingButton from "./cancel-booking-button";
import { formatDateLabel, formatTimeWib, dateLabel, todayWibDateString } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnablePushButton from "@/components/enable-push-button";

export default async function CoachJadwalPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q ?? "";
  const session = await requireRole("COACH");

  // Jadwal coach lain di tanggal yang sama -- biar coach ini tau siapa
  // aja yang udah buka jadwal di hari itu, gak cuma keliatan lewat titik
  // di kalender doang. Query-query ini independen, dijalankan paralel.
  const [availabilities, otherAvailabilities, myAffiliations] = await Promise.all([
    prisma.availability.findMany({
      where: {
        coachId: session.user.id,
        date: { gte: dateLabel(todayWibDateString()) },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        pool: { select: { name: true } },
        bookings: {
          where: { status: "BOOKED" },
          select: {
            id: true,
            package: { select: { dependent: { select: { name: true } } } },
          },
          take: 1,
        },
      },
    }),
    prisma.availability.findMany({
      where: {
        coachId: { not: session.user.id },
        date: { gte: dateLabel(todayWibDateString()) },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        coach: { select: { name: true } },
        pool: { select: { name: true } },
        bookings: { where: { status: "BOOKED" }, take: 1 },
      },
    }),
    prisma.poolAffiliation.findMany({
      where: { coachId: session.user.id },
      include: { pool: { select: { id: true, name: true } } },
      orderBy: { pool: { name: "asc" } },
    }),
  ]);

  const myPools = myAffiliations.map((a) => a.pool);
  const now = new Date();

  // Slot kosong yang jamnya sudah lewat tidak bisa dibooking lagi --
  // disembunyikan (bukan dihapus) biar daftar fokus ke yang masih berlaku.
  const isExpiredOpen = (a: { status: string; startTime: Date }) => a.status === "AVAILABLE" && a.startTime <= now;
  const hiddenExpired = availabilities.filter(isExpiredOpen).length;
  const byDate = new Map<string, typeof availabilities>();
  for (const a of availabilities.filter((x) => !isExpiredOpen(x) && matchesQuery(q, x.pool.name, x.bookings[0]?.package.dependent.name))) {
    const key = a.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  const otherByDate = new Map<string, typeof otherAvailabilities>();
  for (const a of otherAvailabilities.filter((x) => !(x.bookings.length === 0 && x.startTime <= now))) {
    const key = a.date.toISOString();
    if (!otherByDate.has(key)) otherByDate.set(key, []);
    otherByDate.get(key)!.push(a);
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Saya</h1>
          <p className="mt-1 text-sm text-text-muted">
            Tambah slot per tanggal. Member akan lihat & booking slot ini secara real-time.
          </p>
        </div>
        <EnablePushButton />
      </div>

      <AddSlotForm pools={myPools} />

      <SearchForm q={q} placeholder="Cari kolam atau peserta di jadwalmu" />

      {hiddenExpired > 0 && (
        <p className="mb-3 text-sm text-text-subtle">
          {hiddenExpired} slot kosong yang jamnya sudah lewat disembunyikan (sudah tidak berlaku).
        </p>
      )}
      {byDate.size === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Belum ada slot terjadwal</p>
            <p className="mt-1 text-sm text-text-muted">Tambah slot pertamamu di atas.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {[...byDate.entries()].map(([dateKey, dayAvailabilities]) => (
            <div key={dateKey}>
              <h2 className="mb-3 text-lg font-semibold text-text">{formatDateLabel(dayAvailabilities[0].date)}</h2>
              {[...new Set(dayAvailabilities.map((a) => a.pool.name))].map((poolName) => (
                <div key={poolName} className="mb-4">
                  <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-brand-700">
                    {poolName}
                    <span className="text-sm font-normal text-text-muted">
                      · {dayAvailabilities.filter((a) => a.pool.name === poolName).length} slot
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {dayAvailabilities
                      .filter((a) => a.pool.name === poolName)
                      .map((a) => (
                        <Card key={a.id}>
                          <CardBody className="flex items-center justify-between gap-3 py-3">
                            <div>
                              <p className="text-base font-semibold text-text tabular-nums">
                                {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                              </p>
                              {a.status === "BOOKED" && a.bookings[0] ? (
                                <p className="mt-1 text-sm text-text-muted">
                                  Peserta: <span className="font-medium text-text">{a.bookings[0].package.dependent.name}</span>
                                </p>
                              ) : (
                                <div className="mt-1">
                                  <Badge tone="neutral">Belum dibooking</Badge>
                                </div>
                              )}
                            </div>
                            {a.status === "BOOKED" && a.bookings[0] && a.startTime <= now ? (
                              <span className="shrink-0 text-right text-sm text-text-subtle">
                                Sudah mulai — tandai di Riwayat Sesi
                              </span>
                            ) : a.status === "BOOKED" && a.bookings[0] ? (
                              <CancelBookingButton
                                bookingId={a.bookings[0].id}
                                label={`${formatTimeWib(a.startTime)}–${formatTimeWib(a.endTime)}`}
                              />
                            ) : (
                              <DeleteSlotButton
                                availabilityId={a.id}
                                label={`${formatTimeWib(a.startTime)}–${formatTimeWib(a.endTime)}`}
                              />
                            )}
                          </CardBody>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {otherByDate.size > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-text">Jadwal Coach Lain</h2>
          <p className="mt-1 text-sm text-text-muted">
            Slot yang sudah dibuka coach lain, agar kamu tahu siapa saja yang jaga di hari yang sama.
          </p>

          <div className="mt-4 flex flex-col gap-8">
            {[...otherByDate.entries()].map(([dateKey, dayAvailabilities]) => (
              <div key={dateKey}>
                <h3 className="mb-3 text-base font-semibold text-text">{formatDateLabel(dayAvailabilities[0].date)}</h3>
                {[...new Set(dayAvailabilities.map((a) => a.pool.name))].map((poolName) => {
                  const inPool = dayAvailabilities.filter((a) => a.pool.name === poolName);
                  return (
                    <div key={poolName} className="mb-4">
                      <p className="mb-2 text-sm font-semibold text-brand-700">{poolName}</p>
                      {[...new Set(inPool.map((a) => a.coach.name))].map((coachName) => (
                        <div key={coachName} className="mb-3">
                          <p className="mb-1.5 text-sm font-medium text-text">{coachName}</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {inPool
                              .filter((a) => a.coach.name === coachName)
                              .map((a) => (
                                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                                  <span className="text-sm font-medium text-text tabular-nums">
                                    {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                                  </span>
                                  <Badge tone={a.bookings.length > 0 ? "brand" : "neutral"}>
                                    {a.bookings.length > 0 ? (a.startTime <= now ? "Selesai/berjalan" : "Terisi") : "Kosong"}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
