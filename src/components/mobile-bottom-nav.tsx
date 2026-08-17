"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, type IconName } from "@/components/icons";

export type BottomNavLink = { href: string; label: string; icon: IconName };

export function MobileBottomNav({ links }: { links: BottomNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-3xl">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = ICONS[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-brand-600" : "text-text-subtle"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-text-subtle"}`} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
