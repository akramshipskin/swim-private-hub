import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";
import { formatRupiah } from "@/lib/format";
import { todayWibDateString, dateLabel, wibDateTime, formatDateLabel, formatTimeWib, addDaysToDateString } from "@/lib/datetime";
import { groupByHour } from "@/lib/pool-occupancy";
import { BalanceCard, BentoCard, NextStepCard, Stat } from "@/components/dashboard";
import { AffiliateCard } from "@/components/affiliate-card";
import { releaseDueCommissions } from "@/lib/affiliate";

export const metadata = { title: "Dashboard Kolam | Swim Private Hub" };

export default async function PoolDashboardPage() {
  const session = await requireRole("POOL_OWNER");
  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const startMonth = wibDateTime(`${todayStr.slice(0, 7)}-01`, "00:00");

  await releaseDueCommissions();
  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      walletBalance: true,
      openTime: true,
      closeTime: true,
      facilities: true,
      description: true,
      _count: { select: { affiliations: true } },
      availabilities: {
        where: { date: today, ...NOT_CLOSED },
        orderBy: { startTime: "asc" },
        select: {
          startTime: true,
          endTime: true,
          status: true,
          coach: { select: { name: true } },
          bookings: { where: { status: "BOOKED" }, select: { package: { select: { dependent: { select: { name: true } } } } } },
        },
      },
    },
  });

  if (pools.length === 0) {
    return <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">Akun ini belum terhubung ke kolam mana pun. Hubungi admin.</main>;
  }

  const ids = pools.map((p) => p.id);
  const weekEnd = dateLabel(addDaysToDateString(todayStr, 7));
  const [attended, revenue, sold, pendingWithdrawals, weekSlots] = await Promise.all([
    prisma.booking.groupBy({
      by: ["availabilityId"],
      where: { attended: true, availability: { poolId: { in: ids }, startTime: { gte: startMonth } } },
      _count: true,
    }).then(async (rows) =>
      prisma.availability.groupBy({ by: ["poolId"], where: { id: { in: rows.map((r) => r.availabilityId) } }, _count: true })
    ),
    prisma.walletTransaction.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, type: "SESSION_REVENUE", bookingId: { not: null }, createdAt: { gte: startMonth } }, _sum: { amount: true } }),
    prisma.package.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, startDate: { gte: startMonth } }, _count: true }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amount: true } }),
    // "Terisi 7 hari ke depan": slot coach yang sudah dibooking dibanding semua slot yang dibuka.
    prisma.availability.groupBy({
      by: ["poolId", "date", "status"],
      where: { poolId: { in: ids }, date: { gte: today, lt: weekEnd }, ...NOT_CLOSED },
      _count: true,
    }),
  ]);
  const pick = <T extends { poolId: string | null }>(rows: T[], id: string) => rows.find((r) => r.poolId === id);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)}</p>

      {pools.map((p) => {
        const slots = p.availabilities.map((a) => ({
          startTime: a.startTime,
          endTime: a.endTime,
          booked: a.status === "BOOKED",
          coachName: a.coach.name,
          who: a.bookings[0]?.package.dependent.name,
        }));
        const bookedToday = slots.filter((s) => s.booked).length;
        const rows = groupByHour(slots, p.openTime, p.closeTime);
        const busiest = Math.max(1, ...rows.map((r) => r.booked.length));
        // Satu langkah berikutnya per kolam (rombak UI 4 Okt).
        const now = new Date();
        const nextLes = slots.find((x) => x.booked && x.endTime > now);
        const step = !p.openTime || !p.closeTime
          ? { title: "Isi jam buka kolam", body: "Coach belum bisa membuka jadwal di kolammu sebelum jam buka diisi.", href: "/pool/info", cta: "Isi jam buka" }
          : p._count.affiliations === 0
            ? { title: "Belum ada coach di kolammu", body: "Coach memilih sendiri kolam tempat mengajar. Lengkapi foto, fasilitas, dan deskripsi supaya kolammu menarik dipilih.", href: "/pool/info", cta: "Lengkapi info kolam" }
            : nextLes
              ? { eyebrow: "Les berikutnya hari ini", title: `${formatTimeWib(nextLes.startTime)}–${formatTimeWib(nextLes.endTime)} · ${nextLes.who ?? "Peserta"}`, body: `Dengan ${nextLes.coachName}. Total ${bookedToday} sesi les hari ini.`, secondary: { href: "/pool/jadwal", label: "Lihat Jadwal" } }
              : !p.description || p.facilities.length === 0
                ? { title: "Lengkapi info kolam", body: "Deskripsi dan fasilitas membantu member memilih kolammu.", href: "/pool/info", cta: "Lengkapi info" }
                : { title: "Tidak ada les lagi hari ini", body: `Saldo bisa ditarik ${formatRupiah(p.walletBalance)}.`, secondary: { href: "/pool/saldo", label: "Lihat Saldo" } };
        return (
          <section key={p.id} className="mt-6">
            {pools.length > 1 && <h2 className="mb-3 text-xl font-semibold text-text">{p.name}</h2>}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-6">
              <NextStepCard {...step} tone="soft" className="md:col-span-4" />
              <BalanceCard
                label="Saldo Bisa Ditarik"
                amount={formatRupiah(p.walletBalance)}
                hint={`Dalam proses penarikan: ${formatRupiah(pick(pendingWithdrawals, p.id)?._sum.amount ?? 0)}`}
                href="/pool/saldo"
                cta="Buka saldo"
                className="md:col-span-2"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <BentoCard title="Ringkasan bulan ini" href="/pool/laporan" className="md:col-span-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
                  <Stat label="Sesi Hadir" value={pick(attended, p.id)?._count ?? 0} />
                  <Stat label="Bagian Kolam" value={formatRupiah(pick(revenue, p.id)?._sum.amount ?? 0)} hint="Sebelum PPh 0,5%" />
                  <Stat label="Paket Terjual" value={pick(sold, p.id)?._count ?? 0} />
                  <Stat label="Coach Terdaftar" value={p._count.affiliations} />
                </div>
              </BentoCard>
              <BentoCard title="Info kolam" href="/pool/info" linkLabel="Ubah" className="md:col-span-2">
                <p className="text-sm text-text">Jam buka: {p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : "belum diisi"}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {p.facilities.length > 0 ? `Fasilitas: ${p.facilities.join(", ")}` : "Fasilitas belum diisi."}
                </p>
                {!p.description && <p className="mt-2 text-sm text-warning-text">Deskripsi kolam belum diisi.</p>}
              </BentoCard>

              <BentoCard title={`Jam ramai hari ini · ${bookedToday} sesi les`} href="/pool/jadwal" linkLabel="Lihat jadwal" className="md:col-span-3">
                {rows.every((r) => r.booked.length === 0 && r.open.length === 0) ? (
                  <p className="text-sm text-text-muted">Belum ada sesi les atau jam kosong coach hari ini.</p>
                ) : (
                <ul className="flex flex-col gap-1">
                  {rows.map((r) => (
                    <li key={r.hour} className="flex items-center gap-3 text-sm">
                      <span className="w-12 shrink-0 tabular-nums text-text-muted">{String(r.hour).padStart(2, "0")}:00</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.booked.length / busiest) * 100}%` }} />
                      </div>
                      <span className="w-40 shrink-0 text-right text-text">
                        {r.booked.length > 0 ? `${r.booked.length} sesi les` : r.open.length > 0 ? `${r.open.length} jam kosong` : "Tidak ada les"}
                      </span>
                    </li>
                  ))}
                </ul>
                )}
              </BentoCard>
              <BentoCard title="Terisi 7 hari ke depan" href="/pool/jadwal" linkLabel="Lihat jadwal" className="md:col-span-3">
                {(() => {
                  const days = Array.from({ length: 7 }, (_, i) => addDaysToDateString(todayStr, i)).map((d) => {
                    const rowsDay = weekSlots.filter((w) => w.poolId === p.id && w.date.getTime() === dateLabel(d).getTime());
                    const total = rowsDay.reduce((n, w) => n + w._count, 0);
                    const booked = rowsDay.filter((w) => w.status === "BOOKED").reduce((n, w) => n + w._count, 0);
                    return { d, total, booked };
                  });
                  if (days.every((x) => x.total === 0)) return <p className="text-sm text-text-muted">Belum ada jam yang dibuka coach 7 hari ke depan.</p>;
                  return (
                    <ul className="flex flex-col gap-1.5">
                      {days.map((x) => (
                        <li key={x.d} className="flex items-center gap-3 text-sm">
                          <span className="w-12 shrink-0 text-text-muted">
                            {dateLabel(x.d).toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" })}
                          </span>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: x.total ? `${(x.booked / x.total) * 100}%` : "0%" }} />
                          </div>
                          <span className="w-20 shrink-0 text-right tabular-nums text-text">{x.booked}/{x.total}</span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </BentoCard>

              <AffiliateCard owner={{ poolId: p.id }} name={p.name.replace(/^kolam( renang)?\s+/i, "")} className="md:col-span-6" />
            </div>
          </section>
        );
      })}
    </main>
  );
}
