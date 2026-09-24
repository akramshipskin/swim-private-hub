import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { otpauthUrl } from "@/lib/totp";
import { startTotpSetup } from "./actions";
import TotpConfirmForm from "./totp-confirm-form";

export const metadata: Metadata = {
  title: "Keamanan Akun | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Pemasangan 2FA (Google Authenticator) -- wajib untuk admin (keputusan Hadi
// 25 Sep). proxy.ts & requireRole mengarahkan admin tanpa 2FA ke sini.
export default async function KeamananPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  if (session.user.mustChangePassword) redirect("/ganti-password");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, phone: true, totpSecret: true, totpEnabledAt: true },
  });
  if (user.totpEnabledAt) redirect("/admin");

  const account = user.email ?? user.phone ?? "admin";
  const secretGroups = user.totpSecret?.match(/.{1,4}/g)?.join(" ");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="Swim Private Hub" width={56} height={56} className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20" priority />
        <p className="text-lg text-text"><Logotype /></p>
        <p className="text-sm text-text-muted">Akun admin wajib memakai verifikasi 2 langkah.</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-3 text-xl font-semibold text-text">Pasang 2FA</h1>
          <ol className="mb-5 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
            <li>Pasang aplikasi <b className="text-text">Google Authenticator</b> di HP.</li>
            <li>Tambahkan akun dengan kunci di bawah (tap link dari HP, atau pilih &ldquo;Masukkan kunci penyiapan&rdquo;).</li>
            <li>Ketik 6 digit yang muncul di aplikasi.</li>
          </ol>

          {!user.totpSecret ? (
            <form action={startTotpSetup}>
              <Button type="submit" className="w-full">Buat kunci</Button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-surface-muted px-3 py-3">
                <p className="text-xs text-text-subtle">Kunci penyiapan ({account})</p>
                <p className="mt-1 break-all font-mono text-base tracking-wider text-text">{secretGroups}</p>
                <a href={otpauthUrl(user.totpSecret, account)} className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
                  Buka di aplikasi authenticator (dari HP)
                </a>
              </div>
              <TotpConfirmForm />
              <p className="text-xs text-text-subtle">
                HP hilang? Kunci hanya bisa direset pemilik server lewat skrip
                <code className="mx-1">scripts/reset-admin-2fa.mts</code>.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
