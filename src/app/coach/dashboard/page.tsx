import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { todayWibDateString, dateLabel, addDaysToDateString, formatDateLabel } from "@/lib/datetime";
import { BentoCard, Stat, SessionList } from "@/components/dashboard";

export default async function CoachDashboardPage() {
  const session = await requireRole("COACH");
  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const tomorrow = dateLabel(addDaysToDateString(todayStr, 1));
  const weekEnd = dateLabel(addDaysToDateString(todayStr, 7));
  const now = new Date();

  const [profile, slots, unmarked, openThisWeek, pools] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { walletBalance: true, certificateStatus: true } }),
    prisma.availability.findMany({
      where: { coachId: session.user.id, date: { in: [today, tomorrow] }, status: "BOOKED" },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        pool: { select: { name: true } },
        bookings: { where: { status: "BOOKED" }, select: { package: { select: { dependent: { select: { name: true } } } } } },
      },
    }),
    prisma.booking.findMany({
      where: { status: "BOOKED", attended: null, availability: { coachId: session.user.id, endTime: { lt: now } } },
      orderBy: { availability: { startTime: "desc" } },
      select: {
        id: true,
        availability: { select: { startTime: true, endTime: true, date: true, pool: { select: { name: true } } } },
        package: { select: { dependent: { select: { name: true } } } },
      },
    }),
    prisma.availability.count({
      where: { coachId: session.user.id, status: "AVAILABLE", startTime: { gt: now }, date: { lt: weekEnd } },
    }),
    prisma.poolAffiliation.findMany({ where: { coachId: session.user.id }, select: { pool: { select: { name: true } } } }),
  ]);

  const toItem = (s: (typeof slots)[number]) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    poolName: s.pool.name,
    who: s.bookings[0]?.package.dependent.name,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard title="Ringkasan" className="md:col-span-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Saldo bisa dicairkan" value={formatRupiah(profile?.walletBalance ?? 0)} />
            <Stat label="Sesi belum ditandai" value={unmarked.length} tone={unmarked.length > 0 ? "warning" : undefined} hint="Saldo masuk setelah ditandai" />
            <Stat label="Slot kosong 7 hari ke depan" value={openThisWeek} />
            <Stat label="Kolam tempat mengajar" value={pools.length} hint={pools.map((p) => p.pool.name).join(", ") || "Belum ada"} />
          </div>
        </BentoCard>

        <BentoCard title="Sesi belum ditandai hadir" href="/coach/riwayat-sesi" linkLabel="Tandai sekarang" className="md:col-span-2">
          <SessionList
            items={unmarked.map((b) => ({
              id: b.id,
              startTime: b.availability.startTime,
              endTime: b.availability.endTime,
              poolName: b.availability.pool.name,
              who: b.package.dependent.name,
              status: b.availability.date.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }),
            }))}
            empty="Semua sesi sudah ditandai."
          />
        </BentoCard>
        <BentoCard title="Jadwal hari ini" href="/coach/jadwal" className="md:col-span-2">
          <SessionList items={slots.filter((s) => s.date.getTime() === today.getTime()).map(toItem)} empty="Tidak ada sesi terbooking hari ini." />
        </BentoCard>
        <BentoCard title="Jadwal besok" href="/coach/jadwal" className="md:col-span-2">
          <SessionList items={slots.filter((s) => s.date.getTime() === tomorrow.getTime()).map(toItem)} empty="Belum ada sesi terbooking besok." />
        </BentoCard>

        {profile?.certificateStatus !== "APPROVED" && (
          <BentoCard title="Lengkapi profil" href="/profil" linkLabel="Buka profil" className="md:col-span-6">
            <p className="text-sm text-text-muted">
              Upload foto dan sertifikat supaya profilmu tampil lebih meyakinkan di mata orang tua. Badge
              &quot;Bersertifikat&quot; muncul setelah sertifikat disetujui admin.
            </p>
          </BentoCard>
        )}
      </div>
    </main>
  );
}
