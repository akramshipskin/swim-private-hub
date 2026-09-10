import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks } from "@/lib/nav-links";

export const metadata: Metadata = {
  title: "Coach | Les Renang Cianjur",
  robots: { index: false, follow: false },
};

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("COACH");

  return (
    <div className="min-h-screen">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole="Coach"
        links={roleNavLinks.COACH}
      />
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </div>
  );
}
