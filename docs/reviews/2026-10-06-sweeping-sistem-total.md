# Sweeping sistem total + keselarasan landing (6 Okt 2026, mode tidur Hadi)

Penulis: Claude (Opus 5.5 untuk bagian uang/akses, Sonnet untuk peninjau gambar). Perintah Hadi: "sweeping ulang semua sistem, semua fitur, semua role, semua halaman, semua logic, pakai akun dummy di live, landing dan sistem harus selaras".

## Batas yang tidak bisa dilewati (jujur)
- **Peran selain admin TIDAK disapu di situs live.** Aturan keras: Claude tidak mengetik password ke situs production, walaupun Hadi menyebut password akun dummy di chat. Yang dipakai di live hanya sesi admin yang Hadi login sendiri di browser aplikasi, dan hanya dibaca (tidak ada tombol aksi ditekan). Member, coach, pemilik kolam diperiksa di versi jadi LOKAL (kode sama dengan yang tayang, akun uji lokal, database lokal). Hasil lokal bukan bukti perilaku data production.
- Pembayaran sungguhan, notifikasi HP, email, unggah file ke penyimpanan asli, HP asli/Safari: tidak bisa dicek dari sini.
- Audit buku besar production (`AUDIT_PROD=1`) butuh `.env.prod` milik Hadi: tidak dijalankan.
- Tangkapan layar tema gelap di 375 dan 768, serta terang di 1280, hanya diperiksa otomatis (tanpa mata); yang dibaca mata: HP terang (375), tablet terang (768), desktop gelap (1280).

## Inventaris dari kode
69 berkas halaman, 20 rute API. Peran: publik, member, coach, pemilik kolam, admin.

## Cakupan
| Bagian | Isi | Hasil |
|---|---|---|
| Live, admin (baca saja) | 24 dari 25 halaman admin + profil + notifikasi + panduan, desktop dan HP 375; 10 dari 13 detail pengguna | 0 scroll samping, 0 gambar rusak, 0 tautan mati, 0 error konsol; /keamanan tidak bisa dicek (2FA sudah aktif, langsung dialihkan) |
| Live, publik | 15 alamat publik + robots + sitemap + manifest | semua 200 (404 untuk alamat salah sesuai rancangan); halaman peran tanpa login dialihkan ke Masuk |
| Lokal, tampilan | 468 kunjungan: publik 90, member 78, coach 72, pemilik kolam 72, admin 156 (375/768/1280, terang+gelap) + 6 kunjungan sertifikat/milestone + 36 kunjungan ulang tablet 768/1024 setelah perbaikan | 0 melebar ke samping; sisanya hanya alarm lingkungan lokal (foto palsu, skrip analitik Vercel, tombol nonaktif, kolom jebakan bot) |
| Lokal, hak akses | 70 halaman x 5 sesi (tanpa login + 4 peran) = 350 sel, 18 rute API x 5 = 90 sel | 0 halaman peran lain yang menampilkan isi; 0 error server. Halaman profil/notifikasi/kota menjawab 200 tanpa login karena Next mengalihkan di sisi klien (tanpa data); /perjanjian-coach dan /mou-kolam memang dokumen publik |
| Lokal, formulir | 176 kiriman (kosong, panjang+karakter khusus) di 5 peran; 115 formulir berisi isian tersembunyi sengaja tidak dikirim | 0 error server, 0 pengecualian |
| Lokal, audit buku besar | semua booking/pembagian/pencairan/ganti coach/saldo member | "Semua cocok" (catatan lama tentang data uji bukan salah hitung) |
| Tes | cek kode, 835 tes otomatis, 200 tes balapan, lint (2 peringatan lama), versi jadi | lulus semua |
| Tinjauan gambar | 78 HP terang, 78 tablet terang, 78 desktop gelap (Sonnet) | 88 temuan, lihat lampiran |
| Keselarasan landing vs sistem | seluruh landing, halaman publik, panduan, aplikasi (Opus) | 38 temuan, lihat lampiran |
| Pemeriksa kedua Opus (konteks segar) | hapus akun vs ganti coach (2 putaran), seluruh perubahan hari ini | 0 cacat berat; 3 saran diterapkan |

Tidak tercakup: halaman Ganti Password (tidak ada akun uji dengan password sementara), tampilan /perjanjian untuk mitra yang belum menyetujui (semua mitra uji sudah menyetujui rev.3).

## Diperbaiki hari ini
1. **Hapus akun vs ganti coach** (keputusan: ditolak): empat pintu dijaga (ajukan, ganti gratis hari ke-10, setuju admin, tambah bayar baru). Pembayaran yang sudah berjalan tetap bisa dibuka (uang di jalan tidak dikunci). 5 tes balapan baru (HG1-HG5), terbukti gagal tanpa perbaikan dan lulus dengan perbaikan.
2. **Tablet 768-1023 rusak**: sidebar kiri memakan 28% layar sehingga kartu terjepit dan angka rupiah pecah ("Rp 17 / 2.25 / 0"), kolom Jumlah/Status di Uang Masuk hilang, kolom "Masuk saldo" di Laporan kolam hilang. Sekarang sidebar baru muncul di 1024 ke atas; di bawahnya memakai bilah bawah seperti HP. Angka saldo tidak lagi dibungkus dan mengecil di 768-1279. Dibuktikan dengan tangkapan layar ulang.
3. Logika pilih jam di booking dipindah ke fungsi murni + 9 tes (perilaku identik, diperiksa Opus kedua).
4. Tombol "Edit" menjadi "Ubah" di semua peran (termasuk Paket & Harga kolam, harga coach, kartu paket admin).
5. Tulisan landing/panduan/chat AI/pesan sistem disamakan dengan aturan sekarang (±45 potongan): logo Visa/Mastercard/JCB dihapus dari footer (kartu tidak diterima), FAQ kolam (coach memilih kolam sendiri, jam kosong dibuka coach), masa berlaku 60/90 hari, booking dua langkah di Panduan, tautan WhatsApp footer ke admin umum, panduan coach (pilih kolam + harga, catatan perkembangan), "Tidak Hadir", "Jadwalmu dibooking", "kuota/slot" di pesan galat, Saldo PPN, rujukan menu Kinerja Coach, "Jam buka belum diisi", tautan daftar coach/kolam di halaman daftar member, label status paket admin jujur ("Kedaluwarsa"/"Sesi habis" bukan "Aktif"), warna radio/kotak centang ikut merek.

## Menunggu keputusan Hadi (diulang di Pertanyaan laporan chat)
**Uang/aturan**
- A1. Admin bisa menyetujui hapus akun saat masih ada pembayaran (paket atau ganti coach) yang berjalan; jika lunas sesudahnya, ganti coach selesai di akun yang sudah dianonimkan. Usul: layar persetujuan menampilkan atau memblokir "ada pembayaran berjalan".
- A2. Pembayaran Midtrans "Menunggu" tanpa saldo terpakai tidak pernah kedaluwarsa otomatis (3 contoh dummy sejak 17-29 Sep di production; paket "Menunggu Pembayaran" menumpuk).
- A3. Member membaca "biaya layanan SPH di bawah 7%", coach/kolam membaca "6,5%". Seragamkan atau jelaskan "6,5% (maksimal 7%)".
- A4. Label admin Pencairan Saldo: "Total termasuk yang masih ditahan" bernilai sama dengan "bisa dicairkan"; Koreksi Saldo kolom "Sumber dana" berisi alasan.
- A5. FAQ kolam menjanjikan "diperiksa paling lambat 1x24 jam, langsung bisa menerima booking": batas itu tidak ada di aturan, dan booking baru mungkin setelah ada coach yang memilih kolam dan membuka jadwal.
- A6. "Paket 8 sesi lebih hemat per sesi": tidak dijaga sistem.
**Landing dan merek**
- B1. Landing tidak menyebut kota yang dilayani, ganti coach gratis hari ke-10, dan syarat coach (4 jam kosong / 14 hari).
- B2. Tangkapan layar produk di landing (Cari Coach dan Booking) sudah usang (masih memperlihatkan beli 1 sesi eceran dan booking satu ketuk, menu atas lama): perlu diambil ulang.
- B3. Landing masih bisa menampilkan coach yang tidak punya kolam aktif (Cari Coach sudah menyembunyikan).
- B4. Tagline halaman masuk/daftar berbeda per peran dari tagline baku di MESSAGING.md.
- B5. Tema gelap: Panduan tetap terang sedangkan halaman hukum ikut gelap; guideline menulis keduanya sama.
- B6. Tombol "Daftar gratis" di hero dan Panduan berwarna lime (aturan: tombol utama charcoal).
- B7. Huruf besar judul tombol/label tidak seragam (Title Case vs kalimat biasa).
**Teks hukum / terikat perjanjian rev.3 (jangan diubah tanpa Hadi/orang hukum)**
- C1. "Update milestone" dan "Tambah Slot" masih dipakai karena disebut di perjanjian coach; "Rp800.000" tanpa spasi di perjanjian coach.
- C2. Kebijakan Privasi belum menyebut kota domisili, daftar tunggu kota, dan riwayat lonceng.
**Data uji di production**
- D1. Kelima kolam contoh bertanda kota "Jakarta" tapi beralamat Cianjur (Peminat per Kota menghitung 5 di Jakarta, 0 di Cianjur).
- D2. Testimoni contoh "Ibu Clara" berstatus Tampil; email uji "Boleh dihapus"; sumber pendaftaran memuat alamat vercel.app lama; "Kolam Uji Daftar" ("Segera hadir", 0 coach) tampil di landing; milestone peserta berumur 36 tahun di kelompok anak.
- D3. Kotak masuk Email admin menghitung 2 email otomatis noreply Midtrans sebagai "menunggu dibalas".
**Kecil**
- E1. Nama paket tidak seragam ("Private 4x", "Renang 1x", "1 Sesi"), format nomor HP tidak seragam, Jadwal Booking admin sangat panjang (ratusan baris "Kosong"), nama pemilik rekening coach tampil terpotong ("a.n. had") di detail pengguna, tombol WhatsApp hijau di luar palet berulang puluhan kali.

## Alarm palsu (tetap dicatat)
Foto rusak dan kontras tombol nonaktif (lingkungan lokal / tombol sengaja nonaktif); "Coach Coach 6" (nama uji); "Kolam mitra" kontras 1,13 (teks putih di atas foto yang gagal dimuat lokal); kolom jebakan bot 169x24; halaman /profil, /notifikasi, /kota menjawab 200 tanpa login (pengalihan klien tanpa data); /manifest.webmanifest 404 (manifes yang dipakai adalah /manifest.json: 200); kalimat "Jadwal, fasilitas kolam, dan file sertifikat terbuka setelah mendaftar" di bagian coach landing (dituduh salah oleh laporan keselarasan): benar untuk profil coach (jam dan fasilitas disembunyikan dari tamu), tidak diubah; GitHub Test untuk commit 5515cdc "dibatalkan" setelah 15 menit antre tanpa pelari (bukan tes gagal).

## Lampiran
- docs/reviews/2026-10-06-lampiran-keselarasan-landing-sistem.md (kamus istilah, 45 klaim, 38 temuan dengan teks LAMA/BARU)
- docs/reviews/2026-10-06-lampiran-tinjau-gambar-hp-terang.md
- docs/reviews/2026-10-06-lampiran-tinjau-gambar-desktop-gelap-tablet.md
