# PRD Swim Private Hub (SPH): apa yang dibuat dan kenapa

Status: DRAF 3 (7 Okt 2026): empat pertanyaan draf 2 sudah dijawab Hadi; menunggu konfirmasi bahwa PRD disetujui. Dokumen perencanaan pertama dari enam (PRD, alur aplikasi, brief desain, TRD, skema data, rencana kerja). Dikerjakan satu per satu.

Cara baca: dokumen ini menjawab APA yang dibuat dan UNTUK SIAPA. Cara membuatnya ada di TRD (belum ditulis). Rumus dan angka uang TIDAK ditulis ulang di sini; rujukannya `docs/aturan-bisnis-saat-ini.md`, `src/lib/policy.ts`, `src/lib/pricing.ts`. Bahan: keputusan Hadi (`docs/KEPUTUSAN.md`), sesi office hours 29 Sep (`docs/designs/validasi-permintaan-dan-kejujuran-landing.md`), pesan merek (`brand-kit/MESSAGING.md`), landing, dan kode per 7 Okt 2026. Bagian yang BUKAN keputusan Hadi ditandai **[usulan]** atau **[belum diputuskan]**.

## 1. Ringkasan

SPH adalah aplikasi les renang privat. Orang tua (atau orang dewasa yang belajar sendiri) memilih coach, kolam, dan jam; coach dan pemilik kolam menerima bagian mereka otomatis setiap sesi yang benar-benar terlaksana.

- Tagline resmi: "Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya."
- **Tujuan utama (Hadi 7 Okt):** aplikasi dipakai oleh sebanyak mungkin orang. Angka target belum dihitung (lihat bagian 9).
- Posisi: SPH adalah **perantara** (marketplace) yang mencari ketiga sisi sekaligus: kolam, coach, dan member (keputusan 29 Sep). SPH memegang hubungan pelanggan dan semua uang lewat SPH. Bukan pemilik kolam, bukan pemberi kerja coach.
- Bentuk les: **1 coach : 1 peserta, 60 menit, di kolam umum** (bukan sewa lintasan atau klub). Tiket masuk kolam sudah termasuk dalam harga.
- Wilayah awal (Hadi 7 Okt): **Cianjur, Jakarta, Bandung, Surabaya.** Aplikasi tetap menerima pendaftaran dari 10 kota (Hadi 7 Okt); kota di luar empat itu masuk daftar tunggu dan datanya jadi petunjuk kota berikutnya.
- Posisi pasar: belum ditemukan aplikasi sejenis dengan tiga peran seperti ini, tetapi itu bukan bukti; "aplikasi les renang privat" dipakai sebagai nama kategori, bukan klaim "pertama" (MESSAGING.md bagian 2).
- Tahap sekarang: pengembangan. Semua akun di production dummy, pembayaran sandbox Midtrans, belum ada member, coach, atau kolam asli yang terdaftar. Belum ada kabar iklan SPH jalan.

## 2. Kenapa orang memakai SPH (nilai per peran)

Disusun dari keputusan Hadi, landing, dan kode. **[usulan]** untuk kalimat yang belum pernah Hadi tulis sendiri.

| Peran | Yang didapat | Dasar |
|---|---|---|
| Member | Coach yang jelas profil, sertifikat, harga, dan jadwalnya; total biaya tampil sebelum bayar; perkembangan anak tercatat per keterampilan dan bersertifikat; sesi dan jatah batal terhitung per peserta; ada jalan keluar bila coach tidak membuka jadwal (ganti coach gratis). | MESSAGING.md bagian 1; keputusan 3 Okt |
| Coach | Murid dari SPH tanpa mencari sendiri; jadwal, bukti sesi, dan bayaran otomatis; profil publik untuk menarik member (sertifikat, kolam, jam buka). | Landing; keputusan 6 Okt (profil harus menarik karena member yang memilih coach) |
| Pemilik kolam | **Mengisi jam sepi kolam dengan les privat yang terjadwal** tanpa mengurus coach atau pembayaran: kolam tetap kolam umum, setiap sesi Hadir menghasilkan tiket (coach + peserta + pendamping) yang dibayar rapi. SPH memperkenalkan kolam ke orang tua yang mencari les, tanpa menjanjikan jumlah member. | Office hours 29 Sep (bukti lapangan: kolam Cianjur sudah penuh klub tapi masih menerima les satuan); landing bagian kolam |
| SPH (pemilik produk) | Pendapatan dari biaya layanan setiap sesi yang terlaksana, pencatatan uang rapi (siapa berhak berapa, pajak titipan, pembatalan). | Keputusan 2 Okt |

Kekhawatiran Hadi yang jadi dasar aturan: coach "coba-coba" lalu tidak buka jadwal padahal member sudah bayar (3 Okt); coach menarik member keluar dari aplikasi (3 Okt); member memilih coach, jadi profil coach harus menarik (6 Okt).

## 3. Strategi dan risiko terbesar (dari sesi office hours 29 Sep, masih berlaku)

1. **Permintaan belum terbukti.** Bukti lapangan baru satu: kolam Cianjur menerima les satuan. Keyakinan "banyak orang tua butuh" belum diuji. Rencana yang disetujui: uji dengan iklan Meta kecil per wilayah sebelum uang besar keluar; wilayah dipilih dari data (biaya per lead orang tua dan ketersediaan pasokan). Hadi sudah memilih empat kota; hasil uji iklan belum ada.
2. **Pasokan dulu, member terakhir.** Kolam dan coach dicari lebih dulu; member baru diiklankan di kota yang sudah punya pasangan kolam + coach. Di sistem, kota tanpa pasangan otomatis menampilkan daftar tunggu "Kabari saya".
3. **Risiko transaksi pindah ke WhatsApp ("kabur").** Les privat berulang dan lokal paling rawan. Pelindung yang berlaku (keputusan 29 Sep): (a) perjanjian coach melarang transaksi di luar aplikasi; (b) hal yang WhatsApp tidak punya: riwayat, jatah batal, saldo, ganti coach, dan catatan perkembangan + sertifikat anak (milestone); (c) hanya coach yang pernah mengajar peserta yang bisa menulis dan melihat catatannya. Pelindung lewat kolam (klausul "privat hanya lewat SPH") sudah DIHAPUS 29 Sep karena kolam tetap kolam umum.
4. **Ekonomi SPH per paket tipis (dari contoh di aturan bisnis, biaya Midtrans belum dicek).** Contoh paket 8 sesi: biaya layanan Rp83.200, bersih setelah PPN 11% Rp74.955; bila member datang lewat kode afiliasi, komisi sekali Rp37.477, sisa Rp37.478 sebelum biaya Midtrans (ditanggung SPH, tarif belum dicek). Hadi sudah memutuskan menilai ulang sebelum iklan jalan (2 Okt).
5. **Kepercayaan dan keselamatan anak.** SPH belum memeriksa latar belakang coach dan landing tidak boleh berjanji demikian. Pembagian tanggung jawab (keputusan 29 Sep): SPH bertanggung jawab atas keuangan, jadwal, dan booking; keselamatan di air = kolam dan coach. Isi resmi ada di S&K dan perjanjian.
6. **Satu admin.** Semua keputusan manusia (ganti coach, penarikan, hapus akun, persetujuan mitra) menumpuk di satu orang.

## 4. Pengguna dan peran

Daftar halaman lengkap per peran: `docs/cakupan-halaman.md` (59 halaman).

### 4.1 Member (orang tua / dewasa belajar sendiri)
- Daftar dengan kota; satu akun punya beberapa peserta ("Saya" = dirinya sendiri), tanggal lahir peserta wajib (menentukan kelompok umur milestone).
- Cari coach di kotanya (kota lain boleh dengan peringatan); lihat profil, sertifikat, kolam, jadwal terdekat.
- Beli paket 4 atau 8 sesi (terikat 1 coach + 1 kolam), atau sesi coba 1x per peserta.
- Booking dua langkah (pilih jam, konfirmasi, kode booking); batal sendiri sesuai jatah.
- Lihat riwayat, **perkembangan dan sertifikat peserta** (bagian 6), saldo member; ajukan ganti coach; ajukan hapus akun.
- Dikabari lewat notifikasi HP dan lonceng dalam aplikasi.

### 4.2 Coach
- Daftar dengan kota, sertifikat, foto; wajib setuju Perjanjian Kemitraan Coach; **disetujui admin sebelum aktif**; sertifikat "diperiksa" admin sebatas melihat isi file dan nama (bukan konfirmasi ke lembaga penerbit).
- Memilih sendiri kolam tempat mengajar (kolam tidak perlu menyetujui), pasang harga jasa paket 4 dan 8, buka jam kosong.
- Tandai Hadir / Tidak Hadir (paling lambat 24 jam setelah sesi), **tulis catatan perkembangan dan centang keterampilan peserta** (bagian 6).
- Saldo dan penarikan; dasbor "Sesi yang harus kamu sediakan".
- Syarat tampil di pencarian: minimal 4 jam kosong yang bisa dibooking dalam 14 hari ke depan di kolam itu.
- Coach berhalangan: sesi dibatalkan coach, kembali ke paket, dijadwal ulang; member tidak mendapat hak lebih.

### 4.3 Pemilik kolam
- Daftar dengan kota dan alamat; wajib setuju MOU Kolam; **disetujui admin sebelum aktif**.
- Pasang harga tiket paket 4 dan 8 (1 coach + 1 peserta + 1 pendamping per sesi), jam buka (coach tidak bisa membuka jam di luar jam buka), kapasitas harian untuk pelanggan SPH (kosong = tanpa batas), info dan foto kolam.
- Lihat jadwal dan keterisian 7 hari ke depan, laporan, saldo dan penarikan, daftar coach yang memilih kolamnya.
- Tidak melihat catatan perkembangan peserta.

### 4.4 Admin (satu orang: pendiri; wajib 2FA)
Bukan peran yang bisa didaftarkan. Kelola pengguna (setujui mitra, nonaktifkan, anonimkan atas permintaan hapus akun, beri paket gratis), putuskan ganti coach, proses penarikan manual (maks 7 hari kerja), koreksi saldo, bagi hasil, laporan kehadiran, kinerja coach, peminat per kota, testimoni, pesan, email, daftar keterampilan standar milestone.

### 4.5 Pengunjung (tanpa login)
Landing, Panduan, halaman hukum, profil publik coach, daftar member/coach/kolam. Sebagian besar datang dari iklan Meta lewat HP, jadi kecepatan dan kejelasan diutamakan.

## 5. Kemampuan produk dan statusnya

Status dicek dari kode dan STATUS.md per 7 Okt 2026. "Live" = tayang di production (data dummy).

| # | Kemampuan | Status |
|---|---|---|
| 1 | Daftar dan masuk 4 peran, kunci login, 2FA admin, persetujuan admin untuk coach dan kolam | Live |
| 2 | Kota (10 tetap) dan pilihan kolam oleh coach; daftar tunggu kota "Kabari saya" | Live |
| 3 | Harga dari kolam dan coach, paket 4 dan 8 sesi, biaya layanan di atas harga | Live |
| 4 | Pembayaran Midtrans (sandbox), saldo member terpakai otomatis, kedaluwarsa otomatis | Live (sandbox) |
| 5 | Cari coach, profil publik coach, syarat tampil 4 jam kosong / 14 hari | Live |
| 6 | Booking dua langkah, batal sendiri dengan jatah, kapasitas harian dan jam buka kolam | Live |
| 7 | Kehadiran: tandai Hadir / Tidak Hadir, lapor Tidak Hadir yang salah | Live |
| 8 | Bagi hasil otomatis per sesi Hadir, pajak titipan PPh 0,5%, PPN di biaya layanan | Live |
| 9 | Penarikan saldo kolam dan coach (manual admin, min Rp50.000), rekap PPh | Live |
| 10 | **Milestone:** keterampilan per kelompok umur, catatan coach, sertifikat per level | Live (bagian 6) |
| 11 | Ganti coach lewat pengajuan, ganti coach gratis hari ke-10, catatan pelanggaran coach | Live |
| 12 | Penjaga jadwal harian (cron 06.00 WIB) | Live; log cron belum dicek Hadi |
| 13 | Afiliasi: kode coach/kolam, komisi 50% biaya layanan bersih | Live |
| 14 | Notifikasi HP dan lonceng dalam aplikasi (riwayat 90 hari) | Live |
| 15 | Hapus akun (anonimkan), diblokir saat ada pembayaran berjalan | Live |
| 16 | Email admin, chat bantuan, testimoni, Meta Pixel + Conversions API | Live; event Meta belum dicek |
| 17 | **Pengingat sebelum sesi untuk member dan coach** | **Belum ada** (tidak ditemukan di kode; dicek lewat pencarian kata). **Diputuskan dibuat (Hadi 7 Okt, "penting")**; masuk daftar kerja, dikerjakan setelah dokumen perencanaan. Waktu pengingat (contoh H-1) diputuskan di alur aplikasi |
| 18 | Reset password mandiri lewat email | Belum; menunggu bukti email production terkirim |
| 19 | Drop kolom database model lama | Belum; butuh Hadi |

## 6. Milestone (perkembangan peserta)

Fungsi ganda: nilai jual ke member (anak terlihat berkembang) dan pelindung dari transaksi pindah ke WhatsApp. Dijual tanpa jaminan hasil: "tergantung pesertanya" (2 Okt).

- **Kelompok umur otomatis dari tanggal lahir:** A bayi-balita (6 bulan-3 tahun, selalu bersama orang tua), B anak usia dini (4-6), C anak (7-12), D remaja dan dewasa (13+). Tiap kelompok punya level; tiap level berisi keterampilan (contoh: "Meniup gelembung di permukaan air"). Daftar standar disetujui Hadi 30 Sep (catatan keputusan menyebut 40 butir; jumlah di database belum dicek). Bukan standar lembaga resmi (bukan FASI).
- Catatan melekat ke **peserta**, bukan coach: bila ganti coach, coach baru melanjutkan dari keterampilan berikutnya (rancangan 29 Sep; di kode, akses coach ditentukan oleh adanya booking dengan peserta itu).
- Penilaian awal di sesi pertama (keterampilan "sudah bisa sebelumnya", tanpa sertifikat).
- Coach boleh menambah keterampilan khusus untuk pesertanya; usulan yang disetujui admin bisa jadi standar.
- Semua keterampilan satu level tercapai = level selesai, sertifikat level dengan template SPH, ditandatangani coach, dibuka dari halaman milestone peserta.
- **Wajib:** catatan coach tiap 2 sesi Hadir per peserta; bila terlewat, coach tidak bisa mengajukan penarikan baru (berlaku untuk sesi sejak 1 Okt 2026). Coach baru boleh menulis setelah minimal 1 sesi Hadir dengan peserta itu.
- Yang melihat: member (peserta sendiri), coach (peserta yang pernah ia ajar), admin. Kolam tidak.

## 7. Aturan bisnis yang membentuk produk

Hanya prinsipnya. Rumus, angka, dan contoh: `docs/aturan-bisnis-saat-ini.md`.

1. **Harga dari mitra, komisi dari SPH.** Kolam dan coach memasang harga; SPH menambah biaya layanan di atasnya, rincian tampil sebelum bayar. Kepada pengguna disebut "6,5% (maksimal 7%)".
2. **Uang dibagi saat sesi benar-benar terjadi** (tanda Hadir), bukan saat bayar. Tidak hadir: coach 50% dari bagiannya, kolam Rp0.
3. **Satu paket, satu coach, satu kolam.** Tidak ada eceran. Ganti coach lewat pengajuan; gratis bila coach tidak membuka jadwal sampai hari ke-10.
4. **Server yang menjaga aturan**, bukan tampilan: booking, saldo, hak akses dicek di server dan tahan terhadap dua permintaan bersamaan.
5. **Pajak:** PPh final 0,5% dipotong dari bagian coach/kolam sebagai titipan (disetor SPH); PPN 11% sudah di dalam biaya layanan. NPWP coach urusan coach.
6. **Perlindungan member:** paket tidak diperpanjang bila coach lalai; jatah batal per paket; sesi coba 7 hari; kehadiran bisa dilaporkan salah dalam 3 hari.
7. **Perlindungan mitra:** perjanjian coach dan MOU kolam disetujui lewat centang; catatan pelanggaran coach per kejadian; 3 pelanggaran dalam 6 bulan = admin menilai.
8. **Janji ke publik hanya yang bisa dibuktikan** (MESSAGING.md bagian 1): tanpa "terbaik", tanpa angka yang bukan dari database, tanpa janji hasil renang atau jumlah member untuk kolam dan coach. Strip statistik dan testimoni landing hanya dari data asli.

## 8. Di luar cakupan (sudah diputuskan TIDAK dibuat)

- Beli sesi eceran dan beli 1 sesi di kolam lain (dihapus 2 Okt).
- Kartu kredit (dimatikan); biaya Midtrans dibebankan ke member (dilarang aturan BI).
- Impor Excel member (dihapus 2 Okt).
- Persetujuan kolam atas coach yang memilih kolamnya (3 Okt); kolam juga tidak bisa menolak coach.
- Perpanjangan otomatis paket bila coach tidak membuka jadwal (3 Okt).
- Tombol keluar dari daftar tunggu kota; tombol beli menempel di halaman Paket (6 Okt).
- Klausul "privat hanya lewat SPH" di kolam (29 Sep).
- Pemeriksaan latar belakang coach.
- Saldo member dicairkan jadi uang (hanya untuk beli paket berikutnya).

## 9. Ukuran keberhasilan

Tujuan utama dari Hadi: dipakai sebanyak mungkin orang. Angka target **belum diputuskan**. Satu angka yang sudah ada: **100 member aktif** = pemicu mulai menyiapkan admin kedua (Hadi 7 Okt).

**[usulan]** Empat ukuran awal, tanpa target angka sampai ada data nyata:

| Ukuran | Arti | Sumber data |
|---|---|---|
| Sesi Hadir per bulan (per kota) | Berapa les benar-benar terjadi; dasar pendapatan semua pihak | Database (tanda Hadir); layar Laporan Kehadiran |
| Member aktif | Punya paket aktif atau minimal 1 sesi Hadir dalam 30 hari (Hadi 7 Okt) | Database; belum dicek apakah ada layar khusus angka ini |
| Coach dan kolam aktif per kota | Coach yang tampil (punya jam kosong) dan kolam aktif. **Kota siap diiklankan ke member bila minimal 2 kolam dan 5 coach tampil** (Hadi 7 Okt) | Admin: Peminat per Kota, Coach Tanpa Jadwal |
| Pembelian paket kedua | Member yang membeli lagi; tanda sistem berguna dan tidak kabur ke WhatsApp | Database (paket per member); belum ada layarnya |

Alat ukur iklan: Meta Pixel + Conversions API (event belum dicek), biaya per pendaftar dari Meta Ads.

## 10. Kendala dan asumsi

- Pembayaran lewat Midtrans (satu akun platform); penarikan ke coach/kolam manual oleh admin.
- Zona waktu bisnis WIB; 10 kota tetap (Jakarta, Depok, Bekasi, Bogor, Tangerang, Bandung, Cianjur, Sukabumi, Surabaya, Malang), wilayah awal 4 kota.
- Teks hukum disetujui orang hukum dan tidak diubah tanpa mereka. Draf tambahan Privasi menunggu: `docs/legal/draft-privasi-rev-kota-daftar-tunggu-lonceng.md`. Kata "pencairan" di teks hukum belum sama dengan "penarikan" di aplikasi; dibiarkan, orang hukum diberi tahu saat revisi berikutnya (Hadi 7 Okt).
- Lalu lintas utama dari iklan Meta lewat HP.
- Alur aplikasi tidak diubah tanpa izin Hadi; tampilan boleh dirombak.

## 11. Risiko lain dan pengamannya

| Risiko | Pengaman yang sudah ada | Yang belum |
|---|---|---|
| Coach tidak membuka jadwal setelah member bayar | Penjaga harian, ganti coach gratis hari ke-10, catatan pelanggaran | Belum terbukti dengan member asli |
| Dua pihak berebut jam yang sama | Klaim slot di server + 209 tes balapan | Tidak ada |
| Saldo salah hitung | Buku besar (ledger) sebagai sumber kebenaran, audit buku besar | Audit production butuh Hadi |
| Peserta booking lalu tidak hadir (pendapatan kolam dan coach hilang) | Aturan 50% coach, kolam Rp0 | Belum ada pengingat sebelum sesi (butir 17, akan dibuat) |
| Admin satu orang menjadi hambatan | Penarikan lewat 7 hari kerja ditandai | Admin kedua: dipicu 100 member aktif |
| Janji landing tidak sama dengan sistem | Pemeriksaan keselarasan 6 Okt (38 temuan, diperbaiki) | Cek ulang saat iklan jalan |
| Belum ada kolam, coach, member asli | Strip statistik landing hanya akun asli | Pasokan di 4 kota belum dicari; iklan member baru jalan di kota yang memenuhi syarat 2 kolam + 5 coach |

## 12. Pertanyaan terbuka
Tidak ada. Empat pertanyaan draf 2 dijawab Hadi 7 Okt (semua A): definisi member aktif, 10 kota tetap menerima pendaftaran, syarat kota siap diiklankan, pengingat sebelum sesi dibuat.

## Riwayat dokumen
- 7 Okt 2026: draf 1 (Claude, Sonnet 5.5). Bahan: aturan-bisnis-saat-ini, KEPUTUSAN, HANDOFF-AGEN, MESSAGING, kode.
- 7 Okt 2026: draf 2 setelah Hadi minta periksa blindspot. Ditambah: nilai jam sepi untuk kolam (sebelumnya kelewat), bagian milestone lengkap (sebelumnya hanya satu baris), strategi dan risiko terbesar (permintaan belum terbukti, pasokan dulu, pindah ke WhatsApp, ekonomi per paket, keselamatan anak), wilayah awal 4 kota, pemicu admin kedua 100 member aktif, ukuran keberhasilan awal, temuan "tidak ada pengingat sebelum sesi". Diperbaiki: baris "iklan belum jalan" (tidak ada dasarnya), masalah kolam yang tadinya gue tebak ("tiket tercampur").
- 7 Okt 2026: draf 3. Jawaban 4 pertanyaan dimasukkan; pengingat sebelum sesi dicatat sebagai akan dibuat.
