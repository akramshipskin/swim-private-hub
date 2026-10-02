import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logotype } from "@/components/ui/logotype";

// Kerangka halaman masuk & daftar (Hadi 2 Okt malam, #24): setara landing.
// Desktop: panel merek gelap dengan foto perenang di kiri, formulir di kanan.
// HP: header merek ringkas di atas formulir (tanpa foto, supaya cepat dimuat).
export function AuthShell({
  tagline,
  points,
  children,
}: {
  tagline: string;
  points: string[];
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-fixed-night text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src="/images/landing/hero-swim.jpg" alt="" fill sizes="45vw" className="-z-10 object-cover object-[60%_30%] opacity-60" priority />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-fixed-night via-fixed-night/70 to-fixed-night/30" />
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-lg"><Logotype /></span>
        </Link>
        <div>
          <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-balance">{tagline}</p>
          <ul className="mt-6 flex flex-col gap-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-base text-white/85">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fixed-lime" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-brand-100)_0%,_var(--background)_55%)] px-4 py-12 lg:bg-none">
        <Link href="/" className="mb-6 flex flex-col items-center text-center lg:hidden">
          <Image src="/logo.png" alt="Swim Private Hub" width={56} height={56} className="mb-3 h-14 w-14 rounded-2xl object-contain shadow-lg shadow-brand-500/20" priority />
          <span className="text-lg text-text"><Logotype /></span>
          <span className="mt-1 max-w-xs text-sm text-text-muted">{tagline}</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
