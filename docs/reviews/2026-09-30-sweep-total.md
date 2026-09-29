# Sweep total 30 Sep 2026 (logika, hitungan, fitur, semua role, rapi-rapi tampilan)

Branch: `sweep-total-taste-2026-09-30` (dari `main` + commit `ee6bf7f`). **Belum di-push, belum merge ke main, tidak menyentuh production.**
Semua uji pakai DB dev lokal dan akun QA lokal (member `089900000008`, coach `089900000004`/`…006`, pemilik kolam `…002`, admin `…001`). Tidak login ke production.

## 1. Cara periksa (jujur soal cakupan)

| Cara | Cakupan |
|---|---|
| Dijalankan langsung di browser + DB lokal | Hitungan uang Hadir / Tidak Hadir / koreksi bolak-balik; cocokkan ledger vs saldo; batas 24 jam coach; pencairan coach (di bawah minimum, melebihi saldo, sah, ditolak admin, ditandai dibayar); booking & batal member; otorisasi semua role + tanpa login (halaman & API); validasi pendaftaran; tambah peserta; penarikan saldo platform |
| Crawl otomatis semua halaman semua role (HP 390px; sebagian desktop 1280px) | 58 halaman (kecuali halaman sertifikat: data tidak ada): status HTTP, judul, tap target, label form, kontras teks, overflow, kata terlarang |
| Dibaca dari kode + diandalkan pada tes yang sudah ada (tidak diulang tangan) | Webhook Midtrans, checkout, afiliasi, milestone, hapus akun, 2FA, reset password, usulan paket kolam, chat AI, deaktivasi coach |
| **Tidak diuji sama sekali** | Bayar Midtrans nyata (kunci lokal belum jelas sandbox/production), upload foto/sertifikat (storage lokal nonaktif), email Resend, push notifikasi, balasan AI (kunci kosong), halaman sertifikat (tidak ada data), production |
| Tes otomatis | tsc bersih; vitest 603 lulus (70 file); race 131 + tes baru lulus; build production lulus; eslint bersih |

Skill taste (`design-taste-frontend`) dipakai untuk **halaman marketing** saja (landing, dan menyisir panduan/login/daftar/pelatih/legal/pembayaran). Skill itu sendiri menyatakan dashboard/panel admin di luar cakupannya (bagian 13), jadi halaman member/coach/kolam/admin hanya disapu untuk konsistensi brand/aksesibilitas, bukan didesain ulang.

## 2. Bug yang ditemukan DAN sudah diperbaiki (dengan tes)

1. **Trial terblokir selamanya setelah bayar gagal.** Webhook menandai paket EXPIRED saat pembayaran gagal/dibatalkan/kedaluwarsa, dan aturan trial menganggap paket EXPIRED sebagai "sudah pernah punya paket". Sekarang hanya paket yang pernah aktif yang menghalangi trial. (`src/lib/trial.ts`, tes baru `trial.test.ts`)
2. **Saldo platform "boleh ditarik" terlalu rendah setelah koreksi Hadir dalam 3 hari.** Pembalikan kredit yang masih ditahan ikut memotong dana lama yang sudah matang (terbukti: angka jatuh ke Rp0 padahal ada Rp12.555 matang; tes lama menangkap 0 vs 13.393). Sekarang dihitung per sesi (FIFO), tidak pernah lebih besar dari yang aman. Tes race P3-P5 (P3 gagal di kode lama, lulus di kode baru).
3. **API pendaftaran (member, coach, kolam) mengembalikan 500 untuk body rusak** (bukan JSON, `null`, tipe salah). Sekarang 400 dengan pesan jelas.
4. **Tidak ada batas panjang input pendaftaran** (nama 5000 huruf diterima dan tersimpan). Sekarang: nama 100, email 254, password 72, nama kolam 100, alamat 300, bio 1000, catatan sertifikasi 500, maks 10 anak. Info kolam: alamat 300, telepon 20.
5. **Format email tidak dicek** (teks apa pun diterima). Sekarang bentuk dasar dicek.
6. **Kontras teks aksen rose 4,3:1** (badge "Populer"/"Trial") di bawah batas 4,5:1. Token diganti ke `#BE123C` (5,7:1). Tes baru menjaga semua pasangan warna di /brandguideline tetap ≥ 4,5:1.
7. **Tombol Daftar di landing tertutup banner cookie** pada kunjungan pertama (diukur: tombol y=757-805, banner mulai y=730). Hero dipendekkan (subteks 17 kata, foto lebih pendek), banner cookie jadi satu baris. Diukur ulang di 360/375/390/393/430/768/1280/1440: tombol di atas banner.
8. **Istilah baku (`brand-kit/MESSAGING.md`) dilanggar**: login → masuk, pelatih → coach, murid/pelanggan → peserta/member, absensi → kehadiran, langganan → biaya bulanan, "User" → "Pengguna" (admin), "Role" → "Peran", "upload" → "unggah" (kalimat penjelasan). Label CTA member diseragamkan jadi "Daftar gratis".
9. **Judul tab generik** ("Member | …", "Admin | …") di 28 halaman → judul spesifik.
10. **Area sentuh HP < 44px**: link kontak halaman legal, link banner cookie, sapaan coach/kolam di hero, chip brand guideline.
11. **Input file import member tanpa label** (aksesibilitas) diberi label.
12. Tes baru untuk `affiliate.ts` (sebelumnya nol tes): 13 tes (rumus 5% dibulatkan ke bawah, sekali per member, pindah sesi kalau dibalik).

Rapi-rapi landing (taste): 6 poin per peran ditata bento 2+1 / 1+2 / 2+1 dengan sel lebar berwarna (bukan enam kartu kembar); kartu kolam tanpa foto lebih pendek + gradien lime brand; brand guideline ditambah baris "sudut 24px" dan riwayat perubahan aksen.

## 3. Hitungan uang: hasil uji langsung (sesi Rp93.750 = Rp750.000 / 8)

| Kondisi | Kolam | Coach | Platform bersih | PPN | Jumlah |
|---|---|---|---|---|---|
| Hadir (kolam 15/55/30 di data lokal) | 28.125 | 51.563 | 12.555 | 1.507 | 93.750 |
| Tidak Hadir (coach 50%, dibulatkan ke bawah) | 0 | 25.781 | 60.687 | 7.282 | 93.750 |
| Ganti Hadir lagi | 28.125 | 51.563 | 12.555 | 1.507 | 93.750 |

Bolak-balik mengembalikan jumlah persis; total tiap kasus = harga sesi; saldo semua kolam = ledger kolam; saldo semua coach = ledger coach dikurangi pencairan (rekonsiliasi lulus).

## 4. Butuh keputusan/pengecekan Hadi (tidak saya ubah)

1. **Landing produksi masih menampilkan "Harga mulai Rp 5.000/paket"** (paket uji) dan kolam contoh Melati/Tirta Asri dengan alamat contoh (dicek lewat curl publik). Ini tugas H2 (matikan paket uji) + keputusan geser ke kolam asli.
2. **Persentase bagi hasil**: data lokal (salinan produksi) kolam memakai komisi 15% / coach 55% / kolam 30%, sedangkan keputusan 29 Sep contoh 10/40/50. Cek angka sebenarnya di Admin > Bagi Hasil produksi.
3. **Komisi afiliasi**: kode memakai 5% dari harga paket pertama; catatan keputusan lama menulis 10% dan "dasar hitung belum dijawab". Konfirmasi angka dan dasarnya.
4. **Kebijakan Privasi belum diperbarui**: terakhir 25 Sep, belum menyebut tanggal lahir peserta, catatan perkembangan/sertifikat milestone, dan kode afiliasi (S&K sudah). Perlu diperbarui (idealnya dicek orang hukum). Privasi juga masih memakai "pelatih" sementara S&K memakai "Coach".
5. **50% coach saat peserta tidak datang** tertulis di landing/FAQ/halaman coach, tetapi di S&K hanya sisi member. Pastikan tertulis di perjanjian coach/MOU.
6. **Batas salah login per akun+jaringan**: penyerang dengan banyak IP bisa menebak satu akun tanpa terkunci (bcrypt memperlambat). Opsi: tambah batas per akun saja untuk admin/coach/pemilik kolam. Ini opini keamanan, bukan bug.
7. **Kunci Midtrans lokal** berawalan `Mid-se…` (format production) padahal `MIDTRANS_IS_PRODUCTION=false`. Cek sebelum klik Beli di lokal (memori lama sudah mengingatkan).
8. Admin > Pesan menampilkan nama variabel env ("GEMINI_API_KEY / ANTHROPIC_API_KEY belum diisi") saat AI belum aktif. Admin-only; sebaiknya pesan ramah.
9. Riwayat Bayar member menampilkan nomor transaksi panjang (`PKG-cmu…-1789…`). Pertimbangkan diringkas.
10. Foto kolam/coach belum ada di produksi (HTML publik tidak memuat `<img>` kolam/coach): kartu jadi blok polos. Butuh foto asli.
11. Saldo platform "boleh ditarik" tetap bisa terasa rendah selama masa tahan 3 hari (memang desain: kredit baru ditahan). Yang diperbaiki hanya efek samping koreksi.

## 5. Yang awalnya kelihatan temuan tapi ternyata BUKAN (false alarm, dicatat)

- Kontras 2,5:1 pada "Cairkan", "Upload Foto", "Import", "Simpan Tanda Tangan", "Tambah Sertifikat", "Daftar" (register): semua tombol **nonaktif** (dikecualikan aturan kontras).
- Kontras 1,12:1 pada menu landing: teks putih di atas foto hero, alat ukur saya tidak membaca gambar latar.
- "Kontrol tanpa nama" di /admin/kolam dan /admin/users: elemen di dalam `<details>` yang tertutup.
- Tandai hadir lewat dropdown "tidak jalan": itu artefak alat uji (browser tanpa layar tidak menjalankan `requestAnimationFrame`); server dan UI asli berfungsi (dicek lewat kirim form langsung).
- Angka waktu "7 jam lebih awal" di query saya: driver `pg` membaca kolom `timestamp` tanpa zona sebagai waktu lokal; kesalahan alat saya, bukan data.
- Klik "Cairkan" tanpa nominal mencairkan seluruh saldo: memang desain (nominal kosong = semua saldo).
- Batas "Lewat 24 jam" coach: bekerja benar (tombol terkunci "hubungi admin").

## 6. Jejak data uji di DB dev lokal (bukan production)

Disengaja dibiarkan (DB dev bisa direset dengan `npm run db:dev:sync`): pembayaran uji `qa-sweep-pay-1` (Rp750.000) pada paket `cmujkor0n…`; 5+1 booking Member 12 ditandai Hadir/Tidak Hadir; pencairan coach Coach 6 Rp50.000 (PAID) dan Rp103.126 (ditolak); paket 1 Sesi Tirta Asri milik Member 8 diaktifkan + 1 booking; peserta "Uji Sweep Anak". Akun uji pendaftaran (`0812345000xx`) sudah dihapus.

## 7. Yang belum dikerjakan

- Halaman sertifikat milestone tidak diuji (tidak ada data level selesai di DB dev).
- Landing desktop: bagian "Kamu di sini sebagai apa?" dan "Cara kerjanya" masih tiga kartu sejajar; coach polaroid dan logo pembayaran (baris terakhir 1 logo) belum dirapikan.
- Belum ada pengecekan visual penuh halaman sesudah perubahan di semua role selain crawl mekanis (kontras, tap target, judul, HTTP) dan tinjauan gambar landing.
- Tidak ada perubahan migrasi/schema.
