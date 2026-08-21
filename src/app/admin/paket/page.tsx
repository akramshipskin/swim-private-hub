import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CreateTemplateForm from "./create-template-form";
import TemplateEditForm from "./template-edit-form";
import AssignPackageForm from "./assign-package-form";
import PackageMemberCard from "./package-member-card";

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

  const [members, templates, packages] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.packageTemplate.findMany({ orderBy: { totalSesi: "asc" } }),
    prisma.package.findMany({
      orderBy: { createdAt: "desc" },
      include: { member: { select: { name: true, email: true, phone: true, createdAt: true } } },
    }),
  ]);

  const cancelUsedByPackage = new Map(
    (
      await prisma.booking.groupBy({
        by: ["packageId"],
        where: { packageId: { in: packages.map((p) => p.id) }, status: "CANCELLED", cancelledBy: "MEMBER" },
        _count: true,
      })
    ).map((r) => [r.packageId, r._count])
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola Paket</h1>

      {/* --- Katalog Paket --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Katalog Paket</h2>
      <p className="mb-3 text-sm text-text-muted">
        Paket generik, gak ditujukan ke member manapun -- ini yang muncul di halaman
        &ldquo;Beli Paket&rdquo; member.
      </p>

      <CreateTemplateForm />

      <ul className="mb-8 flex flex-col gap-2">
        {templates.map((t) => (
          <li key={t.id}>
            <TemplateEditForm template={t} />
          </li>
        ))}
      </ul>

      {/* --- Assign paket khusus ke member --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Assign Paket ke Member</h2>
      <p className="mb-3 text-sm text-text-muted">
        Buat paket khusus buat 1 member tertentu (koreksi, promo, atau kasus di luar
        alur beli-online).
      </p>

      <AssignPackageForm members={members} templates={templates} />

      {/* --- List member + paket, advanced --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Paket per Member</h2>
      <ul className="flex flex-col gap-3">
        {packages.map((p) => {
          const cancelUsed = cancelUsedByPackage.get(p.id) ?? 0;
          const cancelRemaining = Math.max(0, p.jatahCancel - cancelUsed);

          return (
            <PackageMemberCard
              key={p.id}
              memberName={p.member.name}
              memberContact={p.member.email ?? p.member.phone ?? "-"}
              memberSinceLabel={memberSince(p.member.createdAt)}
              cancelRemaining={cancelRemaining}
              pkg={{
                id: p.id,
                name: p.name,
                sisaSesi: p.sisaSesi,
                totalSesi: p.totalSesi,
                jatahCancel: p.jatahCancel,
                status: p.status,
                expiredDate: p.expiredDate,
                expiredDateInput: toInputDate(p.expiredDate),
              }}
            />
          );
        })}
      </ul>
    </main>
  );
}
