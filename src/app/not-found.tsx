import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
        <CardBody className="flex flex-col items-center text-center">
          <span className="mb-2 text-5xl font-bold tracking-tight text-brand-600">404</span>
          <h1 className="mb-1 text-xl font-semibold text-text">Halaman Tidak Ditemukan</h1>
          <p className="mb-6 text-sm text-text-muted">
            Halaman yang kamu cari gak ada atau udah dipindah. Cek lagi alamatnya,
            atau balik ke beranda.
          </p>
          <Link href="/" className="w-full">
            <Button className="w-full">Kembali ke Beranda</Button>
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
