import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 text-center">
        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-500/20">
          LRC
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-text">Les Renang Cianjur</h1>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Booking jadwal renang dengan coach favoritmu, kapan aja lewat HP.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Daftar</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.mustChangePassword) {
    redirect("/ganti-password");
  }

  const roleHome: Record<string, string> = {
    ADMIN: "/admin",
    COACH: "/coach",
    MEMBER: "/member/booking",
  };

  redirect(roleHome[session.user.role]);
}
