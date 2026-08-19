import Link from "next/link";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { DesktopTabNav } from "@/components/desktop-tab-nav";
import { UserMenu } from "@/components/user-menu";

export function NavBar({
  brand,
  links,
  userName,
  userRole,
}: {
  brand: string;
  links: BottomNavLink[];
  userName: string;
  userRole: string;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="shrink-0 text-sm font-semibold text-text">
              {brand}
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
