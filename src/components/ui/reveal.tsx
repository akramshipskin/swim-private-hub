"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Efek "muncul saat masuk layar". Tanpa library: IntersectionObserver hanya
// memberi tanda data-visible; sembunyi dan transisinya diatur CSS di globals.css
// dan HANYA aktif bila pengguna tidak memilih "kurangi gerakan" dan JavaScript
// menyala. Server dan browser mengirim markup yang sama, jadi tidak ada
// perbedaan hydration yang bisa membuat bagian halaman tertinggal tersembunyi.
// Delay (bergiliran) hanya berlaku di layar lebar; di HP semua muncul langsung.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.visible = "true";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = "true";
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal className={className} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
