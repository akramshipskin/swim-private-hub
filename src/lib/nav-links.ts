import type { BottomNavLink } from "@/components/mobile-bottom-nav";

export const roleNavLinks: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", BottomNavLink[]> = {
  ADMIN: [
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/kolam", label: "Kolam", icon: "package" },
    { href: "/admin/paket", label: "Paket", icon: "package" },
    { href: "/admin/pembayaran", label: "Pembayaran", icon: "credit-card" },
    { href: "/admin/booking-overview", label: "Booking", icon: "calendar" },
    { href: "/admin/kinerja-coach", label: "Kinerja", icon: "bar-chart" },
    { href: "/admin/komisi", label: "Komisi", icon: "credit-card" },
    { href: "/admin/withdrawals", label: "Pencairan", icon: "credit-card" },
  ],
  COACH: [
    { href: "/coach/jadwal", label: "Jadwal", icon: "calendar" },
    { href: "/coach/riwayat-sesi", label: "Riwayat Sesi", icon: "clipboard-check" },
    { href: "/coach/saldo", label: "Saldo", icon: "credit-card" },
  ],
  MEMBER: [
    { href: "/member/booking", label: "Booking", icon: "calendar" },
    { href: "/member/riwayat", label: "Riwayat", icon: "clock" },
    { href: "/member/paket", label: "Paket", icon: "package" },
  ],
  POOL_OWNER: [{ href: "/pool/saldo", label: "Saldo", icon: "credit-card" }],
};
