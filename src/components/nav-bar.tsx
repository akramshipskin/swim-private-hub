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
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-text">
            {brand}
          </Link>
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-xs text-text-muted">{userName}</span>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
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

        <div className="hidden items-center gap-3 sm:flex">
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
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
