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

---

# Sweep lanjutan (30 Sep siang) — semua fitur dijalankan satu per satu

Arahan Hadi: aplikasi masih pengembangan (akun dummy, termasuk di production), jalankan SEMUA fitur, jangan lewati yang "sudah pernah". Semua dijalankan lewat UI di DB dev lokal dengan browser headless, uang dicek ke ledger via SQL. Production tidak disentuh (Claude tidak boleh mengetik password ke situs non-localhost).

## A. Keputusan Hadi yang sudah dikerjakan
| Keputusan | Hasil |
|---|---|
| Kolam contoh ikut digeser kolam asli, maks 5 | `rankLandingPools` + 9 tes; landing dicek: 5 kolam tampil; foto contoh SVG di `public/demo` |
| Bagi hasil final 10/40/50 | Bawaan kolam baru 10/40 (migrasi `20260930120000_pool_split_default`, hanya SET DEFAULT). Kolam yang sudah ada diubah lewat skrip `rapikan-data-produksi.mts` (lihat-saja dulu) |
| Afiliasi 5% sekali dari paket pertama | Sudah begitu di kode; dibuktikan ujung ke ujung (bagian B) |
| Kebijakan Privasi diperbarui | Tanggal lahir peserta, catatan & sertifikat milestone, afiliasi, data coach, bagian data anak, kunci login. **Belum dicek orang hukum** |
| 50% coach tidak hadir di perjanjian coach | Sudah ada di Pasal 4.4; tag "BELUM ADA DI SISTEM" yang usang dibuang dari draft coach & MOU |
| Batas salah login 3x per akun + hitung mundur | Kunci per akun (semua jaringan), layar masuk menampilkan hitung mundur; tes race L3/L3b |
| 1 logo untuk semua latar; teks swim.privatehub ikut tema | Dicatat di brand guideline; teks mewarisi warna pembungkus |
| File lama di-commit | `docs/archive/laporan-lama/`; alat OTP jadi `scripts/qa-otp.mts` (menolak DB non-lokal) |
| Pesan admin ramah, nomor transaksi ringkas, foto contoh | Selesai (`#XXXXXXXX`, nomor penuh di tooltip) |
| Matikan paket uji, paket trial per kolam | Skrip `rapikan-data-produksi.mts` (Hadi jalankan di production). Harga trial bawaan Rp50.000 = angka sementara dari Claude, ubah di Admin > Paket |

## B. Fitur yang dijalankan dan hasilnya
Semua lulus kecuali yang tertulis di bagian C.
- **Laporkan kehadiran:** member lapor → admin ubah Tidak Hadir→Hadir (ledger ikut dikoreksi) → tutup laporan → member melihat hasilnya.
- **Milestone:** coach isi butir + catatan, tambah butir khusus + usul jadi standar, admin setujui, level selesai → sertifikat level; member melihat progres; coach/member lain mendapat 404; tanpa login diarahkan ke masuk.
- **Slot coach:** tambah 3 slot, bentrok lintas kolam ditolak, hapus slot.
- **Usulan paket kolam:** paket baru & ubah harga → admin setujui / tolak (harga aktif tidak berubah saat ditolak).
- **Daftar coach & kolam → persetujuan:** akun menunggu tidak bisa masuk; setelah disetujui bisa masuk; kolam baru butuh "Setujui" terpisah di halaman Kolam; kolam baru mendapat 10/40 bawaan.
- **Afiliasi ujung ke ujung:** coach login pertama → kode terbentuk; member daftar dengan kode; bayar di Midtrans **sandbox** (halaman "TEST", VA BCA); notifikasi Midtrans disimulasikan lokal dengan tanda tangan asli; booking; 2 sesi Hadir → satu komisi Rp20.000 (5% × Rp400.000, sekali per member); lewat masa tahan → cair ke saldo coach, saldo SPH −Rp20.000.
- **Webhook pembayaran:** tanda tangan salah ditolak; jumlah beda tidak mengaktifkan; challenge tetap menunggu; settlement aktif; duplikat & expire telat tidak mengubah; deny → paket EXPIRED.
- **Trial:** pembelian menunggu menyembunyikan tombol; setelah deny tombol muncul lagi (bug yang diperbaiki semalam).
- **Beli 1 sesi:** harga Rp120.000 = tertinggi per sesi (100.000) + 20%; bagi hasil 60.000 / 48.000 / 12.000 (dicek di ledger).
- **Bagi hasil 10/40/50 Rp100.000 (contoh Hadi):** kolam 50.000, coach 40.000, SPH 8.929 + PPN 1.071; sesi nyata di DB dev Rp100.000 cocok persis. Tidak Hadir: coach 20.000, SPH 80.000. Tes otomatis untuk berbagai harga & persen (termasuk 0%).
- **Nonaktifkan coach:** booking mendatang dibatalkan (oleh admin), sesi member kembali.
- **Reset password → wajib ganti:** sama dengan sementara / terlalu pendek / tidak cocok ditolak; valid masuk.
- **Koreksi saldo:** tambah (salah catat) dan kurangi (dipindah ke platform, pasangan ledger PLATFORM_REVENUE).
- **2FA coach:** pasang (kunci tersimpan terenkripsi), kode salah ditolak, masuk dengan kode, matikan.
- **Hapus akun:** diajukan member → admin setujui → identitas dianonimkan, riwayat pembayaran tetap. Diperketat: tanggal lahir peserta & isi catatan milestone ikut dihapus.
- **Impor Excel:** 2 member dibuat (peserta + paket), baris tanpa HP dan HP yang sudah ada dilewati.
- **Chat:** tanpa AI, pesan diteruskan ke admin, admin membalas, status selesai.
- **Unggah file (dengan penyimpanan palsu lokal):** foto coach, tanda tangan, sertifikat PDF, foto kolam; file palsu (bukan gambar asli) dan >3MB ditolak; admin menyetujui sertifikat → badge "Bersertifikat · … +1" tampil di profil publik.
- **Pemilik kolam:** dashboard, saldo, pencairan (di bawah minimum & melebihi saldo ditolak, sah Rp60.000 → admin tandai dibayar; tanpa bukti transfer ditolak), info kolam, paket, daftar coach.
- **Halaman admin vs ledger:** Dashboard "saldo mengendap" = kolam + coach + platform (cocok Rp456.250); Bagi Hasil, Uang Masuk, Pencairan cocok dengan SQL.
- **Kode dibaca (tidak bisa dijalankan):** email (Resend), notifikasi push (VAPID), pencairan otomatis Iris (memang belum ditulis), aksi pesan admin. Tidak ditemukan bug.

## C. Temuan
**Diperbaiki:** komisi afiliasi tampil sebagai "koreksi manual" di Bagi Hasil (sekarang baris sendiri); "Upload" → "Unggah"; nama kolam tanpa pemilik tidak dianggap contoh (aturan demo = nama atau pemilik @example.com); hapus akun menyisakan tanggal lahir anak; peserta per akun tanpa batas (sekarang 10).
**Bukan bug / artefak uji:** Bagi Hasil lebih besar dari ledger sebesar Rp468.750 = 5 sesi uji buatan saya (ditandai Hadir sebelum ada pembayaran, tidak mungkin di alur nyata). Data info kolam Melati sempat kosong karena skrip uji saya melewati kunci "Edit Info Kolam"; dipulihkan lewat UI asli.
**Perlu Hadi:**
1. Merchant Midtrans tampil **"Les Renang Cianjur"** di halaman bayar. Ganti nama merchant di dashboard Midtrans jadi Swim Private Hub.
2. Menyetujui pemilik kolam tidak menyalakan kolamnya; harus klik Setujui di halaman Kolam juga (dua langkah).
3. Persetujuan sertifikat ada di halaman Pengguna (bagian atas), bukan di detail coach.
4. Drop kolom lama `certificateUrl/certificateStatus` (P3) **ditolak pemeriksa izin otomatis** (DROP COLUMN): tidak saya kerjakan. Kolom tidak dibaca kode; aman dibuang nanti dengan persetujuan Hadi.
5. Harga trial Rp50.000 dan 3 kolam contoh tambahan (Bahari, Cempaka, Samudra) adalah isian sementara Claude untuk data contoh.

## D. Sisa
Uji ke Supabase/S3 asli (backup file), CSP mode pantau menunggu log, balasan AI, email, push, pembayaran di production, X-L testimoni (butuh teks Hadi).

---

## Babak 2 (30 Sep sore): sisa fitur dijalankan + perbaikan

**Dijalankan lewat UI, semua benar:** admin buat pengguna (coach), admin assign paket, admin edit paket, bagi hasil kolam lewat form (validasi >100% ditolak, simpan, kembalikan), lepas coach dari kolam, tolak sertifikat (dan coach menghapusnya), tolak usulan butir milestone, coach membatalkan slot yang sudah dibooking (booking batal oleh coach, sesi kembali), member Cari Coach, isi tanggal lahir peserta, tambah & nonaktifkan peserta anak, jatah batal habis (tombol diganti "Hubungi Admin"), halaman pemilik kolam Jadwal & Laporan, admin Email/Kinerja/Jadwal Booking, tautan lupa password (WhatsApp).
**Uang, ujung ke ujung (DB dev):** komisi platform 0% (kolam 0/60: sesi Rp100.000 = kolam 40.000, coach 60.000, tanpa baris platform kosong); trial Rp50.000 di 0/60 = kolam 20.000 / coach 30.000; afiliasi lewat KODE KOLAM (komisi Rp20.000 cair ke saldo kolam Melati); tidak hadir tidak memicu komisi, Hadir memicu, dibalik ke Tidak Hadir kembali menunggu.
**Diperbaiki:**
1. Persetujuan pertama pemilik kolam ikut menyalakan kolamnya (dulu dua klik di dua halaman).
2. Tombol setujui/tolak sertifikat juga di halaman detail coach.
3. Riwayat "Komisi Afiliasi" tampil di Saldo coach & pemilik kolam (dulu saldo naik tanpa keterangan).
4. Bagi Hasil admin: kolom Kolam & Coach terpotong di layar 1440px (dua kolom) -> satu kolom kecuali layar ≥1800px.
5. Langganan push: alamat wajib layanan push resmi (sebelumnya pengguna login bisa mendaftarkan alamat sembarang -> server mengirim ke sana = SSRF buta); body JSON rusak jadi 400. Tes race E10 ikut disesuaikan (hampir merusak job CI).
6. Akun yang sudah dihapus tidak muncul lagi di pilihan member di form admin.
7. Pesan email "kunci belum diisi" tidak lagi menyebut nama variabel env.
8. `seed-prod-demo.mts`: password tertanam dibuang (acak), sertifikat lewat tabel baru. Skrip kolam contoh menghubungkan coach contoh ke kolam contoh.
**Diketahui, tidak diubah (keputusan sebelumnya):** akun coach/pemilik kolam yang dibuat admin tidak dipaksa ganti password saat masuk pertama (hanya member; ada tes yang sengaja menetapkan itu).
**Verifikasi akhir:** tsc 0, eslint 0, vitest 637, race 135 (E10 diperbaiki), build exit 0. Cek overflow horizontal semua halaman admin (1440 & 390), coach (1440 & 390), member & pemilik kolam (390): bersih kecuali satu tabel kecil yang memang bisa digeser.
