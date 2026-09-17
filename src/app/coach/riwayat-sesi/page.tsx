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
      package: { select: { name: true, dependent: { select: { name: true } } } },
      member: { select: { name: true } },
      availability: { include: { pool: { select: { name: true } } } },
    },
  });

  const validSessionCount = bookings.filter((b) => b.attended === true).length;
  const absentCount = bookings.filter((b) => b.attended === false).length;
  const unmarkedCount = bookings.filter((b) => b.attended === null).length;

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
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">Riwayat Sesi</h1>
      <p className="mb-4 text-sm text-text-muted">Tandai kehadiran setelah sesi selesai. Saldo kamu dan kolam masuk setelah ditandai Hadir.</p>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card><CardBody className="py-3"><p className="text-sm text-text-muted">Belum ditandai</p><p className={`text-2xl font-bold ${unmarkedCount > 0 ? "text-warning-text" : "text-text"}`}>{unmarkedCount}</p></CardBody></Card>
        <Card><CardBody className="py-3"><p className="text-sm text-text-muted">Hadir</p><p className="text-2xl font-bold text-success-text">{validSessionCount}</p></CardBody></Card>
        <Card><CardBody className="py-3"><p className="text-sm text-text-muted">Tidak hadir</p><p className="text-2xl font-bold text-text">{absentCount}</p></CardBody></Card>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-text-muted">
              Belum ada sesi yang sudah lewat waktunya buat ditandai.
            </p>
          </CardBody>
        </Card>
      ) : (
        sortedDateKeys.map((key) => {
          const rows = byDate.get(key)!;
          return (
            <div key={key} className="mb-5">
              <h2 className="mb-3 text-lg font-semibold text-text">
                {formatDateLabel(rows[0].availability.date)}
              </h2>
              {[...new Set(rows.map((r) => r.availability.pool.name))].map((poolName) => (
              <div key={poolName} className="mb-3">
              <h3 className="mb-2 text-sm font-semibold text-brand-700">{poolName}</h3>
              <ul className="flex flex-col gap-2">
                {rows.filter((r) => r.availability.pool.name === poolName).map((b) => (
                  <Card key={b.id}>
                    <CardBody className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-text tabular-nums">
                          {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
                        </p>
                        <p className="text-sm text-text">Peserta: {b.package.dependent.name}</p>
                        <p className="text-sm text-text-muted">
                          Akun {b.member.name} · {b.package.name}
                        </p>
                        {b.attended !== null && b.attendedBy && (
                          <p className="mt-0.5 text-xs text-text-subtle">
                            ditandai {b.attendedBy === "COACH" ? "coach" : "admin"}
                          </p>
                        )}
                      </div>
                      <AttendanceToggle bookingId={b.id} attended={b.attended} />
                    </CardBody>
                  </Card>
                ))}
              </ul>
              </div>
              ))}
            </div>
          );
        })
      )}
    </main>
  );
}
