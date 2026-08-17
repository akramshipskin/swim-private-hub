import Link from "next/link";
import { signOut } from "@/auth";

type NavLink = { href: string; label: string };

export function NavBar({
  brand,
  links,
  userName,
  userRole,
}: {
  brand: string;
  links: NavLink[];
  userName: string;
  userRole: string;
}) {
  return (
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
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {links.length > 0 && (
          <nav className="flex flex-wrap items-center justify-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
