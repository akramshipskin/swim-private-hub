import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { usablePackageConditions } from "@/lib/active-package";
import PesertaManager, { type PesertaItem } from "./peserta-manager";

export const metadata = { title: "Peserta | Swim Private Hub" };

export default async function MemberPesertaPage() {
  const session = await requireRole("MEMBER");
  const children = await prisma.dependent.findMany({
    where: { memberId: session.user.id },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      isSelf: true,
      packages: {
        where: usablePackageConditions(),
        orderBy: { createdAt: "desc" },
        select: { name: true, sisaSesi: true, totalSesi: true, pool: { select: { name: true } } },
      },
    },
  });

  const items: PesertaItem[] = children.map((c) => ({
    id: c.id,
    name: c.isSelf ? `${session.user.name ?? c.name} (kamu)` : c.name,
    isActive: c.isActive,
    isSelf: c.isSelf,
    paket: c.packages.map((p) => ({
      poolName: p.pool?.name ?? "Kolam tidak diketahui",
      packageName: p.name,
      sisaSesi: p.sisaSesi,
      totalSesi: p.totalSesi,
    })),
  }));

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Peserta</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Siapa saja yang ikut les: kamu sendiri dan/atau anak. Setiap peserta punya paket dan sisa sesi sendiri, jadi
        sesinya tidak tercampur.
      </p>
      <PesertaManager items={items} />
    </main>
  );
}
