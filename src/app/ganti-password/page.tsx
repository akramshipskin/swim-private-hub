import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import ChangePasswordForm from "./change-password-form";

export default async function GantiPasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-500/20">
          LRC
        </div>
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
