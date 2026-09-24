import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";
import { formatRupiah } from "@/lib/format";
import { todayWibDateString, dateLabel, wibDateTime, formatDateLabel } from "@/lib/datetime";
import { groupByHour } from "@/lib/pool-occupancy";
import { BentoCard, Stat } from "@/components/dashboard";

export default async function PoolDashboardPage() {
  const session = await requireRole("POOL_OWNER");
  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const startMonth = wibDateTime(`${todayStr.slice(0, 7)}-01`, "00:00");

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
  const [attended, revenue, sold, pendingWithdrawals] = await Promise.all([
    prisma.booking.groupBy({
      by: ["availabilityId"],
      where: { attended: true, availability: { poolId: { in: ids }, startTime: { gte: startMonth } } },
      _count: true,
    }).then(async (rows) =>
      prisma.availability.groupBy({ by: ["poolId"], where: { id: { in: rows.map((r) => r.availabilityId) } }, _count: true })
    ),
    prisma.walletTransaction.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, type: "SESSION_REVENUE", createdAt: { gte: startMonth } }, _sum: { amount: true } }),
    prisma.package.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, startDate: { gte: startMonth } }, _count: true }),
    prisma.withdrawalRequest.groupBy({ by: ["poolId"], where: { poolId: { in: ids }, status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amount: true } }),
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
        return (
          <section key={p.id} className="mt-6">
            {pools.length > 1 && <h2 className="mb-3 text-xl font-semibold text-text">{p.name}</h2>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <BentoCard title="Ringkasan bulan ini" href="/pool/laporan" className="md:col-span-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
                  <Stat label="Sesi dihadiri" value={pick(attended, p.id)?._count ?? 0} />
                  <Stat label="Pendapatan kolam" value={formatRupiah(pick(revenue, p.id)?._sum.amount ?? 0)} />
                  <Stat label="Paket terjual" value={pick(sold, p.id)?._count ?? 0} />
                  <Stat label="Coach terdaftar" value={p._count.affiliations} />
                </div>
              </BentoCard>
              <BentoCard title="Saldo" href="/pool/saldo" className="md:col-span-2">
                <Stat label="Bisa dicairkan" value={formatRupiah(p.walletBalance)} />
                <p className="mt-2 text-sm text-text-muted">
                  Dalam proses pencairan: {formatRupiah(pick(pendingWithdrawals, p.id)?._sum.amount ?? 0)}
                </p>
              </BentoCard>

              <BentoCard title={`Jam ramai hari ini · ${bookedToday} sesi les`} href="/pool/jadwal" linkLabel="Lihat jadwal" className="md:col-span-4">
                <ul className="flex flex-col gap-1">
                  {rows.map((r) => (
                    <li key={r.hour} className="flex items-center gap-3 text-sm">
                      <span className="w-12 shrink-0 tabular-nums text-text-muted">{String(r.hour).padStart(2, "0")}:00</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.booked.length / busiest) * 100}%` }} />
                      </div>
                      <span className="w-40 shrink-0 text-right text-text">
                        {r.booked.length > 0 ? `${r.booked.length} sesi les` : r.open.length > 0 ? `${r.open.length} slot kosong` : "Tidak ada les"}
                      </span>
                    </li>
                  ))}
                </ul>
              </BentoCard>
              <BentoCard title="Info kolam" href="/pool/info" linkLabel="Ubah" className="md:col-span-2">
                <p className="text-sm text-text">Jam buka: {p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : "belum diisi"}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {p.facilities.length > 0 ? `Fasilitas: ${p.facilities.join(", ")}` : "Fasilitas belum diisi."}
                </p>
                {!p.description && <p className="mt-2 text-sm text-warning-text">Deskripsi kolam belum diisi.</p>}
              </BentoCard>
            </div>
          </section>
        );
      })}
    </main>
  );
}
