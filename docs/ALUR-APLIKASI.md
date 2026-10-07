# Alur Aplikasi SPH: siapa melakukan apa, dalam urutan apa

Status: DRAF 1 untuk ditinjau Hadi (7 Okt 2026). Dokumen 2 dari 6 (setelah PRD yang disetujui 7 Okt).

Cara baca: dokumen ini menjelaskan langkah-langkah yang dilalui tiap peran dari awal sampai akhir. Isinya adalah **alur yang sudah ada di aplikasi** (dicek dari kode dan catatan keputusan, belum dijalankan ulang satu per satu), ditambah bagian bertanda **[baru]** untuk yang belum ada. Alur tidak diubah tanpa izin Hadi (AGENTS.md butir 10); tampilan boleh. Aturan angka dan uang ada di `docs/aturan-bisnis-saat-ini.md`; di sini hanya urutan dan kondisinya. Layar dan menu per peran: `src/lib/nav-links.ts`, daftar halaman `docs/cakupan-halaman.md`.

## 1. Gerbang setelah masuk (berlaku semua peran)

Setelah login, sistem memeriksa berurutan. Selama satu gerbang belum lewat, pengguna tidak bisa membuka halaman lain.

| Urutan | Gerbang | Siapa | Dilewati dengan |
|---|---|---|---|
| 1 | Ganti password sementara | Akun yang password-nya diatur admin | Buat password baru |
| 2 | Pasang 2FA | Admin | Pindai kode di halaman Keamanan |
| 3 | Setujui perjanjian | Coach (Perjanjian Kemitraan Coach), pemilik kolam (MOU Kolam); versi 3 Oktober 2026 rev.3 | Centang persetujuan |
| 4 | Pilih kota | Akun lama (member, coach) yang belum punya kota | Pilih dari 10 kota |

Akun yang **nonaktif** tidak bisa masuk: pendaftar coach/kolam yang belum disetujui admin, akun yang dinonaktifkan admin. Untuk pendaftar baru, layar "Pendaftaran diterima" tampil setelah daftar, dengan tombol WhatsApp ke admin. Pesan yang tampil bila pendaftar yang belum disetujui mencoba masuk: **belum dicek** (kode hanya menolak tanpa menghitung sebagai salah password).

Salah password berulang mengunci akun 15 menit (3x dari satu jaringan untuk satu akun, 10x untuk satu akun dari mana pun, 20x dari satu jaringan).

## 2. Member

### 2.1 Mulai
1. Daftar: nama, nomor HP, email (opsional), password, **kota**, tanggal lahir (diri sendiri dan/atau anak-anak yang didaftarkan), kode afiliasi opsional dari coach atau kolam. Satu akun bisa punya beberapa peserta; "Saya" = peserta dirinya sendiri.
2. Masuk ke beranda. Kartu "Langkah berikutnya" menunjukkan hal yang paling relevan: ada sesi terjadwal, ada sesi belum dijadwalkan, atau belum ada paket.

### 2.2 Cari dan beli paket
1. **Cari Coach:** daftar coach berkolam aktif di kota member (kota lain boleh dengan peringatan). Coach hanya tampil bila punya minimal 4 jam kosong yang bisa dibooking dalam 14 hari. Kartu memuat kota, kolam, dan "Jadwal terdekat". Buka profil coach (sertifikat, kolam, jam).
2. **Kota belum ada pasangan kolam + coach:** layar "belum tersedia", tombol "Kabari saya" (daftar tunggu), saran kota terdekat. Saat pasangan muncul, member dikabari lewat notifikasi HP.
3. **Paket:** pilih peserta, kolam, coach, 4 atau 8 sesi (atau sesi coba, 1x per peserta). Rincian harga tampil sebelum bayar: harga kolam + harga coach + biaya layanan.
4. Saldo member (bila ada) terpakai otomatis; sisanya lewat Midtrans. Batas bayar 24 jam. Peserta yang menunggu bayar, akun yang minta dihapus, dan akun nonaktif tidak bisa membeli.
5. Bayar sukses: paket aktif, notifikasi "Pembayaran berhasil". Bayar gagal atau kedaluwarsa: paket batal, saldo yang terpakai kembali.

### 2.3 Booking
1. Booking: pilih peserta dan paket, pilih tanggal dan jam kosong coach, konfirmasi (dua langkah, tombol menempel di bawah), layar sukses dengan kode booking.
2. Server menolak bila jam sudah diambil, di luar jam buka kolam, melebihi kapasitas harian kolam, atau paket tidak berlaku.
3. Notifikasi: member ("Booking berhasil") dan coach ("Jadwalmu dibooking").

### 2.4 Hari sesi dan sesudahnya
1. Sesi berlangsung di kolam. Coach menandai **Hadir** atau **Tidak Hadir** (paling lambat 24 jam setelah sesi selesai; lewat itu hanya admin).
2. Hadir: uang dibagi ke kolam, coach, dan SPH; sisa sesi berkurang. Tidak Hadir: coach 50% dari bagiannya, kolam Rp0.
3. Member yang menilai "Tidak Hadir" salah: tombol lapor dalam 3 hari, admin memutuskan.
4. Coach menulis catatan perkembangan (wajib tiap 2 sesi Hadir). Member membuka halaman milestone peserta: keterampilan yang tercapai dan sertifikat per level.
5. Sesi habis atau paket berakhir: beranda menunjukkan "Semua sesi paketmu sudah dipakai" dengan tombol Beli Paket.

### 2.5 Pengecualian
| Situasi | Yang terjadi |
|---|---|
| Member membatalkan | Boleh paling lambat 2 jam sebelum jadwal, sesuai jatah (paket 4: 2x, paket 8: 4x; sesi coba tidak bisa). Sisa sesi kembali. |
| Coach membatalkan (berhalangan) | Sisa sesi kembali ke paket, member menjadwal ulang. Notifikasi ke member. |
| Coach tidak membuka jadwal | Hari ke-2: coach diingatkan tiap hari. Hari ke-10: member dan admin diberi tahu, member boleh **ganti coach tanpa biaya** (coach di kolam sama atau kolam lain sekota, harga sama atau lebih murah, selisih jadi saldo). Coach dapat 1 catatan pelanggaran. Paket tidak diperpanjang. |
| Ganti coach biasa | Member mengajukan dengan alasan, admin memutuskan; sisa sesi dihitung ulang dengan harga coach baru (lebih murah: selisih jadi saldo; lebih mahal: tambah bayar, tidak dibayar 24 jam = batal). Ditolak selama ada pengajuan hapus akun. |
| Pembayaran tidak selesai | Kedaluwarsa otomatis setelah 24 jam 15 menit oleh pemeriksa harian. Bila ternyata lunas belakangan, paket tetap aktif. |
| Hapus akun | Member mengajukan dari Profil, admin menyetujui (ditolak bila ada pembayaran berjalan). Akun dianonimkan, riwayat uang tetap tanpa identitas. Selama pengajuan, beli paket dan booking ditolak. |

## 3. Coach

### 3.1 Mulai
1. Daftar: nama, HP, password, tanggal lahir, **kota**; sertifikat diunggah setelah akun disetujui. Layar "Pendaftaran diterima". Admin diberi tahu ("Pendaftaran coach baru").
2. Admin mengaktifkan akun. **Coach tidak diberi tahu secara otomatis** (lihat bagian 8, celah B).
3. Masuk, setujui Perjanjian Kemitraan Coach, ganti password bila sementara.
4. **Kolam Saya:** pilih kolam tempat mengajar (kolam tidak menyetujui; kota lain boleh dengan peringatan). Pasang **Harga** jasa paket 4 dan 8 (satu harga untuk semua kolam).
5. **Jadwal:** buka jam kosong di kolam yang dipilih, di dalam jam buka kolam. Bila kolam belum mengisi jam buka, pemilik kolam diberi tahu dan coach belum bisa membuka jadwal.
6. Unggah sertifikat di Profil; admin memeriksa (melihat file dan nama) lalu menyetujui atau menolak, coach diberi tahu.

### 3.2 Sehari-hari
1. Dasbor: sesi hari ini, kartu "Sesi yang harus kamu sediakan" (sisa sesi member yang belum terjadwal), saldo.
2. Sesi dibooking: notifikasi "Jadwalmu dibooking".
3. Setelah sesi: tandai **Hadir** atau **Tidak Hadir** (di dasbor atau Riwayat Sesi, ada konfirmasi; bisa diubah ulang sampai batas 24 jam, uangnya ikut dibalik).
4. Tulis catatan milestone dan centang keterampilan peserta (baru bisa setelah minimal 1 sesi Hadir dengan peserta itu). Bisa mengusulkan keterampilan tambahan; admin menyetujui atau menolak, coach diberi tahu.
5. Saldo: bagian per sesi Hadir (dipotong PPh 0,5% kecuali sudah menyerahkan surat omzet). **Tarik Saldo** minimal Rp50.000; ditolak bila ada peserta yang catatan milestone-nya terlambat. Admin memproses manual maksimal 7 hari kerja.
6. Bila peserta pindah coach, coach lama diberi tahu dan jadwal yang belum berjalan dibatalkan.

## 4. Pemilik kolam

1. Daftar: data kolam, **kota**, alamat, harga paket 4 dan 8, kapasitas harian; admin diberi tahu ("Pendaftaran kolam baru"). Admin mengaktifkan; **pemilik tidak diberi tahu otomatis** (celah B).
2. Masuk, setujui MOU Kolam.
3. **Info Kolam:** foto, fasilitas, **jam buka** (wajib sebelum coach bisa membuka jadwal), kapasitas harian untuk pelanggan SPH (kosong = tanpa batas). Mengubah jam buka saat sudah ada booking di luar jam baru: booking tetap jalan, admin diberi tahu.
4. **Paket & Harga:** harga tiket paket 4 dan 8 (1 coach + 1 peserta + 1 pendamping per sesi); berlaku untuk pembelian berikutnya.
5. **Coach di Kolam:** lihat siapa yang memilih kolam. **Jadwal Kolam** dan **Laporan:** jadwal sesi di kolam, keterisian 7 hari ke depan (di dasbor), dan laporan bagian kolam (isi layar dicek sekilas dari kode).
6. **Saldo:** bagian kolam per sesi Hadir (dipotong PPh 0,5%), Tarik Saldo minimal Rp50.000, admin memproses maksimal 7 hari kerja.
7. Pemilik kolam tidak melihat catatan perkembangan peserta.

## 5. Admin (satu orang)

Pekerjaan admin berupa antrean. Dasbor "Perlu Kamu Cek" mengumpulkannya; sebagian besar antrean juga memicu notifikasi HP ke admin.

| Antrean | Pemicu | Tindakan admin | Pihak lain diberi tahu |
|---|---|---|---|
| Persetujuan mitra | Pendaftaran coach atau kolam | Aktifkan atau tolak (menu Akun) | **Tidak ada** (celah B) |
| Sertifikat coach | Coach mengunggah | Setujui atau tolak | Coach |
| Ganti coach | Pengajuan member | Setujui, tolak, atau selesaikan | Member; coach lama; coach baru |
| Penarikan saldo | Coach atau kolam mengajukan | Salin rekening, transfer manual, tandai dibayar atau tolak | Pemohon |
| Hapus akun | Member mengajukan | Setujui (ditolak bila ada pembayaran berjalan) | - |
| Laporan kehadiran | Member melapor "Tidak Hadir" salah | Putuskan | - |
| Pesan dan Email | Chat bantuan, email masuk (email otomatis tidak dihitung) | Balas | Member (balasan lewat notifikasi) |
| Usulan keterampilan | Coach mengusulkan | Setujui atau tolak | Coach |
| Cek pembayaran | Jumlah bayar tidak cocok, saldo member kurang | Periksa | - |
| Coach Tanpa Jadwal, Peminat per Kota | Pemeriksa harian | Pantau; nilai 3 pelanggaran dalam 6 bulan | - |

Admin juga bisa memberi paket gratis, koreksi saldo (dengan alasan), reset password, dan menonaktifkan akun. Login admin wajib 2FA.

## 6. Satu paket dari beli sampai uang cair (lintas peran)

1. Member membeli paket, bayar lewat Midtrans (paket Menunggu Pembayaran).
2. Pembayaran lunas: paket aktif, masa berlaku mulai (60 atau 90 hari).
3. Member booking jam; coach dan member diberi tahu.
4. **[baru] Pengingat sebelum sesi** ke member dan coach (bagian 7).
5. Sesi berlangsung; coach menandai Hadir.
6. Sistem membagi: bagian kolam dan coach (dikurangi PPh 0,5%) masuk saldo masing-masing; bagian SPH ditahan 3 hari.
7. Coach menulis catatan perkembangan (wajib tiap 2 sesi).
8. Kolam dan coach mengajukan Tarik Saldo; admin transfer manual, maksimal 7 hari kerja.
9. Paket habis: member diajak membeli lagi (kartu di beranda).

## 7. Pengingat sebelum sesi [baru] (Hadi 7 Okt: penting)

Belum ada di aplikasi (dicek dari kode; pemeriksa terjadwal hanya satu, harian jam 06.00 WIB). Tujuan: mengurangi peserta yang booking lalu tidak datang, karena coach dan kolam kehilangan uang dan jam kosong tidak bisa terisi lagi.

- **Penerima:** member dan coach (bukan pemilik kolam).
- **Isi:** nama peserta, jam, kolam, coach, dan ajakan batal bila berhalangan (batas batal 2 jam sebelum jadwal).
- **Kanal:** notifikasi HP dan lonceng (lewat satu pintu notifikasi yang sudah ada).
- **Tidak dikirim** untuk sesi yang sudah dibatalkan.

Pilihan waktu (Pertanyaan 1):

| Pilihan | Waktu | Kebutuhan teknis |
|---|---|---|
| A | Dua pengingat: malam sebelumnya (18.00 WIB) dan pagi hari-H (06.00 WIB) | Memakai pemeriksa terjadwal; butuh satu jadwal tambahan jam 18.00. Batasan jadwal di paket Vercel Hobby (sekali sehari per jadwal) **belum dicek**. |
| B | Satu pengingat 3 jam sebelum sesi | Butuh pemeriksa tiap jam atau tiap 15 menit; belum dicek apakah paket Vercel mengizinkan |

Rekomendasi: A. Pengingat malam sebelumnya memberi waktu batal sebelum batas 2 jam; pengingat pagi hari-H menjangkau sesi siang dan sore.

## 8. Celah alur yang ditemukan (dicek dari kode, belum diuji)

| | Celah | Dampak | Usulan |
|---|---|---|---|
| A | Belum ada pengingat sebelum sesi | Peserta lupa; coach dan kolam kehilangan uang | Dibuat (bagian 7) |
| B | Coach dan pemilik kolam tidak diberi tahu saat admin menyetujui akun | Mereka tidak tahu kapan boleh masuk; bergantung pada WhatsApp ke admin | Kirim pesan WhatsApp atau email saat disetujui (butuh kanal: belum ada push karena belum pernah masuk) |
| C | Member tidak diberi tahu saat coach menandai Hadir atau Tidak Hadir | Member baru tahu saat membuka aplikasi; batas lapor "Tidak Hadir" salah hanya 3 hari | Notifikasi ke member saat ditandai |
| D | Tidak ada peringatan paket mendekati berakhir (masa berlaku habis, sisa sesi hangus) | Member kehilangan sesi tanpa kabar | Notifikasi, misalnya 14 dan 3 hari sebelum berakhir bila masih ada sesi |
| E | Tidak ditemukan cara member menghubungi coach di dalam aplikasi (hubungan lewat admin/WhatsApp) | Telat atau ganti jam diurus lewat luar aplikasi, mendorong transaksi pindah ke luar | Belum diputuskan; perlu pembahasan terpisah |

## Riwayat dokumen
- 7 Okt 2026: draf 1 (Claude, Sonnet 5.5). Bahan: kode (proxy, authorize, booking, cron, notifikasi), nav-links, catatan keputusan, PRD. Belum dicek: pesan login untuk akun belum disetujui; isi lengkap aturan di route booking; layar admin satu per satu.
