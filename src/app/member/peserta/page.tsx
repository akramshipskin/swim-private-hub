import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import ManageChildrenForm from "@/app/profil/manage-children-form";

export default async function MemberPesertaPage() {
  const session = await requireRole("MEMBER");
  const children = await prisma.dependent.findMany({
    where: { memberId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isActive: true, isSelf: true },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Peserta</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Siapa saja yang ikut les: kamu sendiri dan/atau anak. Setiap peserta punya paket dan sisa sesi masing-masing.
      </p>
      <Card>
        <CardBody>
          <ManageChildrenForm dependents={children} />
        </CardBody>
      </Card>
    </main>
  );
}
