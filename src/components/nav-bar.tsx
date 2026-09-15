import Link from "next/link";
import Image from "next/image";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { DesktopTabNav } from "@/components/desktop-tab-nav";
import { UserMenu } from "@/components/user-menu";
import { Logotype } from "@/components/ui/logotype";

export function NavBar({
  links,
  userName,
  userRole,
}: {
  links: BottomNavLink[];
  userName: string;
  userRole: string;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
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

          {/* Desktop: tab nav di header. Mobile pakai bottom nav (di bawah). */}
          {links.length > 0 && <DesktopTabNav links={links} />}
        </div>
      </header>

      {links.length > 0 && <MobileBottomNav links={links} />}
    </>
  );
}
