import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { checkCancelEligibility } from "@/lib/cancel-eligibility";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import CancelButton from "./cancel-button";
import RequestCancelButton from "./request-cancel-button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function MemberRiwayatPage() {
  const session = await requireRole("MEMBER");

  const bookings = await prisma.booking.findMany({
    where: { memberId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { availability: { include: { coach: true } } },
  });

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

  const eligibilityByBooking = new Map<
    string,
    { canCancel: boolean; reason?: string; used: number; quota: number }
  >();
  for (const b of bookings) {
    if (b.status !== "BOOKED") continue;
    const eligibility = await checkCancelEligibility({
      memberId: b.memberId,
      packageId: b.packageId,
      startTime: b.availability.startTime,
    });
    eligibilityByBooking.set(b.id, eligibility);
  }

  const now = new Date();

  const pendingRequestBookingIds = new Set(
    (
      await prisma.cancelRequest.findMany({
        where: { memberId: session.user.id, status: "PENDING" },
        select: { bookingId: true },
      })
    ).map((r) => r.bookingId)
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Riwayat Booking</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Belum ada riwayat booking</p>
            <p className="mt-1 text-sm text-text-muted">
              Booking pertamamu bakal muncul di sini.
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
                {rows.map((b) => {
                  const eligibility = eligibilityByBooking.get(b.id);
                  const remaining = eligibility ? Math.max(0, eligibility.quota - eligibility.used) : 0;
                  const hasCancelRequest = pendingRequestBookingIds.has(b.id);

                  return (
                    <Card key={b.id}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {initials(b.availability.coach.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {b.availability.coach.name}
                      </p>
                      <p className="text-sm text-text-muted">
                        {formatTimeWib(b.availability.startTime)}–
                        {formatTimeWib(b.availability.endTime)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                        {b.status === "CANCELLED" && b.cancelledBy && (
                          <span className="text-xs text-text-subtle">
                            oleh {b.cancelledBy === "ADMIN" ? "Admin" : "kamu"}
                          </span>
                        )}
                        {b.status === "BOOKED" && b.attended === true && (
                          <Badge tone="success">Hadir</Badge>
                        )}
                        {b.status === "BOOKED" && b.attended === false && (
                          <Badge tone="danger">Gak Hadir</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {b.status === "BOOKED" && b.availability.startTime > now && (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {eligibility?.canCancel ? (
                        <>
                          <CancelButton
                            bookingId={b.id}
                            label={`${b.availability.coach.name}, ${formatDateLabel(b.availability.date)} ${formatTimeWib(b.availability.startTime)}`}
                          />
                          <Badge tone={remaining <= 1 ? "warning" : "neutral"}>
                            Jatah batal: {remaining}/{eligibility?.quota ?? 0}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <p className="max-w-[220px] text-right text-xs text-text-subtle">
                            {eligibility?.reason}
                          </p>
                          {hasCancelRequest ? (
                            <Badge tone="warning">Pengajuan nunggu admin</Badge>
                          ) : (
                            <RequestCancelButton bookingId={b.id} />
                          )}
                          <a
                            href={buildAdminCancelWaLink({
                              memberName: session.user.name ?? "Member",
                              coachName: b.availability.coach.name,
                              dateLabel: formatDateLabel(b.availability.date),
                              timeRange: `${formatTimeWib(b.availability.startTime)}-${formatTimeWib(b.availability.endTime)}`,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                          >
                            Hubungi Admin (WA)
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </CardBody>
                    </Card>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </main>
  );
}
