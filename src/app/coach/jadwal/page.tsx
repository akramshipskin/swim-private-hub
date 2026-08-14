import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { addAvailability, deleteAvailability } from "./actions";
import { formatDateLabel, formatTimeWib, dateLabel, todayWibDateString } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";

export default async function CoachJadwalPage() {
  const session = await requireRole("COACH");

  const availabilities = await prisma.availability.findMany({
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
      _count: { select: { bookings: true } },
    },
  });

  const byDate = new Map<string, typeof availabilities>();
  for (const a of availabilities) {
    const key = a.date.toISOString();
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Jadwal Saya</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tambah slot per tanggal. Member bakal lihat & booking slot ini secara real-time.
      </p>

      <Card className="mb-8 mt-5">
        <CardBody>
          <form action={addAvailability} className="flex flex-wrap items-end gap-3">
            <Field label="Tanggal">
              <Input type="date" name="date" required className="w-auto" />
            </Field>
            <Field label="Jam mulai">
              <Input type="time" name="startTime" required className="w-auto" />
            </Field>
            <Field label="Jam selesai">
              <Input type="time" name="endTime" required className="w-auto" />
            </Field>
            <div className="flex items-center gap-1.5 pb-2">
              <input
                type="checkbox"
                name="splitHourly"
                id="splitHourly"
                defaultChecked
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="splitHourly" className="text-sm text-text">
                Pecah per jam (1 sesi = 1 member per jam)
              </Label>
            </div>
            <Button type="submit">Tambah Slot</Button>
          </form>
          <p className="mt-2 text-xs text-text-subtle">
            Contoh: 08.00–10.00 + &ldquo;pecah per jam&rdquo; = 2 slot terpisah (08–09, 09–10),
            bisa dibooking 2 member beda. Kalau di-uncheck, jadi 1 slot utuh 08.00–10.00 buat 1
            member aja.
          </p>
        </CardBody>
      </Card>

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
                      ) : a._count.bookings > 0 ? (
                        <span className="text-xs text-text-subtle">Pernah dibooking</span>
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
    </main>
  );
}
