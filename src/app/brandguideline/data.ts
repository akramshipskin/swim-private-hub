import type { ContrastPair } from "./contrast-table";

// Semua pasangan warna di bawah adalah token ASLI dari src/app/globals.css
// (bukan versi lama brand-kit/colors/palette.json) -- rasio & tingkatnya
// dihitung live oleh ContrastTable lewat src/lib/contrast.ts, bukan diketik
// manual, supaya tidak basi kalau nilai token berubah.

export const LIGHT_CONTRAST_PAIRS: ContrastPair[] = [
  { label: "Teks utama di halaman", fg: "#14140F", bg: "#F6F6EE" },
  { label: "Teks utama di kartu", fg: "#14140F", bg: "#FFFFFF" },
  { label: "Teks pendukung di kartu", fg: "#5C5945", bg: "#FFFFFF" },
  { label: "Teks pendukung di krem", fg: "#5C5945", bg: "#F6F6EE" },
  { label: "Teks pendukung di latar sekunder", fg: "#5C5945", bg: "#ECE9DC" },
  { label: "Teks samar di kartu", fg: "#6C6957", bg: "#FFFFFF" },
  { label: "Teks samar di krem", fg: "#6C6957", bg: "#F6F6EE" },
  { label: "Teks samar di latar sekunder", fg: "#6C6957", bg: "#ECE9DC" },
  { label: "Teks putih di tombol utama", fg: "#FFFFFF", bg: "#14140F" },
  { label: "Sukses", fg: "#047857", bg: "#ECFDF5" },
  { label: "Peringatan", fg: "#A8480A", bg: "#FFFBEB" },
  { label: "Bahaya", fg: "#B91C1C", bg: "#FEF2F2" },
  { label: "Rose (Populer)", fg: "#E11D48", bg: "#FFF1F2" },
  { label: "Teks putih di tombol WhatsApp", fg: "#FFFFFF", bg: "#0F7A3C" },
  { label: "Teks charcoal di CTA marketing", fg: "#14140F", bg: "#9FCC1F" },
  { label: "Teks charcoal di lime penuh", fg: "#14140F", bg: "#C6FF3D" },
  { label: "Lime penuh di charcoal (angka statistik)", fg: "#C6FF3D", bg: "#14140F" },
  { label: "Teks pendukung marketing di krem", fg: "#5C5945", bg: "#F3F2EC" },
];

export const DARK_CONTRAST_PAIRS: ContrastPair[] = [
  { label: "Teks utama di halaman", fg: "#E8E6DC", bg: "#191A17" },
  { label: "Teks utama di kartu", fg: "#E8E6DC", bg: "#282A25" },
  { label: "Teks pendukung di kartu", fg: "#B6B3A5", bg: "#282A25" },
  { label: "Teks pendukung di latar sekunder", fg: "#B6B3A5", bg: "#32342E" },
  { label: "Teks samar di kartu", fg: "#A09D8F", bg: "#282A25" },
  { label: "Teks samar di latar sekunder", fg: "#A09D8F", bg: "#32342E" },
  { label: "Tautan / tombol ghost (brand-700) di kartu", fg: "#B9E063", bg: "#282A25" },
  { label: "Teks putih di tombol utama", fg: "#FFFFFF", bg: "#5A7A12" },
  { label: "Sukses", fg: "#6FD6A8", bg: "#1B3A2D" },
  { label: "Peringatan", fg: "#F2C14E", bg: "#3D2F12" },
  { label: "Bahaya", fg: "#F29191", bg: "#3F2023" },
  { label: "Rose (Populer)", fg: "#F5A8B5", bg: "#3D1A22" },
  { label: "Teks hijau WhatsApp di kartu", fg: "#3FCF7C", bg: "#282A25" },
];

// Versi lama brand-kit/colors/palette.json (sebelum disinkronkan 25 Sep
// 2026) -- disimpan di sini sebagai catatan sejarah kenapa nilainya diganti,
// BUKAN nilai yang dipakai aplikasi.
export const OLD_KIT_CONTRAST_PAIRS: ContrastPair[] = [
  { label: "Sukses versi kit lama (#1E8E5A)", fg: "#1E8E5A", bg: "#FFFFFF" },
  { label: "Peringatan versi kit lama (#B4770E)", fg: "#B4770E", bg: "#FFFFFF" },
  { label: "Bahaya versi kit lama (#C23B3B)", fg: "#C23B3B", bg: "#FFFFFF" },
  { label: "Teks samar versi kit lama (#8B8770)", fg: "#8B8770", bg: "#FFFFFF" },
  { label: "Lime Dark versi kit lama (#6F8F1E) sebagai teks", fg: "#6F8F1E", bg: "#FFFFFF" },
];

export const FIXED_TOKENS = [
  { name: "fixed-ink", hex: "#14140F", use: "Teks dan latar charcoal, tetap di dua tema" },
  { name: "fixed-ink-soft", hex: "#3D3B2E", use: "Teks sekunder gelap di halaman marketing" },
  { name: "fixed-ink-deep", hex: "#0A0A08", use: "Hover tombol utama" },
  { name: "fixed-muted", hex: "#5C5945", use: "Teks pendukung di halaman marketing" },
  { name: "fixed-cream", hex: "#F3F2EC", use: "Latar landing (sedikit beda dari Cream)" },
  { name: "fixed-sand", hex: "#ECE9DC", use: "Latar sekunder marketing" },
  { name: "fixed-night", hex: "#0B0C0A", use: "Latar hero landing" },
  { name: "fixed-lime", hex: "#C6FF3D", use: "Lime penuh: angka statistik, ikon di footer" },
  { name: "fixed-lime-500", hex: "#9FCC1F", use: "Tombol CTA marketing" },
  { name: "fixed-lime-100", hex: "#E3F5B0", use: "Latar kartu foto, hover" },
  { name: "fixed-lime-50", hex: "#F1FBDD", use: "Latar lembut marketing" },
];

export const ASSET_INVENTORY = [
  { asset: "Favicon", file: "favicon.ico", size: "16/32/48", status: "Selesai, dipakai kode" },
  { asset: "Ikon aplikasi (Next.js)", file: "icon.png, apple-icon.png", size: "32/180", status: "Selesai, dipakai kode" },
  { asset: "Ikon PWA", file: "icon-192.png, icon-512.png", size: "192/512", status: "Selesai, dipakai kode & manifest" },
  { asset: "Logo di header aplikasi", file: "logo.png", size: "512 (dirender kecil)", status: "Selesai, dipakai kode" },
  { asset: "Gambar bagikan (OG)", file: "Dibuat otomatis oleh kode (opengraph-image.tsx)", size: "1200×630", status: "Selesai, bukan file statis" },
  { asset: "Lockup SVG/PNG", file: "brand-kit/logo/svg, logo/png", size: "8320×1920 (hi-res, 8×)", status: "Selesai, untuk materi luar" },
  { asset: "Mark SVG/PNG (3 varian)", file: "brand-kit/logo/svg, logo/png", size: "2048 (hi-res, 8×)", status: "Selesai" },
  { asset: "Token warna", file: "globals.css, colors/palette.json + palette.css", size: "—", status: "Selesai, kode menang kalau beda" },
  { asset: "Foto profil sosial", file: "social/profile-picture-2000.png", size: "2000×2000 (hi-res, 4×)", status: "Selesai" },
  { asset: "Banner sosial", file: "social/banner-*.png", size: "6336×1584, 6000×2000 (hi-res, 4×)", status: "Selesai" },
];

export const CHANGELOG_ROWS = [
  {
    hal: "Tombol utama",
    v1: "Pil lime dengan teks charcoal",
    v2: "Charcoal, sudut 12px, teks putih. Pil lime hanya untuk CTA di halaman marketing",
  },
  {
    hal: "Warna status",
    v1: "Sukses #1E8E5A, peringatan #B4770E, bahaya #C23B3B",
    v2: "Sukses #047857, peringatan #A8480A, bahaya #B91C1C — versi lama gagal batas keterbacaan",
  },
  { hal: "Teks samar", v1: "#8B8770 (3,6:1 di putih)", v2: "#6C6957 (5,5:1 di putih)" },
  {
    hal: "Palet",
    v1: "4 warna inti + 4 status",
    v2: "Ditambah skala lime, rose, warna nonaktif, hijau WhatsApp, token tema gelap, dan token warna tetap",
  },
  { hal: "Mode gelap", v1: "Tidak dijelaskan", v2: "Ada token lengkap + contoh berdampingan" },
  {
    hal: "Gaya bahasa",
    v1: "Nada santai (gak, lu)",
    v2: "Mengikuti MESSAGING.md: sapaan “kamu”, kata baku",
  },
];
