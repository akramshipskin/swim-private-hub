import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import ChangePasswordForm from "./change-password-form";

export default async function GantiPasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 text-center">
        <p className="text-lg font-semibold text-text">Les Renang Cianjur</p>
        <p className="text-sm text-text-muted">
          Ini login pertama kamu -- ganti password bawaan dulu ya.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Ganti Password</h1>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </main>
  );
}
