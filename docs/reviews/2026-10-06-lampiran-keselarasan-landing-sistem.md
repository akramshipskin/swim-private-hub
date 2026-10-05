# Keselarasan landing page vs sistem SPH (6 Okt 2026)

Cara kerja: HANYA membaca kode dan dokumen (tidak ada server dijalankan, tidak ada data production dibuka, tidak ada file repo diubah). Semua temuan di bawah sudah dicek dengan membaca berkas aslinya; nomor baris = keadaan cabang main lokal saat ini (ada 8 berkas belum di-commit di area ganti coach/booking yang TIDAK saya sentuh, lihat git status).

Acuan: (1) kode `src/lib/policy.ts`, `src/lib/pricing.ts` + logika, (2) `docs/aturan-bisnis-saat-ini.md`, (3) `docs/KEPUTUSAN.md`, (4) `brand-kit/MESSAGING.md`, (5) dokumen lama (diabaikan).

---

## 1. Kamus istilah baku (disimpulkan)

| Konsep | Istilah baku | Sumber | Catatan |
|---|---|---|---|
| Pengguna pembeli | **Member** (orang tua / pemilik akun) | MESSAGING §4; `nav-links.ts:12` roleLabel | Landing memakai label tab "Orang tua / peserta" (wajar untuk jualan) |
| Orang yang les | **Peserta** | MESSAGING §4; S&K Definisi | "anak" hanya bila memang khusus anak |
| Pengajar | **Coach** | MESSAGING §4 | "pelatih" hanya di URL `/pelatih/[id]` dan teks hukum (S&K Definisi) |
| Pemilik kolam | **Pemilik kolam** | MESSAGING §4 | roleLabel/panduan pakai "Pemilik Kolam" (huruf besar K) untuk label peran |
| Kolam | **Kolam mitra** / Kolam | MESSAGING §4 | "Pool" tidak muncul di teks pengguna (dicek) |
| Paket | **Paket** 4 / 8 sesi; **Sesi coba** | `pricing.ts:7-15` | "Kelas" hanya dipakai dalam "bukan kelas gabungan" (benar) |
| Satuan les | **Sesi** (60 menit) | S&K 2.6; `coach/jadwal/actions.ts:75` (slot per jam) | "pertemuan" hanya di S&K Definisi (hukum) |
| Memesan jadwal | **Booking** | MESSAGING §4 | S&K memakai "Pemesanan" (hukum, boleh) |
| Membatalkan | **Batalkan**, **jatah batal** | MESSAGING §4 | 1 sisa "kuota" di pesan galat server (temuan 26) |
| Kehadiran | **Hadir / Tidak Hadir** (H kapital) | MESSAGING §4 | 1 tombol "Tidak hadir" (temuan 28) |
| Catatan coach | **Catatan perkembangan (milestone)**; tombol app "Update milestone" | KEPUTUSAN 4 Okt (dipertahankan karena di perjanjian) | Landing & panduan memakai "catatan perkembangan (milestone)" — konsisten |
| Uang member | **Saldo** (member: "Saldo kamu", tidak bisa dicairkan) | S&K 4.5; `member/paket/page.tsx:300` | |
| Uang mitra | **Bagian kolam / bagianmu**, **Bagi hasil** (admin) | MESSAGING §4 | |
| Tarik uang | **Pencairan / Cairkan saldo** | MESSAGING §4 | |
| Biaya platform | **Biaya layanan SPH** (6,5%, "di bawah 7%") | `pricing.ts:20-21` | Konsisten di landing, panduan, app, S&K |
| Jam yang dibuka coach | **Jam kosong**; tombol teknis "Tambah Slot" | MESSAGING §4 | 2 sisa "slot" di teks server/notifikasi (temuan 26-27) |
| Halaman utama per peran | **Dashboard** (menu & judul app) | `nav-links.ts` | Dokumen internal & perjanjian coach (hukum) menulis "dasbor"; MESSAGING tidak mengatur. Landing tidak memakai keduanya. Tidak dianggap temuan |
| Merek | **Swim Private Hub**; singkatan **SPH** | KEPUTUSAN 2 Okt (4) | Landing tidak pernah memperkenalkan "SPH = Swim Private Hub" (temuan 32) |
| Rupiah | `Rp 1.000` (spasi) | MESSAGING §5; `format.ts:57` (Intl id-ID) | Landing & app konsisten; teks hukum memakai `Rp60.000` (hukum, tidak disentuh) |
| Kontak | WA +62 821-1717-3124, hello@swimprivatehub.biz.id | `whatsapp.ts:1`, `email.ts:9` | Sama di landing, S&K, Privasi, Pengembalian, Cookie |

### Pemakaian istilah: landing vs sistem

| Istilah | Landing / publik | Sistem (app) | Selaras? |
|---|---|---|---|
| Member | "Daftar sebagai member", FAQ | menu, roleLabel | Ya |
| Peserta vs anak | campur: "1 coach, 1 anak", "Untuk 1 anak" | "Peserta", "Kamu sendiri" | **Tidak** (temuan 19) |
| Coach | Ya | Ya | Ya |
| Booking | Ya | Ya | Ya |
| Jatah batal | Ya | Ya; server "kuota" | Hampir (temuan 26) |
| Hadir/Tidak Hadir | Ya | Ya; 1 tombol "Tidak hadir" | Hampir (temuan 28) |
| Jam kosong vs slot | "jam kosong" | push "Slot kamu dibooking" | Hampir (temuan 27) |
| Masa berlaku | "60 hari / 90 hari" | "Berlaku 60 hari" | Ya; panduan & asisten chat: "2 bulan / 3 bulan" (temuan 9, 23) |
| Menu Riwayat | "menu Riwayat" | "Riwayat Booking" (HP: "Riwayat") | Hampir (temuan 17) |
| Daftar Kolam | "halaman Daftarkan Kolam" | judul "Daftar Kolam" | Tidak (temuan 25) |

---

## 2. Tabel klaim & angka

| # | Teks persis + lokasi | Sumber kebenaran | Status |
|---|---|---|---|
| K1 | "biaya layanan SPH (di bawah 7%)" `landing-view.tsx:109`, `:191`, `:225` | `pricing.ts:20-21` (650 bps, kunci 690) | Cocok |
| K2 | "Paket 4 sesi berlaku 60 hari, paket 8 sesi berlaku 90 hari" `landing-view.tsx:109` | `pricing.ts:11` | Cocok |
| K3 | "(lebih hemat per sesi)" `landing-view.tsx:109` | `pricing.ts:100-104` (hemat bisa 0%); tidak ada aturan yang memaksa paket 8 lebih murah | **TIDAK COCOK** (temuan 12) |
| K4 | "satu kali per peserta, berlaku 7 hari", "tidak bisa dibatalkan sendiri" `landing-view.tsx:113`, `landing-sections.tsx:158` | `pricing.ts:12,16-17`; S&K 2.9 | Cocok |
| K5 | "jatah batal 2 kali ... 4 kali, paling lambat 2 jam" `landing-view.tsx:133` | `pricing.ts:15`, `policy.ts:5` | Cocok |
| K6 | "laporkan ... paling lambat 3 hari" `landing-view.tsx:133`; panduan `:85` | `policy.ts:42` | Cocok |
| K7 | "Satu sesi berlangsung 60 menit" `landing-view.tsx:129`, `:357`; `landing-sections.tsx:142` | S&K 2.6; slot dipecah per jam `coach/jadwal/actions.ts:75` | Cocok |
| K8 | "Tiket masuk termasuk ... 1 peserta, 1 pendamping, dan coach" `landing-sections.tsx:138`, `landing-view.tsx:217` | aturan-bisnis "Harga dan paket"; MOU 2.2 | Cocok |
| K9 | "Coach yang membatalkan sesi otomatis mengembalikan sisa sesi ... notifikasi" `landing-view.tsx:137` | `cancel-booking.ts:173-174` | Cocok |
| K10 | "Ajukan ganti coach dari menu Paket; ... setelah disetujui admin ... lebih murah selisih ke saldo, lebih mahal menambah" `landing-view.tsx:145` | `member/paket/page.tsx:232-274`; S&K 3.9 (hanya kolam yang sama) | Cocok sebagian (tidak menyebut "kolam yang sama" & saldo tidak bisa dicairkan) — temuan 18 |
| K11 | "Badge Bersertifikat hanya tampil setelah ... disetujui admin; SPH tidak mengonfirmasi ke lembaga" `landing-view.tsx:149` | KEPUTUSAN 2 Okt malam #4 | Cocok |
| K12 | "Sisa sesi hangus ..." `landing-view.tsx:157` | S&K 2.7 | Cocok |
| K13 | "Tandai kehadiran paling lambat 24 jam" `landing-view.tsx:175` | `policy.ts:37` | Cocok |
| K14 | "Tidak Hadir: kamu tetap mendapat 50%" `landing-view.tsx:175`, `landing-sections.tsx:224,269` | `policy.ts:51` | Cocok |
| K15 | "PPh final 0,5% ... kecuali surat pernyataan omzet di bawah Rp 500 juta" `landing-view.tsx:175`,`:221` | `pricing.ts:24`; MOU 5.12 | Cocok |
| K16 | "pencairan minimal Rp 50.000 ... paling lambat 7 hari kerja" `landing-view.tsx:179`; panduan `:134,:167` | `policy.ts:9,20` | Cocok |
| K17 | "Pencairan diproses manual oleh admin, secepatnya, dan statusnya terlihat" `landing-sections.tsx:244` | KEPUTUSAN 2 Okt malam #5 (janji disamakan "secepatnya, paling lambat 7 hari kerja") | Tidak lengkap (temuan 21) |
| K18 | "Mulai 1 Oktober 2026, catatan ... setiap 2 sesi Hadir ... pencairan ditahan" `landing-view.tsx:203`, `landing-sections.tsx:307-310` | `policy.ts:62-63` | Cocok |
| K19 | "Bagian kolam Rp 60.000 masuk saldo Rp 59.700 setelah PPh Rp 300" `landing-sections.tsx:334` | aturan-bisnis contoh; MOU 5.4 | Cocok |
| K20 | "Kolam memasang harga tiket ... coach memasang harga jasa" `landing-view.tsx:187,217` | `pricing.ts:1-4`; aturan-bisnis | Cocok |
| K21 | "Kamu bisa membuka jam kosong untuk les privat" (ke pemilik kolam) `landing-view.tsx:213` | Hanya coach yang membuat jadwal (`coach/jadwal/actions.ts`; tidak ada pembuatan slot di `/pool`) | **TIDAK COCOK** (temuan 4) |
| K22 | "Coach ... bisa diafiliasikan ke kolam kamu" `landing-view.tsx:229` | aturan-bisnis "coach memilih sendiri kolam; kolam tidak perlu menyetujui"; MOU 3.1-3.3 | **TIDAK COCOK** (temuan 5) |
| K23 | "diperiksa paling lambat 1×24 jam ... langsung bisa menerima booking" `landing-view.tsx:233` | Tidak ada di kode/aturan/KEPUTUSAN; `pending-approval-screen.tsx:30-32` tanpa batas waktu; booking baru mungkin setelah coach memilih kolam + buka jadwal (`partner-steps.tsx:15`) | **TIDAK COCOK** (temuan 3) |
| K24 | Logo Visa, Mastercard, JCB di footer `landing-payments.ts:22-24` | `midtrans-methods.ts:1-15` (kartu tidak ditawarkan); S&K 4.1 "kartu kredit tidak diterima" | **TIDAK COCOK** (temuan 1) |
| K25 | Logo OVO, DANA `landing-payments.ts:14-15` | `midtrans-methods.ts` hanya gopay, shopeepay, QRIS, VA | Tidak bisa dipastikan (bisa dibayar lewat QRIS; tidak ada pilihan langsung) — temuan 38 |
| K26 | "anak mendapat sertifikat setiap naik level" `landing-sections.tsx:150`; "sertifikat bertanda tanganmu" `:240` | `milestone.ts:74-87` (sertifikat hanya bila ≥1 butir dicapai bersama coach); tanda tangan hanya bila coach mengunggahnya (`sertifikat/.../page.tsx:53-107`) | Cocok sebagian (temuan 22) |
| K27 | "Coach mencatat ... dari mengapung sampai gaya bebas" `landing-sections.tsx:150` | butir milestone di migrasi `20260929101427_milestone` | Cocok |
| K28 | "Keselamatan ... petugas penyelamat, P3K, rambu kedalaman, kebersihan air" `landing-sections.tsx:154` | S&K 6.2; MOU 8.1 | Cocok |
| K29 | "Jadwal, fasilitas kolam, dan file sertifikat terbuka setelah kamu mendaftar" `landing-view.tsx:497-498` | Kartu kolam landing menampilkan fasilitas ke publik (`landing-view.tsx:459-468`) | **TIDAK COCOK** (temuan 20) |
| K30 | "Perkembangan tercatat setiap sesi" (halaman Masuk) `(auth)/login/login-form.tsx:96` | `policy.ts:62` (wajib tiap 2 sesi Hadir) | **TIDAK COCOK** (temuan 16) |
| K31 | Panduan "Empat peran, empat tampilan" `panduan-view.tsx:316` | hanya 3 panduan (`panduan-view.tsx:46-173`; tab Admin dihapus KEPUTUSAN #23) | **TIDAK COCOK** (temuan 8) |
| K32 | Panduan "Jam kosong punya tombol Booking" `panduan-view.tsx:74` | booking dua langkah `booking-board.tsx:140`, `booking-labels.ts:32`, `booking-success.tsx:72` | **TIDAK COCOK** (temuan 7) |
| K33 | Panduan "paket 4 sesi (berlaku 2 bulan) dan 8 sesi (berlaku 3 bulan)" `panduan-view.tsx:38` | `pricing.ts:11` (60/90 hari) | Hampir (temuan 23) |
| K34 | Asisten chat: "Ganti coach di tengah paket hanya lewat pengajuan ke admin" `chat-ai.ts:29` | S&K 3.10; `member/paket/page.tsx:178-230` (ganti tanpa biaya hari ke-10 tanpa admin) | **TIDAK COCOK** (temuan 9) |
| K35 | "Tidak ada biaya pendaftaran maupun biaya bulanan" `landing-view.tsx:191,225` | MOU 1.5 | Cocok |
| K36 | "N jam kosong 7 hari ke depan" (tampil bila ≥5) `landing-view.tsx:428-431` | KEPUTUSAN #17; `page.tsx:87-94,143` | Cocok |
| K37 | "N member punya paket di sini" (tampil bila ≥15) `landing-view.tsx:423-426` | KEPUTUSAN #3 | Cocok |
| K38 | Strip angka hanya akun asli, tampil bila member ≥20 `landing-view.tsx:244,252` | KEPUTUSAN 2 Okt sore | Cocok |
| K39 | "Harga paket ... N sesi mulai Rp ..." kartu kolam `landing-view.tsx:452` | `page.tsx:111-142` (hanya coach yang lolos 4 jam/14 hari) | Cocok |
| K40 | "Satu akun ... banyak peserta" | `dependents.ts:20` (ada batas MAX_DEPENDENTS) | Cocok (batas tidak disebut, wajar) |
| K41 | Kontak WA/email/alamat di footer & 4 halaman hukum | `whatsapp.ts:1`, `email.ts:9`, `business.ts:2` | Cocok |
| K42 | Tagline/headline/subheadline landing, panduan, meta, manifest, OG | MESSAGING §2 | Cocok untuk landing/panduan/meta/manifest/gambar OG; **tidak** untuk halaman masuk/daftar (temuan 30) & alt OG (temuan 29) |
| K43 | Landing tidak menyebut 10 kota | `cities.ts:4-15`; aturan-bisnis "Kota" | Blindspot (temuan 13) |
| K44 | Landing tidak menyebut ganti coach tanpa biaya hari ke-10 | S&K 3.10; aturan-bisnis | Blindspot (temuan 14) |
| K45 | Landing tidak menyebut batas bayar 24 jam | `policy.ts:15` | Blindspot kecil (temuan 13, catatan) |

---

## 3. Temuan bernomor

Ringkasan jumlah (38 temuan, nomor 1-38): **BERAT 2**, **SEDANG 17** (nomor 3-18 dan 34), **RINGAN 19** (nomor 19-33 dan 35-38), plus 3 catatan "tidak bisa dipastikan / info" (nomor 39-41, tidak dihitung). Jenis: **MEKANIS 29**, **BUTUH KEPUTUSAN HADI 7** (nomor 3, 12, 13, 14, 30, 31, 38), **TEKS HUKUM 2** (nomor 34, 35).

### BERAT

**1. Footer landing menampilkan logo kartu kredit padahal kartu tidak diterima** — BERAT · MEKANIS
- Lokasi: `src/app/landing-payments.ts:22-24` (dipakai `landing-view.tsx:583-607`)
- Kutipan: `{ label: "Visa", ... }, { label: "Mastercard", ... }, { label: "JCB", ... }` di bawah tulisan "Pembayaran diproses lewat Midtrans"
- Kenapa: `src/lib/midtrans-methods.ts:1-15` sengaja tidak menawarkan kartu (keputusan Hadi 2 Okt); S&K 4.1 menulis "kartu kredit tidak diterima". Calon member yang mau bayar pakai kartu akan kecewa di layar bayar.
- Usulan: hapus tiga baris itu. LAMA: `{ label: "Visa", logo: "/images/payments/visa.svg" },` / `{ label: "Mastercard", logo: "/images/payments/mastercard.svg" },` / `{ label: "JCB", logo: "/images/payments/jcb.svg" },` → BARU: (dihapus). Komentar file juga menyebut "Metode pembayaran yang tersedia lewat Midtrans" — tetap benar setelah dihapus.

**2. Tangkapan layar produk di landing memperlihatkan fitur yang sudah dihapus dan tampilan lama** — BERAT · MEKANIS (perlu tangkapan layar baru, bukan teks)
- Lokasi: `public/images/landing/produk-cari-coach.png` (dipakai di hero desktop `landing-view.tsx:331` dan bagian orang tua `landing-sections.tsx:163`), `public/images/landing/produk-booking.png` (`landing-view.tsx:340`, `landing-sections.tsx:164`). Dibuat 29 Sep.
- Kutipan di gambar Cari Coach: "Paket berlaku di kolam tempat dibeli — mau ke kolam lain, beli 1 sesi di sana lewat menu Booking."
- Kenapa: beli 1 sesi eceran sudah DIHAPUS (aturan-bisnis "Tidak berlaku lagi"; `chat-ai.ts:28`). Gambar Booking memperlihatkan tombol "Booking" per jam (satu ketuk), sedangkan sekarang booking dua langkah (KEPUTUSAN 4 Okt). Keduanya juga memakai menu tab atas lama, bukan bilah bawah 4 ikon + Lainnya. Gambar Perkembangan (`produk-milestone.png`) isinya masih benar, hanya bilah menunya lama.
- Usulan: ambil ulang 3 tangkapan layar dari aplikasi sekarang (akun contoh, ukuran HP 390×844) dengan nama file yang sama, sehingga kode tidak berubah. Caption di `landing-sections.tsx:163-165` tetap berlaku.

### SEDANG

**3. Janji "1×24 jam" dan "langsung bisa menerima booking" untuk kolam** — SEDANG · BUTUH KEPUTUSAN HADI (janji ke mitra)
- Lokasi: `src/app/landing-view.tsx:233`
- Kutipan: "Setelah kolam disetujui admin (diperiksa paling lambat 1×24 jam), kolam kamu langsung bisa menerima booking."
- Kenapa: batas 1×24 jam tidak ada di kode, aturan bisnis, maupun KEPUTUSAN; layar setelah daftar (`components/pending-approval-screen.tsx:30-32`) tidak menyebut batas waktu. "Langsung bisa menerima booking" juga tidak benar: booking baru mungkin setelah coach memilih kolam itu dan membuka jadwal di jam buka (`components/partner-steps.tsx:15`; dashboard kolam `pool/dashboard/page.tsx:94` "Belum ada coach di kolammu").
- Usulan (bila Hadi tidak mau menjanjikan waktu): LAMA "Setelah kolam disetujui admin (diperiksa paling lambat 1×24 jam), kolam kamu langsung bisa menerima booking." → BARU "Setelah kolam disetujui admin, coach di kotamu bisa memilih kolammu dan membuka jadwal di jam bukanya; booking masuk dari jadwal itu."

**4. FAQ kolam: pemilik kolam disebut "membuka jam kosong"** — SEDANG · MEKANIS
- Lokasi: `src/app/landing-view.tsx:213`
- Kutipan: "Kamu bisa membuka jam kosong untuk les privat satuan (1 coach, 1 peserta, bukan sewa club)"
- Kenapa: hanya coach yang membuka jadwal (`coach/jadwal/actions.ts`; tidak ada fitur buat jadwal di area `/pool`). Pemilik kolam mengisi jam buka dan kapasitas harian.
- Usulan: LAMA "Kamu bisa membuka jam kosong untuk les privat satuan (1 coach, 1 peserta, bukan sewa club), dan setiap sesi" → BARU "Jam kosong kolammu terisi les privat satuan (1 coach, 1 peserta, bukan sewa club) yang jadwalnya dibuka coach di dalam jam buka kolam, dan setiap sesi"

**5. FAQ kolam: coach "diafiliasikan" ke kolam (model lama)** — SEDANG · MEKANIS
- Lokasi: `src/app/landing-view.tsx:229`
- Kutipan: "Tidak harus. Coach yang sudah terdaftar di platform bisa diafiliasikan ke kolam kamu; kamu tetap bisa memakai coach sendiri kalau punya."
- Kenapa: aturan sekarang = coach memilih sendiri kolamnya, kolam tidak menyetujui (aturan-bisnis bagian Kota; MOU 3.1-3.2); coach milik kolam harus daftar lewat formulir coach biasa (MOU 3.3). Kata "diafiliasikan" juga rancu dengan "kode afiliasi".
- Usulan: BARU "Tidak harus. Coach yang sudah disetujui SPH memilih sendiri kolam tempat mengajar, termasuk kolammu. Punya coach sendiri? Minta ia mendaftar lewat halaman Daftar Coach, lalu memilih kolammu."

**6. Tautan "Hubungi kami" di footer mengirim pesan khusus pemilik kolam ke semua pengunjung** — SEDANG · MEKANIS
- Lokasi: `src/app/landing-view.tsx:622` (memakai `OWNER_WA_LINK`, `:51`), isi pesan `src/lib/whatsapp.ts:48-51`
- Kutipan pesan: "Halo, saya punya kolam renang dan tertarik bergabung menjadi kolam mitra Swim Private Hub. Boleh minta info lebih lanjut?"
- Kenapa: orang tua yang menekan "WhatsApp +62 821-1717-3124" di bagian "Hubungi kami" mendapat draf pesan seolah ia pemilik kolam.
- Usulan: footer memakai `buildAdminWaLink("Halo Admin Swim Private Hub, saya ingin bertanya.")` (fungsi sudah ada, `whatsapp.ts:3`). Tautan khusus kolam di `:509` dan `:522` tetap.

**7. Panduan member: langkah booking masih satu ketuk** — SEDANG · MEKANIS
- Lokasi: `src/app/panduan/panduan-view.tsx:74-75`
- Kutipan: "Jam kosong punya tombol Booking. Jam yang sudah diambil member lain otomatis terkunci." / "Sisa sesi berkurang 1, dan coach mendapat notifikasi kalau notifikasinya sudah aktif."
- Kenapa: booking dua langkah (KEPUTUSAN 4 Okt; `booking-labels.ts:32`, `booking-success.tsx:72`).
- Usulan: LAMA `{ title: "Pilih coach & jam", body: "Jam kosong punya tombol Booking. Jam yang sudah diambil member lain otomatis terkunci." }` → BARU `{ title: "Pilih jam", body: "Ketuk jam kosong coach paketmu, lalu tekan tombol Booking di bawah layar. Jam yang sudah diambil member lain otomatis terkunci." }`; LAMA `{ title: "Selesai", body: "Sisa sesi berkurang 1, dan coach mendapat notifikasi kalau notifikasinya sudah aktif." }` → BARU `{ title: "Selesai", body: "Muncul layar berhasil dengan kode booking. Sisa sesi berkurang 1, dan coach mendapat notifikasi kalau notifikasinya sudah aktif." }`

**8. Panduan: "Empat peran" padahal tinggal tiga** — SEDANG · MEKANIS
- Lokasi: `src/app/panduan/panduan-view.tsx:316`
- Kutipan: "Empat peran, empat tampilan"
- Kenapa: tab Admin di panduan publik sudah dihapus (KEPUTUSAN 2 Okt malam #23); `GUIDES` berisi 3.
- Usulan: LAMA "Empat peran, empat tampilan" → BARU "Tiga peran, tiga tampilan"

**9. Asisten chat bantuan memberi aturan lama** — SEDANG · MEKANIS
- Lokasi: `src/lib/chat-ai.ts:26`, `:29`, `:33`
- Kutipan: "isi 4 sesi (berlaku 2 bulan) atau 8 sesi (berlaku 3 bulan)"; "Ganti coach di tengah paket hanya lewat pengajuan ke admin dengan alasan yang jelas."; "Pencairan minimal Rp ..., diproses admin."
- Kenapa: asisten ini menjawab member/coach langsung. Ganti coach tanpa biaya (hari ke-10, tanpa admin) ada di S&K 3.10 dan `member/paket/page.tsx:178-230`; masa berlaku resmi 60/90 hari; janji pencairan "paling lambat 7 hari kerja".
- Usulan: `:26` "berlaku 2 bulan" → "berlaku 60 hari", "berlaku 3 bulan" → "berlaku 90 hari"; `:29` → "Ganti coach di tengah paket lewat pengajuan ke admin dengan alasan yang jelas (hanya ke coach di kolam yang sama). Bila coach tidak membuka jadwal 10 hari, member mendapat pemberitahuan dan boleh langsung ganti coach tanpa biaya dari menu Paket."; `:33` "diproses admin." → "diproses admin secepatnya, paling lambat 7 hari kerja."

**10. Halaman Harga coach menyuruh hubungi admin untuk kolam** — SEDANG · MEKANIS
- Lokasi: `src/app/coach/harga/page.tsx:47`
- Kutipan: "Kamu belum terdaftar mengajar di kolam mana pun. Hubungi admin."
- Kenapa: coach memilih kolam sendiri di menu Kolam Saya (aturan-bisnis; dashboard coach `coach/dashboard/page.tsx:79`).
- Usulan: BARU "Kamu belum memilih kolam tempat mengajar. Pilih kolam di menu Kolam Saya."

**11. Halaman daftar member tidak menautkan ke daftar coach/kolam** — SEDANG · MEKANIS
- Lokasi: `src/app/(auth)/register/register-form.tsx:271-276`; tombol "Daftar" di header landing (`landing-header.tsx:41`) dan panduan (`panduan-view.tsx:248`) selalu ke `/register`.
- Kenapa: coach/pemilik kolam yang menekan "Daftar" di pojok atas masuk ke formulir "Daftar Member" tanpa jalan ke formulir mitra (blindspot alur).
- Usulan: tambah satu baris di bawah "Sudah punya akun? Masuk": "Coach atau pemilik kolam? <Daftar sebagai coach> · <Daftarkan kolam>" (pola sama dengan `landing-view.tsx:321-326`).

**12. "Paket 8 sesi ... lebih hemat per sesi" tidak selalu benar** — SEDANG · BUTUH KEPUTUSAN HADI (klaim harga)
- Lokasi: `src/app/landing-view.tsx:109`
- Kutipan: "paket 8 sesi berlaku 90 hari (lebih hemat per sesi)."
- Kenapa: harga 8 sesi dipasang bebas oleh kolam dan coach; sistem hanya menghitung hemat bila memang lebih murah (`pricing.ts:100-104`, label "Lebih hemat" hanya bila >0 di `member/paket/page.tsx:512`). Tidak ada aturan yang memaksa.
- Usulan: LAMA "(lebih hemat per sesi)" → BARU "(biasanya lebih hemat per sesi; angka hematnya tampil saat memilih)" — atau dihapus.

**13. Landing tidak menyebut kota yang dilayani (dan batas bayar 24 jam)** — SEDANG · BUTUH KEPUTUSAN HADI
- Lokasi: seluruh landing (`landing-view.tsx`, `landing-sections.tsx`): tidak ada kata kota selain alamat kartu kolam.
- Kenapa: hanya 10 kota (`cities.ts:4-15`); kota tanpa pasangan kolam+coach = "Belum tersedia" + daftar tunggu (`member/paket/page.tsx:423-433`). Trafik iklan Meta dari kota lain baru tahu setelah mendaftar. Sama halnya batas bayar 24 jam (`policy.ts:15`) baru terlihat di halaman bayar gagal.
- Usulan: putuskan apakah landing menampilkan baris "Tersedia di: ..." (sebaiknya otomatis dari kota yang sudah punya paket bisa dibeli, bukan 10 kota tetap).

**14. Perlindungan "ganti coach tanpa biaya hari ke-10" tidak disebut di landing** — SEDANG · BUTUH KEPUTUSAN HADI (janji ke pelanggan)
- Lokasi: FAQ ortu `landing-view.tsx:143-146`, poin orang tua `landing-sections.tsx:146`
- Kenapa: fitur dan S&K 3.10 sudah ada; ini jawaban untuk kekhawatiran "bagaimana kalau coach tidak buka jadwal setelah saya bayar" (sesuai arahan "kekhawatiran dijawab lewat section jualan").
- Usulan kalimat (bila disetujui), tambahan di jawaban FAQ ganti coach: "Kalau coach tidak membuka jadwal 10 hari padahal sesimu belum terjadwal, kamu boleh langsung pindah ke coach lain di kotamu tanpa biaya (harga sama atau lebih murah)."

**15. Panduan coach tidak menyebut kewajiban catatan perkembangan, menu Harga, dan Kolam Saya** — SEDANG · MEKANIS
- Lokasi: `src/app/panduan/panduan-view.tsx:98-140`
- Kenapa: catatan tiap 2 sesi Hadir adalah syarat pencairan (`policy.ts:62-63`; landing `landing-sections.tsx:303-312`), tetapi panduan coach tidak menyebutnya; panduan juga tidak punya langkah memilih kolam/pasang harga.
- Usulan: tambah langkah di bagian "3. Tandai kehadiran": `{ title: "Isi catatan perkembangan", body: "Isi Update milestone tiap peserta minimal sekali setiap 2 sesi Hadir. Selama ada yang belum diisi, pengajuan pencairan baru ditahan." }`; tambah di bagian "1. Buka jadwal" sebagai langkah pertama: `{ title: "Pilih kolam dan pasang harga", body: "Pilih kolam tempat mengajar di menu Kolam Saya dan isi harga paket 4 dan 8 sesi di menu Harga." }`

**16. Halaman Masuk: "Perkembangan tercatat setiap sesi"** — SEDANG · MEKANIS
- Lokasi: `src/app/(auth)/login/login-form.tsx:96`
- Kenapa: catatan wajib tiap 2 sesi Hadir (`policy.ts:62`), bukan tiap sesi.
- Usulan: LAMA "Perkembangan tercatat setiap sesi" → BARU "Perkembangan peserta dicatat coach"

**17. FAQ batal: "tombol bantuan" dan "menu Riwayat"** — SEDANG · MEKANIS
- Lokasi: `src/app/landing-view.tsx:133`
- Kutipan: "Di luar itu bisa menghubungi admin lewat tombol bantuan di aplikasi." / "laporkan dari menu Riwayat"
- Kenapa: di aplikasi, booking yang tidak bisa dibatalkan sendiri menampilkan tombol WhatsApp "Hubungi Admin" (`member/riwayat/page.tsx:200-216`; `member/booking/page.tsx:134` "Hubungi admin lewat WhatsApp"), bukan chat bantuan. Nama menu = "Riwayat Booking".
- Usulan: LAMA "lewat tombol bantuan di aplikasi" → BARU "lewat tombol Hubungi Admin di menu Riwayat Booking"; LAMA "dari menu Riwayat paling lambat" → BARU "dari menu Riwayat Booking paling lambat"

**18. FAQ ganti coach tidak menyebut "kolam yang sama" dan sifat saldo** — SEDANG · MEKANIS
- Lokasi: `src/app/landing-view.tsx:145`
- Kutipan: "sisa sesi ikut pindah ke coach baru setelah disetujui admin. Kalau coach baru lebih murah, selisihnya masuk ke saldomu."
- Kenapa: S&K 3.9 hanya ke coach di kolam yang sama; saldo member hanya untuk paket berikutnya, tidak bisa dicairkan (S&K 4.5; `member/paket/page.tsx:300`).
- Usulan: LAMA "sisa sesi ikut pindah ke coach baru setelah disetujui admin. Kalau coach baru lebih murah, selisihnya masuk ke saldomu." → BARU "sisa sesi ikut pindah ke coach lain di kolam yang sama setelah disetujui admin. Kalau coach baru lebih murah, selisihnya masuk ke saldomu (dipakai untuk paket berikutnya, tidak bisa dicairkan)."

### RINGAN

**19. "1 anak" padahal peserta bisa dewasa** — RINGAN · MEKANIS
- `landing-view.tsx:357` "Untuk 1 anak, bukan kelas gabungan." → "Untuk 1 peserta, bukan kelas gabungan."
- `landing-sections.tsx:141` "Benar-benar privat: 1 coach, 1 anak" → "Benar-benar privat: 1 coach, 1 peserta"; `:142` "dijadwalkan khusus untuk anakmu" → "dijadwalkan khusus untuk pesertanya"
- Kenapa: hero "Anak atau kamu belajar berenang"; MESSAGING §4 "Peserta, bukan anak (kecuali khusus anak)". (Bagian orang tua yang memang menyapa orang tua, mis. "Perkembangan anak tercatat", boleh tetap.)

**20. "Fasilitas kolam terbuka setelah mendaftar" padahal tampil di landing** — RINGAN · MEKANIS
- `landing-view.tsx:497-498` LAMA "Jadwal, fasilitas kolam, dan file sertifikat terbuka setelah kamu mendaftar." → BARU "Jadwal dan file sertifikat terbuka setelah kamu mendaftar."
- Kenapa: kartu kolam landing menampilkan fasilitas ke publik (`landing-view.tsx:459-468`). (Halaman profil coach publik `pelatih/[coachId]/page.tsx:146-157,171` memang menyembunyikan jam & fasilitas bagi tamu — kebijakan antar-halaman tidak seragam.)

**21. Bento coach: janji pencairan belum memakai kalimat baku** — RINGAN · MEKANIS
- `landing-sections.tsx:244` LAMA "Pencairan diproses manual oleh admin, secepatnya, dan statusnya terlihat." → BARU "Pencairan diproses manual oleh admin secepatnya, paling lambat 7 hari kerja, dan statusnya terlihat."
- Kenapa: KEPUTUSAN 2 Okt malam #5 (janji disamakan).

**22. Sertifikat level & tanda tangan coach dijanjikan tanpa syarat** — RINGAN · MEKANIS
- `landing-sections.tsx:150` LAMA "dan anak mendapat sertifikat setiap naik level." → BARU "dan anak mendapat sertifikat saat naik level bersama coach."
- `landing-sections.tsx:240` LAMA "Peserta yang naik level mendapat sertifikat bertanda tanganmu." → BARU "Peserta yang naik level mendapat sertifikat atas namamu (dengan tanda tanganmu bila sudah diunggah)."
- Kenapa: `milestone.ts:74-87` (level yang selesai hanya dari penilaian awal tidak menerbitkan sertifikat); tanda tangan opsional (`sertifikat/[completionId]/page.tsx:53-107`).

**23. Panduan: "2 bulan / 3 bulan"** — RINGAN · MEKANIS
- `panduan-view.tsx:38` "paket 4 sesi (berlaku 2 bulan) dan 8 sesi (berlaku 3 bulan)" → "paket 4 sesi (berlaku 60 hari) dan 8 sesi (berlaku 90 hari)"

**24. Panduan kolam: isi ringkasan dashboard tidak sama dengan layar** — RINGAN · MEKANIS
- `panduan-view.tsx:150` LAMA "Sesi yang dihadiri, pendapatan kolam, paket terjual, jumlah coach, dan saldo yang bisa dicairkan." → BARU "Sesi Hadir, bagian kolam (sebelum PPh), paket terjual, coach terdaftar, dan saldo yang bisa dicairkan."
- Kenapa: label di `pool/dashboard/page.tsx:106,117-120`.

**25. "halaman Daftarkan Kolam" vs judul "Daftar Kolam"** — RINGAN · MEKANIS
- `landing-view.tsx:233` "Daftar lewat halaman Daftarkan Kolam" → "Daftar lewat halaman Daftar Kolam" (judul halaman `daftar-kolam/register-pool-form.tsx:98`, metadata `daftar-kolam/page.tsx:5`).

**26. Pesan galat booking: "kuota" dan "slot"** — RINGAN · MEKANIS
- `src/app/api/booking/route.ts:134` LAMA "Paket ini tidak bisa dipakai untuk slot ini: paketnya untuk kolam atau coach lain, kuota sesi habis, belum aktif, atau sudah kedaluwarsa." → BARU "Paket ini tidak bisa dipakai untuk jam ini: paketnya untuk kolam atau coach lain, sisa sesi habis, belum aktif, atau sudah kedaluwarsa."
- Kenapa: MESSAGING §4 (kuota → jatah/sisa; slot hanya di tombol teknis). Berkas ini sengaja dilewati sweeping kata 4 Okt. Cek tes yang memakai teks ini sebelum mengubah.

**27. Notifikasi coach: "Slot kamu dibooking"** — RINGAN · MEKANIS
- `src/app/api/booking/route.ts:185` "Slot kamu dibooking" → "Jadwalmu dibooking"

**28. Tombol dashboard coach "Tidak hadir"** — RINGAN · MEKANIS
- `src/components/attendance-buttons.tsx:57` "Tidak hadir" → "Tidak Hadir" (sama dengan dialognya di `:66,72` dan Riwayat Sesi).

**29. Teks alternatif gambar berbagi beda dari tagline** — RINGAN · MEKANIS
- `src/app/opengraph-image.tsx:5` "Swim Private Hub — booking & manajemen les renang" → "Swim Private Hub. Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya." (MESSAGING §2 "satu sumber").

**30. Tagline halaman masuk/daftar tidak sama dengan tagline baku** — RINGAN · BUTUH KEPUTUSAN HADI
- `(auth)/login/login-form.tsx:96`, `(auth)/register/register-form.tsx:99`, `daftar-coach/register-coach-form.tsx:93`, `daftar-kolam/register-pool-form.tsx:94` memakai 4 tagline berbeda ("Les renang privat dengan coach pilihan...", "Daftar gratis, lalu pilih coach dan kolamnya.", dst.).
- Kenapa: MESSAGING §2 meminta tagline halaman masuk/daftar "sama persis dengan headline". Halaman ini dirombak setelahnya (KEPUTUSAN #24) dengan tagline per peran. Pilih: (A) ubah MESSAGING agar mengizinkan tagline per peran di halaman masuk/daftar, atau (B) samakan keempatnya dengan headline. Rekomendasi A (tagline per peran lebih jelas untuk mitra).

**31. Landing bisa menampilkan coach yang tidak punya kolam aktif** — RINGAN · BUTUH KEPUTUSAN HADI (aturan tampil, kode bukan teks)
- `src/app/page.tsx:52-61` (tanpa syarat kolam aktif) dan `:153` (`poolAffiliations` tanpa filter `isActive`); kartu menulis "Mengajar di: -" (`coach-leaders.tsx:199`).
- Kenapa: Cari Coach sudah menyembunyikan coach tanpa kolam aktif (KEPUTUSAN 3 Okt malam #7; `member/cari-coach/page.tsx:28,37`). Landing belum. Rekomendasi: samakan dengan Cari Coach.

**32. Singkatan "SPH" tidak pernah diperkenalkan di landing** — RINGAN · MEKANIS
- Pertama muncul di bagian coach `landing-sections.tsx:228` ("Biaya layanan SPH...") dan tab cara kerja `landing-view.tsx:69`.
- Usulan: di `landing-view.tsx:69` LAMA "dan biaya layanan SPH." → BARU "dan biaya layanan Swim Private Hub (SPH)."; dan `landing-sections.tsx:228` LAMA "Biaya layanan SPH dibayar member" → BARU "Biaya layanan Swim Private Hub (SPH) dibayar member".

**33. Deskripsi Kebijakan Privasi memakai "Anda"** — RINGAN · MEKANIS (metadata, isi hukum tidak disentuh)
- `src/app/kebijakan-privasi/page.tsx:8` "hak Anda atas data tersebut" → "hak Pengguna atas data tersebut" (MESSAGING §3: halaman hukum memakai "Pengguna"). Bila Hadi menganggap ini bagian teks hukum, biarkan.

**34. Kebijakan Privasi belum menyebut data kota, daftar tunggu kota, dan riwayat lonceng** — SEDANG · TEKS HUKUM
- `src/app/kebijakan-privasi/page.tsx:21-60` (daftar data), `lib/legal.ts:22` (`PRIVACY_UPDATED_AT = "2 Oktober 2026"`).
- Kenapa: sejak 3-4 Okt aplikasi menyimpan kota domisili, daftar tunggu "Kabari saya" per kota, dan riwayat notifikasi di lonceng 90 hari (aturan-bisnis Kota; HANDOFF 6 "Lonceng"). Tidak diusulkan teks; diteruskan ke orang hukum.
- (Catatan: masuk hitungan SEDANG.)

**35. S&K 2.10 "paket sebelum 2 Oktober ... ketentuan lama"** — RINGAN · TEKS HUKUM
- `src/app/syarat-ketentuan/page.tsx:92-95`. Sudah tercatat dan diputuskan DIBIARKAN (KEPUTUSAN 3 Okt sore/malam, jawaban B). Dicantumkan agar tidak dianggap terlewat; tidak perlu tindakan.

**36. MESSAGING.md masih menulis "Paket dan harga diatur per kolam"** — RINGAN · MEKANIS (dokumen)
- `brand-kit/MESSAGING.md:23` → BARU "Harga tiket dipasang kolam, harga jasa dipasang coach; rincian tampil sebelum bayar."

**37. Panduan member: menu Profil Saya kurang lengkap** — RINGAN · MEKANIS
- `panduan-view.tsx:92` LAMA "Ubah nama dan password. Klik Ubah dulu, baru bisa mengubah isinya." → BARU "Ubah nama, kota domisili, email, dan password. Klik Ubah dulu, baru bisa mengubah isinya." (belum dicek apakah semua kolom itu ada di Profil member — cek dulu `app/profil` sebelum mengubah).

**38. Langkah coach/kolam di landing tidak menyebut syarat 4 jam kosong / 14 hari dan kewajiban jadwal** — RINGAN · BUTUH KEPUTUSAN HADI
- `landing-view.tsx:76-82` (tab Coach) dan FAQ coach `:163-205`. Halaman daftar coach sudah menyebutnya (`partner-steps.tsx:8`), landing belum; aturan pelanggaran 10 hari juga tidak disebut. Keputusan #21 hanya membahas kewajiban KOLAM (tidak ditambah). Pilih: tambahkan satu kalimat di FAQ coach atau biarkan cukup di halaman daftar.

### Tidak bisa dipastikan / info (tidak dihitung tingkat)

**39. Alamat kolam contoh di landing kemungkinan tertulis "…, Cianjur, Jakarta"** — perlu cek data
- `page.tsx:132` menggabungkan `address + ", " + city`. Skrip contoh mengisi alamat "Jl. Contoh … Cianjur" (`scripts/fill-demo-pools.mts:31-41`) dan kota kolam diisi "Jakarta" (`scripts/isi-harga-dummy.mjs:29`; KEPUTUSAN 3 Okt). Belum dicek di production (tidak ada akses database).

**40. Logo OVO dan DANA** — info
- `landing-payments.ts:14-15`. Midtrans tidak menawarkan OVO/DANA langsung (`midtrans-methods.ts:4-15`); dibayar lewat QRIS. Tidak salah, tapi bisa disalahpahami. Pilihan: biarkan, atau tulis "lewat QRIS".

**41. URL profil coach `/pelatih/[id]`** — info
- Istilah baku "Coach", URL memakai "pelatih". Hanya terlihat di alamat; mengubah URL memutus tautan yang sudah dibagikan. Tidak diusulkan.

---

## 4. Yang tidak sempat / tidak bisa diperiksa

- Tampilan nyata di browser (HP/desktop) dan data production: tidak dijalankan sesuai tugas. Temuan 39 butuh cek data.
- Teks area **admin** hanya dicek sekilas (nama menu = judul halaman cocok; notifikasi admin). Isi tabel, tombol, dialog admin tidak disapu satu per satu.
- Teks di dalam: `app/profil/*` (profil, rekening, hapus akun, keamanan 2FA), `app/milestone/*` (form Update milestone), `app/notifikasi`, `app/perjanjian` (layar centang perjanjian), `app/pembayaran/sukses|gagal` (hanya baris 24 jam), `member/peserta`, `pool/laporan`, `pool/jadwal`, `coach/peserta`, `coach/jadwal` (selain dialog batal), `admin/*` — hanya dicari kata terlarang lewat pencarian, tidak dibaca utuh.
- `lib/coach-slot-watch.ts`, `lib/coach-change.ts` (notifikasi): dibaca judul & isi notifikasinya saja; ada perubahan belum di-commit di area ganti coach yang tidak saya periksa.
- Perjanjian Coach & MOU Kolam: dibaca MOU pasal 1-10 dan potongan perjanjian coach; tidak dibandingkan kalimat per kalimat dengan landing (teks hukum tidak diubah).
- Tidak ada templat email transaksional untuk pengguna di kode (hanya kotak masuk admin); pemberitahuan lewat notifikasi HP + lonceng. Jadi "teks email" tidak bisa dibandingkan.
- `brand-kit/social/` (banner sosmed) dan halaman `/brandguideline` tidak diperiksa.
- Gambar hero/foto (`hero-swim*.jpg`) dan ikon tidak dinilai isinya.
