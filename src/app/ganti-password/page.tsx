import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";
import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = {
  title: "Ganti Password | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function GantiPasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Halaman ini cuma valid buat login pertama (password bawaan wajib
  // diganti). Tanpa guard ini, siapa aja yang udah lama pake akun bisa
  // nyasar ke sini (lewat browser back, bookmark lama, dst) dan lihat
  // pesan "login pertama kamu" yang salah + form setup peserta yang
  // gak nyambung sama data yang udah ada.
  if (!session.user.mustChangePassword) {
    // Record<Role, string> sengaja (bukan Record<string, string>) --
    // 3 salinan map ini nyebar di app (sini, page.tsx, ganti-password/
    // actions.ts) dan POOL_OWNER pernah ketinggalan di 2 dari 3-nya
    // karena Record<string,...> gak maksa semua role keisi.
    const roleHome: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", string> = {
      ADMIN: "/admin",
      COACH: "/coach",
      MEMBER: "/member/booking",
      POOL_OWNER: "/pool/saldo",
    };
    redirect(roleHome[session.user.role]);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Swim Private Hub"
          width={56}
          height={56}
          className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20"
          priority
        />
        <p className="text-lg text-text"><Logotype /></p>
        <p className="text-sm text-text-muted">
          Ini login pertama kamu -- ganti password bawaan dulu ya.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">Ganti Password</h1>
          <ChangePasswordForm
            isMember={session.user.role === "MEMBER"}
            memberName={session.user.name ?? ""}
          />
        </CardBody>
      </Card>
    </main>
  );
}
