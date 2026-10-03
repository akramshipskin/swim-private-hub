import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";

export const metadata: Metadata = {
  title: "Member | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("MEMBER");
  // Akun lama tanpa kota domisili memilih kota sekali (Hadi 3 Okt).
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { city: true } });
  if (!me?.city) redirect("/kota");

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel.MEMBER}
      links={roleNavLinks.MEMBER}
    >
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </NavBar>
  );
}
