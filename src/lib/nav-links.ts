import type { BottomNavLink } from "@/components/mobile-bottom-nav";

// group opsional -- 8 link ADMIN dulu 1 baris flat (DesktopTabNav), sekarang
// dikelompokin jadi kategori di SidebarNav (dashboard modern, bukan tab
// numpuk). Role lain listnya pendek, gak butuh grouping.
export const roleNavLinks: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", BottomNavLink[]> = {
  ADMIN: [
    { href: "/admin/booking-overview", label: "Booking", icon: "calendar", group: "Operasional" },
    { href: "/admin/kolam", label: "Kolam", icon: "package", group: "Operasional" },
    { href: "/admin/users", label: "Users", icon: "users", group: "Orang" },
    { href: "/admin/kinerja-coach", label: "Kinerja Coach", icon: "bar-chart", group: "Orang" },
    { href: "/admin/paket", label: "Paket", icon: "package", group: "Katalog" },
    { href: "/admin/pembayaran", label: "Pembayaran", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/komisi", label: "Komisi", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/withdrawals", label: "Pencairan", icon: "credit-card", group: "Keuangan" },
  ],
  COACH: [
    { href: "/coach/jadwal", label: "Jadwal", icon: "calendar" },
    { href: "/coach/riwayat-sesi", label: "Riwayat Sesi", icon: "clipboard-check" },
    { href: "/coach/saldo", label: "Saldo", icon: "credit-card" },
  ],
  MEMBER: [
    { href: "/member/booking", label: "Booking", icon: "calendar" },
    { href: "/member/cari-coach", label: "Cari Coach", icon: "search" },
    { href: "/member/riwayat", label: "Riwayat", icon: "clock" },
    { href: "/member/paket", label: "Paket", icon: "package" },
  ],
  POOL_OWNER: [{ href: "/pool/saldo", label: "Saldo", icon: "credit-card" }],
};
