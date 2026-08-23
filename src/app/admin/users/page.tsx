import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { usablePackageConditions } from "@/lib/active-package";
import ToggleActiveButton from "./toggle-active-button";
import CreateUserForm from "./create-user-form";
import ImportMembersForm from "./import-members-form";
import AddChildForm from "../paket/add-child-form";
import AssignPackageForm from "../paket/assign-package-form";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildContactWaLink } from "@/lib/whatsapp";
function shortDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

type PesertaRow = {
  id: string;
  label: string;
  pkg: { name: string; sisaSesi: number; totalSesi: number; expiredDate: Date | null } | null;
};

function PesertaLine({ p }: { p: PesertaRow }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.pkg ? "bg-success-text" : "bg-border"}`}
      />
      <span className="min-w-0 truncate">
        {p.label}
        {p.pkg ? (
          <span className="text-text-subtle">
            {" "}
            · sisa {p.pkg.sisaSesi}/{p.pkg.totalSesi} sesi
            {p.pkg.expiredDate && <> · s.d. {shortDate(p.pkg.expiredDate)}</>}
          </span>
        ) : (
          <span className="text-text-subtle"> · belum ada paket aktif</span>
        )}
      </span>
    </div>
  );
}

// >1 peserta dibungkus <details> biar baris tabel gak makin tinggi tiap
// member nambah anak -- summary ringkas (jumlah + berapa yang aktif),
// baru buka detail per-peserta pas di-klik. 1 peserta (atau 0) langsung
// tampil, gak perlu collapse.
function PesertaList({ items }: { items: PesertaRow[] }) {
  if (items.length === 0) {
    return <span className="text-text-subtle">Belum ada peserta</span>;
  }
  if (items.length === 1) {
    return <PesertaLine p={items[0]} />;
  }
  const activeCount = items.filter((p) => p.pkg).length;
  return (
    <details>
      <summary className="cursor-pointer list-none text-text marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          {items.length} peserta · {activeCount} aktif
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 text-text-subtle transition-transform [details[open]_&]:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </summary>
      <div className="mt-1.5 flex flex-col gap-1">
        {items.map((p) => (
          <PesertaLine key={p.id} p={p} />
        ))}
      </div>
    </details>
  );
}

function UserActions({
  user,
}: {
  user: { id: string; name: string; phone: string | null; isActive: boolean };
}) {
  return (
    <div className="flex items-center gap-2">
      {user.phone && (
        <a
          href={buildContactWaLink(user.phone, user.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md px-2 py-1.5 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/10"
        >
          Hubungi
        </a>
      )}
      <ToggleActiveButton userId={user.id} userName={user.name} isActive={user.isActive} />
    </div>
  );
}

const roleSections: { role: "ADMIN" | "COACH" | "MEMBER"; label: string }[] = [
  { role: "ADMIN", label: "Admin" },
  { role: "COACH", label: "Coach" },
  { role: "MEMBER", label: "Member" },
];

export default async function AdminUsersPage() {
  await requireRole("ADMIN");

  const [users, templates, dependents] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // Semua paket aktif (bukan cuma 1) -- 1 peserta bisa punya paket
        // sendiri-sendiri, tabel ini butuh nunjukin status per peserta,
        // bukan cuma 1 ringkasan buat seluruh member.
        packages: {
          where: usablePackageConditions,
          orderBy: { createdAt: "desc" },
        },
        dependents: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, isSelf: true },
        },
      },
    }),
    prisma.packageTemplate.findMany({ orderBy: { totalSesi: "asc" } }),
    prisma.dependent.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, memberId: true, isSelf: true },
    }),
  ]);

  const members = users.filter((u) => u.role === "MEMBER");

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola User</h1>

      <div className="mb-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <CreateUserForm />
        <ImportMembersForm />
      </div>

      {/* --- Tambah peserta (anak atau diri sendiri) buat member -- dibutuhin
          sebelum bisa assign paket --- */}
      <h2 className="mb-3 text-lg font-semibold text-text">Tambah Peserta</h2>
      <p className="mb-3 text-sm text-text-muted">
        1 paket = 1 peserta (bisa anak, bisa diri sendiri). Member baru yang
        belum pernah login belum punya peserta terdaftar -- tambahin di sini
        dulu kalau mau langsung assign paket.
      </p>
      <AddChildForm members={members} />

      {/* --- Assign paket khusus ke member --- */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-text">Assign Paket ke Member</h2>
      <p className="mb-3 text-sm text-text-muted">
        Buat paket khusus buat 1 anak tertentu (koreksi, promo, atau kasus di luar
        alur beli-online).
      </p>
      <AssignPackageForm members={members} templates={templates} dependents={dependents} />

      <h2 className="mb-3 mt-8 text-lg font-semibold text-text">Semua User</h2>

      {roleSections.map(({ role, label }) => {
        const rows = users.filter((u) => u.role === role);
        if (rows.length === 0) return null;

        return (
          <div key={role} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              {label} <span className="text-text-subtle">({rows.length})</span>
            </h2>
            {/* Desktop: tabel -- Nama & Email digabung 1 kolom (email di
                bawah nama) biar kolom gak sesek, kolom sisanya dapet napas
                lebih (padding naik dikit). */}
            <Card className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                      <th className="px-5 py-3.5 font-medium">Nama</th>
                      <th className="px-5 py-3.5 font-medium">No HP</th>
                      {role === "MEMBER" && (
                        <th className="w-72 px-5 py-3.5 font-medium">Paket</th>
                      )}
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => {
                      const peserta: PesertaRow[] = u.dependents.map((d) => ({
                        id: d.id,
                        label: d.isSelf ? "Diri sendiri" : d.name,
                        pkg: u.packages.find((p) => p.dependentId === d.id) ?? null,
                      }));
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-4">
                            <p className="font-medium text-text">{u.name}</p>
                            {u.email && (
                              <p className="text-xs text-text-subtle">{u.email}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-text-muted">{u.phone ?? "-"}</td>
                          {role === "MEMBER" && (
                            <td className="w-72 px-5 py-4 text-xs text-text-muted">
                              <PesertaList items={peserta} />
                            </td>
                          )}
                          <td className="px-5 py-4">
                            <Badge tone={u.isActive ? "success" : "neutral"}>
                              {u.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end">
                              <UserActions user={u} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile: card compact biasa -- semua info langsung keliatan,
                gak perlu di-tap buat expand. */}
            <ul className="flex flex-col gap-1.5 sm:hidden">
              {rows.map((u) => {
                const peserta: PesertaRow[] = u.dependents.map((d) => ({
                  id: d.id,
                  label: d.isSelf ? "Diri sendiri" : d.name,
                  pkg: u.packages.find((p) => p.dependentId === d.id) ?? null,
                }));
                return (
                  <Card key={u.id}>
                    <CardBody className="flex flex-col gap-1.5 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-text">{u.name}</p>
                        <Badge tone={u.isActive ? "success" : "neutral"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      {u.email && <p className="text-xs text-text-subtle">{u.email}</p>}
                      <p className="text-xs text-text-muted">No HP: {u.phone ?? "-"}</p>
                      {role === "MEMBER" && (
                        <div className="text-xs text-text-muted">
                          <PesertaList items={peserta} />
                        </div>
                      )}
                      <UserActions user={u} />
                    </CardBody>
                  </Card>
                );
              })}
            </ul>
          </div>
        );
      })}
    </main>
  );
}
