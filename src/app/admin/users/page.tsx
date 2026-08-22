import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { usablePackageConditions } from "@/lib/active-package";
import { toggleUserActive } from "./actions";
import CreateUserForm from "./create-user-form";
import ImportMembersForm from "./import-members-form";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <form action={toggleUserActive.bind(null, user.id, !user.isActive)}>
        <Button type="submit" variant="ghost" size="sm">
          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
        </Button>
      </form>
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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      packages: {
        where: usablePackageConditions,
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola User</h1>

      <CreateUserForm />
      <ImportMembersForm />

      {roleSections.map(({ role, label }) => {
        const rows = users.filter((u) => u.role === role);
        if (rows.length === 0) return null;

        return (
          <div key={role} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              {label} <span className="text-text-subtle">({rows.length})</span>
            </h2>
            {/* Desktop: tabel */}
            <Card className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">No HP</th>
                      {role === "MEMBER" && (
                        <th className="w-48 px-4 py-3 font-medium">Paket</th>
                      )}
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => {
                      const activePkg = u.packages[0];
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium text-text">{u.name}</td>
                          <td className="px-4 py-3 text-text-muted">{u.email ?? "-"}</td>
                          <td className="px-4 py-3 text-text-muted">{u.phone ?? "-"}</td>
                          {role === "MEMBER" && (
                            <td className="w-48 px-4 py-3 text-text-muted">
                              {activePkg ? (
                                <>
                                  {activePkg.name}
                                  <span className="block text-xs text-text-subtle">
                                    sisa {activePkg.sisaSesi}/{activePkg.totalSesi} sesi
                                    {activePkg.expiredDate && (
                                      <> · s.d. {shortDate(activePkg.expiredDate)}</>
                                    )}
                                  </span>
                                </>
                              ) : (
                                <span className="text-text-subtle">Belum ada paket aktif</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <Badge tone={u.isActive ? "success" : "neutral"}>
                              {u.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
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

            {/* Mobile: card compact, biar gak perlu geser/scroll jauh
                (member bisa 350+ baris) */}
            <ul className="flex flex-col gap-1.5 sm:hidden">
              {rows.map((u) => {
                const activePkg = u.packages[0];
                return (
                  <Card key={u.id}>
                    <CardBody className="flex flex-col gap-1 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text">{u.name}</p>
                        <Badge tone={u.isActive ? "success" : "neutral"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs text-text-subtle">
                          {u.email ?? u.phone ?? "-"}
                          {role === "MEMBER" &&
                            (activePkg ? (
                              <> · sisa {activePkg.sisaSesi}/{activePkg.totalSesi} sesi</>
                            ) : (
                              <> · belum ada paket</>
                            ))}
                        </p>
                        <div className="flex shrink-0 items-center gap-2 text-xs font-medium">
                          {u.phone && (
                            <a
                              href={buildContactWaLink(u.phone, u.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md px-2 py-1.5 text-[#25D366] hover:bg-[#25D366]/10"
                            >
                              WA
                            </a>
                          )}
                          <form action={toggleUserActive.bind(null, u.id, !u.isActive)}>
                            <button
                              type="submit"
                              className="rounded-md px-2 py-1.5 text-text-muted hover:bg-surface-muted"
                            >
                              {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>
                        </div>
                      </div>
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
