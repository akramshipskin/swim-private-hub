import Link from "next/link";
import Image from "next/image";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { Logotype } from "@/components/ui/logotype";
import { ChatWidget } from "@/components/chat-widget";
import { NotificationBell } from "@/components/notification-bell";
import { roleBottomNav, roleLabel } from "@/lib/nav-links";

// Shell dashboard: header full-width (logo+user menu) di atas, sidebar kiri
// (desktop) + konten di bawahnya -- gantiin pola lama (tab horizontal numpuk
// di header). NavBar sekarang MEMBUNGKUS {children} sendiri (bukan sibling
// yang dirender misah di tiap layout file) biar sidebar & konten bisa 1 flex
// row dari 1 sumber, gak perlu ubah struktur di 5 file layout satu-satu.
//
// HP: bilah bawah 4 menu utama + Lainnya/Menu untuk semua peran (Hadi 2 Okt
// malam, #25/#32); menu utama per peran di roleBottomNav.
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
  const roleKey = (Object.keys(roleLabel) as (keyof typeof roleLabel)[]).find((k) => roleLabel[k] === userRole);
  const bottom = roleKey ? roleBottomNav[roleKey] : { primary: links.slice(0, 4), moreLabel: "Lainnya" };

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
            className="flex min-h-[44px] shrink-0 items-center gap-2 text-sm font-semibold text-text"
          >
            <Image src="/logo.png" alt="" width={44} height={44} className="h-9 w-9 rounded-xl object-contain sm:h-11 sm:w-11" />
            <Logotype className="text-base sm:text-lg" />
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <NotificationBell />
            <UserMenu userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 px-4 lg:gap-8 lg:px-8">
        {links.length > 0 && <SidebarNav links={links} activePath={activePath} />}
        {/* pb-28 (HP) / sm:pb-24 (desktop): ruang di bawah konten supaya bottom
            nav + tombol chat mengambang tidak menutupi baris terakhir halaman. */}
        <div className="min-w-0 flex-1 pb-28 sm:pb-24">{children}</div>
      </div>

      {links.length > 0 && <MobileBottomNav links={links} primary={bottom.primary} moreLabel={bottom.moreLabel} activePath={activePath} />}
      {userRole !== roleLabel.ADMIN && <ChatWidget />}
    </div>
  );
}
