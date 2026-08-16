import { requireRole } from "@/lib/require-role";
import { NavBar } from "@/components/nav-bar";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("COACH");

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        brand="Les Renang Cianjur"
        userName={session.user.name ?? ""}
        userRole="Coach"
        links={[
          { href: "/coach/jadwal", label: "Jadwal" },
          { href: "/coach/riwayat-sesi", label: "Riwayat Sesi" },
        ]}
      />
      {children}
    </div>
  );
}
