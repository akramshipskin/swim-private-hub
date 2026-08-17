import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminCancelButton from "./admin-cancel-button";
import AttendanceToggle from "@/components/attendance-toggle";

const statusTone = {
  BOOKED: "brand",
  CANCELLED: "neutral",
  COMPLETED: "success",
} as const;

const statusLabel: Record<string, string> = {
  BOOKED: "Terjadwal",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

export default async function AdminBookingOverviewPage() {
  await requireRole("ADMIN");

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { name: true, email: true } },
      availability: { include: { coach: { select: { id: true, name: true } } } },
    },
  });

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }

  const byCoach = new Map<
    string,
    { coachName: string; byDate: Map<string, typeof bookings> }
  >();
  for (const b of bookings) {
    const coachKey = b.availability.coach.id;
    if (!byCoach.has(coachKey)) {
      byCoach.set(coachKey, { coachName: b.availability.coach.name, byDate: new Map() });
    }
    const group = byCoach.get(coachKey)!;
    const dKey = dateKey(b.availability.date);
    if (!group.byDate.has(dKey)) group.byDate.set(dKey, []);
    group.byDate.get(dKey)!.push(b);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Semua Booking</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">Belum ada booking.</p>
          </CardBody>
        </Card>
      ) : (
        [...byCoach.entries()].map(([coachId, group]) => {
          const totalCount = [...group.byDate.values()].reduce((n, arr) => n + arr.length, 0);
          const sortedDates = [...group.byDate.keys()].sort();

          return (
            <div key={coachId} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-text-muted">
                {group.coachName} <span className="text-text-subtle">({totalCount})</span>
              </h2>

              {sortedDates.map((dKey) => {
                const rows = group.byDate.get(dKey)!;
                return (
                  <div key={dKey} className="mb-3">
                    <h3 className="mb-1.5 text-xs font-medium text-text-subtle">
                      {formatDateLabel(rows[0].availability.date)}
                    </h3>
                    {/* Desktop: tabel */}
                    <Card className="hidden sm:block">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                              <th className="px-4 py-3 font-medium">Member</th>
                              <th className="px-4 py-3 font-medium">Jam</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-4 py-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((b) => (
                              <tr key={b.id} className="border-b border-border last:border-0">
                                <td className="px-4 py-3 text-text">
                                  {b.member.name}
                                  <span className="block text-xs text-text-subtle">{b.member.email}</span>
                                </td>
                                <td className="px-4 py-3 text-text-muted">
                                  {formatTimeWib(b.availability.startTime)}–
                                  {formatTimeWib(b.availability.endTime)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                                  {b.status === "CANCELLED" && b.cancelledBy && (
                                    <span className="ml-1.5 text-xs text-text-subtle">
                                      oleh {b.cancelledBy === "ADMIN" ? "admin" : "member"}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {b.status === "BOOKED" && b.availability.endTime > new Date() && (
                                    <AdminCancelButton bookingId={b.id} />
                                  )}
                                  {b.status === "BOOKED" && b.availability.endTime <= new Date() && (
                                    <AttendanceToggle bookingId={b.id} attended={b.attended} />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    {/* Mobile: card */}
                    <ul className="flex flex-col gap-2 sm:hidden">
                      {rows.map((b) => (
                        <Card key={b.id}>
                          <CardBody className="flex flex-col gap-2 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-text">{b.member.name}</p>
                                <p className="text-xs text-text-subtle">{b.member.email}</p>
                                <p className="text-sm text-text-muted">
                                  {formatTimeWib(b.availability.startTime)}–
                                  {formatTimeWib(b.availability.endTime)}
                                </p>
                              </div>
                              <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                            </div>
                            {b.status === "CANCELLED" && b.cancelledBy && (
                              <p className="text-xs text-text-subtle">
                                Dibatalkan oleh {b.cancelledBy === "ADMIN" ? "admin" : "member"}
                              </p>
                            )}
                            {b.status === "BOOKED" && (
                              <div className="flex items-center justify-end border-t border-border pt-2">
                                {b.availability.endTime > new Date() ? (
                                  <AdminCancelButton bookingId={b.id} />
                                ) : (
                                  <AttendanceToggle bookingId={b.id} attended={b.attended} />
                                )}
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                    </ul>
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
