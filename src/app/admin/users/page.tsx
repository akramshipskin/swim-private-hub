import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { usablePackageConditions } from "@/lib/active-package";
import CreateUserForm from "./create-user-form";
import ImportMembersForm from "./import-members-form";
import AddChildForm from "../paket/add-child-form";
import AssignPackageForm from "../paket/assign-package-form";
import UsersMemberSection from "./users-member-section";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-display";
import PendingCertificates from "./pending-certificates";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";
import { formatRupiah } from "@/lib/format";

const roleSections: { role: "ADMIN" | "COACH" | "POOL_OWNER"; label: string }[] = [
  { role: "ADMIN", label: "Admin" },
  { role: "COACH", label: "Coach" },
  { role: "POOL_OWNER", label: "Pemilik Kolam" },
];

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN");

  const [users, templates, dependents, pools] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // Semua paket aktif (bukan cuma 1) -- 1 peserta bisa punya paket
        // sendiri-sendiri, tabel ini butuh nunjukin status per peserta,
        // bukan cuma 1 ringkasan buat seluruh member.
        packages: {
          where: usablePackageConditions(),
          orderBy: { createdAt: "desc" },
        },
        dependents: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, isSelf: true },
        },
        coachProfile: { select: { photoUrl: true, certificateStatus: true, walletBalance: true, birthDate: true, gender: true } },
        poolAffiliations: { select: { pool: { select: { id: true, name: true } } }, orderBy: { pool: { name: "asc" } } },
        poolOwnerships: { select: { pool: { select: { id: true, name: true, walletBalance: true } } } },
      },
    }),
    prisma.packageTemplate.findMany({ orderBy: { totalSesi: "asc" } }),
    prisma.dependent.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, memberId: true, isSelf: true },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const members = users.filter((u) => u.role === "MEMBER");

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola User</h1>

      <PendingCertificates />

      {/* Kolom kanan diisi migrasi + Tambah Peserta supaya tidak ada ruang
          kosong di sebelah form Tambah User Baru yang tinggi (Hadi 18 Sep). */}
      <div className="mb-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <CreateUserForm pools={pools} />
        <div className="flex flex-col gap-4">
          <details className="rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-text max-sm:py-3">
              Migrasi data: import member dari Excel (.xlsx)
            </summary>
            <p className="mt-2 text-sm text-text-muted">Dipakai saat kolam baru bergabung dan membawa data member lama.</p>
            <div className="mt-3">
              <ImportMembersForm pools={pools} />
            </div>
          </details>

          {/* Tambah peserta (anak atau diri sendiri) -- dibutuhkan sebelum
              bisa assign paket. */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text">Tambah Peserta</h2>
            <p className="mt-1 mb-3 text-sm text-text-muted">
              1 paket = 1 peserta (bisa anak, bisa diri sendiri). Member baru yang belum pernah masuk belum punya
              peserta terdaftar — tambahkan di sini dulu kalau mau langsung assign paket.
            </p>
            <AddChildForm members={members} />
          </div>
        </div>
      </div>

      {/* --- Assign paket khusus ke member --- */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-text">Assign Paket ke Peserta</h2>
      <p className="mb-3 text-sm text-text-muted">
        Buat paket khusus buat 1 anak tertentu (koreksi, promo, atau kasus di luar
        alur beli-online).
      </p>
      <AssignPackageForm members={members} templates={templates} dependents={dependents} pools={pools} />

      <h2 className="mb-3 mt-8 text-lg font-semibold text-text">Semua User</h2>

      {roleSections.map(({ role, label }) => {
        const rows = users.filter((u) => u.role === role);
        if (rows.length === 0) return null;

        return (
          <div key={role} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              {label} <span className="text-text-subtle">({rows.length})</span>
            </h2>
            {/* Kartu 2 kolom (Hadi 18 Sep): muat foto, kontak, ringkasan, dan
                tombol ke halaman detail -- tabel lama terlalu sempit untuk itu. */}
            <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {rows.map((u) => (
                <li key={u.id}>
                  <Card>
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {role === "COACH" && <Avatar src={u.coachProfile?.photoUrl} className="h-12 w-12" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/admin/users/${u.id}`} className="font-semibold text-text hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                              {u.name}
                            </Link>
                            <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                            {role === "COACH" && u.coachProfile?.certificateStatus === "APPROVED" && (
                              <Badge tone="brand">Bersertifikat</Badge>
                            )}
                          </div>
                          {role === "COACH" && coachBioLine(u.coachProfile) && (
                            <p className="text-xs text-text-subtle">{coachBioLine(u.coachProfile)}</p>
                          )}
                          <p className="text-sm text-text-muted">
                            {u.phone ?? "No HP belum diisi"}
                            {u.email ? ` · ${u.email}` : ""}
                          </p>
                          {role === "COACH" && (
                            <p className="mt-1 text-sm text-text-muted">
                              {u.poolAffiliations.length > 0
                                ? `Mengajar di ${u.poolAffiliations.map((a) => a.pool.name).join(", ")}`
                                : "Belum terafiliasi ke kolam"}
                              {u.coachProfile ? ` · saldo ${formatRupiah(u.coachProfile.walletBalance)}` : ""}
                            </p>
                          )}
                          {role === "POOL_OWNER" && (
                            <p className="mt-1 text-sm text-text-muted">
                              {u.poolOwnerships.length > 0
                                ? u.poolOwnerships
                                    .map((o) => `${o.pool.name} (saldo ${formatRupiah(o.pool.walletBalance)})`)
                                    .join(", ")
                                : "Belum memegang kolam"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-muted max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
                        >
                          Info detail
                        </Link>
                        <UserActions user={u} isSelf={u.id === session.user.id} />
                      </div>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <UsersMemberSection
        rows={members.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          isActive: u.isActive,
          peserta: u.dependents.map((d) => ({
            id: d.id,
            label: d.isSelf ? "Diri sendiri" : d.name,
            pkg: u.packages.find((p) => p.dependentId === d.id) ?? null,
          })),
        }))}
      />
    </main>
  );
}
