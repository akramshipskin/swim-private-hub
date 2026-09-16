import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { todayWibDateString, dateLabel } from "@/lib/datetime";

// Home admin -- dulu langsung redirect ke /admin/users, gak ada gambaran
// umum sebelum masuk ke 1 fitur spesifik. Angka di sini semua query
// langsung (bukan cache/snapshot), pola yang sama kayak laporan Komisi.
export default async function AdminHomePage() {
  await requireRole("ADMIN");

  const today = dateLabel(todayWibDateString());

  const [poolCount, coachCount, memberCount, bookingsToday, pendingWithdrawals] = await Promise.all([
    prisma.pool.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "COACH", isActive: true } }),
    prisma.user.count({ where: { role: "MEMBER", isActive: true } }),
    prisma.booking.count({ where: { status: "BOOKED", availability: { date: today } } }),
    prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const stats = [
    { label: "Kolam aktif", value: poolCount, href: "/admin/kolam" },
    { label: "Coach aktif", value: coachCount, href: "/admin/users" },
    { label: "Member aktif", value: memberCount, href: "/admin/users" },
    { label: "Booking hari ini", value: bookingsToday, href: "/admin/booking-overview" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Ringkasan</h1>
      <p className="mt-1 text-sm text-text-muted">Sekilas kondisi platform hari ini.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-surface-muted">
              <CardBody>
                <p className="text-3xl font-bold tabular-nums text-text">{s.value}</p>
                <p className="mt-1 text-xs text-text-muted">{s.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Link href="/admin/withdrawals" className="mt-3 block">
        <Card className="transition-colors hover:bg-surface-muted">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">Pencairan menunggu</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {pendingWithdrawals._count} pengajuan &middot; total Rp
                {(pendingWithdrawals._sum.amount ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
            <span className="text-sm font-medium text-brand-600">Lihat &rarr;</span>
          </CardBody>
        </Card>
      </Link>
    </main>
  );
}
