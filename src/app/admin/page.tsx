import { PENDING_APPROVAL_WHERE } from "@/lib/pending-approval";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { usablePackageConditions } from "@/lib/active-package";
import { todayWibDateString, dateLabel, addDaysToDateString, wibDateTime, formatDateLabel } from "@/lib/datetime";
import { BentoCard, Stat, ActionRow, SessionList } from "@/components/dashboard";
import { getPlatformBalance } from "@/lib/platform-wallet";
import { isWithdrawalOverdue } from "@/lib/withdrawal-deadline";

// Dashboard admin: kondisi bisnis hari ini dalam 1 layar. Semua angka query
// langsung (bukan cache). Detail lengkap lewat tautan "Selengkapnya".
export const metadata = { title: "Dashboard Admin | Swim Private Hub" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const todayStr = todayWibDateString();
  const today = dateLabel(todayStr);
  const tomorrow = dateLabel(addDaysToDateString(todayStr, 1));
  const startToday = wibDateTime(todayStr, "00:00");
  const startMonth = wibDateTime(`${todayStr.slice(0, 7)}-01`, "00:00");
  const now = new Date();
  const openWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
    select: { status: true, requestedAt: true },
  });
  const overdueWithdrawals = openWithdrawals.filter((w) => isWithdrawalOverdue(w, now)).length;
  const deletionRequests = await prisma.user.findMany({
    where: { deletionRequestedAt: { not: null }, anonymizedAt: null },
    orderBy: { deletionRequestedAt: "asc" },
    select: { id: true },
  });

  const [
    bookings,
    paidToday,
    paidMonth,
    activeMembers,
    totalMembers,
    activeCoaches,
    pools,
    activePackages,
    activeDependents,
    waitingChats,
    pendingWithdrawals,
    pendingCerts,
    pendingMilestoneProposals,
    unmarked,
    coachWallets,
    platformMonth,
    platformBalance,
    pendingAccounts,
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
    prisma.payment.aggregate({ where: { status: "SUCCESS", paidAt: { gte: startToday } }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", paidAt: { gte: startMonth } }, _sum: { amount: true }, _count: true }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true, packages: { some: usablePackageConditions() } } }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
    prisma.user.count({ where: { role: "COACH", isActive: true } }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true, walletBalance: true } }),
    // Sama dengan "Member punya paket aktif": hanya akun member yang masih
    // aktif (akun nonaktif tidak bisa login/booking, paketnya tidak terpakai).
    prisma.package.count({ where: { ...usablePackageConditions(), member: { isActive: true } } }),
    prisma.dependent.count({ where: { isActive: true, member: { isActive: true }, packages: { some: usablePackageConditions() } } }),
    prisma.chatThread.count({ where: { needsAdmin: true } }),
    prisma.withdrawalRequest.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _count: true, _sum: { amount: true } }),
    prisma.coachCertificate.count({ where: { status: "PENDING" } }),
    prisma.milestoneItem.count({ where: { proposalStatus: "PENDING" } }),
    prisma.booking.count({ where: { status: "BOOKED", attended: null, availability: { endTime: { lt: now } } } }),
    prisma.coachProfile.aggregate({ _sum: { walletBalance: true } }),
    prisma.walletTransaction.groupBy({
      by: ["type"],
      where: { type: { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] }, createdAt: { gte: startMonth } },
      _sum: { amount: true },
    }),
    getPlatformBalance(),
    prisma.user.count({ where: PENDING_APPROVAL_WHERE }),
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
  // "Saldo mengendap" = semua uang yang sudah masuk sistem tapi belum ditarik
  // siapa pun: bagian kolam + bagian coach + pendapatan & pajak platform.
  const totalHeldBalance =
    poolWalletTotal + (coachWallets._sum.walletBalance ?? 0) + platformBalance.revenue + platformBalance.tax;

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{formatDateLabel(today)} · kondisi bisnis hari ini</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard title="Hari ini" className="md:col-span-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Sesi Hari Ini" value={todayItems.length} />
            <Stat label="Sesi Besok" value={tomorrowItems.length} />
            <Stat label="Uang Masuk Hari Ini" value={formatRupiah(paidToday._sum.amount ?? 0)} hint={`${paidToday._count} transaksi`} />
            <Stat label="Uang Masuk Bulan Ini" value={formatRupiah(paidMonth._sum.amount ?? 0)} hint={`${paidMonth._count} transaksi`} />
            <Stat
              label="Saldo Mengendap"
              value={formatRupiah(totalHeldBalance)}
              hint="Kolam + coach + platform (termasuk pendapatan yang masih ditahan 3 hari), belum ditarik"
            />
          </div>
        </BentoCard>

        <BentoCard title="Perlu Kamu Cek" className="md:col-span-2 md:row-span-2">
          <div className="flex flex-col">
            <ActionRow label="Pesan Perlu Dibalas" count={waitingChats} href="/admin/pesan" />
            <ActionRow
              label="Pengajuan Hapus Akun"
              count={deletionRequests.length}
              href={deletionRequests[0] ? `/admin/users/${deletionRequests[0].id}` : "/admin/users"}
            />
            <ActionRow
              label="Penarikan Menunggu"
              count={pendingWithdrawals._count}
              href="/admin/withdrawals"
              detail={formatRupiah(pendingWithdrawals._sum.amount ?? 0)}
            />
            <ActionRow
              label="Penarikan lewat 7 hari kerja"
              count={overdueWithdrawals}
              href="/admin/withdrawals"
              detail="Janji transfer di perjanjian coach & MOU kolam"
            />
            <ActionRow label="Sertifikat Coach Menunggu" count={pendingCerts} href="/admin/users" />
            <ActionRow label="Usulan Keterampilan Milestone" count={pendingMilestoneProposals} href="/admin/milestone" />
            <ActionRow label="Coach/pemilik kolam baru menunggu persetujuan" count={pendingAccounts} href="/admin/users" />
            <ActionRow label="Kolam Belum Disetujui" count={pools.length - activePools.length} href="/admin/kolam" />
            <ActionRow label="Sesi lewat belum ditandai Hadir" count={unmarked} href="/admin/booking-overview" detail="Saldo kolam & coach baru masuk setelah ditandai Hadir" />
          </div>
        </BentoCard>

        <BentoCard title="Jadwal hari ini" href="/admin/booking-overview" className="md:col-span-2">
          <SessionList items={todayItems} empty="Tidak ada sesi hari ini." />
        </BentoCard>
        <BentoCard title="Jadwal besok" href="/admin/booking-overview" className="md:col-span-2">
          <SessionList items={tomorrowItems} empty="Belum ada sesi besok." />
        </BentoCard>

        <BentoCard title="Pendapatan platform" href="/admin/withdrawals" linkLabel="Cairkan saldo" className="md:col-span-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Pendapatan Bersih Bulan Ini" value={formatRupiah(monthSum("PLATFORM_REVENUE"))} tone="success" />
            <Stat label="PPN Bulan Ini" value={formatRupiah(monthSum("PLATFORM_TAX"))} />
            <Stat label="Pendapatan Bersih Bisa Ditarik" value={formatRupiah(Math.max(0, platformBalance.availableRevenue))} />
            <Stat label="Saldo PPN Belum Disetor" value={formatRupiah(platformBalance.tax)} />
          </div>
          <p className="mt-3 text-xs text-text-subtle">Dihitung dari komisi setiap sesi yang ditandai Hadir (komisi sudah termasuk PPN). Tarif 11% sejak 30 Sep 2026; sesi sebelumnya 12%.</p>
        </BentoCard>

        <BentoCard title="Akun" href="/admin/users" className="md:col-span-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
            <Stat label="Member Punya Paket Aktif" value={activeMembers} hint={`dari ${totalMembers} member`} />
            <Stat label="Peserta Sedang Les" value={activeDependents} hint={`${activePackages} paket aktif`} />
            <Stat label="Coach Aktif" value={activeCoaches} />
            <Stat label="Kolam Aktif" value={activePools.length} />
          </div>
        </BentoCard>

        <BentoCard title="Saldo belum ditarik" href="/admin/komisi" className="md:col-span-3">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Total Saldo Kolam" value={formatRupiah(poolWalletTotal)} />
            <Stat label="Total Saldo Coach" value={formatRupiah(coachWallets._sum.walletBalance ?? 0)} />
          </div>
        </BentoCard>

        <BentoCard title="Ringkasan tiap kolam" href="/admin/kolam" className="md:col-span-6">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map((p) => (
              <li key={p.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-semibold text-text">
                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(nonaktif)</span>}
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
