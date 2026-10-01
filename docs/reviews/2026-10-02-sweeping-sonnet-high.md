# Sweeping sistem ulang (Sonnet High), 2 Okt 2026

Permintaan Hadi (mode TIDUR): ulang sweeping semua fitur dengan Sonnet High, benerin langsung yang salah, lalu landing (animasi desktop, UI, copywriting). Yang menyentuh uang/login/booking dikerjakan hanya bila sudah diputuskan Hadi; selain itu ditunda dan dicatat.

Lingkungan: laptop (database lokal, Midtrans mode uji). Tidak ada akses production.

## A. Cakupan (dijalankan, bukan dibaca)

| Pemeriksaan | Cakupan | Hasil |
|---|---|---|
| Tangkapan layar + 12 pemeriksaan otomatis per halaman (geser ke samping, gambar rusak, label, tap target, kontras, teks kecil, tautan mati, error konsol/jaringan) | 72 pasangan halaman×peran (publik 14, member 15, coach 11, pemilik kolam 10, admin 22) × 3 lebar (375/768/1280) × 2 tema = 432 kunjungan | lihat C |
| Hak akses | 62 halaman × 5 sesi (tanpa login + 4 peran) = 310 + 13 route API × 5 = 65 | Semua penolakan benar (alihan ke /login atau beranda peran; API 401/403/400). Tidak ada 5xx. |
| Formulir (kosong + panjang/karakter khusus, validasi browser dimatikan) | publik 4 halaman, member 6, coach 7, pemilik kolam 5, admin 15 halaman | 166 pengiriman uji, 0 bermasalah: tidak ada 5xx, tidak ada error skrip, tidak ada XSS. Form kosong ditolak dengan pesan jelas. Form yang hanya berisi tombol (setujui/tolak/hapus) dan unggah file dilewati oleh alatnya. |
| Buku besar uang (baca saja) | 7 dompet kolam, 9 dompet coach, 28 booking (12 bertanda+berbayar), 8 pencairan, PPN/PPh, 2 saldo member | "Semua cocok." |
| Tes otomatis | 757 tes unit, 161 tes balapan, cek penulisan kode, build | lulus |
| Tinjauan visual (mata) | semua halaman member/coach/pemilik kolam/admin di 375 px; landing di 375 dan 1280 per layar-gulir | temuan di C |

Tidak bisa/tidak dicek (butuh Hadi atau uang/perangkat asli): HP asli dan Safari, push di HP, unggah ke penyimpanan asli, email keluar/masuk, pembayaran sungguhan, hapus permanen, login production.

## B. Diperbaiki (semua sudah live kecuali dicatat)

| # | Temuan | Perbaikan |
|---|---|---|
| 1 | Kartu paket menulis "Sesi habis" padahal sesinya sudah dijadwalkan | "Semua sesi sudah dijadwalkan" bila masih ada booking berjalan |
| 2 | "Lanjut bayar" hanya di Paket | Ditambah di Riwayat Bayar |
| 3 | Testimoni baru langsung tampil di landing | Dibuat tersembunyi dulu, admin tekan Tampilkan |
| 4 | Admin satu klik memindahkan uang (Setujui ganti coach, Hadir/Tidak Hadir) | Dialog konfirmasi |
| 5 | Isian form kosong setelah ditolak (setor PPh, koreksi saldo, tarik saldo platform, tambah peserta admin) | Isian dipertahankan saat ditolak, dikosongkan saat berhasil (dicoba di browser) |
| 6 | Tambah peserta admin tidak menanyakan tanggal lahir | Isian opsional (diverifikasi server) |
| 7 | Jadwal coach: "Sudah mulai — tandai" walau sudah ditandai | Menampilkan Hadir / Tidak Hadir |
| 8 | Pesan batal sesi coba: "jatah habis" | Pesan sesi coba yang benar |
| 9 | Kalender: tombol tanggal hanya angka; harga salah tidak diumumkan; tidak ada "Harga tersimpan" | Label tanggal lengkap, role alert/status |
| 10 | Laporan Kolam: bagian kolam sebelum PPh, saldo sesudah PPh | Kolom Bagian Kolam / PPh 0,5% / Masuk Saldo |
| 11 | Coach batal sakit: jam terbuka lagi untuk member lain | Jam ditutup, coach bisa membuka lagi lewat Tambah Jadwal (dicek Opus kedua + tes balapan) |
| 12 | Saldo Kolam di HP: angka saldo menabrak "Dalam proses pencairan" | Tata letak membungkus |
| 13 | Laporan Kolam di HP: kolom uang terpotong ke kanan | Satu kartu per sesi di HP |
| 14 | Halaman pembayaran belum selesai: "Belum ada saldo yang terpotong" (tidak akurat bila saldo SPH sudah terpakai) | Teks dibetulkan |
| 15 | Landing: bagian Kata mereka menempel ke Pertanyaan umum | Jarak ditambah |
| 16 | Tablet 768: menu samping dan menu header landing 20-36 px | Tinggi sentuh 44 px di lebar tablet |
| 17 | Landing masih menulis model lama (kolam usulkan harga, beli di kolam, tanpa sesi coba/ganti coach/PPh/biaya layanan) | Teks disesuaikan: tahap beli, FAQ (biaya, sesi coba, ganti coach, saldo, bagian coach tidak dipotong komisi), pemilik kolam pasang harga sendiri |

## C. Diperiksa, bukan masalah (false alarm / lingkungan)

- Foto kolam/coach rusak di laptop: penyimpanan tiruan memakai http, diblokir aturan keamanan browser. Production memakai https.
- "Tombol tanpa nama" di admin Kolam/Pengguna: tombol ada tulisannya ("Edit Info Kolam"), tulisan tak terbaca alat karena berada di bagian lipat.
- "Kontras 3,9" di tombol Daftar/admin: tombol sedang nonaktif (setengah pudar), pengecualian.
- 404 + peringatan konsol di /milestone untuk coach lain: akses ke peserta yang bukan muridnya, memang ditolak.
- Selisih gaya (judul 20 px, tinggi tombol 32 px): halaman masuk/2FA/sukses memang gaya tengah; tombol kecil adalah varian `sm`.

## D. Dibiarkan sengaja / menunggu Hadi

- Baris riwayat model lama di admin Kolam & Bagi Hasil ("Dari beli 1 sesi (member kolam lain)", "Pembagian komisi paket lama"): menjaga rekonsiliasi data lama; nilainya 0 untuk data baru.
- Nama peserta "Peserta 3" vs "Member 12 (kamu)": satu orang disebut beda di halaman berbeda (salinan nama saat "diri sendiri" dibuat). Ringan.
- Susunan "Kenalan dengan coach" (kartu miring berderet vertikal di desktop, ±3000 px dengan ruang kosong lebar): keputusan Hadi sebelumnya "tidak diubah". Tanya apakah mau dirapatkan.
- Isian [ISI HADI] di draf perjanjian coach & MOU kolam: menunggu jawaban Hadi; centang perjanjian tetap mati (versi null) sampai itu selesai.
- Teks landing yang menyangkut janji ke pelanggan (mis. "SPH belum melakukan pemeriksaan latar belakang") ditulis sesuai fakta sistem, tolong dibaca ulang.
