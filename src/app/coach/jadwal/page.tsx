import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { deleteAvailability } from "./actions";
import AddSlotForm from "./add-slot-form";
import { formatDateLabel, formatTimeWib, dateLabel, todayWibDateString } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CoachJadwalPage() {
  const session = await requireRole("COACH");

  // Jadwal coach lain di tanggal yang sama -- biar coach ini tau siapa
  // aja yang udah buka jadwal di hari itu, gak cuma keliatan lewat titik
  // di kalender doang. Dua query ini independen, dijalankan paralel.
  const [availabilities, otherAvailabilities] = await Promise.all([
    prisma.availability.findMany({
      where: {
        coachId: session.user.id,
        date: { gte: dateLabel(todayWibDateString()) },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        bookings: {
          where: { status: "BOOKED" },
          include: { member: { select: { name: true } } },
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
        bookings: { where: { status: "BOOKED" }, take: 1 },
      },
    }),
  ]);

  const byDate = new Map<string, typeof availabilities>();
  for (const a of availabilities) {
    const key = a.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  const otherByDate = new Map<string, typeof otherAvailabilities>();
  for (const a of otherAvailabilities) {
    const key = a.date.toISOString();
    if (!otherByDate.has(key)) otherByDate.set(key, []);
    otherByDate.get(key)!.push(a);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Saya</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tambah slot per tanggal. Member bakal lihat & booking slot ini secara real-time.
      </p>

      <AddSlotForm />

      {availabilities.length === 0 ? (
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
              <h2 className="mb-3 text-sm font-semibold text-text-muted">
                {formatDateLabel(dayAvailabilities[0].date)}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {dayAvailabilities.map((a) => (
                  <Card key={a.id}>
                    <CardBody className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">
                          {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                        </p>
                        {a.status === "BOOKED" && a.bookings[0] ? (
                          <p className="mt-1 text-sm text-text-muted">
                            Dibooking oleh{" "}
                            <span className="font-medium text-text">
                              {a.bookings[0].member.name}
                            </span>
                          </p>
                        ) : (
                          <div className="mt-1">
                            <Badge tone="neutral">Belum dibooking</Badge>
                          </div>
                        )}
                      </div>
                      {a.status === "BOOKED" ? (
                        <Badge tone="brand">Terisi</Badge>
                      ) : (
                        <form action={deleteAvailability.bind(null, a.id)}>
                          <Button type="submit" variant="danger" size="sm">
                            Hapus
                          </Button>
                        </form>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {otherAvailabilities.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-text">Jadwal Coach Lain</h2>
          <p className="mt-1 text-sm text-text-muted">
            Slot yang udah dibuka coach lain, biar kamu tau siapa aja yang jaga di hari yang sama.
          </p>

          <div className="mt-4 flex flex-col gap-8">
            {[...otherByDate.entries()].map(([dateKey, dayAvailabilities]) => {
              const byCoach = new Map<string, typeof dayAvailabilities>();
              for (const a of dayAvailabilities) {
                if (!byCoach.has(a.coach.name)) byCoach.set(a.coach.name, []);
                byCoach.get(a.coach.name)!.push(a);
              }

              return (
                <div key={dateKey}>
                  <h3 className="mb-3 text-sm font-semibold text-text-muted">
                    {formatDateLabel(dayAvailabilities[0].date)}
                  </h3>
                  <div className="flex flex-col gap-4">
                    {[...byCoach.entries()].map(([coachName, slots]) => (
                      <div key={coachName}>
                        <p className="mb-2 text-sm font-medium text-text">{coachName}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {slots.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                            >
                              <span className="text-sm text-text">
                                {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                              </span>
                              <Badge tone={a.bookings.length > 0 ? "brand" : "neutral"}>
                                {a.bookings.length > 0 ? "Terisi" : "Kosong"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
