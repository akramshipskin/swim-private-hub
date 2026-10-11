import { requireRole } from "@/lib/require-role";
import { SearchForm, matchesQuery } from "@/components/search-form";
import { ShowMoreLink, listHref, pageSize } from "@/components/show-more-link";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { getCancelQuotaUsage, evaluateCancelEligibility } from "@/lib/cancel-eligibility";
import { buildAdminCancelWaLink } from "@/lib/whatsapp";
import CancelButton from "./cancel-button";
import ReportButton from "./report-button";
import CoachReportForm from "./coach-report-form";
import { ATTENDANCE_REPORT_WINDOW_DAYS, memberCanReportAttendance } from "@/lib/policy";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

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

export const metadata = { title: "Riwayat Booking | Swim Private Hub" };

// Riwayat lama: tampil 7 tanggal terbaru dulu, tombol menambah 7 tanggal.
// Sesi yang akan datang selalu tampil semuanya di bagian atas, terdekat dulu.
const PAGE_DAYS = 7;

export default async function MemberRiwayatPage({ searchParams }: { searchParams: Promise<{ q?: string; n?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const limit = pageSize(sp.n, PAGE_DAYS);
  const session = await requireRole("MEMBER");

  const bookings = await prisma.booking.findMany({
    where: { memberId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      availability: { include: { coach: { select: { name: true, coachProfile: { select: { photoUrl: true } } } }, pool: { select: { name: true } } } },
      package: { include: { dependent: { select: { name: true, isSelf: true } } } },
      attendanceReport: { select: { status: true, resolution: true } },
    },
  });

  function dateKey(d: Date) {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }

  const now = new Date();
  const matching = bookings.filter((x) => matchesQuery(q, x.availability.coach.name, x.availability.pool.name, x.package.dependent.name));
  const isUpcoming = (b: (typeof bookings)[number]) => b.status === "BOOKED" && b.availability.endTime > now;
  function group(list: typeof bookings) {
    const byDate = new Map<string, typeof bookings>();
    for (const b of list) {
      const key = dateKey(b.availability.date);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(b);
    }
    return byDate;
  }
  const upcomingByDate = group(matching.filter(isUpcoming));
  const upcomingKeys = [...upcomingByDate.keys()].sort();
  const pastByDate = group(matching.filter((b) => !isUpcoming(b)));
  const allPastKeys = [...pastByDate.keys()].sort().reverse();
  const pastKeys = allPastKeys.slice(0, limit);

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

  function renderDay(key: string, byDate: Map<string, typeof bookings>) {
          const rows = byDate.get(key)!;
          return (
            <div key={key} className="mb-5">
              <h3 className="mb-3 text-lg font-semibold text-text">
                {formatDateLabel(rows[0].availability.date)}
              </h3>
              {[...new Set(rows.map((r) => r.availability.pool.name))].map((poolName) => (
              <div key={poolName} className="mb-3">
              {/* Nama kolam dibikin label kontras + 2 kolom di layar lebar
                  (Hadi 18 Sep: kolamnya kurang kebaca, banyak ruang kosong). */}
              <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">
                {poolName}
              </p>
              <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {rows.filter((r) => r.availability.pool.name === poolName).map((b) => {
                  const eligibility = eligibilityByBooking.get(b.id);
                  const remaining = eligibility ? Math.max(0, eligibility.quota - eligibility.used) : 0;
                  const showActions = b.status === "BOOKED" && b.availability.startTime > now;
                  const canReport =
                    b.status === "BOOKED" &&
                    b.attended === false &&
                    !b.attendanceReport &&
                    memberCanReportAttendance(b.availability.endTime, now);
                  const reportDeadline = new Date(b.availability.endTime.getTime() + ATTENDANCE_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

                  return (
                    <Card key={b.id}>
                      <CardBody className="flex items-start justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar src={b.availability.coach.coachProfile?.photoUrl} className="h-10 w-10" />
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-text tabular-nums">
                              {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
                            </p>
                            <p className="text-sm text-text">Coach {b.availability.coach.name}</p>
                            <p className="text-sm text-text-muted">
                              Peserta: {b.package.dependent.isSelf ? "kamu sendiri" : b.package.dependent.name} · {b.package.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {/* Status COMPLETED gak pernah di-set di mana pun -- booking
                                  yang sesinya udah lewat tetep BOOKED selamanya, jadi dulu
                                  kebaca "Terjadwal" buat sesi minggu lalu. Label diturunin
                                  dari jam sesi. */}
                              {b.status === "BOOKED" && b.availability.endTime <= now ? (
                                <Badge tone="neutral">Sudah lewat</Badge>
                              ) : b.status === "BOOKED" && b.availability.startTime <= now ? (
                                // Tombol batal ilang begitu sesi mulai -- kasih tau kenapa.
                                <Badge tone="brand">Sedang berlangsung</Badge>
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
                              {b.attendanceReport?.status === "OPEN" && (
                                <Badge tone="warning">Dilaporkan, diperiksa admin</Badge>
                              )}
                            </div>
                            {b.attendanceReport?.status === "RESOLVED" && (
                              <p className="mt-1 text-xs text-text-muted">
                                Laporan selesai diperiksa{b.attendanceReport.resolution ? `: ${b.attendanceReport.resolution}` : "."}
                              </p>
                            )}
                          </div>
                        </div>

                        {canReport && (
                          <ReportButton
                            bookingId={b.id}
                            deadlineLabel={reportDeadline.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                          />
                        )}

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
                                  className="inline-flex items-center gap-1.5 rounded-md bg-whatsapp px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 max-lg:min-h-[44px]"
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
  }

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
      ) : upcomingKeys.length + allPastKeys.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm font-medium text-text">Tidak ada hasil untuk &quot;{q}&quot;</p>
            <p className="mt-1 text-sm text-text-muted">Coba kata kunci lain: nama coach, kolam, atau peserta.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {upcomingKeys.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold text-text">Akan Datang</h2>
              {upcomingKeys.map((k) => renderDay(k, upcomingByDate))}
            </section>
          )}
          {pastKeys.length > 0 && (
            <section>
              {upcomingKeys.length > 0 && <h2 className="mb-3 mt-2 text-xl font-semibold text-text">Riwayat</h2>}
              {pastKeys.map((k) => renderDay(k, pastByDate))}
            </section>
          )}
          <ShowMoreLink href={listHref({ q: q || undefined, n: String(limit + PAGE_DAYS) })} shown={pastKeys.length} total={allPastKeys.length} unit="tanggal" />
        </>
      )}
      <CoachReportForm
        coaches={[...new Map(bookings.map((b) => [b.availability.coachId, { id: b.availability.coachId, name: b.availability.coach.name }])).values()]}
      />
    </main>
  );
}
