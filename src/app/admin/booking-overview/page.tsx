import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminCancelButton from "./admin-cancel-button";
import AttendanceToggle from "@/components/attendance-toggle";

export default async function AdminBookingOverviewPage() {
  await requireRole("ADMIN");

  // Root di Availability (bukan Booking) biar slot yang UDAH dibuka coach
  // tapi BELUM ada member yang ambil juga keliatan -- admin bisa langsung
  // tau coach mana yang jamnya masih kosong.
  const availabilities = await prisma.availability.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      coach: { select: { id: true, name: true } },
      bookings: {
        where: { status: "BOOKED" },
        include: { member: { select: { name: true, email: true } } },
        take: 1,
      },
    },
  });

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }

  const byCoach = new Map<
    string,
    { coachName: string; byDate: Map<string, typeof availabilities> }
  >();
  for (const a of availabilities) {
    const coachKey = a.coach.id;
    if (!byCoach.has(coachKey)) {
      byCoach.set(coachKey, { coachName: a.coach.name, byDate: new Map() });
    }
    const group = byCoach.get(coachKey)!;
    const dKey = dateKey(a.date);
    if (!group.byDate.has(dKey)) group.byDate.set(dKey, []);
    group.byDate.get(dKey)!.push(a);
  }

  const now = new Date();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Semua Booking</h1>

      {availabilities.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada slot dibuka coach manapun.</p>
          </CardBody>
        </Card>
      ) : (
        [...byCoach.entries()].map(([coachId, group]) => {
          const allSlots = [...group.byDate.values()].flat();
          const filledCount = allSlots.filter((a) => a.bookings.length > 0).length;
          const sortedDates = [...group.byDate.keys()].sort();

          return (
            <div key={coachId} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-text-muted">
                {group.coachName}{" "}
                <span className="text-text-subtle">
                  ({filledCount}/{allSlots.length} terisi)
                </span>
              </h2>

              {sortedDates.map((dKey) => {
                const rows = group.byDate.get(dKey)!;
                return (
                  <div key={dKey} className="mb-3">
                    <h3 className="mb-1.5 text-xs font-medium text-text-subtle">
                      {formatDateLabel(rows[0].date)}
                    </h3>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {rows.map((a) => {
                        const booking = a.bookings[0];
                        const isPast = a.endTime <= now;

                        return (
                          <Card key={a.id}>
                            <CardBody className="flex items-center justify-between gap-3 py-2.5">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-text">
                                  {formatTimeWib(a.startTime)}–{formatTimeWib(a.endTime)}
                                </p>
                                {booking ? (
                                  <p className="truncate text-xs text-text-muted">
                                    {booking.member.name}
                                  </p>
                                ) : (
                                  <p className="text-xs text-text-subtle">Belum ada yang book</p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {booking ? (
                                  <>
                                    <Badge tone="brand">Terisi</Badge>
                                    {isPast ? (
                                      <AttendanceToggle bookingId={booking.id} attended={booking.attended} />
                                    ) : (
                                      <AdminCancelButton bookingId={booking.id} />
                                    )}
                                  </>
                                ) : (
                                  <Badge tone="neutral">Kosong</Badge>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </main>
  );
}
