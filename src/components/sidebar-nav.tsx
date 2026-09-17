"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BottomNavLink } from "@/components/mobile-bottom-nav";

function groupLinks(links: BottomNavLink[]) {
  const order: string[] = [];
  const byGroup = new Map<string, BottomNavLink[]>();
  for (const link of links) {
    const key = link.group ?? "";
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
      order.push(key);
    }
    byGroup.get(key)!.push(link);
  }
  return order.map((key) => [key, byGroup.get(key)!] as const);
}

// Sidebar kiri, desktop-only -- gantiin DesktopTabNav (baris tab horizontal)
// yang numpuk gak karuan begitu 1 role punya >4 fitur (Admin: 8). Link tanpa
// `group` dirender flat (list pendek gak butuh header kategori).
export function SidebarNav({
  links,
  activePath,
}: {
  links: BottomNavLink[];
  // Override buat halaman yang gak ada di `links` sendiri (misal
  // /pelatih/[coachId], dibuka dari Cari Coach) tapi konsepnya masih
  // "di dalam" 1 menu tertentu -- biar highlight-nya gak ilang cuma
  // karena URL-nya beda dari href menu itu persis.
  activePath?: string;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const groups = groupLinks(links);

  return (
    // Sidebar dikasih latar + border sendiri: tanpa itu daftar menunya
    // "menyatu" dengan isi halaman (Hadi 18 Sep). Nama kategori tebal,
    // nama tab tidak -- kebalikan dari versi sebelumnya.
    <nav
      className="hidden w-52 shrink-0 flex-col gap-4 self-start rounded-2xl border border-border bg-surface p-3 sm:sticky sm:top-20 sm:my-6 sm:flex"
      aria-label="Navigasi"
    >
      {groups.map(([group, items]) => (
        <div key={group} className="flex flex-col gap-0.5">
          {group && (
            <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
              {group}
            </p>
          )}
          {items.map((link) => {
            // Exact match doang -- semua halaman role ini flat (gak ada
            // nested sub-route), dan "Ringkasan" (/admin) itu prefix dari
            // SEMUA link admin lain, jadi startsWith bikin dia keliatan
            // aktif di halaman manapun kalau dipake di sini.
            const active = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={active ? false : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-brand-600 font-semibold text-white"
                    : "font-normal text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// Mobile-only, cuma dipake buat role dengan link panjang (Admin) --
// MobileBottomNav (icon bar 44px) numpuk banget kalau diisi >4 item, strip
// scroll-horizontal lebih pas buat kategori sebanyak itu di layar sempit.
export function MobileNavStrip({ links, activePath }: { links: BottomNavLink[]; activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto border-t border-border px-4 py-2 sm:hidden"
      aria-label="Navigasi"
    >
      {links.map((link) => {
        // Exact match doang, sama alesan kayak SidebarNav (Ringkasan/admin
        // adalah prefix dari semua link admin lain).
        const active = currentPath === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={active ? false : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-brand-600 text-white" : "bg-surface-muted text-text-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
