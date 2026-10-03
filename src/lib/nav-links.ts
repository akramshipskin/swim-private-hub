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

// group opsional -- dipakai SidebarNav (desktop) dan lembar "Lainnya" (HP)
// untuk mengelompokkan menu. "Pengaturan" (Profil Saya) sengaja
// ditaro PALING TERAKHIR di tiap role -- SidebarNav render group sesuai
// urutan array, jadi ini yang bikin dia nongol paling bawah sidebar (pola
// baku dashboard: settings selalu di bawah, gak campur sama menu kerja).
export const roleNavLinks: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", BottomNavLink[]> = {
  // Menu admin 4 kelompok (Hadi 2 Okt malam, #32).
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: "bar-chart", group: "Operasional" },
    { href: "/admin/booking-overview", label: "Jadwal Booking", icon: "calendar", group: "Operasional" },
    { href: "/admin/laporan-kehadiran", label: "Laporan Kehadiran", icon: "clipboard-check", group: "Operasional" },
    { href: "/admin/ganti-coach", label: "Ganti Coach", icon: "users", group: "Operasional" },
    { href: "/admin/users", label: "Pengguna", icon: "users", group: "Mitra & Member" },
    { href: "/admin/kolam", label: "Kolam", icon: "package", group: "Mitra & Member" },
    { href: "/admin/peminat-kota", label: "Peminat per Kota", icon: "users", group: "Mitra & Member" },
    { href: "/admin/paket", label: "Paket", icon: "package", group: "Mitra & Member" },
    { href: "/admin/kinerja-coach", label: "Kinerja Coach", icon: "bar-chart", group: "Mitra & Member" },
    { href: "/admin/milestone", label: "Milestone", icon: "clipboard-check", group: "Mitra & Member" },
    { href: "/admin/pembayaran", label: "Uang Masuk", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/komisi", label: "Bagi Hasil", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/withdrawals", label: "Pencairan Saldo", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/koreksi-saldo", label: "Koreksi Saldo", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/afiliasi", label: "Afiliasi", icon: "credit-card", group: "Keuangan" },
    { href: "/admin/pesan", label: "Pesan", icon: "chat", group: "Lainnya" },
    { href: "/admin/email", label: "Email", icon: "chat", group: "Lainnya" },
    { href: "/admin/testimoni", label: "Testimoni", icon: "users", group: "Lainnya" },
    { href: "/profil", label: "Profil Saya", icon: "settings", group: "Lainnya" },
  ],
  COACH: [
    { href: "/coach/dashboard", label: "Dashboard", icon: "bar-chart" },
    { href: "/coach/jadwal", label: "Jadwal", icon: "calendar" },
    { href: "/coach/kolam", label: "Kolam Saya", icon: "package" },
    { href: "/coach/riwayat-sesi", label: "Riwayat Sesi", icon: "clipboard-check" },
    { href: "/coach/peserta", label: "Peserta", icon: "users" },
    { href: "/coach/harga", label: "Harga", icon: "package" },
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

// Bilah bawah HP: 4 menu utama per peran (+ tombol Lainnya/Menu) (Hadi 2 Okt
// malam, #25/#32). activeGroup = menu itu mewakili seluruh kelompok.
export const roleBottomNav: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", { primary: (BottomNavLink & { activeGroup?: string })[]; moreLabel: string }> = {
  ADMIN: {
    moreLabel: "Menu",
    primary: [
      { href: "/admin", label: "Dashboard", icon: "bar-chart" },
      { href: "/admin/booking-overview", label: "Booking", icon: "calendar" },
      { href: "/admin/komisi", label: "Keuangan", icon: "credit-card", activeGroup: "Keuangan" },
      { href: "/admin/pesan", label: "Pesan", icon: "chat" },
    ],
  },
  COACH: {
    moreLabel: "Lainnya",
    primary: [
      { href: "/coach/dashboard", label: "Dashboard", icon: "bar-chart" },
      { href: "/coach/jadwal", label: "Jadwal", icon: "calendar" },
      { href: "/coach/riwayat-sesi", label: "Sesi", icon: "clipboard-check" },
      { href: "/coach/saldo", label: "Saldo", icon: "credit-card" },
    ],
  },
  MEMBER: {
    moreLabel: "Lainnya",
    primary: [
      { href: "/member/dashboard", label: "Dashboard", icon: "bar-chart" },
      { href: "/member/booking", label: "Booking", icon: "calendar" },
      { href: "/member/paket", label: "Paket", icon: "package" },
      { href: "/member/riwayat", label: "Riwayat", icon: "clock" },
    ],
  },
  POOL_OWNER: {
    moreLabel: "Lainnya",
    primary: [
      { href: "/pool/dashboard", label: "Dashboard", icon: "bar-chart" },
      { href: "/pool/jadwal", label: "Jadwal", icon: "calendar" },
      { href: "/pool/laporan", label: "Laporan", icon: "clipboard-check" },
      { href: "/pool/saldo", label: "Saldo", icon: "credit-card" },
    ],
  },
};
