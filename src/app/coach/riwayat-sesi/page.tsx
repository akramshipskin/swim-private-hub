import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AttendanceToggle from "@/components/attendance-toggle";

export default async function CoachRiwayatSesiPage() {
  const session = await requireRole("COACH");

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { coachId: session.user.id, endTime: { lte: new Date() } },
    },
    orderBy: { availability: { startTime: "desc" } },
    include: { member: { select: { name: true } }, availability: true },
  });

  const validSessionCount = bookings.filter((b) => b.attended === true).length;

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }
  const byDate = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = dateKey(b.availability.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(b);
  }
  const sortedDateKeys = [...byDate.keys()].sort().reverse();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Riwayat Sesi</h1>
      <p className="mb-6 text-sm text-text-muted">
        Total sesi valid (member beneran hadir):{" "}
        <span className="font-semibold text-text">{validSessionCount}</span>
      </p>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">
              Belum ada sesi yang udah lewat waktunya buat ditandain.
            </p>
          </CardBody>
        </Card>
      ) : (
        sortedDateKeys.map((key) => {
          const rows = byDate.get(key)!;
          return (
            <div key={key} className="mb-5">
              <h2 className="mb-2 text-sm font-semibold text-text-muted">
                {formatDateLabel(rows[0].availability.date)}
              </h2>
              <ul className="flex flex-col gap-2">
                {rows.map((b) => (
                  <Card key={b.id}>
                    <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">{b.member.name}</p>
                        <p className="text-sm text-text-muted">
                          {formatTimeWib(b.availability.startTime)}–
                          {formatTimeWib(b.availability.endTime)}
                        </p>
                        {b.attended !== null && (
                          <div className="mt-1">
                            <Badge tone={b.attended ? "success" : "neutral"}>
                              {b.attended ? "Hadir" : "Gak Hadir"}
                              {b.attendedBy && (
                                <span className="ml-1 opacity-70">
                                  (ditandain {b.attendedBy === "COACH" ? "coach" : "admin"})
                                </span>
                              )}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <AttendanceToggle bookingId={b.id} attended={b.attended} />
                    </CardBody>
                  </Card>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </main>
  );
}
