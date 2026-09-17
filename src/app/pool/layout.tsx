import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";

export const metadata: Metadata = {
  title: "Kolam | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function PoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("POOL_OWNER");

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel.POOL_OWNER}
      links={roleNavLinks.POOL_OWNER}
    >
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </NavBar>
  );
}
