import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Logotype } from "@/components/ui/logotype";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { otpauthUrl } from "@/lib/totp";
import { startTotpSetup } from "./actions";
import TotpConfirmForm from "./totp-confirm-form";
import TotpDisableForm from "./totp-disable-form";

export const metadata: Metadata = {
  title: "Keamanan Akun | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Pemasangan 2FA (Google Authenticator) -- wajib untuk admin (keputusan Hadi
// 25 Sep; proxy.ts & requireRole mengarahkan admin tanpa 2FA ke sini),
// opsional untuk coach, member, dan pemilik kolam (tautan dari /profil).
export default async function KeamananPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  const isAdmin = session.user.role === "ADMIN";

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, phone: true, totpSecret: true, totpEnabledAt: true },
  });
  // Admin tidak bisa menonaktifkan sendiri -- tidak ada yang perlu dilihat.
  if (user.totpEnabledAt && isAdmin) redirect("/admin");

  const account = user.email ?? user.phone ?? "akun";
  // Kunci rahasia hanya ditampilkan selama proses pasang (belum aktif).
  const setupSecret = user.totpEnabledAt ? null : user.totpSecret;
  const secretGroups = setupSecret?.match(/.{1,4}/g)?.join(" ");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="Swim Private Hub" width={56} height={56} className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20" priority />
        <p className="text-lg text-text"><Logotype /></p>
        <p className="text-sm text-text-muted">
          {isAdmin ? "Akun admin wajib memakai verifikasi 2 langkah." : "Verifikasi 2 langkah (2FA) — tidak wajib, tapi disarankan."}
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          {user.totpEnabledAt ? (
            <>
              <h1 className="mb-2 text-xl font-semibold text-text">2FA aktif</h1>
              <p className="mb-4 text-sm text-text-muted">
                Setiap masuk, kamu diminta kode 6 digit dari Google Authenticator di HP-mu. Aktif sejak{" "}
                {user.totpEnabledAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}.
              </p>
              <h2 className="mb-2 text-base font-semibold text-text">Matikan 2FA</h2>
              <TotpDisableForm />
            </>
          ) : (
            <>
              <h1 className="mb-3 text-xl font-semibold text-text">Pasang 2FA</h1>
              {!isAdmin && (
                <div className="mb-4 space-y-2 text-sm text-text-muted">
                  <p>
                    <b className="text-text">Apa itu?</b> Selain password, saat masuk kamu juga mengetik kode 6 digit dari aplikasi
                    Google Authenticator di HP-mu. Kodenya berganti tiap 30 detik.
                  </p>
                  <p>
                    <b className="text-text">Kenapa berguna?</b> Akun coach dan pemilik kolam menyimpan saldo. Kalau password-mu bocor,
                    orang lain tetap tidak bisa masuk tanpa kode dari HP-mu.
                  </p>
                </div>
              )}
              <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
                <li>Pasang aplikasi <b className="text-text">Google Authenticator</b> di HP (gratis di Play Store / App Store).</li>
                <li>Tekan &ldquo;Buat kunci&rdquo;, lalu tambahkan akun di aplikasi: tap link dari HP, atau pilih &ldquo;Masukkan kunci penyiapan&rdquo; dan ketik kuncinya.</li>
                <li>Ketik 6 digit yang muncul di aplikasi.</li>
              </ol>
              {!isAdmin && (
                <p className="mb-5 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
                  <b>Penting:</b> kalau HP hilang, ganti HP, atau aplikasinya terhapus, kamu <b>tidak bisa masuk</b> sampai admin
                  mereset 2FA-mu. Hubungi admin lewat WhatsApp kalau itu terjadi.
                </p>
              )}

              {!setupSecret ? (
                <form action={startTotpSetup}>
                  <Button type="submit" className="w-full">Buat kunci</Button>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-surface-muted px-3 py-3">
                    <p className="text-xs text-text-subtle">Kunci penyiapan ({account})</p>
                    <p className="mt-1 break-all font-mono text-base tracking-wider text-text">{secretGroups}</p>
                    <a href={otpauthUrl(setupSecret, account)} className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
                      Buka di aplikasi authenticator (dari HP)
                    </a>
                  </div>
                  <TotpConfirmForm />
                  {isAdmin && (
                    <p className="text-xs text-text-subtle">
                      HP hilang? Kunci hanya bisa direset pemilik server lewat skrip
                      <code className="mx-1">scripts/reset-admin-2fa.mts</code>.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!isAdmin && (
            <Link href="/profil" className="mt-5 inline-block text-sm font-medium text-brand-700 hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
              ← Kembali ke Profil
            </Link>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
