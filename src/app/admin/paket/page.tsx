import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import PaketPerMemberList from "./paket-per-member-list";
import { packagesToShow } from "@/lib/active-package";

function toInputDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function memberSince(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export const metadata = { title: "Paket | Swim Private Hub" };

export default async function AdminPaketPage() {
  await requireRole("ADMIN");
  const now = new Date();

  const [members] = await Promise.all([
    // Grup per member (bukan per paket) -- 1 member bisa punya >1 peserta,
    // masing-masing punya paketnya sendiri. Cuma member yang punya
    // >=1 paket yang muncul di sini (member polos tanpa paket sama sekali
    // udah kepegang di tab Users).
    prisma.user.findMany({
      where: { role: "MEMBER", packages: { some: {} } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        dependents: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, isSelf: true },
        },
        // Diurut terbaru duluan -- kalau 1 peserta somehow punya >1 paket
        // (renewal lama), yang kepake buat kartu ini cuma yang terbaru.
        packages: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            sisaSesi: true,
            totalSesi: true,
            jatahCancel: true,
            status: true,
            expiredDate: true,
            dependentId: true,
            poolId: true,
            pool: { select: { name: true } },
            saldoUsed: true,
            refundedAt: true,
            refundCash: true,
            refundSaldo: true,
          },
        },
      },
    }),
  ]);

  const allPackageIds = members.flatMap((m) => m.packages.map((p) => p.id));
  const cancelUsedByPackage = new Map(
    (
      await prisma.booking.groupBy({
        by: ["packageId"],
        where: { packageId: { in: allPackageIds }, status: "CANCELLED", cancelledBy: "MEMBER" },
        _count: true,
      })
    ).map((r) => [r.packageId, r._count])
  );

  // Dasar Kembalikan Dana per paket: uang tunai lunas + saldo yang dipakai
  // (termasuk tambah bayar ganti coach).
  const [cashByPackage, changeSaldoByPackage] = await Promise.all([
    prisma.payment.groupBy({ by: ["packageId"], where: { packageId: { in: allPackageIds }, status: "SUCCESS", OR: [{ coachChangeRequestId: null }, { coachChangeRequest: { status: "COMPLETED" } }] }, _sum: { amount: true } }),
    prisma.coachChangeRequest.groupBy({ by: ["packageId"], where: { packageId: { in: allPackageIds }, status: "COMPLETED" }, _sum: { saldoUsed: true } }),
  ]).then(([cash, change]) => [
    new Map(cash.map((r) => [r.packageId, r._sum.amount ?? 0])),
    new Map(change.map((r) => [r.packageId, r._sum.saldoUsed ?? 0])),
  ]);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Paket</h1>

      {/* --- List member + paket, advanced --- */}
      <p className="mb-3 text-xs text-text-subtle">
        Untuk menambah peserta atau memberi paket gratis ke member, buka
        menu <span className="font-medium text-text-muted">Akun</span>.
      </p>
      <h2 className="mb-3 text-lg font-semibold text-text">Paket per Member</h2>
      <PaketPerMemberList
        rows={members.map((m) => ({
          memberId: m.id,
          memberName: m.name,
          memberContact: m.email ?? m.phone ?? "-",
          memberSinceLabel: memberSince(m.createdAt),
          // Paket per kolam: 1 peserta bisa punya paket di beberapa kolam. Per
          // kolam tampil semua paket yang masih bisa dipakai (kalau tidak ada,
          // yang terbaru) -- lihat packagesToShow.
          peserta: m.dependents.flatMap((d): Parameters<typeof PaketPerMemberList>[0]["rows"][number]["peserta"] => {
            const mine = m.packages.filter((p) => p.dependentId === d.id);
            const shownPerPool = [...new Set(mine.map((p) => p.poolId))].flatMap((poolId) =>
              packagesToShow(mine.filter((p) => p.poolId === poolId), now)
            );
            const label = d.isSelf ? "Diri sendiri" : d.name;
            if (shownPerPool.length === 0) return [{ dependentId: d.id, label, pkg: null }];
            return shownPerPool.map((pkg) => ({
              dependentId: d.id,
              label,
              pkg: {
                id: pkg.id,
                name: pkg.name,
                poolName: pkg.pool.name,
                sisaSesi: pkg.sisaSesi,
                totalSesi: pkg.totalSesi,
                jatahCancel: pkg.jatahCancel,
                status: pkg.status,
                expiredDate: pkg.expiredDate,
                expiredDateInput: toInputDate(pkg.expiredDate),
                cancelRemaining: Math.max(0, pkg.jatahCancel - (cancelUsedByPackage.get(pkg.id) ?? 0)),
                refund: {
                  cashPaid: cashByPackage.get(pkg.id) ?? 0,
                  saldoPaid: pkg.saldoUsed + (changeSaldoByPackage.get(pkg.id) ?? 0),
                  refundedAt: pkg.refundedAt,
                  refundCash: pkg.refundCash,
                  refundSaldo: pkg.refundSaldo,
                },
              },
            }));
          }),
        }))}
      />
    </main>
  );
}
