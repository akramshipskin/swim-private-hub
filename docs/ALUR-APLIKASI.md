# Alur Aplikasi SPH: siapa melakukan apa, dalam urutan apa

Status: DRAF 1.2 untuk ditinjau Hadi (draf 1 7 Okt 2026; 9 Okt jawaban Hadi; 10 Okt dicocokkan ulang ke kode, 14 koreksi). Dokumen 2 dari 6 (setelah PRD yang disetujui 7 Okt).

Cara baca: dokumen ini menjelaskan langkah-langkah yang dilalui tiap peran dari awal sampai akhir. Isinya adalah **alur yang sudah ada di aplikasi** (dicek dari kode dan catatan keputusan, belum dijalankan ulang satu per satu), ditambah bagian bertanda **[baru]** untuk yang belum ada. Alur tidak diubah tanpa izin Hadi (AGENTS.md butir 10); tampilan boleh. Aturan angka dan uang ada di `docs/aturan-bisnis-saat-ini.md`; di sini hanya urutan dan kondisinya. Layar dan menu per peran: `src/lib/nav-links.ts`, daftar halaman `docs/cakupan-halaman.md`.

## 1. Gerbang setelah masuk (berlaku semua peran)

Setelah login, sistem memeriksa berurutan. Selama gerbang 1-3 belum lewat, halaman member/coach/kolam/admin tidak bisa dibuka. Gerbang 4 (kota) hanya menahan halaman member dan coach; Profil dan Notifikasi tetap bisa dibuka.

| Urutan | Gerbang | Siapa | Dilewati dengan |
|---|---|---|---|
| 1 | Ganti password sementara | Akun yang password-nya diatur admin | Buat password baru |
| 2 | Pasang 2FA | Admin | Pindai kode di halaman Keamanan |
| 3 | Setujui perjanjian | Coach (Perjanjian Kemitraan Coach), pemilik kolam (MOU Kolam); versi 3 Oktober 2026 rev.3 | Centang persetujuan |
| 4 | Pilih kota | Akun lama (member, coach) yang belum punya kota | Pilih dari 10 kota |

Akun yang **nonaktif** tidak bisa masuk: pendaftar coach/kolam yang belum disetujui admin, akun yang dinonaktifkan admin. Untuk pendaftar baru, layar "Pendaftaran diterima" tampil setelah daftar, dengan tombol WhatsApp ke admin. Bila pendaftar yang belum disetujui mencoba masuk, pesannya: "Nomor HP/email atau password salah. Bila kamu coach atau pemilik kolam yang baru daftar, akunmu mungkin belum diaktifkan admin." (tidak dihitung sebagai salah password).

Salah password berulang mengunci akun 15 menit (3x dari satu jaringan untuk satu akun, 10x untuk satu akun dari mana pun, 20x dari satu jaringan).

## 2. Member

### 2.1 Mulai
1. Daftar: nama, nomor HP, email (opsional), password, **kota**, tanggal lahir (diri sendiri dan/atau anak-anak yang didaftarkan), kode afiliasi opsional dari coach atau kolam. Satu akun bisa punya beberapa peserta; "Saya" = peserta dirinya sendiri.
2. Masuk ke beranda. Ada sesi hari ini: daftar sesi hari ini. Bila tidak, satu kartu utama: jadwal berikutnya, atau sisa sesi yang belum dijadwalkan, atau "Belum ada paket aktif" / "Semua sesi paketmu sudah dipakai" dengan tombol Beli Paket. Paket yang berakhir dalam 7 hari diberi peringatan di beranda.

### 2.2 Cari dan beli paket
1. **Cari Coach** (hanya melihat): semua coach aktif yang sudah memilih minimal 1 kolam aktif, dari semua kota, tanpa syarat jam kosong. Kartu memuat domisili, keahlian, kolam. Buka profil coach (sertifikat, kolam).
1b. **Paket** (tempat membeli): disaring kota domisili member (kota lain bisa dipilih, dengan peringatan). Pasangan coach + kolam hanya tampil bila coach punya minimal 4 jam kosong yang bisa dibooking dalam 14 hari, dengan "Jadwal terdekat". Server menolak pembelian bila syarat ini tidak terpenuhi.
2. **Kota belum ada pasangan kolam + coach:** layar "belum tersedia", tombol "Kabari saya" (daftar tunggu), saran kota terdekat. Saat pasangan muncul (kolam/coach diaktifkan, harga dipasang, jam kosong dibuka, coach memilih kolam), member dikabari sekali lewat lonceng dan notifikasi HP.
3. **Paket:** pilih peserta, kolam, coach, 4 atau 8 sesi (atau sesi coba 7 hari, hanya untuk peserta yang belum pernah punya paket). Rincian harga tampil sebelum bayar: harga kolam + harga coach + biaya layanan.
4. Saldo member (bila ada) terpakai otomatis; saldo cukup = paket langsung aktif tanpa Midtrans; sisanya lewat Midtrans, batas bayar 24 jam. Ditolak: peserta nonaktif, akun yang sedang mengajukan hapus, akun nonaktif, dan klik beli dobel untuk barang yang sama dalam 1 menit.
5. Bayar sukses: paket aktif, notifikasi "Pembayaran berhasil". Bayar gagal atau kedaluwarsa: paket batal, saldo yang terpakai kembali.

### 2.3 Booking
1. Booking: pilih peserta dan paket, pilih tanggal dan jam kosong coach, konfirmasi (dua langkah, tombol menempel di bawah), layar sukses dengan kode booking.
2. Server menolak bila jam sudah diambil atau sudah lewat, di luar jam buka kolam, melebihi kapasitas harian kolam, coach atau kolam tidak aktif, akun nonaktif atau sedang mengajukan hapus, atau paket tidak berlaku. Paket harus untuk coach dan kolam itu, masih ada sisa, dan **masih berlaku pada tanggal sesinya** (bukan hanya hari ini).
2b. **Sisa sesi berkurang saat booking**, bukan saat Hadir. Batal sesuai aturan = sisa sesi kembali.
3. Notifikasi: member ("Booking berhasil") dan coach ("Jadwalmu dibooking").

### 2.4 Hari sesi dan sesudahnya
1. Sesi berlangsung di kolam. Coach menandai **Hadir** atau **Tidak Hadir** (paling lambat 24 jam setelah sesi selesai; lewat itu hanya admin).
2. Hadir: uang dibagi ke kolam, coach, dan SPH. Tidak Hadir: sesi tetap terpakai; coach 50% dari bagiannya, kolam Rp0, sisanya ke SPH.
3. Member yang menilai "Tidak Hadir" salah: tombol lapor dalam 3 hari, admin memutuskan.
4. Coach menulis catatan perkembangan (wajib tiap 2 sesi Hadir). Member membuka halaman milestone peserta: keterampilan yang tercapai dan sertifikat per level.
5. Semua sesi terpakai: beranda "Semua sesi paketmu sudah dipakai"; paket berakhir: "Belum ada paket aktif". Keduanya dengan tombol Beli Paket.

### 2.5 Pengecualian
| Situasi | Yang terjadi |
|---|---|
| Member membatalkan | Boleh paling lambat 2 jam sebelum jadwal, sesuai jatah (paket 4: 2x, paket 8: 4x; sesi coba tidak bisa). Sisa sesi kembali, jam kembali kosong, coach diberi tahu. |
| Coach membatalkan (berhalangan) | Sisa sesi kembali ke paket, jam itu ditutup (coach bisa membukanya lagi), member diberi tahu dan menjadwal ulang. Sesi yang sudah mulai tidak bisa dibatalkan coach. |
| Coach tidak membuka jadwal | Hari ke-2: coach diingatkan tiap hari. Hari ke-10: member dan admin diberi tahu, member boleh **ganti coach tanpa biaya** (coach di kolam sama atau kolam lain sekota, harga sama atau lebih murah, selisih jadi saldo). Coach dapat 1 catatan pelanggaran. Paket tidak diperpanjang. Ganti tanpa biaya hanya untuk paket berbayar (paket pemberian admin: admin diberi tahu). Bila penyebabnya bukan coach (kolam nonaktif atau coach dilepas dari kolam): member tetap boleh ganti tanpa biaya, tanpa catatan pelanggaran. |
| Ganti coach biasa | Member mengajukan dengan alasan, admin memutuskan; sisa sesi dihitung ulang dengan harga coach baru (lebih murah: selisih jadi saldo; lebih mahal: tambah bayar, tidak dibayar 24 jam = batal). Ditolak selama ada pengajuan hapus akun. |
| Pembayaran tidak selesai | Tagihan Midtrans berakhir 24 jam; kabar dari Midtrans membatalkan paket dan mengembalikan saldo yang terpakai. Bila kabar tidak datang, pemeriksa harian (06.00 WIB) menutupnya setelah lewat 24 jam 15 menit, jadi bisa sampai sekitar 2 hari. Bila ternyata lunas belakangan, paket tetap aktif. |
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

1. Daftar: nama pemilik, nama kolam, **kota**, alamat, **jam buka dan jam tutup (wajib)**, deskripsi dan fasilitas, harga paket 4 dan 8, kapasitas harian; admin diberi tahu ("Pendaftaran kolam baru"). Admin mengaktifkan akun (kolamnya ikut aktif); **pemilik tidak diberi tahu otomatis** (celah B).
2. Masuk, setujui MOU Kolam.
3. **Info Kolam:** foto, fasilitas, **jam buka** (sudah diisi saat daftar; kolam lama yang kosong: coach belum bisa membuka jadwal dan pemilik diberi tahu), kapasitas harian untuk pelanggan SPH (kosong = tanpa batas). Mengubah jam buka saat sudah ada booking di luar jam baru: booking tetap jalan, admin diberi tahu.
4. **Paket & Harga:** harga tiket paket 4 dan 8 (1 coach + 1 peserta + 1 pendamping per sesi); berlaku untuk pembelian berikutnya.
5. **Coach di Kolam:** lihat siapa yang memilih kolam. **Jadwal Kolam** dan **Laporan:** jadwal sesi di kolam, keterisian 7 hari ke depan (di dasbor), dan laporan bagian kolam (isi layar dicek sekilas dari kode).
6. **Saldo:** bagian kolam per sesi Hadir (dipotong PPh 0,5%), Tarik Saldo minimal Rp50.000, admin memproses maksimal 7 hari kerja.
7. Pemilik kolam tidak melihat catatan perkembangan peserta.

## 5. Admin (satu orang)

Pekerjaan admin berupa antrean. Dasbor "Perlu Kamu Cek" mengumpulkannya; sebagian besar antrean juga memicu notifikasi HP ke admin.

| Antrean | Pemicu | Tindakan admin | Pihak lain diberi tahu |
|---|---|---|---|
| Persetujuan mitra | Pendaftaran coach atau kolam | Aktifkan (menu Akun). Tidak ada tombol tolak: pendaftar yang tidak disetujui dibiarkan nonaktif | **Tidak ada** (celah B) |
| Sertifikat coach | Coach mengunggah | Setujui atau tolak | Coach |
| Ganti coach | Pengajuan member | Setujui, tolak, atau selesaikan | Member; coach lama; coach baru |
| Penarikan saldo | Coach atau kolam mengajukan | Salin rekening, transfer manual, tandai dibayar atau tolak | Pemohon |
| Hapus akun | Member mengajukan | Setujui (ditolak bila ada pembayaran berjalan) | - |
| Laporan kehadiran | Member melapor "Tidak Hadir" salah | Putuskan | - |
| Pesan dan Email | Chat bantuan (dijawab AI dulu, diteruskan ke admin bila perlu; admin tidak dapat notifikasi HP untuk chat), email masuk (admin dapat notifikasi; email otomatis tidak dihitung) | Balas | Member (balasan chat lewat notifikasi) |
| Usulan keterampilan | Coach mengusulkan | Setujui atau tolak | Coach |
| Cek pembayaran | Jumlah bayar tidak cocok, saldo member kurang | Periksa | - |
| Coach Tanpa Jadwal, Peminat per Kota | Pemeriksa harian | Pantau; nilai 3 pelanggaran dalam 6 bulan | - |

Admin juga bisa membuat akun, memberi paket gratis, koreksi saldo (dengan alasan; pemilik saldo diberi tahu), reset password dan 2FA, dan menonaktifkan akun. Login admin wajib 2FA.

## 6. Satu paket dari beli sampai uang cair (lintas peran)

1. Member membeli paket, bayar lewat Midtrans (paket Menunggu Pembayaran).
2. Pembayaran lunas: paket aktif, masa berlaku mulai (paket 4: 60 hari, paket 8: 90 hari, sesi coba: 7 hari).
3. Member booking jam (sisa sesi berkurang); coach dan member diberi tahu.
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

**Diputuskan Hadi 9 Okt: pilihan A (18.00 WIB malam sebelumnya + 06.00 WIB pagi hari-H).** Pilihan waktu yang dibahas:

| Pilihan | Waktu | Kebutuhan teknis |
|---|---|---|
| A | Dua pengingat: malam sebelumnya (18.00 WIB) dan pagi hari-H (06.00 WIB) | Memakai pemeriksa terjadwal; butuh satu jadwal tambahan jam 18.00. Batasan jadwal di paket Vercel Hobby (sekali sehari per jadwal) **belum dicek**. |
| B | Satu pengingat 3 jam sebelum sesi | Butuh pemeriksa tiap jam atau tiap 15 menit; belum dicek apakah paket Vercel mengizinkan |

Rekomendasi: A. Pengingat malam sebelumnya memberi waktu batal sebelum batas 2 jam; pengingat pagi hari-H menjangkau sesi siang dan sore.

## 8. Celah alur yang ditemukan (dicek dari kode, belum diuji)

| | Celah | Dampak | Usulan |
|---|---|---|---|
| A | Belum ada pengingat sebelum sesi | Peserta lupa; coach dan kolam kehilangan uang | **Dibuat (bagian 7; diputuskan 9 Okt)** |
| B | Coach dan pemilik kolam tidak diberi tahu saat admin menyetujui akun | Mereka tidak tahu kapan boleh masuk; bergantung pada WhatsApp ke admin | **Dikerjakan (Hadi 9 Okt).** Kirim pesan WhatsApp atau email saat disetujui (butuh kanal: belum ada push karena belum pernah masuk) |
| C | Member tidak diberi tahu saat coach menandai Hadir atau Tidak Hadir | Member baru tahu saat membuka aplikasi; batas lapor "Tidak Hadir" salah hanya 3 hari | **Dikerjakan (Hadi 9 Okt).** Notifikasi ke member saat ditandai |
| D | Tidak ada notifikasi paket mendekati berakhir (yang ada hanya peringatan di beranda 7 hari sebelumnya, terlihat bila member membuka aplikasi) | Member kehilangan sesi tanpa kabar | **Dikerjakan (Hadi 9 Okt).** Notifikasi, misalnya 14 dan 3 hari sebelum berakhir bila masih ada sesi |
| E | Tidak ditemukan cara member menghubungi coach di dalam aplikasi (hubungan lewat admin/WhatsApp) | Telat atau ganti jam diurus lewat luar aplikasi, mendorong transaksi pindah ke luar | **Diputuskan Hadi 9 Okt: tidak dibuat fitur chat atau kontak langsung; member menghubungi lewat WhatsApp admin; nomor WhatsApp coach TIDAK boleh sampai ke member.** Dicek dari kode: nomor coach tidak tampil di halaman member. Sejak 9 Okt (live) bio, catatan sertifikasi, catatan perkembangan, dan keterampilan tambahan menolak nomor HP, email, dan tautan chat (nomor yang ditulis dengan kata masih lolos). Usulan perluasan pasal 6 + daftar hitam diberitahukan ke mitra: docs/legal/usulan-revisi-pasal-6-larangan-coach.md (menunggu orang hukum). Larangan coach membawa member keluar SPH sudah ada di Perjanjian Coach pasal 6 (12 bulan setelah berakhir, akun dinonaktifkan + daftar hitam; butir 2 hanya menyebut membagikan nomor lewat Aplikasi) dan MOU Kolam pasal 4; S&K member sengaja tidak mengikat member. |

## Riwayat dokumen
- 7 Okt 2026: draf 1 (Claude, Sonnet 5.5). Bahan: kode (proxy, authorize, booking, cron, notifikasi), nav-links, catatan keputusan, PRD. Belum dicek: pesan login untuk akun belum disetujui; isi lengkap aturan di route booking; layar admin satu per satu.
- 9 Okt 2026 (Hadi): jawaban 9 pertanyaan: pengingat A; pemberitahuan B/C/D dikerjakan; celah E = lewat WhatsApp admin, nomor coach tidak boleh sampai ke member. Menunggu: 2 pertanyaan turunan (penyaring nomor di bio dan catatan coach; perluasan bunyi pasal 6 di Perjanjian Coach, teks hukum, butuh orang hukum). Setelah itu persetujuan Hadi untuk dokumen ini.
- 10 Okt 2026 (Claude, Opus 5.5): dicocokkan ulang ke kode (gerbang, daftar, Cari Coach, Paket, checkout, booking, batal, kehadiran, pembagian uang, penjaga jadwal, pembayaran, kolam, antrean admin, notifikasi). 14 koreksi: Cari Coach vs Paket dipisah; sisa sesi berkurang saat booking; pesan login pendaftar; gerbang kota hanya member/coach; syarat beli; aturan booking lengkap; Tidak Hadir sesi tetap terpakai; batal oleh member/coach; ganti tanpa biaya hanya paket berbayar + kasus bukan salah coach; kedaluwarsa bayar; jam buka wajib saat daftar kolam; admin tanpa tombol tolak pendaftar; chat tanpa notifikasi admin; peringatan beranda 7 hari (celah D) dan penyaring kontak (celah E). Belum dicek: isi layar admin satu per satu, laporan kolam, dasbor kolam rinci.
