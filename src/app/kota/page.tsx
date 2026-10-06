import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { CitySelect } from "@/components/city-select";
import { prisma } from "@/lib/prisma";
import { saveMyCity } from "./actions";

export const metadata: Metadata = {
  title: "Pilih Kota | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Akun member & coach lama yang belum punya kota diarahkan ke sini sekali
// (layout member/coach) sebelum memakai aplikasi (Hadi 3 Okt).
export default async function KotaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { role } = session.user;
  if (role !== "MEMBER" && role !== "COACH") redirect("/");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { city: true } });
  if (user.city) redirect(role === "COACH" ? "/coach/dashboard" : "/member/dashboard");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="Swim Private Hub" width={56} height={56} className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20" priority />
        <p className="text-lg text-text"><Logotype /></p>
      </div>
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-2 text-xl font-semibold text-text">Kamu tinggal di kota mana?</h1>
          <p className="mb-5 text-sm text-text-muted">
            {role === "COACH"
              ? "Kami tampilkan kolam di kota ini lebih dulu saat kamu memilih tempat mengajar. Kolam di kota lain tetap bisa dipilih."
              : "Kami tampilkan kolam dan coach di kota ini lebih dulu. Kota lain tetap bisa dipilih."}
          </p>
          <form action={saveMyCity} className="flex flex-col gap-4">
            <Field label="Kota Domisili">
              <CitySelect />
            </Field>
            {error && (
              <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
                Pilih kota dari daftar.
              </p>
            )}
            <Button type="submit">Simpan dan Lanjut</Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
