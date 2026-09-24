import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { activePackageWhere } from "@/lib/active-package";
import { todayWibDateString, dateLabel, formatDateLabel, formatTimeLeft, formatTimeWib, wibDateTime } from "@/lib/datetime";
import { BentoCard, Stat, SessionList } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

export default async function MemberDashboardPage() {
  const session = await requireRole("MEMBER");
  const today = dateLabel(todayWibDateString());
  const now = new Date();

  const startMonth = wibDateTime(`${todayWibDateString().slice(0, 7)}-01`, "00:00");
  const [packages, upcoming, upcomingCount, attendedCount, attendedThisMonth, pesertaCount, spentThisMonth, favCoach] = await Promise.all([
    prisma.package.findMany({
      where: activePackageWhere(session.user.id),
      orderBy: { expiredDate: "asc" },
      select: {
        id: true,
        name: true,
        sisaSesi: true,
        totalSesi: true,
        jatahCancel: true,
        expiredDate: true,
        isSingleSession: true,
        pool: { select: { name: true } },
        dependent: { select: { name: true } },
        _count: { select: { bookings: { where: { status: "CANCELLED", cancelledBy: "MEMBER" } } } },
      },
    }),
    prisma.booking.findMany({
      where: { memberId: session.user.id, status: "BOOKED", availability: { startTime: { gt: now } } },
      orderBy: { availability: { startTime: "asc" } },
      take: 10,
      select: {
        id: true,
        availability: { select: { date: true, startTime: true, endTime: true, coach: { select: { name: true } }, pool: { select: { name: true } } } },
        package: { select: { dependent: { select: { name: true } } } },
      },
    }),
    prisma.booking.count({ where: { memberId: session.user.id, status: "BOOKED", availability: { startTime: { gt: now } } } }),
    prisma.booking.count({ where: { memberId: session.user.id, attended: true } }),
    prisma.booking.count({
      where: { memberId: session.user.id, attended: true, availability: { startTime: { gte: startMonth } } },
    }),
    prisma.dependent.count({ where: { memberId: session.user.id, isActive: true } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startMonth }, package: { memberId: session.user.id } },
      _sum: { amount: true },
    }),
    // Coach yang paling sering mengajar peserta member ini -- info kecil
    // tapi sering ditanya orang tua ("biasanya sama coach siapa?").
    prisma.booking.findMany({
      where: { memberId: session.user.id, attended: true },
      select: { availability: { select: { coach: { select: { name: true } } } } },
    }),
  ]);

  const coachCounts = favCoach.reduce<Record<string, number>>((acc, b) => {
    acc[b.availability.coach.name] = (acc[b.availability.coach.name] ?? 0) + 1;
    return acc;
  }, {});
  const topCoach = Object.entries(coachCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const totalSisa = packages.reduce((s, p) => s + p.sisaSesi, 0);
  // orderBy expiredDate asc di atas -> elemen pertama = yang paling dekat habis.
  const expiringSoon = packages.filter((p) => p.expiredDate && p.expiredDate.getTime() - now.getTime() < 7 * 86_400_000);
  const nearest = expiringSoon[0];
  const nearestLeft = nearest?.expiredDate ? formatTimeLeft(nearest.expiredDate.getTime() - now.getTime()) : "";

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard title="Ringkasan" className="md:col-span-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Paket aktif" value={packages.length} hint={`${pesertaCount} peserta terdaftar`} />
            <Stat label="Total sisa sesi" value={totalSisa} />
            <Stat label="Sesi terjadwal" value={upcomingCount} />
            <Stat label="Sesi dihadiri" value={attendedCount} hint={`${attendedThisMonth} bulan ini`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-4 xl:grid-cols-4">
            <Stat label="Belanja paket bulan ini" value={formatRupiah(spentThisMonth._sum.amount ?? 0)} />
            <Stat label="Paling sering diajar" value={topCoach ?? "-"} />
          </div>
          {expiringSoon.length > 0 && (
            <p className="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
              {expiringSoon.length === 1
                ? `Paket ${nearest.name} (${nearest.dependent.name}) kedaluwarsa dalam ${nearestLeft}.`
                : `${expiringSoon.length} paket akan kedaluwarsa. Terdekat: ${nearest.name} (${nearest.dependent.name}) dalam ${nearestLeft}.`}{" "}
              Pakai sisa sesinya sebelum hangus.
            </p>
          )}
        </BentoCard>

        <BentoCard title="Paket aktif" href="/member/paket" className="md:col-span-3">
          {packages.length === 0 ? (
            <p className="text-sm text-text-muted">Belum ada paket aktif. Beli paket di menu Paket.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {packages.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-700">{p.pool.name}</p>
                    {p.isSingleSession && <Badge tone="neutral">1 sesi</Badge>}
                  </div>
                  <p className="text-sm text-text">
                    {p.dependent.name} · {p.name}
                  </p>
                  <p className="text-sm text-text-muted">
                    Sisa {p.sisaSesi}/{p.totalSesi} sesi · jatah batal {Math.max(0, p.jatahCancel - p._count.bookings)}
                    {p.expiredDate && ` · s.d. ${p.expiredDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}${p.expiredDate.getTime() - now.getTime() < 2 * 86_400_000 ? `, ${formatTimeWib(p.expiredDate)} WIB` : ""}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard title="Jadwal berikutnya" href="/member/riwayat" className="md:col-span-3">
          <SessionList
            items={upcoming.map((b) => ({
              id: b.id,
              startTime: b.availability.startTime,
              endTime: b.availability.endTime,
              poolName: b.availability.pool.name,
              coachName: b.availability.coach.name,
              who: b.package.dependent.name,
              status: b.availability.date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
            }))}
            empty="Belum ada jadwal. Booking sesi di menu Booking."
          />
        </BentoCard>
      </div>
    </main>
  );
}
