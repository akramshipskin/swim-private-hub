import type { BottomNavLink } from "@/components/mobile-bottom-nav";

// Fallback (?? role mentah) di pemakaiannya, jadi kalau ada role baru yang
// ketinggalan di sini gak sampe nunjukin "undefined" -- tapi tetep nunjukin
// enum mentah kayak "POOL_OWNER" bukan label rapi kayak role lain.
export const roleLabel: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  MEMBER: "Member",
  POOL_OWNER: "Pemilik Kolam",
};

// group opsional -- 8 link ADMIN dulu 1 baris flat (DesktopTabNav), sekarang
// dikelompokin jadi kategori objek bisnis (Booking/Kolam/Coach/User/Keuangan)
// di SidebarNav, bukan tab numpuk. "Pengaturan" (Profil Saya) sengaja
// ditaro PALING TERAKHIR di tiap role -- SidebarNav render group sesuai
// urutan array, jadi ini yang bikin dia nongol paling bawah sidebar (pola
// baku dashboard: settings selalu di bawah, gak campur sama menu kerja).
export const roleNavLinks: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", BottomNavLink[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: "bar-chart", group: "Utama" },
    { href: "/admin/booking-overview", label: "Jadwal Booking", icon: "calendar", group: "Booking" },
    { href: "/admin/kolam", label: "Kolam", icon: "package", group: "Kolam" },
    { href: "/admin/paket", label: "Paket", icon: "package", group: "Kolam" },
    { href: "/admin/kinerja-coach", label: "Kinerja", icon: "bar-chart", group: "Coach" },
    { href: "/admin/users", label: "Users", icon: "users", group: "User" },
    { href: "/admin/pembayaran", label: "Uang Masuk", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/komisi", label: "Bagi Hasil", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/withdrawals", label: "Pencairan Saldo", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/pesan", label: "Pesan", icon: "users", group: "Bantuan" },
    { href: "/profil", label: "Profil Saya", icon: "settings", group: "Pengaturan" },
  ],
  COACH: [
    { href: "/coach/dashboard", label: "Dashboard", icon: "bar-chart" },
    { href: "/coach/jadwal", label: "Jadwal", icon: "calendar" },
    { href: "/coach/riwayat-sesi", label: "Riwayat Sesi", icon: "clipboard-check" },
    { href: "/coach/saldo", label: "Saldo", icon: "credit-card" },
    { href: "/profil", label: "Profil Saya", icon: "settings", group: "Pengaturan" },
  ],
  MEMBER: [
    { href: "/member/dashboard", label: "Dashboard", icon: "bar-chart" },
    { href: "/member/booking", label: "Booking", icon: "calendar" },
    { href: "/member/cari-coach", label: "Cari Coach", icon: "search" },
    { href: "/member/riwayat", label: "Riwayat", icon: "clock" },
    { href: "/member/paket", label: "Paket", icon: "package" },
    { href: "/member/pembayaran", label: "Riwayat Bayar", icon: "credit-card" },
    { href: "/member/peserta", label: "Peserta", icon: "users" },
    { href: "/profil", label: "Profil Saya", icon: "settings", group: "Pengaturan" },
  ],
  POOL_OWNER: [
    { href: "/pool/dashboard", label: "Dashboard", icon: "bar-chart" },
    { href: "/pool/jadwal", label: "Jadwal Kolam", icon: "calendar" },
    { href: "/pool/laporan", label: "Laporan", icon: "clipboard-check" },
    { href: "/pool/saldo", label: "Saldo", icon: "credit-card" },
    { href: "/pool/info", label: "Info Kolam", icon: "package" },
    { href: "/pool/paket", label: "Paket & Harga", icon: "credit-card" },
    { href: "/pool/coach", label: "Coach", icon: "users" },
    { href: "/profil", label: "Profil Saya", icon: "settings", group: "Pengaturan" },
  ],
};
