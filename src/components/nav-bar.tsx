import Link from "next/link";
import { signOut } from "@/auth";
import { MobileBottomNav, type BottomNavLink } from "@/components/mobile-bottom-nav";
import { DesktopTabNav } from "@/components/desktop-tab-nav";

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

            <div className="flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-text">{userName}</p>
                <p className="text-xs text-text-subtle">{userRole}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          {/* Desktop: tab nav di header. Mobile pakai bottom nav (di bawah). */}
          {links.length > 0 && <DesktopTabNav links={links} />}
        </div>
      </header>

      {links.length > 0 && <MobileBottomNav links={links} />}
    </>
  );
}
