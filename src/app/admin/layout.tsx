import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole="Admin"
        links={[
          { href: "/admin/users", label: "Users", icon: "users" },
          { href: "/admin/paket", label: "Paket", icon: "package" },
          { href: "/admin/pembayaran", label: "Pembayaran", icon: "credit-card" },
          { href: "/admin/booking-overview", label: "Booking", icon: "calendar" },
        ]}
      />
      <div className="pb-16 sm:pb-0">{children}</div>
    </div>
  );
}
