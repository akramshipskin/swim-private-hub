import { requireRole } from "@/lib/require-role";
import { SearchForm, matchesQuery } from "@/components/search-form";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { getCancelQuotaUsage, evaluateCancelEligibility } from "@/lib/cancel-eligibility";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import CancelButton from "./cancel-button";
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

export default async function MemberRiwayatPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q ?? "";
  const session = await requireRole("MEMBER");

  const bookings = await prisma.booking.findMany({
    where: { memberId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      availability: { include: { coach: true, pool: { select: { name: true } } } },
      package: { include: { dependent: { select: { name: true, isSelf: true } } } },
    },
  });

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }

  const byDate = new Map<string, typeof bookings>();
  for (const b of bookings.filter((x) => matchesQuery(q, x.availability.coach.name, x.availability.pool.name, x.package.dependent.name))) {
    const key = dateKey(b.availability.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(b);
  }
  const sortedDateKeys = [...byDate.keys()].sort().reverse();

  // quota/used cancel cuma bergantung ke (memberId, packageId), bukan per
  // booking -- fetch sekali per packageId unik (biasanya 1, member pake
  // paket yang sama buat banyak booking), bukan sekali per booking.
  const bookedBookings = bookings.filter((b) => b.status === "BOOKED");
  const distinctPackageIds = [...new Set(bookedBookings.map((b) => b.packageId))];
  const quotaUsageByPackage = new Map(
    await Promise.all(
      distinctPackageIds.map(
        async (packageId) =>
          [packageId, await getCancelQuotaUsage(session.user.id, packageId)] as const,
      ),
    ),
  );
  const eligibilityByBooking = new Map<
    string,
    { canCancel: boolean; reason?: string; used: number; quota: number }
  >();
  bookedBookings.forEach((b) => {
    const usage = quotaUsageByPackage.get(b.packageId)!;
    eligibilityByBooking.set(
      b.id,
      evaluateCancelEligibility({ ...usage, startTime: b.availability.startTime }),
    );
  });

  const now = new Date();

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-text">Riwayat Booking</h1>
      <SearchForm q={q} placeholder="Cari coach, kolam, atau peserta" />

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Belum ada riwayat booking</p>
            <p className="mt-1 text-sm text-text-muted">
              Booking pertamamu akan muncul di sini.
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
                {rows.filter((r) => r.availability.pool.name === poolName).map((b) => {
                  const eligibility = eligibilityByBooking.get(b.id);
                  const remaining = eligibility ? Math.max(0, eligibility.quota - eligibility.used) : 0;
                  const showActions = b.status === "BOOKED" && b.availability.startTime > now;

                  return (
                    <Card key={b.id}>
                      <CardBody className="flex items-start justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                            {initials(b.availability.coach.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-text tabular-nums">
                              {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
                            </p>
                            <p className="truncate text-sm text-text">
                              Coach {b.availability.coach.name} · {b.availability.pool.name}
                            </p>
                            <p className="truncate text-sm text-text-muted">
                              Peserta: {b.package.dependent.isSelf ? "kamu sendiri" : b.package.dependent.name} · {b.package.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {/* Status COMPLETED gak pernah di-set di mana pun -- booking
                                  yang sesinya udah lewat tetep BOOKED selamanya, jadi dulu
                                  kebaca "Terjadwal" buat sesi minggu lalu. Label diturunin
                                  dari jam sesi. */}
                              {b.status === "BOOKED" && b.availability.endTime <= now ? (
                                <Badge tone="neutral">Sudah lewat</Badge>
                              ) : (
                                <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                              )}
                              {b.status === "CANCELLED" && b.cancelledBy && (
                                <span className="text-xs text-text-subtle">
                                  oleh{" "}
                                  {b.cancelledBy === "ADMIN"
                                    ? "Admin"
                                    : b.cancelledBy === "COACH"
                                      ? "Coach"
                                      : "kamu"}
                                </span>
                              )}
                              {b.status === "BOOKED" && b.attended === true && (
                                <Badge tone="success">Hadir</Badge>
                              )}
                              {b.status === "BOOKED" && b.attended === false && (
                                <Badge tone="danger">Tidak Hadir</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {showActions && (
                          <div className="flex w-28 shrink-0 flex-col items-end gap-1.5 text-right sm:w-auto">
                            {eligibility?.canCancel ? (
                              <>
                                <CancelButton
                                  bookingId={b.id}
                                  label={`${b.availability.coach.name}, ${formatDateLabel(b.availability.date)} ${formatTimeWib(b.availability.startTime)}`}
                                />
                                <p className="text-xs text-text-subtle">Sisa jatah batal: {remaining}</p>
                              </>
                            ) : (
                              <>
                                <a
                                  href={buildAdminCancelWaLink({
                                    memberName: session.user.name ?? "Member",
                                    childName: b.package.dependent.isSelf
                                      ? undefined
                                      : b.package.dependent.name,
                                    coachName: b.availability.coach.name,
                                    dateLabel: formatDateLabel(b.availability.date),
                                    timeRange: `${formatTimeWib(b.availability.startTime)}-${formatTimeWib(b.availability.endTime)}`,
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md bg-whatsapp px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                                >
                                  Hubungi Admin
                                </a>
                                <p className="text-xs text-text-subtle">{eligibility?.reason}</p>
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
              ))}
            </div>
          );
        })
      )}
    </main>
  );
}
