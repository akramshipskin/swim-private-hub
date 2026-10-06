# PRD Swim Private Hub (SPH): apa yang dibuat dan kenapa

Status: DRAF 1 untuk ditinjau Hadi (7 Okt 2026). Dokumen perencanaan pertama dari enam (PRD, alur aplikasi, brief desain, TRD, skema data, rencana kerja). Dikerjakan satu per satu: dokumen berikutnya baru dimulai setelah ini disetujui.

Cara baca: dokumen ini menjawab APA yang dibuat dan UNTUK SIAPA. Cara membuatnya ada di TRD (belum ditulis). Angka dan aturan uang TIDAK ditulis ulang di sini; rujukannya `docs/aturan-bisnis-saat-ini.md` dan `src/lib/policy.ts`, `src/lib/pricing.ts`. Isi dokumen ini diambil dari keputusan Hadi (`docs/KEPUTUSAN.md`), pesan merek (`brand-kit/MESSAGING.md`), dan kode per 7 Okt 2026. Bagian yang BUKAN keputusan Hadi ditandai **[usulan]** atau **[belum diputuskan]**.

## 1. Ringkasan

SPH adalah aplikasi les renang privat. Orang tua (atau orang dewasa yang belajar sendiri) memilih coach, kolam, dan jam; coach dan pemilik kolam menerima bagian mereka otomatis setiap sesi yang benar-benar terlaksana.

- Tagline resmi: "Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya."
- Posisi: SPH adalah **perantara** (marketplace), bukan pemilik kolam dan bukan pemberi kerja coach. SPH mendapat biaya layanan di atas harga yang dipasang kolam dan coach (keputusan Hadi 2 Okt; posisi perantara dinyatakan aman oleh akuntan lewat Hadi).
- Posisi pasar: belum ditemukan aplikasi sejenis dengan tiga peran seperti ini, tetapi itu bukan bukti; "aplikasi les renang privat" dipakai sebagai nama kategori, bukan klaim "pertama" (MESSAGING.md bagian 2).
- Tahap sekarang: pengembangan. Semua akun di production dummy dan pembayaran masih sandbox Midtrans. Belum ada member asli. Iklan Meta belum jalan.

## 2. Masalah yang dijawab

Disusun dari fitur dan keputusan yang sudah ada, per peran. **[usulan]**: Hadi koreksi bila alasan aslinya berbeda.

| Peran | Masalah yang dijawab |
|---|---|
| Member | Sulit menemukan coach renang privat yang jelas profil, harga, dan jadwalnya; tidak tahu total biaya sebelum bayar; takut sisa sesi hangus atau coach hilang tanpa kabar. |
| Coach | Mengurus murid, jadwal, dan uang lewat chat manual; tidak ada bukti sesi yang sudah terjadi. |
| Pemilik kolam | Tiket masuk pelanggan privat tercampur dengan pengunjung umum; sulit melihat siapa datang kapan dan berapa haknya. |
| SPH (pemilik produk) | Perlu pencatatan uang yang rapi (siapa berhak berapa, pajak titipan, pembatalan) tanpa menahan uang di rekening sendiri lebih lama dari perlu. |

Kekhawatiran Hadi yang jadi dasar aturan (dari KEPUTUSAN.md): coach "coba-coba" lalu tidak membuka jadwal padahal member sudah bayar (3 Okt); coach menarik member keluar dari aplikasi (3 Okt); member memilih coach, jadi profil coach harus menarik (6 Okt).

## 3. Pengguna dan peran

Lima kelompok. Daftar halaman lengkap per peran: `docs/cakupan-halaman.md` (59 halaman).

### 3.1 Member (orang tua / dewasa belajar sendiri)
Tujuan: les renang yang jelas biayanya, jadwalnya, dan perkembangannya.
- Daftar dengan kota; satu akun punya beberapa peserta ("Saya" = peserta dirinya sendiri), tanggal lahir peserta wajib.
- Cari coach di kotanya (kota lain boleh dengan peringatan); lihat profil, sertifikat, kolam, jadwal terdekat.
- Beli paket 4 atau 8 sesi (terikat 1 coach + 1 kolam), atau sesi coba 1x per peserta.
- Booking dua langkah (pilih jam, lalu konfirmasi, lalu kode booking); batal sendiri sesuai jatah.
- Lihat riwayat, catatan perkembangan (milestone) dan sertifikat; saldo member; ajukan ganti coach; ajukan hapus akun.
- Dikabari lewat notifikasi HP dan lonceng dalam aplikasi.

### 3.2 Coach
Tujuan: murid yang terjadwal dan bayaran yang jelas tanpa urusan manual.
- Daftar dengan kota, sertifikat, foto; wajib menyetujui Perjanjian Kemitraan Coach.
- Memilih sendiri kolam tempat mengajar (kolam tidak perlu menyetujui), pasang harga jasa paket 4 dan 8, buka jam kosong.
- Tandai Hadir / Tidak Hadir (paling lambat 24 jam setelah sesi), tulis catatan milestone.
- Saldo dan penarikan; dasbor "Sesi yang harus kamu sediakan".
- Syarat tampil di pencarian: minimal 4 jam kosong yang bisa dibooking dalam 14 hari ke depan di kolam itu.

### 3.3 Pemilik kolam
Tujuan: tiket masuk pelanggan privat terbayar rapi dan terkendali kapasitasnya.
- Daftar dengan kota dan alamat; wajib menyetujui MOU Kolam.
- Pasang harga tiket paket 4 dan 8 (1 coach + 1 peserta + 1 pendamping per sesi), jam buka, kapasitas harian untuk pelanggan SPH (kosong = tanpa batas), info dan foto kolam.
- Lihat jadwal, laporan, saldo dan penarikan, daftar coach yang memilih kolamnya.

### 3.4 Admin (satu orang: pendiri; wajib 2FA)
Tujuan: menjaga kualitas dan uang tetap benar. Admin bukan peran yang bisa didaftarkan.
- Kelola pengguna (nonaktifkan, anonimkan atas permintaan hapus akun, beri paket gratis), putuskan ganti coach, proses penarikan manual (maks 7 hari kerja), koreksi saldo, lihat bagi hasil, laporan kehadiran, kinerja coach, peminat per kota, testimoni, pesan, email.

### 3.5 Pengunjung (tanpa login)
Landing, Panduan, halaman hukum, profil publik coach, daftar member/coach/kolam. Sebagian besar datang dari iklan Meta lewat HP, jadi kecepatan dan kejelasan diutamakan (CLAUDE.md SPH).

## 4. Kemampuan produk dan statusnya

Status dicek dari kode dan catatan STATUS.md per 7 Okt 2026. "Live" = sudah tayang di production (data dummy).

| # | Kemampuan | Status |
|---|---|---|
| 1 | Daftar dan masuk 4 peran, kunci login 15 menit setelah salah password, 2FA admin | Live |
| 2 | Kota (10 kota tetap) dan pilihan kolam oleh coach; daftar tunggu kota "Kabari saya" | Live |
| 3 | Harga dari kolam dan coach, paket 4 dan 8 sesi, biaya layanan di atas harga | Live |
| 4 | Pembayaran Midtrans (sandbox), saldo member terpakai otomatis, kedaluwarsa otomatis | Live (sandbox) |
| 5 | Cari coach, profil publik coach, syarat tampil 4 jam kosong / 14 hari | Live |
| 6 | Booking dua langkah, batal sendiri dengan jatah, kapasitas harian kolam, jam buka kolam | Live |
| 7 | Kehadiran: tandai Hadir / Tidak Hadir, lapor Tidak Hadir yang salah | Live |
| 8 | Bagi hasil otomatis per sesi Hadir, pajak titipan PPh 0,5%, PPN di biaya layanan | Live |
| 9 | Penarikan saldo kolam dan coach (manual admin, min Rp50.000), rekap PPh | Live |
| 10 | Milestone: catatan perkembangan wajib tiap 2 sesi Hadir, sertifikat tingkat | Live |
| 11 | Ganti coach lewat pengajuan, ganti coach gratis hari ke-10, catatan pelanggaran coach | Live |
| 12 | Penjaga jadwal harian (cron 06.00 WIB) | Live; log cron belum dicek Hadi |
| 13 | Afiliasi: kode coach/kolam, komisi 50% biaya layanan bersih | Live |
| 14 | Notifikasi HP dan lonceng dalam aplikasi (riwayat 90 hari) | Live |
| 15 | Hapus akun (anonimkan), diblokir saat ada pembayaran berjalan | Live |
| 16 | Email admin (Resend), chat bantuan, testimoni, Meta Pixel + Conversions API | Live; event Meta belum dicek |
| 17 | Reset password mandiri lewat email (email terkonfirmasi) | Belum dibuat; menunggu bukti email production terkirim (keputusan 2 Okt #10) |
| 18 | Drop kolom database model lama | Belum; butuh Hadi |

## 5. Aturan bisnis yang membentuk produk

Hanya prinsipnya. Rumus, angka, dan contoh hitung: `docs/aturan-bisnis-saat-ini.md`.

1. **Harga dari mitra, komisi dari SPH.** Kolam dan coach memasang harga sendiri; SPH menambah biaya layanan di atasnya (bukan markup tersembunyi: rincian tampil sebelum bayar). Kepada pengguna disebut "6,5% (maksimal 7%)".
2. **Uang dibagi saat sesi benar-benar terjadi** (tanda Hadir), bukan saat bayar. Tidak hadir: coach 50% dari bagiannya, kolam Rp0.
3. **Satu paket, satu coach, satu kolam.** Tidak ada eceran dan tidak ada beli 1 sesi di kolam lain. Ganti coach lewat pengajuan; ganti gratis bila coach tidak membuka jadwal sampai hari ke-10.
4. **Server yang menjaga aturan**, bukan tampilan: booking, saldo, hak akses dicek di server dan tahan terhadap dua permintaan bersamaan.
5. **Pajak:** PPh final 0,5% dipotong dari bagian coach/kolam sebagai titipan (disetor SPH); PPN 11% sudah di dalam biaya layanan. NPWP coach urusan coach.
6. **Perlindungan member:** paket tidak diperpanjang bila coach lalai; jatah batal per paket; sesi coba 7 hari; kehadiran bisa dilaporkan salah dalam 3 hari.
7. **Perlindungan mitra:** perjanjian coach dan MOU kolam disetujui lewat centang saat daftar; catatan pelanggaran coach per kejadian; 3 pelanggaran dalam 6 bulan = admin menilai (tidak otomatis).
8. **Janji ke publik hanya yang bisa dibuktikan** (MESSAGING.md bagian 1): tanpa "terbaik", tanpa angka yang bukan dari database, tanpa janji hasil renang.

## 6. Di luar cakupan (sudah diputuskan TIDAK dibuat)

- Beli sesi eceran dan beli 1 sesi di kolam lain (dihapus 2 Okt).
- Kartu kredit (dimatikan; biaya Midtrans ditanggung SPH).
- Biaya Midtrans dibebankan ke member (dilarang aturan BI, 2 Okt).
- Impor Excel member (dihapus 2 Okt).
- Persetujuan kolam atas coach yang memilih kolamnya (3 Okt).
- Perpanjangan otomatis paket bila coach tidak membuka jadwal (3 Okt).
- Tombol keluar dari daftar tunggu kota (6 Okt).
- Tombol beli menempel di halaman Paket (6 Okt).
- Pemeriksaan latar belakang coach: SPH belum melakukannya dan landing tidak boleh berjanji demikian (2 Okt).
- Saldo member dicairkan jadi uang (saldo hanya untuk beli paket berikutnya).

## 7. Kendala dan asumsi

- Pembayaran lewat Midtrans (satu akun platform); penarikan ke coach/kolam manual oleh admin.
- Zona waktu bisnis WIB; 10 kota tetap (Jakarta, Depok, Bekasi, Bogor, Tangerang, Bandung, Cianjur, Sukabumi, Surabaya, Malang).
- Admin hanya satu orang (pendiri): fitur yang butuh keputusan manusia (ganti coach, penarikan, hapus akun) menumpuk di satu orang. Ini batas produk saat ini.
- Teks hukum disetujui orang hukum dan tidak diubah tanpa mereka (draf tambahan Privasi menunggu: `docs/legal/draft-privasi-rev-kota-daftar-tunggu-lonceng.md`). Kata "pencairan" di teks hukum belum sama dengan "penarikan" di aplikasi; orang hukum diberi tahu saat revisi berikutnya (Hadi 7 Okt, pertanyaan 1A).
- Lalu lintas utama dari iklan Meta lewat HP.
- Alur aplikasi tidak diubah tanpa izin Hadi; tampilan boleh dirombak.

## 8. Ukuran keberhasilan

**[belum diputuskan]** Belum ada target angka dari Hadi untuk SPH (jumlah kota aktif, jumlah sesi per bulan, biaya per pendaftar iklan, dan sebagainya). Alat ukur yang sudah ada: Meta Pixel + Conversions API (event belum dicek), halaman admin Peminat per Kota, Kinerja Coach, Laporan Kehadiran, Bagi Hasil. Usulan ukuran awal ada di Pertanyaan 1 di laporan chat.

## 9. Risiko produk

| Risiko | Pengaman yang sudah ada | Yang belum |
|---|---|---|
| Coach tidak membuka jadwal setelah member bayar | Penjaga harian, ganti coach gratis hari ke-10, catatan pelanggaran | Belum terbukti dengan member asli |
| Dua pihak berebut jam yang sama | Klaim slot di server + tes balapan | Tidak ada |
| Saldo salah hitung | Buku besar (ledger) sebagai sumber kebenaran, audit buku besar, 209 tes balapan | Audit production butuh Hadi |
| Admin satu orang menjadi hambatan | Ditandai bila penarikan lewat 7 hari kerja | Belum ada admin kedua |
| Janji landing tidak sama dengan sistem | Sweeping keselarasan 6 Okt (38 temuan, sebagian diperbaiki) | Tangkapan layar dan kota sudah diperbarui; cek ulang saat iklan jalan |
| Kolam atau coach asli belum ada | Landing hanya menampilkan akun asli di strip statistik | Belum ada mitra asli |

## 10. Pertanyaan terbuka untuk Hadi (dicatat; diulang di laporan chat)

1. Ukuran keberhasilan: angka apa yang dianggap "SPH jalan"? (bagian 8)
2. Tabel masalah per peran (bagian 2): apakah sudah menggambarkan alasan Hadi membuat SPH, atau ada alasan lain yang belum tertulis?
3. Target pasar awal: apakah mulai dari satu kota dulu (Cianjur?), atau semua 10 kota sekaligus? **[belum diputuskan]**
4. Admin kedua: kapan dibutuhkan? **[belum diputuskan]**

## Riwayat dokumen
- 7 Okt 2026: draf 1 (Claude, Sonnet 5.5). Bahan: aturan-bisnis-saat-ini, KEPUTUSAN, HANDOFF-AGEN, MESSAGING, kode.
