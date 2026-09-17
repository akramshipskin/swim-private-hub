# Brand Kit — Swim Private Hub

Paket aset identitas "Lime Pulse". Panduan lengkap (visual, contoh pemakaian, gaya bahasa): buka `guideline.html` di browser.

## Isi
| Folder | Isi |
|---|---|
| `logo/svg/` | Logo vektor (bisa diperbesar tanpa pecah, latar transparan): `lockup-on-light`, `lockup-on-dark`, `mark-lime`, `mark-cream`, `mark-white-mono` |
| `logo/png/` | Logo siap pakai: lockup 1040×240 (latar cream / charcoal), tanda logo 512×512 |
| `icons/` | favicon.ico, ikon aplikasi (32/180), ikon PWA 192 & 512 — sama persis dengan yang dipakai website |
| `social/` | Foto profil 500×500, banner 1584×396 (LinkedIn) & 1500×500 |
| `colors/` | `palette.json` & `palette.css` (kode warna) |
| `fonts/FONTS.md` | Font yang dipakai + link download resmi |

## Warna inti
| Nama | Hex | Pemakaian |
|---|---|---|
| Charcoal | `#14140F` | Dominan (~60%): teks utama, latar gelap |
| Cream | `#F6F6EE` | Latar terang, kartu (~30%) |
| Lime | `#C6FF3D` | Aksen & tombol utama saja (maks ~10%) |
| Lime Dark | `#6F8F1E` | Teks/link hijau di latar terang (kontras aman) |

## Aturan pemakaian logo
- **Tanda logo (mark) selalu: langit lime di atas, air charcoal di bawah.** Jangan
  dibalik. Varian `mark-charcoal` yang warnanya terbalik sudah dihapus (18 Sep 2026).
- Untuk latar gelap, pakai `mark-lime` (tandanya tetap sama) atau
  `lockup-on-dark`. Untuk cetak 1 warna, pakai `mark-white-mono`.
- **Di dalam aplikasi: ikon + logotype berdampingan** — dipakai di navbar semua
  peran, halaman masuk/daftar, header landing, header panduan, dan footer.
- **Logotype saja** hanya untuk ruang sangat sempit (misal tulisan di dalam
  kartu) — jangan pernah ikon saja tanpa nama, kecuali favicon dan ikon aplikasi.
- Jangan mengganti warna, rasio, atau jarak huruf.

## Aturan singkat
- Pakai `lockup-on-light` di latar terang, `lockup-on-dark` di latar gelap. Jangan ubah warna, rasio, atau jarak huruf.
- Beri ruang kosong di sekeliling logo minimal setengah lebar tanda logo.
- Ukuran minimum tanda logo: 16 px (favicon); lockup: lebar 120 px.
- Tulisan logo selalu huruf kecil: `swim.privatehub` (titik berwarna lime).
- File PNG (lockup & social) sudah dirender memakai font Sora asli (diperbarui 18 Sep 2026).
- Catatan: file SVG lockup memakai `font-family: Sora`. Kalau dibuka di komputer
  yang belum memasang Sora, tulisannya jatuh ke font pengganti — pakai versi PNG
  untuk keperluan cetak/berbagi, atau pasang Sora dulu (lihat `fonts/FONTS.md`).
- Gaya bahasa, headline, tagline, dan istilah baku: lihat `MESSAGING.md`.
