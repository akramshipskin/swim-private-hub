import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { toggleUserActive } from "./actions";
import CreateUserForm from "./create-user-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Kelola User</h1>

      <CreateUserForm />

      {roleSections.map(({ role, label }) => {
        const rows = users.filter((u) => u.role === role);
        if (rows.length === 0) return null;

        return (
          <div key={role} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              {label} <span className="text-text-subtle">({rows.length})</span>
            </h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      {role === "MEMBER" && (
                        <th className="px-4 py-3 font-medium">Paket</th>
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
                          <td className="px-4 py-3 text-text-muted">{u.email}</td>
                          {role === "MEMBER" && (
                            <td className="px-4 py-3 text-text-muted">
                              {activePkg ? (
                                <>
                                  {activePkg.name}
                                  <span className="block text-xs text-text-subtle">
                                    sisa {activePkg.sisaSesi}/{activePkg.totalSesi} sesi
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
                            <form action={toggleUserActive.bind(null, u.id, !u.isActive)}>
                              <Button type="submit" variant="ghost" size="sm">
                                {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      })}
    </main>
  );
}
