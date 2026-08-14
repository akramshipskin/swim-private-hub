import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
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

  const roleHome: Record<string, string> = {
    ADMIN: "/admin",
    COACH: "/coach",
    MEMBER: "/member/booking",
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-1 py-8">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {session.user.name?.charAt(0) ?? "?"}
          </div>
          <h1 className="text-lg font-semibold text-text">Hai, {session.user.name}</h1>
          <p className="text-sm text-text-muted">{session.user.role}</p>

          <Link href={roleHome[session.user.role]} className="mt-4 w-full">
            <Button className="w-full">Buka Dashboard</Button>
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
            className="mt-2"
          >
            <button type="submit" className="text-sm text-text-subtle underline hover:text-text-muted">
              Logout
            </button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
