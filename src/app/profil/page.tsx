import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardBody } from "@/components/ui/card";
import EditNameForm from "./edit-name-form";
import EditPasswordForm from "./edit-password-form";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  MEMBER: "Member",
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole={roleLabel[session.user.role] ?? session.user.role}
        links={[]}
      />

      <main className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Edit Profil</h1>

        <Card className="mb-4">
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Nama</h2>
            <EditNameForm currentName={session.user.name ?? ""} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Ganti Password</h2>
            <EditPasswordForm />
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
