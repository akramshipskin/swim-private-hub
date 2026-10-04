# Swim Private Hub: handoff desain (mobile + desktop)

Untuk Claude Code. Baca file ini dulu. Tidak butuh izin khusus: semua berupa file teks biasa di folder project.

## File
- `Swim Private Hub App.dc.html`: prototipe iOS interaktif (alur Member lengkap, plus Coach / Pemilik kolam / Admin). Berisi markup + class logika, bisa dibaca sebagai teks.
- `ios-frame.jsx`: bingkai iPhone (hanya untuk presentasi, jangan di-port ke app).
- `HANDOFF.md`: dokumen ini.

## Sumber kebenaran (urutan)
1. Kode di `swim-private-hub/src` 2. `docs/aturan-bisnis-saat-ini.md` 3. `docs/KEPUTUSAN.md` 4. `brand-kit/MESSAGING.md`. Prototipe = arah visual, bukan aturan bisnis.

## Token (dari `brand-kit/colors/palette.css`)
| Token | Terang | Gelap |
|---|---|---|
| bg | #F6F6EE | #14140F |
| surface | #FCFCF7 | #1E1F18 |
| border | #DEDACA | #4A4C44 |
| ink | #14140F | #F6F6EE |
| muted | #5C5945 | #B6B3A5 |
| surfaceMuted | #ECE9DC | #32342E |
| brand text | #4F6B0F | #BDE85A |
| brand-500 | #9FCC1F | #BDE85A |
| hero card | #14140F, teks cream, aksen lime | #C6FF3D, teks charcoal |
| success / warning | #047857 / #A8480A | #6FD6A8 / #F2C14E |

Lime #C6FF3D = tombol utama dan aksen saja (maks ~10%). Font: Sora (400-700). Radius kartu 20-26, tombol 14-16, pill 999. Tap target minimal 44px. Tulisan: "kamu", baku (masuk, keluar, batalkan), lihat MESSAGING.md.

## Pola layar (mobile)
- Header: tanda logo + `swim.privatehub` (titik = brand-500), lonceng.
- Tab bawah Member: Beranda, Cari coach, Booking.
- Beranda punya 2 varian: A "Jadwal dulu" (kartu hero sesi berikutnya), B "Paket dulu" (angka sisa sesi besar + 8 segmen).
- Booking: kalender bulanan (titik = ada slot kosong) + daftar jam + CTA menempel di bawah.
- Switcher profil peserta: Alya, Raka, Saya (model `Dependent`).

## Peta halaman (66 di katalog; cakupan-halaman.md mencatat 59) -> pola
Desktop: sidebar kiri (`sidebar-nav.tsx`), konten grid bento 6 kolom (`BentoCard`, `Stat`, `SessionList` di `src/components/dashboard.tsx`). Mobile: `mobile-bottom-nav.tsx`, konten 1 kolom.

**Member** (`/member/*`)
- dashboard: Booking hari ini (kartu aksen), NextStepCard, Ringkasan (4 Stat), Paket aktif, Jadwal berikutnya
- cari-coach, booking, paket, riwayat, pembayaran ("Riwayat Bayar"), peserta
**Coach** (`/coach/*`): dashboard (Pencairan ditahan, Sesi yang harus disediakan, Ringkasan, Belum ditandai Hadir, Jadwal hari ini/besok), jadwal, kolam, harga, peserta, riwayat-sesi, saldo
**Pemilik kolam** (`/pool/*`): dashboard (Ringkasan bulan ini, Saldo, Info kolam), jadwal, coach, paket, info, laporan, saldo
**Admin** (`/admin/*`): dashboard (Hari ini, Perlu tindakan, Jadwal hari ini/besok, Pendapatan platform, Pengguna, Saldo belum dicairkan, Ringkasan tiap kolam), afiliasi, booking-overview, coach-tanpa-jadwal, email, ganti-coach, kinerja-coach, kolam, komisi ("Bagi Hasil"), koreksi-saldo, laporan-kehadiran, milestone, milestone/butir, paket, pembayaran ("Uang Masuk"), peminat-kota, pesan, testimoni, users, users/[userId], withdrawals ("Pencairan Saldo")
**Publik / lintas peran:** `/`, login, register, daftar-coach, daftar-kolam, kota, perjanjian, ganti-password, keamanan (2FA), profil, pelatih/[coachId], milestone/[dependentId] (+ sertifikat), pembayaran/sukses|gagal, panduan, brandguideline, 4 halaman legal (`LegalPageLayout`)

Katalog visual semua halaman (desktop 1180x720 + mobile 360x720, id M1, C1, P1, A1, U1, L1): `Katalog Halaman.dc.html`. Data tiap halaman ada di fungsi `pages()` pada file itu (rute, judul, blok). Isi blok adalah data contoh yang disusun dari judul halaman dan komponen `BentoCard`/`Stat`/`SessionList`; sebelum implementasi, cocokkan dengan page.tsx asli.


## Status kesesuaian dengan kode (jujur)
| Bagian | Status |
|---|---|
| Token warna terang/gelap, font (Plus Jakarta Sans + Sora), Card, Button, Badge, Input | Sesuai kode: dibaca dari globals.css dan src/components/ui. Catatan: tombol utama dan menu aktif = charcoal (brand-600), BUKAN lime. Lime #C6FF3D hanya untuk CTA khusus. Di mode gelap brand-600 = #5A7A12. |
| Shell: header, sidebar (grup menu), bilah bawah HP + Lainnya, NextStepCard, BentoCard, Stat | Sesuai kode (nav-bar, sidebar-nav, mobile-bottom-nav, nav-links, dashboard.tsx) |
| Member: dashboard, cari-coach, riwayat, pembayaran, booking (bagian server), paket (bagian atas) | Isi dari page.tsx. Belum dibaca: booking-board.tsx, paket baris 340-550, peserta-manager.tsx |
| Coach: dashboard, jadwal, kolam, harga, peserta, riwayat-sesi, saldo (+ SaldoView) | Isi dari page.tsx dan saldo-view.tsx. Belum dibaca: AffiliateCard, AddSlotForm, AttendanceToggle, PackPriceForm |
| Pemilik kolam, Admin, Publik, Masuk/daftar | BELUM dicocokkan dengan kode. Menu/sidebar sudah benar; isi halaman masih data contoh |
| Prototipe 'Swim Private Hub App.dc.html' | Eksplorasi baru (tombol lime, font Sora), tidak mengikuti token kode. Pakai hanya sebagai ide alur |
