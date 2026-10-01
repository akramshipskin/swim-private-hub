"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logotype } from "@/components/ui/logotype";

// Header landing nempel di atas (sticky). Di puncak halaman transparan supaya
// foto hero kelihatan; begitu discroll TETAP transparan -- bukan blok solid --
// cuma gradasi gelap tipis + blur kaca (backdrop-blur) supaya teks putihnya
// tetap terbaca di atas section krem/pasir di bawahnya tanpa jadi bilah pekat.
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
      className={`fixed inset-x-0 top-0 z-50 text-white backdrop-blur-md transition-[background,padding] duration-200 ${
        scrolled ? "bg-gradient-to-b from-fixed-night/85 via-fixed-night/75 to-fixed-night/65" : "bg-gradient-to-b from-black/25 to-transparent"
      }`}
    >
      <div className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 transition-[padding] duration-200 sm:gap-4 ${scrolled ? "py-2 sm:py-3" : "py-5"}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2 text-white max-sm:min-h-[44px]">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
          <Logotype className="text-sm sm:text-xl" />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#kolam" className="fx-nav md:max-lg:inline-flex md:max-lg:min-h-[44px] md:max-lg:items-center">Kolam</a>
          <a href="#coach" className="fx-nav md:max-lg:inline-flex md:max-lg:min-h-[44px] md:max-lg:items-center">Coach</a>
          <a href="#cara-kerja" className="fx-nav md:max-lg:inline-flex md:max-lg:min-h-[44px] md:max-lg:items-center">Cara Kerja</a>
          <a href="#faq" className="fx-nav md:max-lg:inline-flex md:max-lg:min-h-[44px] md:max-lg:items-center">FAQ</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/login" className="rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-white/10 sm:px-4 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">Masuk</Link>
          <Link href="/register" className="rounded-full bg-white px-2.5 py-2 text-sm font-semibold text-fixed-ink hover:bg-fixed-lime-100 sm:px-4 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">Daftar</Link>
        </div>
      </div>
      {/* Tali lintasan kolam di bawah header; perenang kecil maju sesuai posisi
          scroll (CSS scroll timeline, browser lama: tali saja). */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 h-[3px] transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}>
        <div className="lane-rope h-full" />
        <svg className="lane-swimmer absolute -top-[11px] left-0 h-5 w-8 text-fixed-lime" viewBox="0 0 32 20" fill="none">
          <circle cx="25" cy="9" r="3.2" fill="currentColor" />
          <path d="M3 13 C9 11.5 15 11.5 21 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M12 11 C15 4 20 2.5 26 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </header>
  );
}
