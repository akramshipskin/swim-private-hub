import Link from "next/link";
import Image from "next/image";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { SidebarNav, MobileNavStrip } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { Logotype } from "@/components/ui/logotype";
import { ChatWidget } from "@/components/chat-widget";
import { roleLabel } from "@/lib/nav-links";

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
  activePath,
  avatarUrl,
  children,
}: {
  links: BottomNavLink[];
  userName: string;
  userRole: string;
  activePath?: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const hasManyLinks = links.length > 5;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 lg:px-8">
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
            <Image src="/logo.png" alt="" width={44} height={44} className="h-9 w-9 rounded-xl object-contain sm:h-11 sm:w-11" />
            <Logotype className="text-base sm:text-lg" />
          </Link>

          <UserMenu userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
        </div>
        {links.length > 0 && hasManyLinks && <MobileNavStrip links={links} activePath={activePath} />}
      </header>

      <div className="flex w-full gap-6 px-4 lg:gap-8 lg:px-8">
        {links.length > 0 && <SidebarNav links={links} activePath={activePath} />}
        {/* pb-28: ruang di bawah konten supaya bottom nav + tombol chat
            mengambang tidak menutupi baris terakhir halaman di HP. */}
        <div className="min-w-0 flex-1 pb-28 sm:pb-8">{children}</div>
      </div>

      {links.length > 0 && !hasManyLinks && <MobileBottomNav links={links} activePath={activePath} />}
      {userRole !== roleLabel.ADMIN && <ChatWidget />}
    </div>
  );
}
