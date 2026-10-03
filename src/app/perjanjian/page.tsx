import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { needsPartnerAgreement, partnerAgreementFor } from "@/lib/partner-agreement";
import { prisma } from "@/lib/prisma";
import { acceptPartnerAgreement } from "./actions";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Perjanjian Kemitraan | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Coach & pemilik kolam menyetujui perjanjian kemitraan lewat centang (Hadi
// 2 Okt, 3A/4A): pendaftar baru saat daftar, akun lama diarahkan ke sini
// (proxy.ts & requireRole) sampai menyetujui versi yang berlaku.
export default async function PerjanjianPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  const { role } = session.user;
  const home = role === "COACH" ? "/coach/dashboard" : role === "POOL_OWNER" ? "/pool/dashboard" : "/";
  const doc = partnerAgreementFor(role);
  if (!doc) redirect(home);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { partnerAgreementVersion: true } });
  if (!needsPartnerAgreement(role, user.partnerAgreementVersion)) redirect(home);
  const { error } = await searchParams;

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
      </div>

      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-2 text-xl font-semibold text-text">{doc.title}</h1>
          <p className="mb-5 text-sm text-text-muted">
            {user.partnerAgreementVersion
              ? "Perjanjian kemitraan sudah diperbarui. Baca versi terbaru lalu setujui untuk lanjut memakai aplikasi."
              : "Sebelum lanjut, baca dan setujui perjanjian kemitraan dengan Swim Private Hub."}
          </p>
          <form action={acceptPartnerAgreement} className="flex flex-col gap-4">
            <input type="hidden" name="version" value={doc.version} />
            <label className="flex items-start gap-2 text-sm text-text-muted max-lg:min-h-[44px] max-sm:py-1">
              <input
                type="checkbox"
                name="agree"
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-700 focus:ring-brand-500 max-sm:h-5 max-sm:w-5"
              />
              <span>
                Saya sudah membaca dan menyetujui{" "}
                <a href={doc.href} target="_blank" className="font-medium text-brand-700 hover:underline">
                  {doc.title}
                </a>
                .
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                Centang kotak persetujuan untuk melanjutkan.
              </p>
            )}
            <Button type="submit">Setuju dan lanjut</Button>
          </form>
          <LogoutButton />
        </CardBody>
      </Card>
    </main>
  );
}
