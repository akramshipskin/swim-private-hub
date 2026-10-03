# Sweeping sistem total ulang setelah update kota (3 Okt 2026 malam, Opus)

Lingkungan: laptop, versi jadi (`next start` port 3110), database & penyimpanan lokal. Akun uji lokal: admin 089900000001 (2FA), coach 089900000004, pemilik kolam 089900000002, member 089977700099 (kota Bandung). Inventaris dari kode: 68 file halaman (+ halaman 404), 19 route API, 37 file server action (2 file lain hanya menyebut "use server" di komentar).

## Cakupan
| Peran | Halaman | HP 375 | Tablet 768 | Desktop 1280 | Terang/Gelap | Kunjungan |
|---|---|---|---|---|---|---|
| Publik | 17 | dicek | dicek | dicek | dua-duanya | 102 |
| Member | 14 (3 mengalihkan: /member, /kota, /ganti-password) | dicek | dicek | dicek | dua-duanya | 84 |
| Coach | 13 (3 mengalihkan: /coach, /perjanjian, /ganti-password) | dicek | dicek | dicek | dua-duanya | 78 |
| Pemilik kolam | 12 (3 mengalihkan) | dicek | dicek | dicek | dua-duanya | 72 |
| Admin | 23 (/keamanan mengalihkan karena 2FA aktif) | dicek | dicek | dicek | dua-duanya | 138 |
Total 474 kunjungan + tinjauan gambar (Sonnet): semua halaman di HP terang, 43 halaman di desktop gelap; tablet hanya pemeriksa otomatis. Pengalihan sesuai rancangan (akun sudah punya kota / sudah setuju rev.3 / bukan password sementara); isi halaman /kota dan /perjanjian sudah diuji di browser 3 Okt sore. Milestone milik peserta sendiri dicek langsung di browser (member).

## Uji otomatis
- Hak akses: 69 halaman x 5 peran (termasuk tanpa login) + 20 alamat data x 5 = 445 sel. 0 halaman peran lain terbuka, 0 error server. Alamat baru (/coach/kolam, /kota, /admin/peminat-kota, /admin/coach-tanpa-jadwal) hanya terbuka untuk perannya; /api/cron/harian menolak semua tanpa kunci (401).
- Formulir: 287 catatan, 174 kiriman (kosong / panjang+karakter khusus) di 5 peran. 0 error server, 0 celah penyisipan kode.
- Audit buku besar lokal: semua cocok (termasuk cek baru ganti coach tanpa biaya).
- Cek tipe lulus, 763 tes otomatis, 190 tes balapan, build, lint (1 catatan lama tak berpengaruh).

## Pemeriksaan kode (3 Opus berkonteks segar + 1 Opus pemeriksa perbaikan)
- Hak akses: 0 berat, 0 sedang, 5 ringan. Uang: 0 berat, 1 sedang (alat audit), 2 ringan; contoh paket Rp1.363.200 terbagi utuh sampai rupiah terakhir. Booking/jadwal: 0 berat, 2 sedang, 6 ringan. Pemeriksa perbaikan: 0 berat, 0 sedang, 4 ringan.

## Diperbaiki langsung
1. Notifikasi Midtrans ditolak semua bila kunci server kosong (sebelumnya tanda tangan bisa dipalsukan dengan teks "undefined" di lingkungan tanpa kunci).
2. Ubah info/foto kolam & tandai hadir lewat panggilan langsung: menolak password sementara, admin tanpa 2FA, mitra belum setuju perjanjian terbaru.
3. Profil publik coach tidak menampilkan kolam nonaktif; tata letak tengah sejajar header.
4. Coach tidak bisa membuka jam di kolam nonaktif (sebelumnya berhasil tapi tidak bisa dibooking).
5. Kalender & daftar slot member menyembunyikan slot coach/kolam nonaktif, di luar jam buka, dan tanggal yang kapasitas kolamnya penuh (sebelumnya member klik lalu ditolak).
6. Syarat tampil coach (4 jam kosong/14 hari) tidak menghitung jam di tanggal kolam penuh. Penjaga jadwal (pelanggaran) SENGAJA tidak ikut berubah: menunggu keputusan Hadi.
7. Ganti coach berbayar mengunci akun member dulu (urutan sama dengan booking) supaya tidak saling mengunci.
8. Alat audit uang memahami ganti coach tanpa biaya (harga kolam lama, kolam yang dikredit, kredit saldo member).
9. Landing: "mulai Rp..." dan jumlah coach di kartu kolam hanya dari coach yang bisa dibeli.
10. Tanggal berlaku paket/batas bayar/tanggal catatan memakai tanggal WIB (sebelumnya mundur sehari, contoh "s.d. 1 Des" di Paket Saya vs "2 Des" di Dashboard).
11. Halaman daftar member melebar 394 px di HP 375 -> pas.
12. Skrip jam kosong contoh tidak membuat slot jam 12.00 (jam istirahat).
13. Teks: "Saldo mengendap" menjelaskan termasuk pendapatan yang masih ditahan 3 hari; label "Pendapatan bersih bisa ditarik" disamakan; riwayat ganti coach "Rp... masuk saldo member"; Coach Tanpa Jadwal "pertimbangkan menonaktifkan coach"; Panduan "Daftarkan kolam" (ke formulir, bukan WA); teks daftar tunggu kota dirapikan; pilihan kota tidak terpotong; judul tab Cari Coach & Profil Coach.
14. Tampilan: kartu jadwal coach tidak menumpuk teks; butir milestone admin terbaca di HP; tautan FAQ landing 44 px di tablet.

## Alarm palsu
- Foto rusak + pesan keamanan (penyimpanan lokal), skrip analitik Vercel 404, kontras tombol nonaktif, kolom jebakan bot 169x24, tombol tanpa nama di Kolam admin (tombol × punya label; yang terdeteksi ada di bagian terlipat), spanduk cookie.
- Milestone 404 untuk member/coach yang bukan pemilik peserta: memang ditolak.
- Tabel brand guideline "terpotong" di HP: memang bisa digeser ke samping.
- Tombol "Edit Info Kolam": tombol membuka mode ubah, bukan tombol simpan.
- "Saldo mengendap" tidak sama dengan jumlah kartu: selisihnya pendapatan platform yang masih ditahan 3 hari (teks diperjelas).
- openSlotStats tanpa saring coach/kolam aktif: semua pemanggilnya sudah menyaring.
- PPN 11%, "biaya layanan di bawah 7%", kolam "Segera hadir" di landing: sesuai keputusan Hadi.

## Menunggu keputusan Hadi
1. Pelanggaran coach dihitung per paket (sekarang: 3 member diam = 3 pelanggaran sekaligus) atau per kejadian coach.
2. Kolam dinonaktifkan admin: coach tetap dicatat melanggar di hari ke-10? Kolam penuh karena member lain: dihitung tanpa jadwal?
3. Hari ke-10 dihitung dari pemeriksaan pagi pertama (bisa ~10,9 hari sejak jadwal habis).
4. Admin membatalkan sesi lama (sebelum ganti coach) yang belum ditandai: sesi kembali ke paket dan dibagi dengan harga baru.
5. Pemilik kolam melihat No HP semua coach di kolamnya.
6. Cari Coach menampilkan coach tanpa kolam dan tanpa kota.
7. Tidak tertulis: member yang sedang minta hapus akun masih bisa beli/booking; checkout menerima peserta yang dinonaktifkan; coach bisa menulis milestone setelah baru 1 booking (belum ada sesi Hadir).
8. Format rupiah "Rp 172.250" (angka) vs "Rp1.000" (kalimat); istilah menu tidak seragam (Riwayat/Riwayat Booking, Sesi/Riwayat Sesi, Lainnya/Menu).

## Ringan, dibiarkan (dicatat)
- Gerbang wajib-ganti-password tidak dicek di batal booking, simpan kota, aksi profil (hanya data milik sendiri).
- Daftar tunggu kota bisa terlambat dikabari bila jam ke-4 tersedia karena pembatalan (tidak pernah terlalu cepat).
- Paket menunggu bayar >24 jam 15 menit tidak menghalangi lepas kolam (kemungkinan sangat kecil).
- Urutan kunci webhook vs bayar ganti coach (hanya bila notifikasi telat bersamaan dengan bayar ulang; Postgres membatalkan salah satu, tidak macet).
- Kartu riwayat sesi coach & riwayat member di HP agak padat (masih terbaca).

## Belum dicek
HP asli & Safari, halaman login di production, notifikasi push, email, unggah ke penyimpanan asli, pembayaran sungguhan, pemeriksa harian di Vercel (cek Logs 4 Okt setelah 06.00 WIB), tablet 768 hanya pemeriksa otomatis (bukan tinjauan gambar).
