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
