# Plan: Lanjutan sweep total (menutup celah laporan pertama)

> Ditulis oleh Claude (Sonnet 5), 25 Sep 2026. Eksekutor: OpenCode.
> Lanjutan dari `docs/plans/sweep-total-opencode.md` (masih berlaku penuh,
> termasuk semua larangan di bagian 2 dokumen itu — SATU perbaikan: baris
> larangan `.env*` di dokumen itu sudah direvisi, MEMBACA `.env` untuk
> `MIDTRANS_SERVER_KEY` sekarang dibolehkan khusus 5.4, nilainya tidak boleh
> dicetak). Ini tetap tugas AUDIT SAJA — tidak ada kode yang diubah.

## 0. Kenapa dokumen ini ada

Laporan pertama (`laporan-sweep-opencode.md`) terpotong di tengah kalimat —
file-nya sendiri berakhir dengan teks literal `...[truncated 3010 chars]`
di bagian 8. Setelah ditanya, OpenCode konfirmasi sendiri:

- Bagian 7-10 laporan memang tertulis tipis/terpotong (butir 30 cuma
  ringkasan, bukan tabel per-route; empty-state diklaim "OK" tanpa bukti
  saat ditulis).
- Tes yang BELUM JALAN sama sekali (bukan cuma belum ditulis) lebih besar:
  dark+HP halaman role (~30 kombinasi), loading state, alur 15/19/20-penuh/28
  (terblokir data), webhook 5.4 (terblokir kontradiksi aturan, sudah
  diperbaiki di atas), kontras per halaman (baru spot-check).

Jadi ini BUKAN cuma nulis ulang laporan — sebagian besar tes beneran belum
jalan. Kerjakan sesuai urutan di bawah.

## 1. Patch laporan lama dulu (cepat, datanya sudah ada)

Edit `laporan-sweep-opencode.md` langsung (jangan bikin file baru):

1. Selesaikan bagian 8 yang terpotong (poin 5 pola UI UX Pro Max yang hilang),
   lalu tulis bagian 7 (hasil tes otomatis — kalau belum dijalankan, jalankan
   sekarang: `npx tsc --noEmit` cek exit code langsung, `npm run lint`,
   `npx vitest run`), bagian 9 (tidak dites + alasan — pisahkan jelas: sudah
   dites tapi belum ditulis vs BELUM JALAN SAMA SEKALI, jangan dicampur),
   bagian 10 (cara pasang UI UX Pro Max).
2. Alur 30 (API tanpa login): ganti ringkasan satu baris jadi tabel per-route
   (route, status tanpa login, status role salah). Datanya sudah ada di tangan
   menurut OpenCode — tinggal ditulis.
3. Tambahkan hasil empty-state yang sudah dites (riwayat/pembayaran/paket akun
   baru) ke tabel halaman (bagian 3) atau baris baru di bagian 5.
4. Di bagian paling atas laporan (sebelum bagian 1), tambah baris:
   "Lihat juga: bagian 11 untuk kelanjutan tes 25 Sep (dark-HP role,
   loading state, alur terblokir, webhook)." — bagian 11 diisi di langkah 2/3.

## 2. Lanjutkan tes yang BELUM JALAN sama sekali

Kerjakan berurutan, tulis hasil ke bagian 11 laporan yang sama (append, jangan
timpa bagian 1-10). Tiap sub-bagian: kalau genuinely tidak bisa dijalankan,
tulis kenapa — jangan dipaksakan sampai merusak data asli.

### 2.1 Dark + HP untuk halaman role (yang di sweep pertama cuma desktop-terang)

Untuk 4 role (admin/coach/member/pool) × halaman yang tercantum di bagian 5.1
dokumen utama: ulangi kombinasi **HP 375 + tema gelap** yang belum dicek
(laporan pertama: role dalam baru desktop-terang+HP-terang+desktop-gelap;
HP-gelap role-dalam belum). Termasuk 20 halaman detail user admin: cukup
sampling wajar (misal 5 dari 20, dipilih acak) untuk HP+gelap, bukan wajib
20/20 lagi — TAPI kalau kena batas waktu/token, prioritaskan halaman yang di
laporan pertama sudah ada catatan "belum dicek" di kolom Gelap/HP.

### 2.2 Loading state

Server lokal terlalu cepat untuk menangkap loading state natural. Coba:
- Cek apakah tiap route Next punya `loading.tsx` (`find src/app -name
  "loading.tsx"`) — kalau ada, itu sudah komponen yang dirender saat
  Suspense boundary aktif; baca isinya, nilai apakah wajar (skeleton/spinner
  ada teks yang jelas, bukan blank).
- Kalau alat `$B` (gstack) punya kemampuan network throttling/slow-3g,
  pakai itu untuk 3-4 halaman yang datanya besar (dashboard admin, riwayat
  member) dan screenshot state loading-nya.
- Kalau tidak bisa dipaksa muncul, tulis apa adanya: "tidak bisa dipicu,
  alasan: server lokal < X ms, alat tidak punya throttle" — JANGAN
  mengarang state loading yang tidak benar-benar dilihat.

### 2.3 Alur yang terblokir data (15, 19, 20-penuh, 28)

Ini boleh dicoba dibuka jalannya dengan DATA UJI TAMBAHAN (awalan "OC "),
BUKAN dengan mengubah kode atau nilai minimum di DB langsung:

- **15 (pencairan admin: Tolak/Bayar) & 20/28 (saldo coach/pool < minimum
  Rp 50.000):** jalankan alur booking → Hadir → bagi hasil (seperti alur
  22-23 tapi berkali-kali, pakai slot baru tiap kali) sampai saldo salah satu
  akun OC melewati Rp 50.000, baru ajukan pencairan. Kalau ini makan waktu
  terlalu lama (butuh banyak booking), STOP setelah percobaan wajar (misal
  3-4 booking) dan tulis "tidak bisa dalam waktu wajar, butuh N booking lagi".
- **19 (Tandai Hadir) penuh:** butuh slot yang waktunya sudah lewat saat
  ditandai. Cek apakah UI coach mengizinkan buat slot untuk tanggal hari ini
  jam yang sudah lewat, atau apakah ada slot lama dari sweep sebelumnya
  (DB dev berisi data dari sweep 25 Sep pagi) yang belum ditandai dan
  waktunya sudah lewat — pakai itu kalau ada, JANGAN ubah `startTime` lewat
  DB langsung (itu mengubah data, bukan audit).
- Kalau semua jalan buntu tetap ditempuh dan tetap tidak bisa, itu SAH
  ditulis sebagai "tidak bisa dites: penyebab X" — bukan kegagalan OpenCode.

### 2.4 Webhook Midtrans (5.4)

Sekarang boleh baca `.env` untuk `MIDTRANS_SERVER_KEY` (lihat bagian 0 di atas).
Hitung signature SHA-512 (`order_id + status_code + gross_amount + SERVER_KEY`),
kirim POST ke `http://localhost:3000/api/payment/webhook`. Pakai `order_id`
dari pembayaran uji yang sudah ada di DB dev (booking sweep OC), status
`"200"`/`"settlement"` untuk 1 skenario sukses saja — TIDAK perlu 7 skenario
ulang (sudah dites lengkap di sweep 25 Sep pagi, lihat
`laporan-sweep-2026-09-26.md`). Cukup buktikan endpoint hidup dan menerima
signature valid di kode saat ini. JANGAN mencetak `MIDTRANS_SERVER_KEY` ke
laporan/konsol dalam bentuk apa pun.

### 2.5 Sisa kecil yang tercatat "tidak dites" di laporan pertama

Kalau waktu masih ada, coba selesaikan (opsional, urutan prioritas rendah):
hapus slot (alur 18), `/pelatih/[coachId]` untuk coach yang isActive=false
(harus 404/ditolak — cari id coach nonaktif dari daftar user admin), tap
chat widget di viewport HP, role selain member di form buat-user admin
(alur 8), investigasi sumber 4× console 404 di R10 (cocokkan timestamp
dengan request di tab Network, bukan cuma re-visit halaman).

### 2.6 Kontras per halaman (bukan cuma spot-check)

Laporan pertama baru mengukur kontras di landing (terang+gelap). Jalankan
pengukuran kontras otomatis (skill UI UX Pro Max / metode yang sama dipakai
sweep 25 Sep: `__contrast` di localStorage, transisi CSS dimatikan dulu)
di MINIMAL 1 halaman representatif per role per tema (8 kombinasi: admin/
coach/member/pool × terang/gelap), plus halaman dengan warna status
(sukses/warning/danger) yang belum kena spot-check. Tulis angka rasio yang
di bawah 4.5:1 kalau ada.

## 3. Format hasil

Semua masuk ke `laporan-sweep-opencode.md` yang sama, bagian baru:
**"## 11. Lanjutan 25 Sep — dark/HP role, loading, alur terblokir, webhook,
kontras"**, dengan sub-heading sesuai 2.1-2.6. Ikuti aturan jujur yang sama
seperti dokumen utama: tiap klaim ada bukti, "tidak bisa" dipisah jelas dari
"tidak sempat", tidak menulis "aman/lengkap" tanpa cara verifikasi.

## 4. Setelah ini

Setelah bagian 11 selesai, laporkan ke Hadi/Claude ringkas: apa yang
akhirnya BENAR-BENAR tidak bisa dites sampai titik ini (daftar final), supaya
Claude bisa putuskan mana yang perlu ditutup manual sebelum fitur terkait
dianggap tervalidasi.
