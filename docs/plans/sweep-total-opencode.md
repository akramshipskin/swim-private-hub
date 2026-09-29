# Plan: Sweep total (desktop + mobile, semua fitur, semua role) + audit brand

> Ditulis oleh Claude (Sonnet 5), 2026-09-25. Eksekutor: OpenCode.
> Ini tugas **AUDIT SAJA**: OpenCode mencari dan melaporkan. OpenCode
> TIDAK memperbaiki apa pun. Perbaikan dikerjakan Claude setelah
> laporan divalidasi (uang, booking, auth, schema = haram lewat OpenCode).

## 1. Tujuan

1. Buka SEMUA halaman semua role di desktop dan HP, jalankan SEMUA fitur, catat yang rusak.
2. Pasang skill UI UX Pro Max, lalu cek apakah brand guideline
   (`brand-kit/`) sudah diterapkan konsisten di semua halaman.
3. Hasil = satu file laporan. Bukan perubahan kode.

Kalau ada bagian yang tidak bisa dites, TULIS bahwa tidak dites dan alasannya.
Jangan mengarang hasil. "Belum dicek" lebih baik daripada tebakan.

## 2. Aturan main WAJIB

- **DILARANG mengubah file kode apa pun** (`src/`, `prisma/`, `scripts/`, config).
  Satu-satunya file yang boleh dibuat: `laporan-sweep-opencode.md` di root repo
  dan file sementara di `/tmp`.
- **DILARANG** `git commit`, `git push`, ganti branch, atau git destruktif.
- **DILARANG** MENGUBAH `.env*`, `.env.prod`, `.git/`, `prisma/migrations/`.
  MEMBACA `.env` (bukan `.env.prod`) untuk `MIDTRANS_SERVER_KEY` DIBOLEHKAN,
  khusus untuk 5.4 (hitung signature webhook lokal) — nilainya tidak boleh
  dicetak ke laporan atau konsol, hanya dipakai di memori skrip.
- **DILARANG** membuka atau mengakses PRODUKSI (domain live, `.env.prod`, DB prod).
  Semua tes hanya di lokal (`http://localhost:3000`) dengan DB dev.
- **DILARANG KERAS klik tombol Beli / checkout / bayar** di halaman paket member.
  `.env` lokal berisi kunci Midtrans PRODUKSI: klik = transaksi sungguhan.
  Webhook boleh disimulasikan (lihat 5.4), checkout tidak.
- **Email admin (Resend, kirim sungguhan):** BOLEH dites, dengan syarat ketat:
  penerima HANYA `hadiakram6@gmail.com`, maksimal 3 email selama sweep. DILARANG
  mengirim ke alamat lain, termasuk alamat akun QA (`@example.com`). Jangan
  mencetak `RESEND_API_KEY` ke laporan.
- **Chat bantuan AI:** hanya tes tampilan widget dan pesan error/cadangan. Di
  `.env` lokal tidak ada `GEMINI_API_KEY`/`ANTHROPIC_API_KEY`, jadi jangan
  menambahkan key apa pun. Kalau ternyata menjawab, berhenti setelah 5 pesan.
- **DILARANG** push notif (kirim sungguhan). Catat sebagai "tidak dites".
- **DILARANG** `npm install` paket ke project ini. Skill UI UX Pro Max dipasang
  GLOBAL/di luar repo (bagian 4).
- **DILARANG** mematikan/menyalakan ulang DB dev. Dev server: kalau belum jalan,
  `npm run dev`; kalau sudah jalan di 3000, pakai itu.
- Jangan mengubah password akun QA atau menghapus data yang bukan buatan sendiri.
  Data uji baru boleh dibuat, beri awalan nama `OC ` supaya mudah dikenali.
- Kalau instruksi di dokumen ini tidak bisa dijalankan persis, STOP di langkah
  itu, tulis kenapa di laporan, lanjut ke langkah berikutnya.

## 3. Persiapan

1. `git status` dan `git log -1 --oneline`: catat commit yang dites di laporan.
2. Pastikan `http://localhost:3000` hidup. Kalau tidak: `npm run dev`.
3. Baca dulu: `AGENTS.md`, `brand-kit/README.md`, `brand-kit/MESSAGING.md`,
   `brand-kit/fonts/FONTS.md`, `src/app/globals.css` (token warna), dan
   `brand-kit/guideline.html` (buka di browser, ini guideline resminya).
4. Akun QA lokal (khusus DB dev):

| Role | Login | Password |
|---|---|---|
| Admin | 089900000001 | qa-admin-123 (butuh kode 2FA, lihat catatan) |
| Coach | 089900000002 | qa-coach-123 |
| Member | dedi.member@example.com | qa-member-123 |
| Pemilik kolam | budi.tirta@example.com | qa-pool-123 |

   **Kode 2FA admin** (berubah tiap 30 detik, jadi hitung tepat sebelum
   mengetik). Jalankan di root repo, tepat saat layar minta kode:

   ```bash
   npx tsx -e 'import {totpAt,currentStep} from "./src/lib/totp"; console.log(totpAt("P5PDDN7ZLEL52TL3DOB3RNKNUPSLFQYE", currentStep()))'
   ```

   Cetakannya 6 digit; ketik segera. Kalau ditolak, hitung ulang (mungkin
   pas ganti jendela 30 detik). Ini khusus akun QA di DB dev. JANGAN
   reset/matikan 2FA admin, kecuali langkah alur 5 (pasang/matikan 2FA)
   dilakukan pada akun coach/member, bukan admin. Kalau tetap gagal, tandai
   halaman admin BELUM DICEK, bukan lolos.
   Kalau `localhost:54330` (DB) atau `:3000` mati: DB dev `npm run db:dev`
   (biarkan terbuka), server `npm run dev`.

## 4. Pasang UI UX Pro Max

1. Repo: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
   Ikuti README repo itu untuk memasang ke OpenCode. Jangan mengarang langkah;
   kalau README tidak menyebut OpenCode, lapor dan pakai cadangan di bawah.
2. Cadangan: skill ini sudah terpasang untuk Claude di
   `~/.claude/skills/ui-ux-pro-max/` (berisi `SKILL.md` dan skrip Python).
   Baca `SKILL.md`-nya dan jalankan skrip yang disebut di sana langsung.
3. Tulis di laporan: cara pasang yang dipakai, berhasil atau tidak.
4. Pakai skill untuk: aksesibilitas, area sentuh, kontras, spacing, tipografi,
   form, state (kosong/error/loading), konsistensi komponen.

## 5. Sweep

### 5.1 Halaman yang WAJIB dibuka

Untuk SETIAP halaman: desktop (lebar 1280) DAN HP (lebar 375). Buka dulu tema
terang, lalu tema gelap (tombol tema di menu). Catat status tiap halaman di tabel
laporan: OK / ada temuan / tidak bisa dibuka.

- **Publik:** `/`, `/login`, `/register`, `/daftar-coach`, `/daftar-kolam`, `/panduan`,
  `/syarat-ketentuan`, `/kebijakan-privasi`, `/kebijakan-cookie`,
  `/kebijakan-pengembalian`, `/pembayaran/sukses`, `/pembayaran/gagal`,
  `/pelatih/[coachId]` (ambil id coach dari daftar di landing), halaman 404 (URL ngawur).
- **Semua role login:** `/profil`, `/keamanan`, `/ganti-password` (hanya kalau
  akun bertanda wajib ganti password).
- **Admin (`/admin/...`):** dashboard (`/admin`), `booking-overview`, `email`,
  `kinerja-coach`, `kolam`, `komisi`, `paket`, `pembayaran`, `pesan`, `users`
  (+ halaman detail SETIAP user di daftar), `withdrawals`.
- **Coach (`/coach/...`):** `dashboard`, `jadwal`, `riwayat-sesi`, `saldo`, halaman utama.
- **Member (`/member/...`):** `dashboard`, `booking`, `cari-coach`, `paket`,
  `pembayaran`, `peserta`, `riwayat`.
- **Pemilik kolam (`/pool/...`):** `dashboard`, `coach`, `info`, `jadwal`,
  `laporan`, `paket`, `saldo`.

Halaman `/admin`, `/coach`, `/member`, `/pool` tanpa sub-path hanya mengarahkan
ke dashboard masing-masing; cukup pastikan arahnya benar.

Daftar di atas dicocokkan dengan `find src/app -name page.tsx` (49 halaman,
sebagian dinamis). Tidak boleh ada yang dilewati. Kalau ternyata ada page baru
yang belum tercantum, tambahkan dan catat.

### 5.2 Yang diukur di tiap halaman (desktop DAN HP)

- Halaman bisa digeser ke samping (overflow horizontal)?
- Teks terpotong/menumpuk/keluar kotak, nama panjang merusak layout?
- Tombol dan link yang bisa diklik lebih kecil dari 44x44px di HP.
- Teks lebih kecil dari 12px.
- Kontras teks di bawah 4.5:1 (terang DAN gelap).
- Tombol/input tanpa label atau nama; gambar tanpa alt.
- Console browser: error merah dan warning.
- Network: request gagal (4xx/5xx) selain yang memang diharapkan.
- Elemen yang baru muncul setelah ada data: ulangi halaman di HP SETELAH data
  ada (setelah alur 5.3).
- State kosong, state error, dan state loading tiap halaman: terlihat wajar?
- **Kebocoran data:** di HTML/JSON halaman, cari teks `passwordHash`, `totpSecret`,
  `$2a$`, `$2b$`, `registrationIp`. Ada satu saja = tulis di bagian paling atas
  laporan sebagai KRITIS.

### 5.3 Alur fitur yang WAJIB dijalankan (DB lokal)

Jalankan berurutan; catat hasil tiap langkah (OK / gagal + pesan persis).
Tiap langkah: coba jalur normal DAN minimal satu input salah (kosong, negatif,
terlalu panjang, dobel klik).

**Akun dan auth**
1. Daftar member baru (input valid, kosong, email dobel, HP dobel beda format).
2. Daftar coach baru dan kolam baru: layar "pendaftaran diterima"; coba login
   sebelum disetujui (harus ditolak).
3. Login/logout tiap role; password salah 3x (ada pembatasan?).
4. Lupa/ganti password; akun buatan admin wajib ganti password saat login pertama;
   password baru sama dengan sementara harus ditolak.
5. `/keamanan` pada akun COACH (bukan admin): pasang 2FA (butuh password akun),
   login dengan 2FA, matikan 2FA. Kode TOTP dihitung dengan skrip di bagian 3
   memakai secret yang tampil di layar pemasangan; kalau tidak bisa, tandai tidak dites.
6. Profil: edit nama (tombol Edit dulu), validasi kosong.
7. Minta hapus akun (member), admin setujui, login setelah dihapus harus ditolak.

**Admin**
8. Buat user baru (tiap role); form harus menampilkan pesan sukses dan tidak
   membiarkan kirim ulang tak sengaja.
9. Aktifkan/nonaktifkan user; badge "Menunggu persetujuan" untuk coach/pemilik
   kolam baru; dashboard menampilkan barisnya.
10. Setujui kolam: kolam aktif, pemilik yang belum pernah disetujui ikut aktif.
11. Tambah coach ke kolam: dropdown hanya coach aktif; hapus afiliasi.
12. Bagi hasil kolam: komisi + coach share > 100% ditolak; kolom kosong ditolak
    (bukan tersimpan 0).
13. Paket: buat/edit; sisa sesi dan jatah batal kosong ditolak.
14. Assign paket ke member; tambah peserta (anak) untuk member.
15. Pencairan: Tolak (saldo balik), Tandai Dibayar (nomor referensi wajib).
16. Booking overview, kinerja coach, pesan (lihat daftar, filter, buka).
16b. **Email admin** (`/admin/email`): lihat kotak masuk dan tab alamat
    (hello/support/info/billing). Kirim email baru ATAU balas, penerima HANYA
    `hadiakram6@gmail.com`, maksimal 3 email; catat apakah muncul di riwayat
    thread dan pesan error kalau gagal. Coba kirim dengan subjek/isi kosong.
16c. Unduh template import member (`/api/admin/import-template`), lalu jalankan
    import member dari halaman admin dengan file berisi 2 baris uji (awalan
    nama `OC `): baris valid, baris dengan HP dobel, baris kosong.
17. Kelola user: cari, filter, urutan (yang menunggu persetujuan di atas).

**Coach**
18. Buat slot jadwal (rentang jam), hapus slot, coba slot bentrok/tumpang tindih.
19. Tandai Hadir / Tidak hadir; batalkan tanda Hadir; coba ubah setelah uang
    diajukan cair (harus ditolak).
20. Saldo: ajukan pencairan lebih dari saldo, di bawah minimum, dan jumlah pas.
21. Profil publik coach (`/pelatih/[id]`), spesialisasi, foto (upload: lihat 5.5).

**Member**
22. Cari coach, lihat slot, booking. Coba booking slot yang sama dari dua tab
    (satu harus gagal).
23. Batalkan booking (dialog konfirmasi, Esc menutup, jatah batal berkurang);
    coba batal saat jatah habis: harus muncul jalur WhatsApp.
24. Paket: lihat daftar, sisa sesi, riwayat pembayaran, riwayat sesi.
    (Tombol Beli JANGAN diklik.)
25. Peserta: tambah anak, edit, pilih peserta saat booking.

**Pemilik kolam**
26. Jadwal, coach afiliasi, info kolam (edit), laporan, saldo.
27. Usul paket: jatah kosong ditolak; admin (akun lain) menyetujui.
28. Pencairan pemilik kolam.

**Chat bantuan AI**
29. Buka widget chat di tiap role dan di halaman publik: buka/tutup, tap area
    di HP, kirim 1 pesan, catat perilakunya (jawaban, pesan error, pesan
    cadangan). Maksimal 5 pesan (lihat bagian 2).

**API langsung (tanpa login)**
30. Untuk tiap route di `src/app/api/` (kecuali `payment/checkout`, `push/*`,
    `webhooks/*`, `auth/*`), panggil dengan `curl` TANPA cookie login dan catat
    status: harus 401/403 untuk yang butuh login. Lalu panggil dengan login
    role yang salah (mis. member memanggil route admin): harus ditolak.
    Route: `admin/import-template`, `availability`, `availability/available-dates`,
    `booking`, `booking/[id]`, `chat`, `coach/schedule-dates`, `register`,
    `register-coach`, `register-pool`. Untuk route POST kirim body kosong/
    tidak valid saja; JANGAN membuat data lewat curl.

### 5.4 Simulasi webhook Midtrans (opsional, hati-hati)

Hanya kalau bisa dilakukan tanpa menyentuh Midtrans asli: hitung signature SHA-512
(`order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY` dari `.env`) lalu
kirim POST ke `http://localhost:3000/api/payment/webhook` lokal. Lihat kode route
webhook dan tes yang sudah ada (`src/app/api/**/route.test.ts`) untuk format.
JANGAN mencetak atau menyalin isi `MIDTRANS_SERVER_KEY` ke laporan. Kalau ragu,
lewati dan tulis "tidak dites".

### 5.5 Yang JANGAN dites (tulis sebagai "tidak dites" beserta alasannya)

Push notif, upload foto/sertifikat (kunci storage tidak ada di lokal), checkout
Midtrans, menerima email masuk (webhook inbound butuh URL publik), jawaban chat AI
(tidak ada key di lokal), Safari iOS dan HP asli.

### 5.6 Tes otomatis

Jalankan dan tempel hasil ringkas (jumlah lolos/gagal, nama tes yang gagal):
- `npx tsc --noEmit; echo "exit=$?"` (cek exit code langsung, tanpa pipe)
- `npm run lint`
- `npx vitest run`
- `npm run build` (boleh dilewati jika dev server sedang jalan dan build
  bentrok; tulis alasannya)

## 6. Audit brand guideline (UI UX Pro Max + brand-kit)

Bandingkan aplikasi dengan `brand-kit/` (README, MESSAGING, guideline.html,
colors/, fonts/, logo/, icons/). Untuk SEMUA halaman di 5.1, periksa:

1. **Warna:** hanya token palet brand yang dipakai? Cari warna hardcode
   (`#hex`, `rgb(`, kelas Tailwind palet mentah seperti `bg-blue-500`) di `src/`
   yang tidak berasal dari token di `globals.css`. Daftar file:baris.
2. **Font:** family, bobot, dan ukuran sesuai `brand-kit/fonts/FONTS.md`?
   Ada halaman yang memakai font lain?
3. **Logo dan ikon:** logo dipakai sesuai aturan (ruang aman, ukuran minimum,
   versi terang/gelap)? Favicon/OG image sesuai `brand-kit/`?
4. **Nada bahasa:** teks di UI sesuai `MESSAGING.md` (sapaan, istilah, gaya)?
   Daftar teks yang menyimpang. Catat juga istilah yang tidak konsisten antar
   halaman (contoh: "kolam"/"pool", "sesi"/"pertemuan").
5. **Komponen:** tombol, kartu, input, badge, dialog, tabel konsisten antar
   halaman (radius, bayangan, tinggi, padding, warna status)? Bandingkan
   halaman sejenis antar role.
6. **Tema gelap:** semua halaman punya padanan gelap yang terbaca? Ada elemen
   yang tetap terang atau hilang?
7. **Status warna:** sukses/peringatan/bahaya dipakai konsisten (arti sama di
   semua halaman)?
8. **Pola UI UX Pro Max:** ringkas 5 pelanggaran terbesar menurut skill.

Bukti wajib untuk tiap temuan brand: path file:baris atau URL halaman + apa yang
dilihat + yang seharusnya menurut brand-kit (kutip nama file/bagian, jangan
mengarang aturan yang tidak ada di brand-kit).

## 7. Format laporan (`laporan-sweep-opencode.md`, root repo)

Urutan wajib:

1. **KRITIS** (kebocoran data, uang salah, halaman tak bisa dipakai). Kosong = tulis "tidak ada".
2. **Ringkasan jujur:** X dari Y halaman dicek desktop, X dari Y dicek HP, X dari
   30 alur dijalankan. Angka sebenarnya, bukan "semua" kecuali memang semua.
3. **Tabel halaman:** halaman, role, desktop, HP, gelap, temuan (ringkas).
4. **Tabel alur 1-30 (termasuk 16b, 16c):** hasil tiap langkah, pesan error persis kalau gagal.
5. **Temuan** (satu per satu): judul, tingkat (Tinggi/Sedang/Rendah), halaman/role,
   langkah reproduksi, yang diharapkan vs yang terjadi, file:baris kalau tahu
   penyebabnya. Tanpa usulan perbaikan yang menyentuh uang/booking/auth.
6. **Audit brand:** temuan tiap poin 1-8 di bagian 6.
7. **Hasil tes otomatis** (5.6).
8. **Tidak dites + alasan** (5.5 dan apa pun yang gagal dijalankan).
9. **False alarm:** temuan yang ternyata bukan bug, beserta alasannya. Jangan dibuang.
10. **Cara pasang UI UX Pro Max** yang dipakai (bagian 4).

Aturan isi: setiap klaim harus punya bukti (halaman, langkah, atau file:baris).
Kalau tidak yakin, tulis "tidak yakin" dan sebut apa yang perlu dicek. Jangan
menulis "aman/lengkap/beres" tanpa menyebut cara verifikasinya.

## 8. Verifikasi oleh Claude (setelah laporan masuk)

Claude memvalidasi sampel temuan secara independen (reproduksi sendiri),
menandai false alarm, lalu memutuskan perbaikan. Laporan OpenCode bukan bukti.
