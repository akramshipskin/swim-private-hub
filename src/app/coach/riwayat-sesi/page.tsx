import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import AttendanceToggle from "@/components/attendance-toggle";

export default async function CoachRiwayatSesiPage() {
  const session = await requireRole("COACH");

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      availability: { coachId: session.user.id, endTime: { lte: new Date() } },
    },
    orderBy: { availability: { startTime: "desc" } },
    include: {
      package: { select: { dependent: { select: { name: true } } } },
      availability: { include: { pool: { select: { name: true } } } },
    },
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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
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
                    <CardBody className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{b.package.dependent.name}</p>
                        <p className="text-sm text-text-muted">
                          {formatTimeWib(b.availability.startTime)}–
                          {formatTimeWib(b.availability.endTime)} · {b.availability.pool.name}
                        </p>
                        {b.attended !== null && b.attendedBy && (
                          <p className="mt-0.5 text-xs text-text-subtle">
                            ditandain {b.attendedBy === "COACH" ? "coach" : "admin"}
                          </p>
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
