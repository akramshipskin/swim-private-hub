import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks } from "@/lib/nav-links";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("MEMBER");

  return (
    <div className="min-h-screen">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole="Member"
        links={roleNavLinks.MEMBER}
      />
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </div>
  );
}
