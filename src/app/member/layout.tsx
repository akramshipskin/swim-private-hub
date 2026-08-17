import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("MEMBER");

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole="Member"
        links={[
          { href: "/member/booking", label: "Booking", icon: "calendar" },
          { href: "/member/riwayat", label: "Riwayat", icon: "clock" },
          { href: "/member/paket", label: "Paket", icon: "package" },
        ]}
      />
      <div className="pb-16 sm:pb-0">{children}</div>
    </div>
  );
}
