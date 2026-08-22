"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BottomNavLink } from "@/components/mobile-bottom-nav";

export function DesktopTabNav({ links }: { links: BottomNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-wrap items-center justify-center gap-1 sm:flex">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            // Tab aktif gak di-prefetch -- kita udah DI halaman itu, prefetch
            // ke diri sendiri percuma. Di halaman yang sering ganti state
            // client-side (misal kalender coach/jadwal), prefetch berulang ke
            // link aktif malah numpuk & ke-abort duluan sebelum kepake,
            // munculin "unknown error occurred when fetching the script" di
            // console (noise doang, gak ngerusak apa-apa, tapi gak perlu).
            prefetch={active ? false : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
