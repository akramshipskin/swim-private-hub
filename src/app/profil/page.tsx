import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardBody } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { roleNavLinks } from "@/lib/nav-links";
import EditNameForm from "./edit-name-form";
import EditPasswordForm from "./edit-password-form";
import ManageChildrenForm from "./manage-children-form";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  MEMBER: "Member",
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");

  const children =
    session.user.role === "MEMBER"
      ? await prisma.dependent.findMany({
          where: { memberId: session.user.id },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, isActive: true, isSelf: true },
        })
      : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole={roleLabel[session.user.role] ?? session.user.role}
        links={roleNavLinks[session.user.role]}
      />

      <main className="mx-auto max-w-xl px-4 pb-16 py-6 sm:pb-8 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Edit Profil</h1>

        <Card className="mb-4">
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Nama</h2>
            <EditNameForm currentName={session.user.name ?? ""} />
          </CardBody>
        </Card>

        <Card className={children ? "mb-4" : undefined}>
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Ganti Password</h2>
            <EditPasswordForm />
          </CardBody>
        </Card>

        {children && (
          <Card>
            <CardBody>
              <h2 className="mb-3 text-lg font-semibold text-text">Anak</h2>
              <ManageChildrenForm children={children} />
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}
