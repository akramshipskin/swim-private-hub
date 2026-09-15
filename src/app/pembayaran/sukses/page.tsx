import type { Metadata } from "next";
import Image from "next/image";
import { Logotype } from "@/components/ui/logotype";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default function PembayaranSuksesPage() {
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
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-text">
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" aria-hidden="true">
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="mb-1 text-xl font-semibold text-text">Pembayaran Berhasil</h1>
          <p className="mb-6 text-sm text-text-muted">
            Makasih! Paketmu lagi diproses otomatis dan bakal aktif dalam
            beberapa saat.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href="/member/paket" className="w-full">
              <Button className="w-full">Lihat Paket Saya</Button>
            </Link>
            <Link href="/member/booking" className="w-full">
              <Button variant="secondary" className="w-full">
                Booking Sekarang
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
