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
          { href: "/admin/users", label: "Users" },
          { href: "/admin/paket", label: "Paket" },
          { href: "/admin/pembayaran", label: "Pembayaran" },
          { href: "/admin/booking-overview", label: "Booking" },
        ]}
      />
      {children}
    </div>
  );
}
