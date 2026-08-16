import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import CreateTemplateForm from "./create-template-form";
import TemplateEditForm from "./template-edit-form";
import AssignPackageForm from "./assign-package-form";
import PackageEditForm from "./package-edit-form";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLabel } from "@/lib/datetime";

const statusTone = {
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
} as const;

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  ACTIVE: "Aktif",
  EXPIRED: "Kedaluwarsa",
};

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
        {packages.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text">
                  {p.member.name}{" "}
                  <span className="text-text-subtle">({p.member.email ?? p.member.phone ?? "-"})</span>
                </p>
                <p className="text-xs text-text-subtle">
                  Member sejak {memberSince(p.member.createdAt)}
                </p>
                <p className="mb-3 mt-1 text-sm text-text-muted">{p.name}</p>

                <PackageEditForm
                  pkg={{
                    id: p.id,
                    sisaSesi: p.sisaSesi,
                    totalSesi: p.totalSesi,
                    status: p.status,
                    expiredDateInput: toInputDate(p.expiredDate),
                  }}
                />
              </div>

              <div className="shrink-0 rounded-lg bg-surface-muted px-4 py-3 sm:text-right">
                <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                <p className="mt-2 text-sm font-semibold text-text">
                  {p.sisaSesi}/{p.totalSesi} sesi
                </p>
                <p className="text-xs text-text-subtle">
                  {p.expiredDate
                    ? `Berlaku s.d. ${formatDateLabel(p.expiredDate)}`
                    : "Gak ada batas waktu"}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </ul>
    </main>
  );
}
