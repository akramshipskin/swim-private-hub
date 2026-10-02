"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ICONS, type IconName } from "@/components/icons";

// group opsional -- dipake SidebarNav & lembar "Lainnya" buat ngelompokin link
// jadi kategori. Lihat src/lib/nav-links.ts.
export type BottomNavLink = { href: string; label: string; icon: IconName; group?: string };

function isActive(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(href + "/");
}

// Bilah menu bawah HP (Hadi 2 Okt malam, #25/#32): 4 menu utama + "Lainnya"
// yang membuka semua menu peran itu, dikelompokkan. Menu utama boleh mewakili
// satu kelompok (mis. admin "Keuangan"): aktif kalau halaman sekarang ada di
// kelompok itu.
export function MobileBottomNav({
  links,
  primary,
  moreLabel = "Lainnya",
  activePath,
}: {
  links: BottomNavLink[];
  primary: (BottomNavLink & { activeGroup?: string })[];
  moreLabel?: string;
  activePath?: string;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const [open, setOpen] = useState(false);
  // Pindah halaman = lembar menu tertutup (pola "adjust state during render").
  const [openedAt, setOpenedAt] = useState(currentPath);
  if (openedAt !== currentPath) {
    setOpenedAt(currentPath);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeLink = [...links].sort((a, b) => b.href.length - a.href.length).find((l) => isActive(currentPath, l.href));
  const primaryActive = (p: (typeof primary)[number]) =>
    p.activeGroup ? activeLink?.group === p.activeGroup : isActive(currentPath, p.href) && activeLink?.href === p.href;
  const moreActive = !primary.some(primaryActive);
  const groups = [...new Set(links.map((l) => l.group ?? "Menu"))];
  const MoreIcon = ICONS.menu;

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold tracking-tight transition-colors ${
      active ? "bg-brand-600 text-white" : "text-text-muted hover:bg-surface-muted hover:text-text"
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 sm:hidden" role="dialog" aria-modal="true" aria-label={`Semua menu`}>
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-surface px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-2xl">
            {groups.map((g) => (
              <section key={g} className="mb-4">
                <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">{g}</h2>
                <ul className="grid grid-cols-2 gap-1.5">
                  {links
                    .filter((l) => (l.group ?? "Menu") === g)
                    .map((l) => {
                      const Icon = ICONS[l.icon];
                      const active = activeLink?.href === l.href;
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-medium ${
                              active ? "bg-brand-600 text-white" : "bg-surface-muted text-text"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {l.label}
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-4px_rgb(0_0_0_/_0.12)] sm:hidden"
        aria-label="Navigasi utama"
      >
        <div className="mx-auto flex max-w-3xl gap-0.5 px-1 py-1.5">
          {primary.map((link) => {
            const active = primaryActive(link);
            const Icon = ICONS[link.icon];
            return (
              <Link key={link.href} href={link.href} prefetch={active ? false : undefined} aria-current={active ? "page" : undefined} className={item(active)}>
                <Icon className={`h-5 w-5 ${active ? "text-white" : "text-text-muted"}`} />
                {link.label}
              </Link>
            );
          })}
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={item(open || moreActive)}>
            <MoreIcon className={`h-5 w-5 ${open || moreActive ? "text-white" : "text-text-muted"}`} />
            {moreLabel}
          </button>
        </div>
      </nav>
    </>
  );
}
