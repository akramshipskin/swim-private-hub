"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logotype } from "@/components/ui/logotype";

// Header landing nempel di atas (sticky). Di puncak halaman transparan supaya
// foto hero kelihatan; begitu discroll jadi gelap solid supaya teks putihnya
// tetap terbaca di atas section krem/pasir di bawahnya.
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-white transition-colors duration-200 ${
        scrolled ? "border-b border-white/10 bg-fixed-night/90 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 transition-[padding] duration-200 sm:gap-4 ${scrolled ? "py-2 sm:py-3" : "py-5"}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2 text-white max-sm:min-h-[44px]">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
          <Logotype className="text-sm sm:text-xl" />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#kolam" className="hover:underline">Kolam</a>
          <a href="#coach" className="hover:underline">Coach</a>
          <a href="#cara-kerja" className="hover:underline">Cara Kerja</a>
          <a href="#faq" className="hover:underline">FAQ</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/login" className="rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-white/10 sm:px-4 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">Masuk</Link>
          <Link href="/register" className="rounded-full bg-white px-2.5 py-2 text-sm font-semibold text-fixed-ink hover:bg-fixed-lime-100 sm:px-4 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">Daftar</Link>
        </div>
      </div>
    </header>
  );
}
