import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CreateTemplateForm from "./create-template-form";
import TemplateEditForm from "./template-edit-form";
import PaketPerMemberList from "./paket-per-member-list";
import PendingTemplateChanges from "./pending-template-changes";

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

export default async function AdminPaketPage() {
  await requireRole("ADMIN");

  const [templates, members, pools] = await Promise.all([
    prisma.packageTemplate.findMany({
      orderBy: [{ pool: { name: "asc" } }, { totalSesi: "asc" }],
      include: { pool: { select: { name: true } } },
    }),
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
          },
        },
      },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
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

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola Paket</h1>

      <PendingTemplateChanges />

      {/* --- Katalog Paket --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Katalog Paket</h2>
      <p className="mb-3 text-sm text-text-muted">
        Paket generik, tidak ditujukan ke member manapun — ini yang muncul di halaman
        &ldquo;Beli Paket&rdquo; member.
      </p>

      <CreateTemplateForm pools={pools} />

      {/* 2 kolom = 2 KOLAM sejajar, paketnya numpuk ke bawah di dalam
          kolomnya masing-masing (Hadi 18 Sep v3). Sebelumnya kebalik:
          1 kolam sebaris penuh, paketnya yang melebar ke samping. */}
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...new Set(templates.map((t) => t.pool.name))].map((poolName) => (
          <section key={poolName}>
            <h3 className="mb-2 text-base font-semibold text-brand-700">{poolName}</h3>
            <ul className="flex flex-col gap-3">
              {templates
                .filter((t) => t.pool.name === poolName)
                .map((t) => (
                  <li key={t.id}>
                    <TemplateEditForm template={t} />
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>

      {/* --- List member + paket, advanced --- */}
      <p className="mb-3 text-xs text-text-subtle">
        Mau tambah peserta atau assign paket khusus ke member? Sekarang ada di
        tab <span className="font-medium text-text-muted">Users</span>.
      </p>
      <h2 className="mb-3 text-lg font-semibold text-text">Paket per Member</h2>
      <PaketPerMemberList
        rows={members.map((m) => ({
          memberId: m.id,
          memberName: m.name,
          memberContact: m.email ?? m.phone ?? "-",
          memberSinceLabel: memberSince(m.createdAt),
          // 1 baris per (peserta, kolam): paket sekarang per kolam, jadi 1 peserta
          // bisa punya paket di beberapa kolam. Ambil paket terbaru per kolam.
          peserta: m.dependents.flatMap((d): Parameters<typeof PaketPerMemberList>[0]["rows"][number]["peserta"] => {
            const latestPerPool = [
              ...new Map(
                m.packages.filter((p) => p.dependentId === d.id).reverse().map((p) => [p.poolId, p])
              ).values(),
            ];
            const label = d.isSelf ? "Diri sendiri" : d.name;
            if (latestPerPool.length === 0) return [{ dependentId: d.id, label, pkg: null }];
            return latestPerPool.map((pkg) => ({
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
              },
            }));
          }),
        }))}
      />
    </main>
  );
}
