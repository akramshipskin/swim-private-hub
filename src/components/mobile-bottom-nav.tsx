"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, type IconName } from "@/components/icons";

export type BottomNavLink = { href: string; label: string; icon: IconName };

export function MobileBottomNav({ links }: { links: BottomNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-4px_rgb(0_0_0_/_0.12)] sm:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-3xl gap-1 px-2 py-1.5">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = ICONS[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              // Sama kayak DesktopTabNav -- tab aktif gak perlu di-prefetch.
              prefetch={active ? false : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
                active ? "bg-brand-600 text-white" : "text-text-muted hover:bg-surface-muted hover:text-text"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-white" : "text-text-muted"}`} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
