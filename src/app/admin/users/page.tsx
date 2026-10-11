import { isPendingApproval } from "@/lib/pending-approval";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { usablePackageConditions } from "@/lib/active-package";
import CreateUserForm from "./create-user-form";
import AddChildForm from "../paket/add-child-form";
import AssignPackageForm from "../paket/assign-package-form";
import UsersMemberSection from "./users-member-section";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-display";
import { RejectionWaLink } from "./reject-registration-button";
import PendingCertificates from "./pending-certificates";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";
import { approvedCertificatesSelect, certifiedBadgeText } from "@/lib/coach-certificates";
import { formatRupiah } from "@/lib/format";

export const metadata = { title: "Akun | Swim Private Hub" };

type Tab = "menunggu" | "member" | "coach" | "kolam" | "admin";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const session = await requireRole("ADMIN");
  const { tab: rawTab, q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 100);

  const [users, dependents, pools] = await Promise.all([
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
        coachProfile: { select: { photoUrl: true, walletBalance: true, birthDate: true, gender: true, certificates: approvedCertificatesSelect } },
        poolAffiliations: { select: { pool: { select: { id: true, name: true } } }, orderBy: { pool: { name: "asc" } } },
        poolOwnerships: { select: { pool: { select: { id: true, name: true, walletBalance: true } } } },
      },
    }),
    prisma.dependent.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, memberId: true, isSelf: true },
    }),
    prisma.pool.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
  ]);

  const members = users.filter((u) => u.role === "MEMBER");
  // Yang dikirim ke komponen client HANYA field ini. Baris User utuh dulu
  // ikut ter-serialisasi ke browser (hash password & kunci 2FA semua member).
  // Akun yang sudah dihapus (dianonimkan) tidak ditawarkan di pilihan assign paket / tambah peserta.
  // Coach aktif + kolam tempat mengajar, untuk pilihan coach di form Berikan Paket.
  const coachOptions = users
    .filter((u) => u.role === "COACH" && u.isActive && !u.anonymizedAt)
    .map((u) => ({ id: u.id, name: u.name, poolIds: u.poolAffiliations.map((a) => a.pool.id) }));
  const memberOptions = members.filter((u) => !u.anonymizedAt).map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone }));

  // Satu kelompok akun per tampilan (tab) + pencarian, supaya admin tidak perlu
  // menggulir puluhan layar di HP untuk menemukan satu akun.
  const pending = users.filter((u) => (u.role === "COACH" || u.role === "POOL_OWNER") && isPendingApproval(u));
  const byRole = (role: string) => users.filter((u) => u.role === role);
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "menunggu", label: "Menunggu Persetujuan", count: pending.length },
    { key: "member", label: "Member", count: members.length },
    { key: "coach", label: "Coach", count: byRole("COACH").length },
    { key: "kolam", label: "Pemilik Kolam", count: byRole("POOL_OWNER").length },
    { key: "admin", label: "Admin", count: byRole("ADMIN").length },
  ];
  const tab: Tab = tabs.some((t) => t.key === rawTab) ? (rawTab as Tab) : pending.length > 0 ? "menunggu" : "member";
  const matches = (u: (typeof users)[number]) =>
    !q || u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.phone ?? "").includes(q);
  const cardRows =
    tab === "menunggu"
      ? pending.filter(matches)
      : tab === "member"
        ? []
        : byRole(tab === "coach" ? "COACH" : tab === "kolam" ? "POOL_OWNER" : "ADMIN")
            .filter(matches)
            .sort((a, b) => Number(isPendingApproval(b)) - Number(isPendingApproval(a)));

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Akun</h1>

      <PendingCertificates />

      {/* Formulir jarang dipakai dibanding mencari akun: dilipat supaya daftar akun
          langsung terlihat (dulu 3 formulir panjang ada di atas daftar). */}
      <details className="group mb-6 rounded-2xl border border-border bg-surface">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-text">
          Tambah Akun, Peserta, atau Berikan Paket
          <span aria-hidden className="text-text-subtle transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-border p-4">
      <div className="mb-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <CreateUserForm pools={pools.map(({ id, name }) => ({ id, name }))} />
        <div className="flex flex-col gap-4">
          {/* Tambah peserta (anak atau diri sendiri) -- dibutuhkan sebelum
              bisa assign paket. */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-text">Tambah Peserta</h2>
            <p className="mt-1 mb-3 text-sm text-text-muted">
              1 paket = 1 peserta (bisa anak, bisa diri sendiri). Member baru yang belum pernah masuk belum punya
              peserta. Tambahkan di sini bila ingin langsung memberi paket.
            </p>
            <AddChildForm members={memberOptions} />
          </div>
        </div>
      </div>

      {/* --- Assign paket khusus ke member --- */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-text">Berikan Paket ke Peserta</h2>
      <p className="mb-3 text-sm text-text-muted">
        Beri paket gratis untuk 1 peserta (koreksi, promo, atau kasus di luar alur beli online).
      </p>
      <AssignPackageForm
        members={memberOptions}
        dependents={dependents}
        // Hanya kolam aktif yang punya coach aktif (server juga menolak kolam nonaktif).
        pools={pools.filter((p) => p.isActive && coachOptions.some((c) => c.poolIds.includes(p.id))).map(({ id, name }) => ({ id, name }))}
        coaches={coachOptions}
      />

        </div>
      </details>

      <nav aria-label="Kelompok akun" className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/users?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
              tab === t.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border bg-surface text-text-muted hover:bg-surface-muted"
            }`}
          >
            {t.label}
            <span className={t.key === "menunggu" && t.count > 0 ? "rounded-full bg-warning-bg px-1.5 text-xs text-warning-text" : "text-xs text-text-subtle"}>{t.count}</span>
          </Link>
        ))}
      </nav>
      {tab !== "member" && (
        <form action="/admin/users" className="mb-4 flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cari nama, email, atau Nomor HP"
            aria-label="Cari akun"
            className="min-h-[44px] w-full max-w-sm rounded-xl border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle"
          />
          <button type="submit" className="min-h-[44px] shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white">
            Cari
          </button>
        </form>
      )}

      {tab !== "member" && cardRows.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
          {q ? `Tidak ada akun yang cocok dengan "${q}".` : tab === "menunggu" ? "Tidak ada pendaftar yang menunggu persetujuan." : "Belum ada akun."}
        </p>
      )}
      {tab !== "member" && cardRows.length > 0 && (() => {
        const rows = cardRows;
        return (
            <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {rows.map((u) => {
                const role = u.role;
                return (
                <li key={u.id}>
                  <Card>
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {role === "COACH" && <Avatar src={u.coachProfile?.photoUrl} className="h-12 w-12" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/admin/users/${u.id}`} className="font-semibold text-text hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                              {u.name}
                            </Link>
                            {u.rejectedAt ? (
                              <Badge tone="danger">Ditolak</Badge>
                            ) : isPendingApproval(u) ? (
                              <Badge tone="warning">Menunggu Persetujuan</Badge>
                            ) : (
                              <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                            )}
                            {role === "COACH" && certifiedBadgeText(u.coachProfile?.certificates) && (
                              <Badge tone="brand">Bersertifikat</Badge>
                            )}
                          </div>
                          {role === "COACH" && coachBioLine(u.coachProfile) && (
                            <p className="text-xs text-text-subtle">{coachBioLine(u.coachProfile)}</p>
                          )}
                          <p className="text-sm text-text-muted">
                            {u.phone ?? "Nomor HP belum diisi"}
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
                          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-muted max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center"
                        >
                          Info detail
                        </Link>
                        {u.rejectedAt ? (
                          <>
                            <span className="text-sm text-text-muted">Ditolak: {u.rejectionReason}</span>
                            <RejectionWaLink userId={u.id} />
                          </>
                        ) : (
                          <UserActions user={u} isSelf={u.id === session.user.id} pending={isPendingApproval(u)} />
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </li>
                );
              })}
            </ul>
        );
      })()}

      {tab === "member" && (
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
      )}
    </main>
  );
}
