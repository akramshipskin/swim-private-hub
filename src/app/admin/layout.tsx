import type { Metadata } from "next";
import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { roleNavLinks } from "@/lib/nav-links";

export const metadata: Metadata = {
  title: "Admin | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");

  return (
    <div className="min-h-screen">
      <NavBar
        userName={session.user.name ?? ""}
        userRole="Admin"
        links={roleNavLinks.ADMIN}
      />
      <PullToRefresh>
        <div className="pb-16 sm:pb-0">{children}</div>
      </PullToRefresh>
    </div>
  );
}
