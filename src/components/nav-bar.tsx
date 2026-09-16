import Link from "next/link";
import Image from "next/image";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { SidebarNav, MobileNavStrip } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { Logotype } from "@/components/ui/logotype";

// Shell dashboard: header full-width (logo+user menu) di atas, sidebar kiri
// (desktop) + konten di bawahnya -- gantiin pola lama (tab horizontal numpuk
// di header). NavBar sekarang MEMBUNGKUS {children} sendiri (bukan sibling
// yang dirender misah di tiap layout file) biar sidebar & konten bisa 1 flex
// row dari 1 sumber, gak perlu ubah struktur di 5 file layout satu-satu.
//
// >4 link (Admin) pake MobileNavStrip (scroll horizontal) di mobile --
// MobileBottomNav (icon bar) numpuk kalau diisi 8 item. Role dengan link
// pendek tetep pakai MobileBottomNav biasa.
export function NavBar({
  links,
  userName,
  userRole,
  children,
}: {
  links: BottomNavLink[];
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const hasManyLinks = links.length > 5;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* prefetch={false} -- "/" cuma redirect server-side ke home per-role
              (lihat src/app/page.tsx), gak pernah nampilin konten sendiri buat
              user yang udah login. Prefetch default Next.js buat link ini
              nembak RSC fetch yang keburu ke-abort pas ganti halaman, muncul
              sebagai "unknown error occurred when fetching the script" di
              console -- noise doang, gak ngerusak apa-apa, tapi percuma
              di-prefetch karena tujuannya emang cuma redirect. */}
          <Link
            href="/"
            prefetch={false}
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-text"
          >
            <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg object-contain" />
            <Logotype className="text-sm" />
          </Link>

          <UserMenu userName={userName} userRole={userRole} />
        </div>
        {links.length > 0 && hasManyLinks && <MobileNavStrip links={links} />}
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4">
        {links.length > 0 && <SidebarNav links={links} />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {links.length > 0 && !hasManyLinks && <MobileBottomNav links={links} />}
    </div>
  );
}
