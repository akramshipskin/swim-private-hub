import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import { Card, CardBody } from "@/components/ui/card";

// Kerangka halaman Lupa Password dan Buat Password Baru (sama dengan Ganti Password).
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="Swim Private Hub" width={56} height={56} className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20" priority />
        <p className="text-lg text-text"><Logotype /></p>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-5 text-xl font-semibold text-text">{title}</h1>
          {children}
        </CardBody>
      </Card>
    </main>
  );
}
