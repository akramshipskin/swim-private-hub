# Sweeping UI + sistem (Opus) dan kerjaan Opus — 2 Okt 2026

Model: Opus 5.5 (dipilih Hadi). Semua uji di database lokal (salinan production yang disamarkan) dan akun uji lokal; tidak login ke production, tidak ada uang sungguhan. Laporan sebelumnya: docs/reviews/2026-10-01-sweeping-ui-sistem.md.

## 1. Koreksi atas laporan 1 Okt
- Butir "nama akun di pendaftaran belum dibatasi" SALAH: pendaftaran member/coach/kolam sudah dibatasi 100 karakter sejak 30 Sep (src/lib/register-input.ts). Claude menyimpulkan tanpa membaca kode pendaftaran. Yang benar-benar belum dibatasi hanya pembuatan akun oleh admin (sekarang sudah).
- "Tombol tanpa nama" di Kelola Kolam/Pengguna: false alarm (tombol di dalam bagian lipat yang tertutup; teksnya ada).
- Komisi platform 0% Kolam Bahari: disetel Claude di database LOKAL saat uji 30 Sep (tercatat di laporan 30 Sep baris 142), bukan data production.

## 2. Kerjaan Opus yang dikerjakan
| Butir | Hasil | Bukti |
|---|---|---|
| Kunci pembatas login menyimpan identitas mentah (5.077 karakter) | storedKey(): kunci >200 diringkas (potong + sha256) di catat/hitung/hapus; identitas >254 ditolak tanpa menyentuh DB | tes rate-limit + authorize (batas 254/255); uji formulir ulang: tidak ada kunci panjang baru |
| Batas nama 100 di semua jalur akun/peserta | createDependent, ubah nama profil, pembaca peserta, buat akun admin (+email, nama/alamat kolam baru), impor Excel (dilewati dengan pesan jelas) | tes 100/101; uji formulir ulang menampilkan "Nama maksimal 100 karakter." |
| Pemeriksa Opus konteks segar | 0 temuan berat/sedang; 6 ringan, yang mudah sudah dirapikan (email impor, nama peserta impor, nama spasi saja, tes lebih ketat) | laporan pemeriksa di percakapan |
| Audit buku besar (scripts/audit-uang.mjs) | 14 dompet, 9 sesi berbayar, 4 pencairan, afiliasi, platform: COCOK | 5 sesi Hadir tanpa uang = data uji (pembayaran disisipkan 7 jam setelah ditandai); PPN 12% pada 30 Sep pagi = benar (11% berlaku 30 Sep 22:01 WIB) |
| Aksi uang lewat tampilan + audit tiap langkah | Hadir->Tidak Hadir (coach -24.000, kolam -60.000 jadi minus, platform +84.000; sesi Rp120.000, 10/40/50), kembali Hadir (persis kembali), ajukan cair 50.000, ditolak (kembali), ajukan lagi + tandai dibayar manual (tidak terpotong dua kali), koreksi +10.000 | audit COCOK di semua 8 titik |
| Tes balapan (2+ permintaan bersamaan) | 14 berkas, 146 tes lulus; berkas "bug yang diketahui" sudah semuanya diperbaiki sebelumnya | npm run test:race |

## 3. Animasi landing v2 + video
Lihat docs/reviews/2026-10-01-animasi-landing.md bagian "v2". Ringkas: riak air mengikuti kursor/ketukan, judul muncul dari bawah air, gelombang di bawah "pilih jamnya", layar HP miring, perenang di tali lintasan, coretan cara lama + sapuan lime, parallax foto kolam, sorotan kartu coach, tombol magnetis, gelombang sebelum footer, video perenang (desktop). Situs asli: HP elemen terbesar median 0,93 dtk (awal 2,37), desktop 0,46 dtk (berisik), CLS 0.

## 4. Sweeping ulang (528 kunjungan, 59 halaman x 5 kondisi, 3 lebar, terang/gelap) + konsistensi
Temuan baru dan perbaikannya:
1. [sedang] Kelola Paket melebar 47.000 px karena nama tanpa spasi (data uji 5.071 huruf) -> CSS global overflow-wrap: break-word; data uji lokal dipendekkan. Terbukti tidak melebar.
2. [sedang, kesalahan Claude] Landing 768 px: tombol "Daftar gratis" penutup keluar 24 px karena pembungkus tombol magnetis menyusut -> shrink-0. Terbukti.
3. [ringan] "Kelola butir standar" 20 px di HP -> 44 px.
4. Konsistensi gaya (otomatis, 64 halaman aplikasi x 3 lebar): judul halaman, kartu (sudut 16 px + bayangan), tombol utama (44 px) seragam. Yang berbeda sengaja: halaman berdiri sendiri (pembayaran, keamanan, milestone: judul 20 px), sertifikat (untuk cetak), tombol kecil vs normal, item kotak masuk Email/Pesan.
Ulang uji hak akses: identik, 0 error server. Ulang uji formulir: 162 pengiriman, 0 masalah.

## 5. Tabel cakupan (sweeping ulang 2 Okt)
| Halaman | publik | admin | coach | member | pool |
|---|---|---|---|---|---|
| `/` | UI 6/6 | ditolak →/admin | ditolak →/coach/das | ditolak →/member/bo | ditolak →/pool/dash |
| `/brandguideline` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/daftar-coach` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/daftar-kolam` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/ganti-password` | ditolak →/login | alih→/admin | alih→/coach/dashboa | alih→/member/bookin | alih→/pool/dashboar |
| `/keamanan` | alih→/login | alih→/admin | UI 6/6 | UI 6/6 | UI 6/6 |
| `/kebijakan-cookie` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/kebijakan-pengembalian` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/kebijakan-privasi` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/milestone/[dependentId]` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/milestone/[dependentId]/sertifikat/[completionId]` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/panduan` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/pelatih/[coachId]` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/pembayaran/gagal` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/pembayaran/sukses` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/profil` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/syarat-ketentuan` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/(auth)/login` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/(auth)/register` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/admin` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/afiliasi` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/booking-overview` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/email` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/kinerja-coach` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/kolam` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/komisi` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/koreksi-saldo` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/laporan-kehadiran` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/milestone` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/milestone/butir` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/paket` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/pembayaran` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/pesan` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/testimoni` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/users` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/users/[userId]` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/withdrawals` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/coach` | ditolak →/login | ditolak →/ | alih→/coach/dashboa | ditolak →/ | ditolak →/ |
| `/coach/dashboard` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/jadwal` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/peserta` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/riwayat-sesi` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/saldo` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/member` | ditolak →/login | ditolak →/ | ditolak →/ | alih→/member/bookin | ditolak →/ |
| `/member/booking` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/cari-coach` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/dashboard` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/paket` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/pembayaran` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/peserta` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/riwayat` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/pool` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | alih→/pool/dashboar |
| `/pool/coach` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/dashboard` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/info` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/jadwal` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/laporan` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/paket` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/saldo` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |

## 6. Tidak bisa dicek
Production (login dilarang), HP asli/Safari, unggah ke penyimpanan asli, email, push, pembayaran Midtrans asli, keadaan error 500. Pembatalan booking oleh member tidak diklik di uji tampilan (dicakup tes balapan booking).
