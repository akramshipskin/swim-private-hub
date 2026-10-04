# Serah terima SPH untuk asisten pengkode berikutnya (OpenCode / Codex / lainnya) — 4 Okt 2026

Dokumen ini untuk asisten pengkode baru (Hadi memakai OpenCode dengan model Fable 5; isinya netral dan berlaku juga untuk Codex atau asisten lain) yang melanjutkan Swim Private Hub (SPH) setelah dikerjakan Claude. Baca SELURUHNYA sebelum mengubah apa pun. Ditulis dari kode dan dokumen repo per commit 7017f6e (4 Okt 2026 siang). Bila dokumen ini bertentangan dengan kode, kode yang benar: laporkan ke Hadi, jangan diam-diam mengikuti salah satunya.

## 0. Prompt awal yang disarankan

> Kamu melanjutkan project SPH di folder ini. Baca dulu, berurutan: docs/HANDOFF-AGEN.md (seluruhnya), AGENTS.md, docs/STATUS.md, docs/aturan-bisnis-saat-ini.md, lalu docs/KEPUTUSAN.md bagian bawah. Aturan di CLAUDE.md juga berlaku untukmu (isinya diringkas di dokumen serah terima, bagian 2 dan 3). Jangan menebak aturan bisnis: ragu = tanya Hadi. Jangan menyentuh uang, login, skema database, atau booking tanpa membaca bagian 6 dan 7. Lapor ke Hadi dengan bahasa Indonesia awam (bagian 3).

Catatan: CLAUDE.md dan folder `.claude/` adalah milik Claude Code (pagar otomatis format laporan, pembuka sesi otomatis, dan paket cara kerja Claude TIDAK ikut ke asisten lain; aturannya sudah ditulis di dokumen ini dan di bagian "Aturan main Hadi" di AGENTS.md). Asisten lain umumnya membaca `AGENTS.md` otomatis (belum dicek untuk OpenCode versi Hadi), karena itu prompt di atas tetap perlu dikirim sebagai pesan pertama setiap sesi baru. `AGENTS.md` sendiri ada blok yang ditulis ulang otomatis oleh `next dev`: jangan dihapus.

## 1. Produk dan peran

Marketplace les renang privat. Penyelenggara: PT Makna Krabat Indonesia (nama ini hanya untuk dokumen hukum). Empat peran (enum `Role`: ADMIN, COACH, MEMBER, POOL_OWNER):

- **Member** (orang tua / dewasa): beli paket 4 atau 8 sesi untuk 1 coach di 1 kolam, booking jam kosong coach itu, batal sendiri sesuai jatah, riwayat, saldo member. Satu akun punya beberapa **peserta** (model `Dependent`; "Saya" = peserta dirinya sendiri).
- **Coach**: pilih kolam tempat mengajar sendiri (menu Kolam Saya), pasang harga jasa, buka jam kosong, tandai Hadir / Tidak hadir, saldo + pencairan, catatan milestone per peserta.
- **Pemilik kolam**: pasang harga tiket paket, info dan jam buka kolam, lihat jadwal, laporan, saldo + pencairan.
- **Admin** (satu orang, founder; wajib 2FA): kelola pengguna, beri paket gratis, putuskan ganti coach, proses pencairan manual, koreksi saldo, bagi hasil, laporan.
- **Publik / tanpa login**: landing (`/`), panduan, 4 halaman legal, halaman publik coach (`/pelatih/[coachId]`), daftar (member, coach, kolam).

Semua akun di production sekarang dummy/sandbox. Belum ada pembayaran asli.

## 2. Hadi dan cara kerja (aturan yang berlaku untuk semua asisten)

Hadi = orang marketing dan branding, BUKAN programmer. Hadi memutuskan APA (produk, bisnis, tampilan); asisten memutuskan BAGAIMANA dan memilih cara teknis yang aman.

- **Jujur, jangan sotoy.** Tidak tahu = tulis "belum dicek". "Baru baca kode" beda dengan "sudah dijalankan". "Selesai / aman" hanya setelah diverifikasi; sebut cara verifikasinya; verifikasi lemah = bilang lemah. Temuan yang ternyata false alarm tetap dilaporkan beserta alasannya. Angka dalam satu laporan harus konsisten.
- **Pertanyaan = jawab, bukan langsung mengubah.** "Udah X belum?" = laporkan status apa adanya, tawarkan kerjaannya, jangan langsung kerja. Perintah eksplisit dan spesifik ("kerjain X") = persetujuan: tulis breakdown singkat lalu jalan. Permintaan ambigu / sangat besar / menyentuh hal sensitif = tampilkan breakdown dan tunggu "lanjut". Kerjakan hanya yang diminta.
- **"Kepikiran…", "menurut lu…", "gimana kalau…" = eksplorasi, bukan perintah coding.** Pahami ide, periksa sistem yang ada, tantang secara konstruktif, sebut konsekuensi.
- **Mode tidur / pergi** ("gua tidur", "beresin semua"): jalan sendiri sesuai daftar. Hal yang wajib tanya dilewati dan dicatat "ditunda". Berakhir di pesan Hadi berikutnya.
- **Batas keras (semua mode):** tidak transaksi uang sungguhan, tidak mengetik password ke situs production, tidak menghapus data permanen di production, tidak membaca berkas `.env*` dan tidak menyalin isinya ke file / chat.
- **Hadi marah = ada yang salah di asisten.** Berhenti, sebut salahnya secara spesifik, perbaiki. Jangan membela diri dan jangan minta maaf secara umum.
- Password, kunci, token ASLI: jangan tulis isinya ke file, catatan, atau chat; catat lokasi, nama, dan tanggal ganti saja. Akun uji dummy boleh disimpan di berkas yang masuk `.gitignore`.
- Keputusan bisnis yang HARUS ditanyakan (jangan ditebak): harga, janji ke pelanggan, syarat kelayakan, pembatalan, refund, status pembayaran, pengakuan pendapatan, bagi hasil, komisi, perilaku saldo, pencairan, pemilik booking, hak akses, isolasi antar kolam, data historis, migrasi yang menghapus data. Bila repo sudah menetapkan aturannya, ikuti repo kecuali Hadi minta diubah; bila ambigu atau saling bertentangan, tampilkan ke Hadi.

**Urutan acuan bila sumber bertentangan:** (1) kode, (2) `docs/aturan-bisnis-saat-ini.md`, (3) `docs/KEPUTUSAN.md`, (4) `brand-kit/MESSAGING.md`, (5) dokumen lama di `docs/designs/` dan README. `docs/designs/marketplace-pivot.md` dan `simulasi-pendapatan-kolam.md` TIDAK berlaku. Kode yang menyimpang dari keputusan Hadi tetap dilaporkan.

## 3. Cara melapor ke Hadi

Bahasa Indonesia awam. Sapaan "gue" (asisten) dan "lu" (Hadi); jangan menyebut "Hadi" sebagai orang ketiga ke dia. Urutan (hanya yang ada isinya): Sudah / Proses / Belum / Rekomendasi / Pertanyaan.

- Kalimat pertama = jawaban atau hal yang perlu Hadi lakukan.
- Tanpa nama file, nama cabang, atau perintah teknis di laporan; pakai padanan awam (cek penulisan kode = tsc; tes otomatis = vitest; versi jadi = build; jalur kerja = cabang; kirim ke GitHub = push; tayang = deploy). Istilah teknis: padanan awam dulu, aslinya di kurung.
- SEMUA yang butuh keputusan Hadi diulang di bagian "Pertanyaan" di akhir: bernomor, satu keputusan per nomor, dengan pilihan A/B dan rekomendasi. Tidak ada = tulis "Pertanyaan: tidak ada".
- Bagian "Next" memuat SELURUH langkah sisa berurutan, termasuk yang menunggu Hadi.
- Laporan yang menyentuh kode memuat satu baris "Status kode": sudah di-commit? di-push? tayang? dengan bukti singkat (hasil GitHub dan Vercel).
- Bagian "Tugas Hadi" hanya berisi tugas nyata; kosong = "tidak ada". Langkah untuk Hadi ditulis langsung di chat, bernomor, singkat; perintah shell dalam blok kode terpisah, satu perintah per blok.
- Panjang laporan progres maksimal ±35 baris; rincian panjang ke `docs/`.
- Tutup dengan "Dicatat: …" bila menulis ke file catatan.

## 4. Tumpukan teknologi dan lingkungan

- Next.js 16 (App Router, Turbopack) + React 19, Tailwind CSS v4, TypeScript. **Next.js ini punya perubahan besar dari yang kamu kenal** (contoh: middleware bernama `src/proxy.ts`; `after()` dari `next/server` dipakai untuk kerja susulan). Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode Next.
- Prisma 7 dengan adapter `@prisma/adapter-pg` (PrismaPg), PostgreSQL di Supabase (project khusus SPH, jangan dicampur dengan produk lain). Klien Prisma dihasilkan ke `src/generated/prisma` (tidak di-commit; `npm install` menjalankan `prisma generate`).
- Auth: next-auth v5 beta 32 (dikunci), Credentials + JWT. Callback jwt membaca DB tiap `auth()` (cek `isActive` dan `sessionVersion`). Percobaan menyimpan hasil `auth()` per permintaan SUDAH dicoba dan DIBATALKAN (risiko data basi setelah ganti password / perjanjian dalam permintaan yang sama): jangan diulang.
- Pembayaran: Midtrans Snap (satu akun platform untuk semua kolam). Pencairan: manual oleh admin; Midtrans Iris opsional (belum aktif).
- Hosting: Vercel, wilayah `sin1` (Singapura). Cron harian `/api/cron/harian` jam 06.00 WIB (`vercel.json`, `0 23 * * *` UTC), dilindungi `CRON_SECRET` (kosong = semua panggilan ditolak).
- Email: Resend (inbox admin). Notifikasi: web push (VAPID) + lonceng dalam aplikasi. Penyimpanan file: Supabase Storage (bucket `coach-photos` publik, `coach-certificates` privat). Chat bantuan AI opsional (Gemini atau Anthropic; kosong = diteruskan ke admin). Meta Pixel + Conversions API untuk iklan (ID/token diisi Hadi di Vercel).
- Zona waktu bisnis: WIB (Asia/Jakarta). Tanggal murni (kolom `date`) disimpan sebagai tanggal UTC tengah malam; **titik waktu** (jam sesi, `createdAt`) harus diformat dengan `formatDateWib` / `formatTimeWib`, BUKAN `formatDateLabel` (UTC). Pernah menyebabkan tanggal mundur sehari.
- Rupiah: `formatRupiah` menghasilkan "Rp 1.000" dengan spasi tak terputus. Jangan ubah ke "Rp1.000" (sudah pernah dicoba dan dikembalikan sesuai `brand-kit/MESSAGING.md`).
- Nama variabel lingkungan: lihat `.env.example` (hanya nama, tanpa isi). Hadi memegang nilai production di Vercel dan berkas `.env.prod` miliknya. Asisten TIDAK membaca berkas `.env*`.

## 5. Peta kode

```
src/proxy.ts            penjaga rute per peran + wajib ganti password, 2FA admin, perjanjian mitra
src/auth.ts             konfigurasi next-auth
src/app/                halaman (App Router)
  (auth)/               masuk, daftar (member)
  member/ coach/ pool/ admin/   area per peran (tiap area: layout, template, loading, dashboard, ...)
  pelatih/[coachId]/    profil publik coach
  notifikasi/           lonceng: daftar notifikasi (semua peran)
  milestone/[dependentId]/  catatan perkembangan + sertifikat
  daftar-coach/ daftar-kolam/ kota/ perjanjian/ perjanjian-coach/ mou-kolam/ ganti-password/ keamanan/ profil/ panduan/ brandguideline/
  api/                  booking, availability, payment (checkout, webhook, coach-change), cron/harian, notifikasi/jumlah, push, chat, register*, webhooks/resend-inbound, admin/pph-rekap, coach/schedule-dates, csp-report
src/lib/                logika bisnis (±130 berkas; tiap fungsi punya tes berdampingan)
src/components/         komponen bersama (dashboard.tsx, nav-bar, sidebar-nav, mobile-bottom-nav, attendance-*, notification-bell, ui/*)
prisma/schema.prisma    skema; prisma/migrations/ (44 migrasi)
scripts/                alat bantu lokal dan produksi (bagian 8)
brand-kit/              warna, font, logo, MESSAGING.md (aturan tulisan)
docs/                   catatan, keputusan, rancangan, laporan sweeping (bagian 13)
tests/race/ + vitest.race.config.ts   tes balapan (butuh DB lokal 54329); vitest.config.ts = tes biasa
```

**Halaman per peran** (menu asli ada di `src/lib/nav-links.ts`; nama menu = judul halaman):
- Member: Dashboard, Booking, Cari Coach, Riwayat Booking, Paket, Riwayat Bayar, Peserta, Profil Saya.
- Coach: Dashboard, Jadwal, Kolam Saya, Riwayat Sesi, Peserta, Harga, Saldo, Profil Saya.
- Pemilik kolam: Dashboard, Jadwal Kolam, Laporan, Saldo, Info Kolam, Paket & Harga, Coach di Kolam, Profil Saya.
- Admin (4 kelompok): Operasional (Dashboard, Jadwal Booking, Laporan Kehadiran, Ganti Coach, Coach Tanpa Jadwal), Mitra & Member (Pengguna, Kolam, Peminat per Kota, Paket, Kinerja Coach, Milestone), Keuangan (Uang Masuk, Bagi Hasil, Pencairan Saldo, Koreksi Saldo, Afiliasi), Lainnya (Pesan, Email, Testimoni, Profil Saya).
- Daftar halaman lengkap dan status uji: `docs/cakupan-halaman.md`.

**Tabel penting** (`prisma/schema.prisma`): `User`, `CoachProfile`, `Pool`, `PoolOwnership`, `PoolAffiliation`, `Dependent`, `Package`, `Payment`, `Availability`, `Booking`, `WalletTransaction` (ledger kolam/coach/platform; sumber kebenaran uang), `WithdrawalRequest`, `PlatformWithdrawal`, `MemberWalletTransaction`, `CoachChangeRequest`, `CoachViolation`, `CityWaitlist`, `MilestoneItem/Achievement/Note/LevelCompletion`, `AttendanceReport`, `AffiliateCode/Commission`, `PphRemittance`, `Testimonial`, `PushSubscription`, `InAppNotification`, `ChatThread/Message`, `EmailThread/Message`, `RateLimitHit`. Kolom/tabel model lama (`PackageTemplate`, `Pool.commissionPercent`, `coachSharePercent`, `Package.isSingleSession`, `templateId`) masih ada di DB tapi TIDAK dipakai kode (drop menyusul, butuh Hadi).

**Komponen dasbor bersama** (`src/components/dashboard.tsx`): `BentoCard` (kartu grid 6 kolom), `Stat`, `ActionRow`, `SessionList`, `NextStepCard` (kartu utama gelap / lembut), `SegmentBar` (sisa sesi), `BalanceCard` (kartu saldo, hanya tautan ke halaman Saldo). Semua dasbor memakai grid `md:grid-cols-6` (gaya bento).

## 6. Aturan bisnis ringkas (sumber lengkap: docs/aturan-bisnis-saat-ini.md + docs/KEPUTUSAN.md)

Angka tetap ada di `src/lib/policy.ts` dan `src/lib/pricing.ts`. Jangan tulis angka ini di tempat lain; impor dari sana.

- **Harga:** member bayar = harga tiket kolam + harga jasa coach + biaya layanan SPH 6,5% (sistem mengunci maks 6,9%). Paket 4 sesi berlaku 60 hari (batal sendiri maks 2x), paket 8 sesi 90 hari (maks 4x). Batal sendiri paling lambat 2 jam sebelum sesi (`CANCEL_WINDOW_HOURS`). Sesi coba: 1x per peserta, 7 hari, tidak bisa dibatalkan sendiri. Harga paket baru kelipatan Rp1.000. Batas bayar 24 jam.
- **Uang per sesi Hadir:** kolam dan coach masing-masing menerima harganya dibagi jumlah sesi (dibulatkan ke bawah), dipotong PPh final 0,5% (titipan, disetor SPH), sisanya SPH (sudah termasuk PPN 11%, `PLATFORM_TAX_PERCENT`). Tidak hadir: coach 50% dari bagiannya, kolam Rp0, sisanya SPH. Uang SPH ditahan 3 hari (`PLATFORM_HOLD_DAYS`). Contoh hitungan lengkap ada di aturan-bisnis (paket 8 sesi: kolam Rp480.000 + coach Rp800.000, biaya layanan Rp83.200, member bayar Rp1.363.200).
- **Kehadiran:** coach menandai paling lambat 24 jam setelah sesi selesai (lewat itu hanya admin); member bisa melaporkan "Tidak hadir" yang salah dalam 3 hari. Menandai ulang membalik pembukuan sebelumnya.
- **Pencairan:** minimal Rp50.000, saldo terpotong saat pengajuan, diproses manual admin maks 7 hari kerja (ditandai bila lewat). Saldo member hanya untuk membeli paket, tidak bisa dicairkan.
- **Milestone:** wajib catatan tiap 2 sesi Hadir per peserta; pencairan coach ditahan bila terlewat (sesi sejak 1 Okt 2026). Coach baru bisa mengisi milestone setelah ada 1 sesi Hadir.
- **Ganti coach:** diajukan member, diputuskan admin; sisa sesi dihitung ulang dengan harga coach baru (lebih murah = selisih jadi saldo member; lebih mahal = tambah bayar). Ganti coach GRATIS (hari ke-10 tanpa jadwal): ke coach sekolam atau kolam lain sekota, harga sama / lebih murah. Sesi yang sudah lewat tetap dibayar ke coach/kolam lama dengan harga lama. Paket pemberian admin tidak bisa diganti lewat pengajuan.
- **Kota dan kolam:** 10 kota tetap. Coach memilih kolam sendiri. Coach tampil di halaman beli bila punya minimal 4 jam kosong yang bisa dibooking dalam 14 hari. Cari Coach hanya menampilkan coach yang punya kolam aktif, lengkap dengan kota. Kapasitas harian kolam dijaga saat booking (kosong = tanpa batas). Daftar tunggu kota "Kabari saya".
- **Penjaga jadwal harian (cron):** paket aktif dengan sesi belum terjadwal tapi coach tanpa jam kosong. Hari ke-2 coach diingatkan; hari ke-10 member + admin diberi tahu, member boleh ganti coach gratis, coach mendapat 1 catatan pelanggaran per KEJADIAN (kejadian = periode tanpa jadwal di tingkat coach, dikelompokkan 10 hari); 3 pelanggaran dalam 6 bulan = admin menilai (tidak otomatis). Kolam nonaktif atau coach dilepas dari kolam = BUKAN salah coach (tidak dicatat, hitungan hari dimulai ulang saat kolam aktif / coach ditautkan lagi). Paket tidak diperpanjang.
- **Hapus akun member:** diajukan dari Profil, disetujui admin; akun dianonimkan (riwayat uang tetap). Selama pengajuan: beli paket, booking, dan checkout ditolak. Riwayat lonceng ikut dihapus saat anonimisasi.
- **Afiliasi:** komisi sekali per member baru, 50% dari biaya layanan SPH bersih, cair setelah sesi Hadir pertama + 3 hari.
- **Login:** kunci 15 menit setelah salah password (3x per jaringan+akun, 10x akun dari semua jaringan, 20x per jaringan). Admin wajib 2FA (TOTP; rahasia dienkripsi dengan `SECRET_ENCRYPTION_KEY`). Coach dan pemilik kolam wajib mencentang Perjanjian / MOU (versi "3 Oktober 2026 rev.3") sebelum memakai fitur utama.
- **Booking dua langkah (4 Okt):** ketuk jam = memilih; tombol menempel di bawah = booking; lalu layar sukses + kode booking (6 karakter terakhir id). Server (`/api/booking`) tidak berubah dan tetap yang menjaga aturan.
- **Lonceng notifikasi (4 Okt):** tiap kejadian yang sudah memanggil `push.ts` otomatis tersimpan di tabel `InAppNotification` (satu pintu: fungsi `schedule()`), lencana dihitung klien setelah halaman tampil (tanpa query tambahan di render server), halaman `/notifikasi`, dihapus otomatis setelah 90 hari oleh cron.
- Kata-kata yang dilarang di antarmuka (contoh: "diajar", "gak", "nggak") dan istilah baku: lihat `brand-kit/MESSAGING.md` bagian 4 dan `docs/plans/sweeping-kata-2026-10-04.md`.

## 7. Area berisiko tinggi dan pengaman yang sudah ada

Nilai risiko dari AKIBATNYA, bukan besar kodenya: 10 baris di dompet bisa lebih berbahaya daripada 500 baris UI. Wajib kerja ekstra hati-hati (baca kodenya dulu, tulis tes, minta pemeriksa independen) bila menyentuh:

- **Uang** (`src/lib/wallet.ts`, `pricing.ts`, `platform-wallet.ts`, `withdrawal.ts`, `member-wallet.ts`, `wallet-adjustment.ts`, `src/app/api/payment/*`). `WalletTransaction` adalah buku besar (ledger) dan sumber kebenaran; `walletBalance` di Pool/CoachProfile hanya cache. Jangan "memperbaiki" saldo yang tampil tanpa memahami ledger. Pahami: apa yang memicu pengakuan pendapatan, dan nasibnya saat batal / refund / pencairan. Webhook Midtrans menolak SEMUA notifikasi bila kunci server kosong (gagal tertutup).
- **Booking, slot, saldo sesi:** server menjaga aturan, bukan tampilan. Pikirkan dua permintaan bersamaan. Pola yang dipakai: klaim slot dengan conditional update (CAS) di `/api/booking`; pembatalan dengan `SELECT … FOR UPDATE` di `cancel-booking.ts`; `completeCoachChange` mengunci baris User (`FOR NO KEY UPDATE`) sebelum menyentuh Package; kunci `FOR SHARE` pada user di booking supaya anonimisasi akun tidak berpapasan. Batasan DB: `unique(coachId, date, startTime)` sengaja TANPA poolId (satu coach satu slot per jam di seluruh kolam).
- **Login dan hak akses:** anggap API / server action bisa dipanggil langsung tanpa lewat tampilan; tiap aksi mengecek peran, kepemilikan, dan gerbang akun (`mustChangePassword`, `needsTotpSetup`, `needsPartnerAgreement`) di server. `src/proxy.ts` hanya lapisan pertama. Hasil pengujian akses 445 sel: 0 bocor (docs/reviews/2026-10-03-sweeping-sistem-malam.md).
- **Skema database dan data production:** Asisten tidak punya akses DB production. Migrasi baru dijalankan Hadi LEBIH DULU (bagian 9).
- **Penjaga jadwal** (`src/lib/coach-slot-watch.ts`: `countEpisodes`, `coachViolationEpisodes`, `noFault`) dan kapasitas harian (`fullPoolDays`, `isFullDay` dipakai untuk syarat tampil coach dan daftar slot, TIDAK untuk penjaga jadwal: keputusan Hadi 3A).
- Notifikasi pelengkap: gagal kirim TIDAK boleh menggagalkan aksi utamanya (pola `.catch(() => {})` di `notify.ts` / `push.ts`).

## 8. Pengujian dan verifikasi

- Perintah dasar (jalankan dari akar repo):
  - cek penulisan kode: `npx tsc --noEmit` (baca exit code langsung, jangan lewat pipe);
  - tes otomatis: `npx vitest run` (822 tes lulus per 7017f6e; Vitest 4 + Testing Library + jsdom; tes berdampingan dengan berkasnya, `*.test.ts(x)`);
  - versi jadi: `npm run build` (tidak menjalankan migrasi);
  - lint: `npm run lint`.
- **Perubahan logika:** tsc + vitest + build semuanya lulus. **Perubahan tampilan:** verifikasi di browser (HP 375 dan 320, tablet 768, desktop 1280, mode terang dan gelap). Tulis tes untuk fungsi baru di `src/lib/`, tes regresi untuk tiap bug, tes untuk KEDUA cabang tiap kondisi baru dan tiap penanganan galat. Jangan commit kode yang membuat tes lain gagal.
- **Tes balapan (race):** `npm run db:race` (DB lokal 54329, bila gagal "postmaster.pid" jalankan `prisma migrate deploy` ke 54329 langsung), lalu `npm run test:race` (195 tes). Wajib bila menyentuh booking, paket, uang.
- **Uji alur penuh (e2e)** `scripts/e2e.mts`: berjalan di GitHub Actions (`.github/workflows/test.yml`): daftar member → beli paket dari saldo → booking dua langkah → batal → coach menandai Hadir → saldo coach. Untuk menjalankannya lokal: DB `e2e` di 54329 (pengguna dan password uji ada di berkas workflow), `prisma migrate deploy`, `npm run build`, `npx next start -p 3120`, lalu `E2E_BASE=http://localhost:3120 npx tsx scripts/e2e.mts`. Bila alur booking / tombol berubah, perbarui skrip ini.
- **Alat sweeping lokal** (hanya ke localhost; akun uji dummy): `scripts/sweep-halaman.mjs` (kunjungi daftar halaman × lebar layar × tema, tangkapan layar + temuan otomatis; butuh Google Chrome), `uji-hak-akses.mjs` (peran × halaman × API), `uji-formulir.mjs` (kirim formulir), `audit-uang.mjs` (cocokkan ledger; production hanya baca-saja dengan `AUDIT_PROD=1`), `ukur-halaman.mjs` (kecepatan).
- **Aturan sweeping** (dipakai Hadi): "Sweeping UI" = SEMUA halaman × SEMUA peran, tampilan dan tulisan. "Sweeping sistem" = itu + fitur, tombol, hitungan uang, logika, keamanan. Laporan wajib berupa tabel cakupan halaman × peran × (dicek / tidak bisa dicek + alasan). Perbaiki yang mekanis (teks, spasi, warna ke token yang ada) langsung; yang menyentuh uang, login, booking, skema, brand baru, teks hukum: lapor dan tunggu Hadi. Contoh laporan: `docs/reviews/2026-10-03-sweeping-sistem-malam.md`.
- **WAJIB (keputusan Hadi 4 Okt):** pekerjaan yang mengubah uang, booking/slot, login/hak akses, atau skema database harus diperiksa PIHAK KEDUA berkonteks segar (sesi atau model lain yang tidak ikut menulis kodenya; tugasnya mencari cacat, bukan membenarkan) ditambah tes, SEBELUM dikirim ke GitHub. Tulis hasil pemeriksaan kedua di laporan ke Hadi. Pemeriksa tidak boleh model yang lebih lemah dari penulisnya. Mengaku "sudah aman" tanpa pemeriksa kedua untuk area ini tidak dihitung selesai.

**Lingkungan lokal** (nyalakan lagi bila laptop tidur):
- `npm run db:dev` (DB dev 54330), `node scripts/qa-storage.mjs` (storage 54331), `npm run db:race` (54329). `npm run db:dev:sync` menyalin data production ke dev lewat penyanitasi `scripts/dev-db-sanitize.mjs` (tabel `InAppNotification` sengaja tidak disalin karena memuat nama dan nominal).
- Server dev: `npm run dev` (port 3000). Server versi jadi: `npx next start -p 3110` (bangun ulang dulu).
- Akun uji lokal dummy: admin 089900000001 (2FA; kode lewat `scripts/qa-otp.mts`), coach 089900000004 (ada satu coach uji lain, lihat catatan lingkungan di docs/STATUS.md), pemilik kolam 089900000002, member 089977700099. Password uji dev ada di `scripts/dev-db-sync.mjs` (bukan password production).

## 9. Deploy dan migrasi (aturan keras)

- Deploy otomatis ke Vercel tiap push ke `main`. GitHub Actions "Test" (tes + build + e2e) harus hijau; periksa hasilnya setelah push (`gh run list`).
- **Ada berkas baru di `prisma/migrations/` sejak `origin/main`? BERHENTI.** Hadi menjalankan migrasi ke database production LEBIH DULU, baru kode dikirim. Kode yang memakai kolom/tabel baru sebelum migrasi = login atau fitur rusak. Perintah yang Hadi jalankan (dari folder yang SUDAH memuat berkas migrasinya, jadi gabungkan ke `main` lokal dulu, jangan push):
  ```bash
  set -a; source .env.prod; set +a; DATABASE_URL=$PROD_DIRECT_URL DIRECT_URL=$PROD_DIRECT_URL npx prisma migrate deploy
  ```
  Pernah salah: Hadi menjalankannya di folder tanpa berkas migrasi dan hasilnya "No pending migrations" (menyesatkan). Pastikan hasilnya menyebut migrasi barunya "applied".
- Migrasi harus murni penambahan bila memungkinkan. Jangan memakai `prisma migrate reset` atau `migrate dev` yang bisa mereset database; buat migrasi dari selisih skema lalu `migrate deploy` ke DB lokal.
- Commit dan push boleh selama masih tahap pengembangan (izin Hadi 1 Okt 2026), dengan syarat tsc, vitest, dan build lulus (perubahan dokumen saja tidak perlu build) dan tidak ada migrasi baru. Kumpulkan push di akhir satu batch kerja. **Setelah Hadi bilang iklan SPH sudah jalan: konfirmasi dulu sebelum tiap push.** Sebelum commit/push: cek cabang aktif dan apakah ada merge/rebase yang berjalan.
- Akhir pesan commit memakai atribusi yang berlaku di alat yang kamu pakai; jangan menimpa riwayat orang lain (tanpa `--force`).

## 10. Desain dan tulisan

- Brand: Lime Pulse (charcoal + lime). Acuan: `src/app/brandguideline/` (isi di `data.ts`), `brand-kit/` (warna `colors/palette.css`, font, logo), `brand-kit/MESSAGING.md` (aturan tulisan). Font: Sora (judul), Plus Jakarta Sans (isi).
- **Token** ada di `src/app/globals.css` (terang + gelap): `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `brand-50/100/500/600/700`, `success/warning/danger`, token `hero*` (kartu utama gelap: charcoal di terang, lime di gelap), token `fixed-*` (warna tetap yang tidak ikut tema). **Tombol utama = charcoal (`brand-600`), BUKAN lime.** Lime hanya untuk kartu gelap, aksen kecil, dan layar sukses (keputusan Hadi 4 Okt).
- Tulisan: "kamu", bahasa Indonesia baku, tanpa kata santai / daerah, tombol berupa kata kerja, rupiah "Rp 1.000". Nama menu = judul halaman. Hindari kesan tulisan AI.
- UI: target sentuh minimal 44px di HP (`max-lg:min-h-[44px]`), tanpa halaman melebar ke samping di 320px, hormati `prefers-reduced-motion`, kontras minimal AA. Animasi: HP ringan (muncul saat masuk layar), desktop lebih kaya; landing untuk iklan Meta (mayoritas HP) mengutamakan kecepatan dan kejelasan. Indikator memuat tetap orb (keputusan Hadi 18 Sep).
- Satu basis kode responsif untuk HP dan desktop. Desain terbaru dari Claude Design (4 Okt) dan analisis perbedaan alurnya: `docs/designs/terapkan-claude-design.md`, `docs/designs/analisis-alur-desain-baru.md`, `docs/designs/halaman-terdampak-desain-baru.md`, sumber di `docs/designs/claude-design-2026-10-04/`. Prinsip Hadi: suka tampilannya, JANGAN mengubah alur aplikasi (satu pengecualian yang disetujui: booking dua langkah).

## 11. Status terkini (4 Okt 2026 siang)

**Live (7017f6e; GitHub Test hijau, Vercel sukses):** semua pekerjaan 2–4 Okt: harga dari coach, kota + coach memilih kolam, penjaga jadwal harian, perjanjian rev.3, sweeping sistem (474 kunjungan, 0 bocor, audit uang cocok), 9 keputusan 3 Okt malam, sweeping kata ±300 potongan, rombak UI (kartu utama gelap, saldo, segmen sisa sesi, chip peserta, batang terisi kolam, tombol Hadir di dasbor coach), booking dua langkah, lonceng notifikasi (migrasi `20261004120000_notifikasi_lonceng` sudah dijalankan di production). Rincian: `docs/STATUS.md`.

**Pertanyaan terbuka untuk Hadi (4 Okt):**
1. Member minta hapus akun, lalu mengajukan ganti coach: ditolak? (rekomendasi: tolak)
2. Tombol "Edit" diganti "Ubah" di semua peran? (rekomendasi: ya)
3. Lonceng admin/coach menyimpan nama member yang akunnya sudah dihapus sampai 90 hari: terima atau ikut dibersihkan? (rekomendasi: terima)
4. Tombol beli paket menempel di halaman Paket: perlu bentuk lain atau cukup tautan "Beli paket baru"? (rekomendasi: cukup tautan)

**Kerjaan berikutnya:** menjawab pertanyaan di atas, sapu halaman lain yang ikut kerangka + ukur kecepatan sebelum/sesudah, tes otomatis untuk logika pilih-jam di papan booking, P8 (reset password lewat email) setelah email production terbukti. Daftar lengkap: `docs/backlog/sph-backlog-gabungan-2026-09-29.md` (bagian paling bawah).

**Tugas yang hanya bisa dikerjakan Hadi:** cek Vercel > Logs `/api/cron/harian` setelah 06.00 WIB dan Settings > Functions > Fluid Compute; 14 Okt jalankan ulang `isi-jadwal-dummy --apply` di production (jam kosong contoh habis ±13 Okt); `akhiri-paket-lama` di production; tombol GitHub Actions "Uji Pulih Backup"; `DATABASE_CA_CERT` di Vercel; event Meta; uji di HP asli + Safari dan satu pembayaran sungguhan sampai paket aktif; akuntan (PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus). Asisten tidak mengerjakan ini.

**Belum terverifikasi:** HP asli dan Safari, push, unggah file ke storage asli, email, pembayaran asli sampai paket aktif, buku besar production, halaman login production, cron harian di Vercel (belum terbukti jalan), isi lonceng dengan akun asli di production.

**Ditahan atas perintah Hadi (jangan dimulai sendiri):** Payouts/Midtrans Iris, fitur loket, komisi bertingkat, dan item "menunggu pemicu" lain: Hadi yang bilang bila saatnya.

## 12. Jebakan yang sudah pernah terjadi (belajar dari sini)

- Format rupiah diubah tanpa spasi lalu dikembalikan; format tanggal UTC dipakai untuk titik waktu (tanggal mundur sehari).
- Menyimpan hasil `auth()` per permintaan: dibatalkan, data basi setelah ganti password.
- Aturan kapasitas ditaruh di penjaga jadwal: dikembalikan (keputusan Hadi 3A).
- Tombol "Isi catatan milestone" menggantikan "Update milestone": dikembalikan, karena disebut di perjanjian coach rev.3 (menyentuh teks hukum).
- Halaman daftar melebar 394px karena grid kolom otomatis; perbaikan `grid-cols-[minmax(0,1fr)]`.
- Dialog konfirmasi di dalam `<form>` tanpa `type="button"`: tombol Batal bisa ikut mengirim form (di tombol Hadir ini pernah hampir mencatat "Tidak hadir" tanpa sengaja). Letakkan dialog di luar form.
- Elemen `sticky` dengan z-index sama dengan popup kalender menutupi kalender di HP.
- Uji alur penuh (e2e) merah setelah booking menjadi dua langkah, karena skrip masih mengklik tombol "Booking" satu ketukan. Ubah alur UI = perbarui `scripts/e2e.mts`.
- Migrasi dijalankan dari folder tanpa berkas migrasinya: "No pending migrations" menyesatkan.
- Tes yang mengklasifikasikan semua tabel (`scripts/dev-db-sanitize.test.mjs`) gagal bila tabel baru tidak didaftarkan di `scripts/dev-db-sanitize.mjs`.
- Notifikasi pembatalan oleh admin saat anonimisasi membuat riwayat lonceng baru untuk akun yang baru dihapus: dibersihkan lagi setelah pembatalan.

## 13. Peta dokumen

- `docs/STATUS.md` (maks 60 baris; dimuat otomatis di awal sesi Claude): sampai mana, proses, tugas Hadi. Perbarui di akhir tiap batch.
- `docs/KEPUTUSAN.md`: arsip keputusan Hadi dan hal sensitif bertanggal. Tambahkan 1–2 baris bila Hadi membuat keputusan baru.
- `docs/aturan-bisnis-saat-ini.md`: aturan bisnis (satu sumber).
- `docs/cakupan-halaman.md`: daftar halaman per peran + status uji.
- `docs/backlog/`: daftar kerjaan (bagian paling bawah = terbaru).
- `docs/designs/`: rancangan (kota-coach-kolam, harga-dari-coach, rombak-ui-aplikasi, terapkan-claude-design, analisis-alur-desain-baru, dll.). Yang bertanda lama (marketplace-pivot, simulasi-pendapatan-kolam) tidak berlaku.
- `docs/reviews/`: laporan sweeping dan pemeriksaan (bukti hasil uji).
- `docs/plans/`: dokumen tugas mekanis dengan potongan LAMA/BARU persis (format delegasi).
- `docs/legal/`: draf perjanjian, MOU, S&K (teks hukum: JANGAN diubah tanpa Hadi; versi aktif ada di kode halaman legal).
- `docs/backup.md`: pencadangan DB + storage (GitHub Actions). `docs/midtrans-onboarding/`: dokumen onboarding Midtrans.
- `brand-kit/MESSAGING.md`: standar tulisan. `TESTING.md`, `README.md` (ringkasan; bukan acuan aturan bisnis).

## 14. Kebiasaan kerja yang diharapkan dari kamu

1. Urutan: paham → periksa → nilai risiko → kerjakan → uji → verifikasi → jelaskan. Jangan lewati "paham" karena perubahannya tampak jelas.
2. Perubahan terkecil yang aman; refactor lain jangan. Masalah yang berkaitan langsung disebutkan.
3. Akar masalah, bukan gejala: cari semua pemanggil fungsi yang disentuh dan perbaiki fungsi bersamanya sekali.
4. Tes dulu untuk bug (reproduksi → perbaiki → pastikan reproduksi hilang).
5. Perbarui `docs/STATUS.md` dan `docs/KEPUTUSAN.md` saat satu bagian kerjaan selesai atau Hadi memutuskan sesuatu.
6. Jelaskan risiko dengan bahasa bisnis, contoh: "ini menyentuh catatan uang asli; kalau salah, saldo coach atau kolam ikut salah".
7. Bila ragu tentang aturan bisnis: berhenti dan tanya. Menebak aturan uang atau akses lebih mahal daripada bertanya.
