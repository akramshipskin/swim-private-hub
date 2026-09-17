import { requireRole } from "@/lib/require-role";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { usablePackageConditions } from "@/lib/active-package";
import { todayWibDateString, dateLabel, addDaysToDateString, wibDateTime, formatDateLabel } from "@/lib/datetime";
import { BentoCard, Stat, ActionRow, SessionList } from "@/components/dashboard";
import { getPlatformBalance } from "@/lib/platform-wallet";

// Dashboard admin: kondisi bisnis hari ini dalam 1 layar. Semua angka query
// langsung (bukan cache). Detail lengkap lewat tautan "Selengkapnya".
export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const tomorrow = dateLabel(addDaysToDateString(todayStr, 1));
  const startToday = wibDateTime(todayStr, "00:00");
  const startMonth = wibDateTime(`${todayStr.slice(0, 7)}-01`, "00:00");
  const now = new Date();

  const [
    bookings,
    paidToday,
    paidMonth,
    activeMembers,
    totalMembers,
    activeCoaches,
    pools,
    activePackages,
    waitingChats,
    pendingWithdrawals,
    pendingCerts,
    unmarked,
    coachWallets,
    platformMonth,
    platformBalance,
    pendingTemplates,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "BOOKED", availability: { date: { in: [today, tomorrow] } } },
      orderBy: { availability: { startTime: "asc" } },
      select: {
        id: true,
        availability: {
          select: { date: true, startTime: true, endTime: true, coach: { select: { name: true } }, pool: { select: { name: true } } },
        },
        package: { select: { dependent: { select: { name: true } } } },
      },
    }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", updatedAt: { gte: startToday } }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", updatedAt: { gte: startMonth } }, _sum: { amount: true }, _count: true }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true, packages: { some: usablePackageConditions() } } }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
    prisma.user.count({ where: { role: "COACH", isActive: true } }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true, walletBalance: true } }),
    prisma.package.count({ where: usablePackageConditions() }),
    prisma.chatThread.count({ where: { needsAdmin: true } }),
    prisma.withdrawalRequest.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _count: true, _sum: { amount: true } }),
    prisma.coachProfile.count({ where: { certificateStatus: "PENDING" } }),
    prisma.booking.count({ where: { status: "BOOKED", attended: null, availability: { endTime: { lt: now } } } }),
    prisma.coachProfile.aggregate({ _sum: { walletBalance: true } }),
    prisma.walletTransaction.groupBy({
      by: ["type"],
      where: { type: { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] }, createdAt: { gte: startMonth } },
      _sum: { amount: true },
    }),
    getPlatformBalance(),
    prisma.packageTemplate.count({ where: { pendingChanges: { not: Prisma.DbNull } } }),
  ]);
  const monthSum = (t: string) => platformMonth.find((r) => r.type === t)?._sum.amount ?? 0;

  const toItem = (b: (typeof bookings)[number]) => ({
    id: b.id,
    startTime: b.availability.startTime,
    endTime: b.availability.endTime,
    poolName: b.availability.pool.name,
    coachName: b.availability.coach.name,
    who: b.package.dependent.name,
  });
  const todayItems = bookings.filter((b) => b.availability.date.getTime() === today.getTime()).map(toItem);
  const tomorrowItems = bookings.filter((b) => b.availability.date.getTime() === tomorrow.getTime()).map(toItem);
  const activePools = pools.filter((p) => p.isActive);
  const poolWalletTotal = pools.reduce((sum, p) => sum + p.walletBalance, 0);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)} · kondisi bisnis hari ini</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard title="Hari ini" className="md:col-span-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Sesi hari ini" value={todayItems.length} />
            <Stat label="Sesi besok" value={tomorrowItems.length} />
            <Stat label="Uang masuk hari ini" value={formatRupiah(paidToday._sum.amount ?? 0)} hint={`${paidToday._count} transaksi`} />
            <Stat label="Uang masuk bulan ini" value={formatRupiah(paidMonth._sum.amount ?? 0)} hint={`${paidMonth._count} transaksi`} />
          </div>
        </BentoCard>

        <BentoCard title="Perlu tindakan" className="md:col-span-2 md:row-span-2">
          <div className="flex flex-col">
            <ActionRow label="Pesan perlu dibalas" count={waitingChats} href="/admin/pesan" />
            <ActionRow
              label="Pencairan menunggu"
              count={pendingWithdrawals._count}
              href="/admin/withdrawals"
              detail={formatRupiah(pendingWithdrawals._sum.amount ?? 0)}
            />
            <ActionRow label="Sertifikat coach menunggu" count={pendingCerts} href="/admin/users" />
            <ActionRow label="Usulan paket/harga kolam" count={pendingTemplates} href="/admin/paket" />
            <ActionRow label="Kolam belum disetujui" count={pools.length - activePools.length} href="/admin/kolam" />
            <ActionRow label="Sesi lewat belum ditandai hadir" count={unmarked} href="/admin/booking-overview" detail="Saldo kolam & coach belum masuk" />
          </div>
        </BentoCard>

        <BentoCard title="Jadwal hari ini" href="/admin/booking-overview" className="md:col-span-2">
          <SessionList items={todayItems} empty="Tidak ada sesi hari ini." />
        </BentoCard>
        <BentoCard title="Jadwal besok" href="/admin/booking-overview" className="md:col-span-2">
          <SessionList items={tomorrowItems} empty="Belum ada sesi besok." />
        </BentoCard>

        <BentoCard title="Pendapatan platform" href="/admin/withdrawals" linkLabel="Tarik saldo" className="md:col-span-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Pendapatan bersih bulan ini" value={formatRupiah(monthSum("PLATFORM_REVENUE"))} tone="success" />
            <Stat label="PPN 12% bulan ini" value={formatRupiah(monthSum("PLATFORM_TAX"))} />
            <Stat label="Saldo pendapatan bisa ditarik" value={formatRupiah(platformBalance.revenue)} />
            <Stat label="Saldo pajak belum disetor" value={formatRupiah(platformBalance.tax)} />
          </div>
          <p className="mt-3 text-xs text-text-subtle">Dihitung dari komisi setiap sesi yang ditandai Hadir (komisi sudah termasuk PPN).</p>
        </BentoCard>

        <BentoCard title="Pengguna" href="/admin/users" className="md:col-span-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Member punya paket aktif" value={activeMembers} hint={`dari ${totalMembers} member`} />
            <Stat label="Paket aktif" value={activePackages} />
            <Stat label="Coach aktif" value={activeCoaches} />
            <Stat label="Kolam aktif" value={activePools.length} />
          </div>
        </BentoCard>

        <BentoCard title="Saldo belum dicairkan" href="/admin/komisi" className="md:col-span-3">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Total saldo kolam" value={formatRupiah(poolWalletTotal)} />
            <Stat label="Total saldo coach" value={formatRupiah(coachWallets._sum.walletBalance ?? 0)} />
          </div>
        </BentoCard>

        <BentoCard title="Per kolam" href="/admin/kolam" className="md:col-span-6">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map((p) => (
              <li key={p.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-semibold text-text">
                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(belum disetujui)</span>}
                </p>
                <p className="text-sm text-text-muted">
                  {todayItems.filter((i) => i.poolName === p.name).length} sesi hari ini ·{" "}
                  {tomorrowItems.filter((i) => i.poolName === p.name).length} besok · saldo {formatRupiah(p.walletBalance)}
                </p>
              </li>
            ))}
          </ul>
        </BentoCard>
      </div>
    </main>
  );
}
