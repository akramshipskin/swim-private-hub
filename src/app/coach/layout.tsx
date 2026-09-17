import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";

export const metadata: Metadata = {
  title: "Coach | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("COACH");
  const profile = await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { photoUrl: true } });

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel.COACH}
      links={roleNavLinks.COACH}
      avatarUrl={profile?.photoUrl}
    >
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </NavBar>
  );
}
