import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { todayWibDateString, dateLabel, addDaysToDateString, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { BalanceCard, BentoCard, NextStepCard, Stat, SessionList } from "@/components/dashboard";
import AttendanceButtons from "@/components/attendance-buttons";
import { getOverdueParticipants } from "@/lib/milestone-hold";
import { releaseDueCommissions } from "@/lib/affiliate";
import { AffiliateCard } from "@/components/affiliate-card";
import { ATTENDANCE_MARK_WINDOW_HOURS, MILESTONE_NOTE_EVERY_SESSIONS, coachCanMarkAttendance } from "@/lib/policy";
import { packagesWithBookableSlot, watchedPackageWhere, daysWithoutSlot, FREE_CHANGE_AFTER_DAYS } from "@/lib/coach-slot-watch";

export const metadata = { title: "Dashboard Coach | Swim Private Hub" };

export default async function CoachDashboardPage() {
  const session = await requireRole("COACH");
  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const tomorrow = dateLabel(addDaysToDateString(todayStr, 1));
  const weekEnd = dateLabel(addDaysToDateString(todayStr, 7));
  const now = new Date();

  await releaseDueCommissions();
  const overdue = await getOverdueParticipants(session.user.id);
  const [profile, slots, unmarked, openThisWeek, pools, owed] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { id: true, walletBalance: true, certificates: { where: { status: "APPROVED" }, select: { id: true }, take: 1 } } }),
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
    // Sesi yang harus disediakan (Hadi 3 Okt): sisa sesi member aktif yang belum terjadwal.
    prisma.package.findMany({
      where: watchedPackageWhere(now, session.user.id),
      orderBy: { expiredDate: "asc" },
      select: { id: true, coachId: true, poolId: true, sisaSesi: true, expiredDate: true, noSlotSince: true, dependent: { select: { name: true } }, pool: { select: { name: true } } },
    }),
  ]);
  const owedBookable = await packagesWithBookableSlot(owed, now);
  const owedTotal = owed.reduce((n, p) => n + p.sisaSesi, 0);
  const owedBlocked = owed.filter((p) => !owedBookable.has(p.id));

  const toItem = (s: (typeof slots)[number]) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    poolName: s.pool.name,
    who: s.bookings[0]?.package.dependent.name,
  });

  // Satu langkah berikutnya untuk coach (rombak UI 4 Okt), urut dari yang
  // paling berdampak ke saldo/member.
  const nextToday = slots.find((s) => s.date.getTime() === today.getTime() && s.endTime > now);
  const step = unmarked.length > 0
    ? { title: `${unmarked.length} sesi belum ditandai Hadir`, body: "Bagianmu masuk saldo setelah sesi ditandai. Lewat 24 jam setelah sesi selesai, hanya admin yang bisa menandai.", href: "/coach/riwayat-sesi", cta: "Tandai sekarang" }
    : owedBlocked.length > 0
      ? { title: `${owedBlocked.length} member belum bisa booking`, body: "Buka jam kosong di kolam mereka supaya sesinya tidak tertunda.", href: "/coach/jadwal", cta: "Buka jadwal" }
      : pools.length === 0
        ? { title: "Pilih kolam tempat kamu mengajar", body: "Member baru bisa membeli paket denganmu setelah kamu memilih kolam dan membuka jam kosong.", href: "/coach/kolam", cta: "Pilih kolam" }
        : nextToday
          ? { eyebrow: "Sesi berikutnya hari ini", title: `${formatTimeWib(nextToday.startTime)}–${formatTimeWib(nextToday.endTime)} · ${nextToday.pool.name}`, body: nextToday.bookings[0]?.package.dependent.name, secondary: { href: "/coach/jadwal", label: "Lihat jadwal" } }
          : openThisWeek < 4
            ? { title: "Buka jam kosong minggu ini", body: "Coach dengan minimal 4 jam kosong dalam 14 hari ke depan tampil di halaman beli paket member.", href: "/coach/jadwal", cta: "Buka jadwal" }
            : { title: "Semua beres", body: `${openThisWeek} jam kosong 7 hari ke depan siap dibooking member.`, secondary: { href: "/coach/jadwal", label: "Lihat jadwal" } };

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <NextStepCard {...step} tone="soft" className="md:col-span-4" />
        <BalanceCard
          label="Saldo bisa dicairkan"
          amount={formatRupiah(profile?.walletBalance ?? 0)}
          hint="Bertambah setelah sesi ditandai Hadir."
          href="/coach/saldo"
          cta="Cairkan saldo"
          className="md:col-span-2"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        {overdue.length > 0 && (
          <BentoCard title="Pencairan ditahan" href="/coach/peserta" linkLabel="Update milestone" className="md:col-span-6">
            <p className="text-sm text-warning-text">
              {overdue.map((o) => o.name).join(", ")} sudah {MILESTONE_NOTE_EVERY_SESSIONS} sesi Hadir atau lebih tanpa catatan
              milestone darimu. Isi catatannya supaya saldo bisa dicairkan lagi.
            </p>
          </BentoCard>
        )}
        {owed.length > 0 && (
          <BentoCard title="Sesi yang harus kamu sediakan" href="/coach/jadwal" linkLabel="Buka jadwal" className="md:col-span-6">
            <p className={`text-sm ${owedBlocked.length > 0 ? "text-danger-text" : "text-text-muted"}`}>
              <b>{owedTotal} sesi</b> dari {owed.length} paket member belum terjadwal.
              {owedBlocked.length > 0
                ? ` ${owedBlocked.length} member belum bisa booking karena kamu belum membuka jam kosong di kolamnya. ${FREE_CHANGE_AFTER_DAYS} hari tanpa jadwal = member boleh pindah coach tanpa biaya dan tercatat pelanggaran.`
                : " Semua member ini sudah bisa booking jam kosongmu."}
            </p>
            <ul className="mt-3 flex flex-col divide-y divide-border text-sm">
              {owed.map((p) => {
                const blocked = !owedBookable.has(p.id);
                const daysLeft = p.expiredDate ? Math.max(0, Math.ceil((p.expiredDate.getTime() - now.getTime()) / 86_400_000)) : null;
                return (
                  <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span className="min-w-0 text-text">
                      <b>{p.dependent.name}</b> · {p.pool.name} · {p.sisaSesi} sesi belum terjadwal
                      {daysLeft != null && ` · paket berakhir ${daysLeft} hari lagi`}
                    </span>
                    {blocked && (
                      <span className="text-xs font-medium text-danger-text">
                        Belum ada jam kosong{p.noSlotSince ? ` (hari ke-${daysWithoutSlot(p.noSlotSince, now)})` : ""}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </BentoCard>
        )}
        <BentoCard title="Ringkasan" className="md:col-span-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Sesi belum ditandai" value={unmarked.length} tone={unmarked.length > 0 ? "warning" : undefined} hint="Saldo masuk setelah ditandai" />
            <Stat label="Jam kosong 7 hari ke depan" value={openThisWeek} />
            <Stat label="Kolam tempat mengajar" value={pools.length} hint={pools.map((p) => p.pool.name).join(", ") || "Belum ada"} />
          </div>
        </BentoCard>

        <BentoCard
          title="Sesi belum ditandai Hadir"
          href="/coach/riwayat-sesi"
          linkLabel="Semua sesi"
          className={unmarked.length > 0 ? "md:col-span-6" : "md:col-span-2"}
        >
          {unmarked.length === 0 ? (
            <p className="text-sm text-text-muted">Semua sesi sudah ditandai.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {unmarked.slice(0, 6).map((b) => (
                <li key={b.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tabular-nums text-text">
                      {b.package.dependent.name} · {formatTimeWib(b.availability.startTime)}–{formatTimeWib(b.availability.endTime)}
                    </p>
                    <p className="text-sm text-text-muted">
                      {b.availability.date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · {b.availability.pool.name}
                    </p>
                  </div>
                  <div className="sm:w-72 sm:shrink-0">
                    <AttendanceButtons
                      bookingId={b.id}
                      lockedReason={coachCanMarkAttendance(b.availability.endTime) ? undefined : `Lewat ${ATTENDANCE_MARK_WINDOW_HOURS} jam, hubungi admin`}
                    />
                  </div>
                </li>
              ))}
              {unmarked.length > 6 && <li className="pt-3 text-xs text-text-subtle">+{unmarked.length - 6} sesi lainnya di Riwayat Sesi</li>}
            </ul>
          )}
        </BentoCard>
        <BentoCard title="Jadwal hari ini" href="/coach/jadwal" className={unmarked.length > 0 ? "md:col-span-3" : "md:col-span-2"}>
          <SessionList items={slots.filter((s) => s.date.getTime() === today.getTime()).map(toItem)} empty="Tidak ada sesi yang dibooking hari ini." />
        </BentoCard>
        <BentoCard title="Jadwal besok" href="/coach/jadwal" className={unmarked.length > 0 ? "md:col-span-3" : "md:col-span-2"}>
          <SessionList items={slots.filter((s) => s.date.getTime() === tomorrow.getTime()).map(toItem)} empty="Belum ada sesi yang dibooking besok." />
        </BentoCard>

        {!profile?.certificates.length && (
          <BentoCard title="Lengkapi profil" href="/profil" linkLabel="Buka profil" className="md:col-span-6">
            <p className="text-sm text-text-muted">
              Unggah foto dan sertifikat supaya profilmu tampil lebih meyakinkan di mata orang tua. Badge
              &quot;Bersertifikat&quot; muncul setelah sertifikat disetujui admin.
            </p>
          </BentoCard>
        )}

        {profile && (
          <AffiliateCard owner={{ coachProfileId: profile.id }} name={session.user.name ?? "Coach"} className="md:col-span-6" />
        )}
      </div>
    </main>
  );
}
