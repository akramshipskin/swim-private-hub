"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// HP (Hadi 2 Okt malam, #25): baris lompat 7 tombol diganti satu tombol
// "Daftar gratis" yang menempel di bawah layar setelah hero lewat. Penanda
// (sentinel) ditaruh tepat setelah hero; tombol muncul saat penanda sudah di
// atas layar. Desktop tidak memakai ini (header sudah punya tombol daftar).
export function StickyCta() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={ref} aria-hidden="true" className="h-px" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-fixed-ink/10 bg-fixed-cream/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden ${
          show ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!show}
      >
        <Link
          href="/register"
          tabIndex={show ? undefined : -1}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-fixed-lime text-base font-semibold text-fixed-ink active:scale-[0.98]"
        >
          Daftar gratis
        </Link>
      </div>
    </>
  );
}
