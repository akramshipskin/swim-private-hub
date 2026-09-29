# Backlog Gabungan SPH — 29 Sep 2026

> **Bagian 10 (paling bawah) adalah yang terbaru (29 Sep malam).** Bila status di bagian lain masih TERBUKA tetapi bagian 10 menyebut sudah diputuskan, bagian 10 yang berlaku.

Gabungan dari dua dokumen:
- Verifikasi ke kode (28 Sep): [docs/reviews/2026-09-28-verifikasi-blindspot.md](../reviews/2026-09-28-verifikasi-blindspot.md) — cek klaim ChatGPT+Antigravity ke kode asli.
- Office hours (29 Sep): [docs/designs/validasi-permintaan-dan-kejujuran-landing.md](../designs/validasi-permintaan-dan-kejujuran-landing.md) — keputusan model bisnis Hadi.

Tujuan file ini: satu daftar kerja, bukan dua dokumen terpisah. Tiap baris = satu item, dengan status akhir setelah office hours dan siapa yang ngerjain apa.

Status:
- **SELESAI** — udah difix & commit.
- **DIPUTUSKAN** — office hours udah jawab, tinggal dieksekusi.
- **DITUNDA** — sengaja ditunda, ada syarat pemicunya.
- **TERBUKA** — belum dibahas sama sekali, masih nunggu keputusan Hadi.

---

## 1. Uang & Integritas Keuangan — semua TERBUKA (paling berisiko)

Office hours 29 Sep gak nyentuh ini sama sekali (fokusnya model bisnis & landing). Ini masih murni dari verifikasi 28 Sep.

| # | Item | Status | Kerjaan berikutnya | Owner / Gear |
|---|---|---|---|---|
| 1.1 | Pembalikan pendapatan platform gak dicek saldo (beda dari pool/coach yang dicek) | TERBUKA | Hadi putusin: platform boleh saldo minus sementara (mirip koreksi saldo 26 Sep) atau harus dikunci kayak pool/coach? PPN yang udah disetor lalu dibalik = isu nyata | Hadi jawab dulu, baru Opus (area uang) |
| 1.2 | Penarikan platform gak ada bukti transfer/status/konfirmator | TERBUKA | Samain standar sama penarikan coach/pool (udah wajib bukti transfer) | Opus (area uang) |
| 1.3 | Rekening bank polos di DB | SELESAI & LIVE 29 Sep: 1 rekening coach + 1 rekening kolam di prod terenkripsi; Hadi cek admin > Users rekening tampil benar | — | — |

## 2. Privasi & Data

| # | Item | Status | Kerjaan berikutnya | Owner / Gear |
|---|---|---|---|---|
| 2.1 | `totpSecret` disimpan polos | SELESAI & LIVE 29 Sep: 1 kunci 2FA (admin) di prod terenkripsi; Hadi login admin dengan kode berhasil | — | — |
| 2.2 | `dev-db-sync.mjs` nyalin data asli prod TERMASUK totpSecret admin | SELESAI (e74df1a, merge d787722). Terbukti 29 Sep: sync ulang Hadi dari main -> DB dev 0 email/nama/HP/rekening/chat asli, 0 kunci 2FA, 1 hash password; ledger & pembayaran utuh; login lokal member OK, admin diarahkan pasang 2FA | — | — |
| 2.3 | Data ke AI tanpa filter | SEBAGIAN DIPUTUSKAN (retensi chat 90 hari + arsip, 25 Sep) | Belum ada aturan "data apa yang boleh diproses AI" secara eksplisit — saat ini cuma nama+peran+ketikan user, gak baca DB | Hadi putusin kalau mau diperketat lagi |
| 2.4 | Pemilik kolam bisa liat nama anak | TERBUKA | Hadi putusin: perlu atau cukup jumlah peserta | Hadi jawab dulu |
| 2.5 | Sertifikat coach bisa dibuka semua yang login (bukan cuma member) | SEBAGIAN DIPUTUSKAN (25 Sep: member boleh) | Coach lain & pemilik kolam masih ikut kebuka — perlu diputuskan dibatasi atau dibiarkan | Hadi jawab dulu, lalu Sonnet |

## 3. Kredensial

| # | Item | Status | Kerjaan berikutnya | Owner / Gear |
|---|---|---|---|---|
| 3.1 | Password demo `qwertyuiop` di `seed-prod-demo.mts` | TERBUKA — status akun Nadia di prod belum dipastikan | Hadi konfirmasi: akun demo di prod udah dihapus atau masih ada? | Hadi cek, lalu Sonnet kalau perlu hapus dari skrip |

## 4. Aturan Tampil Publik

| # | Item | Status | Kerjaan berikutnya | Owner / Gear |
|---|---|---|---|---|
| 4.1 | `/pelatih` gak cek profil aktif | SELESAI (d6a7d2e, OpenCode mekanis-batch-5) | — | — |
| 4.2 | Slot kolam nonaktif masih tampil di `/api/availability` (booking-nya tetap ditolak) | SELESAI (d6a7d2e) + tes regresi | — | — |

## 5. Infrastruktur

| # | Item | Status | Kerjaan berikutnya | Owner / Gear |
|---|---|---|---|---|
| 5.1 | Backup DB gagal tiap malam (secret R2 belum diisi); file storage gak ikut backup | TERBUKA, masalah lama | Hadi isi secret R2. File storage butuh mekanisme terpisah | Hadi (secret), lalu Opus (desain backup storage) |
| 5.2 | CI gak jalanin build & race test | Build SELESAI (d6a7d2e). Race test di CI masih TERBUKA (butuh Postgres di CI) | — | Sonnet High |
| 5.3 | Rate limit cuma 1 lapis (level app) | TERBUKA, saran infra jangka panjang | Gak mendesak untuk tahap validasi permintaan | Nanti |
| 5.4 | Satu alamat email = satu thread (`EmailThread.externalEmail @unique`), padahal topik beda-beda dari waktu ke waktu | TERBUKA, dampak kecil di volume sekarang | Kelompokkan berdasarkan Message-ID/subjek kalau volume email makin banyak | Nanti, gak mendesak |
| 5.5 | CSP belum aktif (nunggu daftar domain Midtrans+Vercel) | TERBUKA | Kumpulin daftar domain, aktifkan CSP | Sonnet, setelah daftar domain siap |

## 6. Hukum & Model Bisnis — DIPUTUSKAN office hours 29 Sep

| # | Item | Status | Keputusan | Kerjaan berikutnya |
|---|---|---|---|---|
| 6.1 | S&K bilang "sarana bantu administrasi" tapi SPH pegang dana Midtrans dulu | DRAFT JADI (80b6a86): `docs/legal/draft-syarat-ketentuan-v2.md` | 12 [ISI HADI], lalu review orang hukum | Hadi |
| 6.2 | **Temuan baru 29 Sep:** S&K live pasal 3 "hanya sesi Hadir dihitung terpakai" SALAH (sistem potong sesi saat booking; tidak hadir = terpakai) | TERBUKA — S&K yang sudah disetujui pengguna bertentangan dengan sistem | Ikut terbenahi saat S&K v2 dipasang; kalau v2 lama, pertimbangkan koreksi 1 kalimat duluan | Hadi putuskan |
| §7 #8 | Marketplace / software / hybrid? | DIPUTUSKAN | **Marketplace penuh** | — |
| §7 #9-10 | SPH bawa demand ke coach/kolam? | DIPUTUSKAN | Ya, itu tujuannya, tapi **belum terbukti** — landing gak boleh janji sebelum ada member asli | Lunakkan klaim di landing (lihat §7) |
| §7 #11 | Siapa pegang hubungan pelanggan? | DIPUTUSKAN | SPH | — |
| §7 #12 | Transaksi di luar platform (kabur ke WA)? | DRAFT JADI (80b6a86): `docs/legal/draft-mou-kolam-v1.md` (23 [ISI HADI]) + `draft-perjanjian-coach-v1.md` (18 [ISI HADI]) | Hadi tanya 3 kolam (cakupan eksklusivitas), isi [ISI HADI], review orang hukum | Hadi |

## 7. Landing — per role

### Member

| Item | Status | Keputusan / Kerjaan |
|---|---|---|
| Tiket masuk kolam sudah termasuk paket? | TERBUKA | Gak ada di sistem juga — perlu diputuskan dulu sebagai aturan bisnis sebelum ditulis di landing |
| Durasi 1 sesi | TERBUKA | Sama, perlu angka pasti |
| 1 coach : 1 anak atau bisa grup? | SELESAI (commit 6db51ac) | FAQ baru "Ini les privat satu lawan satu?" ditambahkan |
| Perlengkapan renang | TERBUKA | Belum dibahas |
| Target belajar per paket | TERBUKA | Belum dibahas |
| Social proof angka kecil | SELESAI (commit 6db51ac) | Badge hero & strip statistik disembunyikan sampai member ≥ 20 (`MIN_MEMBERS_TO_SHOW_STATS`) |
| Narasi sebelum/sesudah | SEBAGIAN ADA | Landing baris 368 udah ada narasinya, tinggal dirapikan jadi perbandingan eksplisit kalau mau (opsional, rendah) |
| Badge "Bersertifikat" disalahpahami | SEBAGIAN USANG | FAQ udah presisi ("diperiksa admin"); badge sendiri masih bisa disalahpahami tapi ini polish, bukan urgent |
| Trial / beli 1 sesi pertama | TERBUKA | Keputusan bisnis: ada trial atau enggak |
| Testimoni, screenshot produk, info keselamatan | TERBUKA | Belum dibahas, prioritas rendah sampai ada pengguna asli buat testimoni |

### Coach

| Item | Status | Keputusan / Kerjaan |
|---|---|---|
| Persentase komisi gak disebut | DIPUTUSKAN | Komisi per MOU per kolam, **angka belum final** → landing TETAP gak boleh sebut angka sampai MOU pertama jalan |
| "Kenapa dipotong komisi dibanding cari sendiri" | DIPUTUSKAN (arah) | Dijawab lewat fitur yang WA gak punya (riwayat, progres, jaminan sesi pengganti) — bukan lewat teks landing doang |
| "Murid saya datang dari mana?" | DIPUTUSKAN | SPH janji bawa demand, tapi **belum terbukti** — jangan janji di landing sebelum ada member asli |
| Biaya masuk kolam buat coach | TERBUKA | Belum ada di sistem, perlu diputuskan |
| Murid bawaan sendiri | TERBUKA | Belum dibahas |
| Waktu pencairan | TERBUKA | FAQ masih general ("admin memproses") |
| **Coach/kolam dibayar kalau peserta tidak datang / sesi hangus?** (temuan 29 Sep) | TERBUKA | Sistem sekarang: tidak dibagi, uang tetap di platform. Masuk MOU pasal 5.5 & perjanjian coach pasal 4.4 |
| FAQ beli 1 sesi kurang presisi (temuan 29 Sep) | SELESAI & LIVE (e580a78, OpenCode batch-6) | Kode pakai harga per sesi **termahal** (`src/lib/drop-in.ts:13`), FAQ cuma "harga per sesi kolam itu" — Sonnet |
| **FAQ salah: "kolam mitra bisa menambahkanmu"** | SELESAI (commit 6db51ac) | Diubah jadi "admin yang mengafiliasikanmu" |
| Siapa nentuin harga | SELESAI (commit 6db51ac) | FAQ coach baru: "Saya bisa menentukan tarif saya sendiri? Tidak..." |
| Risiko transaksi di luar platform | DIPUTUSKAN | Lihat §7 #12 di atas — MOU kolam |

### Pemilik Kolam

| Item | Status | Keputusan / Kerjaan |
|---|---|---|
| "SPH bawa pelanggan atau cuma software?" | DIPUTUSKAN | Marketplace penuh, tapi permintaan belum terbukti — landing gak boleh janji "jam sepi pasti terisi" sampai ada bukti |
| "Saya dapat berapa?" | DIPUTUSKAN | Per MOU, belum final — sama kayak coach |
| Simulasi pendapatan vs tiket reguler | TERBUKA | Belum ada datanya |
| Monopoli lintasan / gangguan pengunjung reguler | SELESAI (commit 6db51ac) | FAQ "Apa untungnya buat kolam saya?" sekarang sebut eksplisit "les privat satuan (1 coach, 1 peserta — bukan sewa club)" |
| Tanggung jawab keselamatan/insiden | TERBUKA | Keputusan hukum, masuk draft MOU |
| Prosedur loket/kasir | DITUNDA | Bagian dari fitur "daftar hadir loket" yang ditunda sampai ada MOU kolam pertama |
| Wajib pakai coach dari platform? Boleh nolak coach? | TERBUKA | Sistem sekarang: kolam gak bisa tambah/tolak coach sendiri, semua lewat admin — perlu diputuskan apakah ini tetap begitu |
| **FAQ salah: "kolam langsung tampil di halaman ini"** | SELESAI (commit 6db51ac) | Diubah: landing nampilin kolam paling aktif, kemunculan mengikuti aktivitas kolam |
| Berapa lama proses persetujuan admin | TERBUKA | Belum dibahas |
| Gabung gratis atau ada biaya? | TERBUKA | Belum dibahas |
| Studi kasus / bukti dari kolam lain | TERBUKA | Belum ada pengguna asli buat bukti ini |

### Lintas peran

| Item | Status | Keputusan / Kerjaan |
|---|---|---|
| Satu hero buat 3 audiens, gak ada pemilihan peran | TERBUKA, tapi rendah prioritas sampai ada traffic buat diuji | Bisa ditambah setelah tes Meta Ads jalan |

## 8. Sisa Sweep 28 Sep

Update 29 Sep: sweep member (089900000009) & pemilik kolam (089900000003) SELESAI di lokal (kode branch encrypt-bank). Hasil:
- Semua halaman member (7) & pemilik kolam (7) terbuka tanpa error; akses ke peran lain ditolak.
- Alur tulis-data diuji nyata: booking (sesi 8->7), batal (7->8, sisa jatah batal 2->1), tambah peserta anak, usul paket kolam (tersimpan nonaktif + menunggu admin, tidak tampil ke member/landing), ajukan pencairan coach + tolak admin (saldo kembali), pasang 2FA admin + login.
- **Bug kecil baru:** ganti nama di Profil tidak ikut mengganti nama peserta "diri sendiri" (`src/app/profil/actions.ts` updateName tidak memperbarui Dependent isSelf) -> dropdown booking & dashboard menampilkan nama lama. Sonnet / OpenCode.
- False alarm: (a) Dashboard kolam "bulan ini 1 sesi" vs Laporan "0" = beda rentang (laporan bawaan 7 hari, sesinya 13 Sep). (b) Kolom jatahCancel tidak berkurang saat batal = memang total jatah; sisa dihitung dari jumlah batal, tampilan ke member benar. (c) Screenshot sempat menampilkan admin saat login member: tidak bisa diulang setelah dicek identitas per halaman; kemungkinan sesi sisa di alat tes, penyebab pasti tidak terbukti.
- Yang TIDAK diuji: pembayaran/checkout (key Midtrans production di lokal, dilarang), tandai Hadir oleh coach -> bagi hasil (sudah diuji di sweep 25-26 Sep, tidak diulang).



| Item | Status | Kerjaan berikutnya |
|---|---|---|
| Sweep role member & pemilik kolam | SELESAI 29 Sep | lihat catatan di atas |
| Alur tulis-data | SEBAGIAN SELESAI 29 Sep | booking, batal, peserta, usul paket, pencairan, 2FA diuji; checkout tidak (dilarang di lokal) |
| Fix `/pembayaran/sukses` belum diuji order asli | BELUM DIVERIFIKASI | Checkout lokal = key Midtrans production, dilarang tes langsung |
| `.qa-otp.mts` masih nangkring di root repo | BELUM DIBERESIN | Hapus setelah sweep kelar |

---

## Ringkasan prioritas (urutan kerja yang disarankan)

1. **The Assignment Hadi** (di luar kode): tanya 3 kolam soal klausul "privat hanya lewat SPH" — ini nentuin apakah premis #4 (pelindung utama) beneran jalan.
2. **Bug teks FAQ (Sonnet, cepat, gak berisiko):** "kolam bisa tambah coach" (salah) dan "kolam langsung tampil" (salah) — ini murni kesalahan fakta di landing yang aktif sekarang, gak nunggu apa pun.
3. **Perbaikan landing lain dari daftar A** (Sonnet): 1:1, social proof, harga dari kolam, lunakkan janji "dapat murid"/"jam sepi terisi".
4. **Draft S&K + MOU** (Opus, lalu wajib ke orang hukum) — jalan paralel sama Hadi ngerjain tes lapangan.
5. **Item uang (Bagian 1)** — TERBUKA, perlu Hadi putusin dulu sebelum dikerjakan, paling berisiko kalau dikerjakan asal.
6. Sisanya (privasi, infra, sisa sweep) — gak mendesak untuk tes permintaan, bisa nyusul.

---

## 10. Keputusan Hadi 29 Sep malam + antrean kerja

Sumber: jawaban Hadi atas 19 pertanyaan dan klarifikasi lanjutan. Pekerjaan uang
dan tabel baru = Opus + konfirmasi; migrasi production dijalankan Hadi sebelum push.

### 10.1 Sudah selesai hari ini
| Item | Status |
|---|---|
| S&K live pasal 3 salah | SELESAI (c525c9f), sudah di-push Hadi |
| Bug ganti nama Profil tidak ikut nama peserta diri sendiri (OpenCode batch-7) | SELESAI (0711906), divalidasi, sudah di-push Hadi |
| Draft MOU, perjanjian coach, S&K v2, dokumen desain | DIPERBARUI 29 Sep malam sesuai keputusan di bawah |
| Simulasi pendapatan kolam | DOKUMEN JADI: `docs/designs/simulasi-pendapatan-kolam.md` |
| Sembunyikan harga per sesi (OpenCode batch-8) | SELESAI (6151032), divalidasi |

### 10.2 Diputuskan, belum dikerjakan
| # | Item | Keputusan | Owner / Gear | Syarat |
|---|---|---|---|---|
| A | Coach tandai hadir maksimal 24 jam setelah sesi; admin bebas | Diputuskan lengkap (dikonfirmasi Hadi 29 Sep): 24 jam dari jam sesi selesai; lewat batas hanya admin; coach tidak dibayar sampai admin menandai | Opus | — |
| B | Saldo platform "aman ditarik" H+3 | Diputuskan lengkap: hanya uang dari sesi yang sudah lewat 3 hari; hanya saldo platform (coach/kolam tetap); PPN dipisah dan mengendap di saldo, tidak ikut bisa ditarik, baru ditarik saat dibayar ke negara (penarikan bertanda setor pajak + bukti transfer) | Opus | — |
| C | Penarikan platform wajib bukti transfer (1.2) | Diputuskan (A) | Opus | — |
| D | Peserta booking tidak datang | Coach 50% dari bagian coach masuk saldo LANGSUNG seperti sesi Hadir (dikonfirmasi); kolam Rp0; sisanya SPH; sesi hangus tidak dibayar | Opus | Perlu ubah aturan uang; PPN atas selisih → akuntan |
| E | Tombol Laporkan (member, hanya status Tidak Hadir, maks 3 hari) | Diputuskan; S&K ikut (draft v2 sudah memuat) | Opus (booking/uang) + Sonnet (teks) | Bareng A dan D |
| F | Komisi afiliasi | Diputuskan lengkap: kode singkat per coach dan per kolam (diisi di form daftar member); satu kali per member baru; 5% dari harga paket pertama apa pun (reguler atau trial); coach = kolam; cair setelah sesi pertama Hadir + 3 hari; pajak ditanggung SPH (besar pajak: akuntan, tidak menghalangi pembangunan) | Opus (tabel + uang) | — |
| G | Trial: paket trial berbayar (opsi B) | Diputuskan lengkap: penanda di template paket, member baru, 1 kali per anak; harga diatur SPH per kolam; bagi hasil persen normal dari harga trial (selisih ditanggung bersama); tertulis di S&K member, MOU, perjanjian coach | Opus (tabel) | — |
| H | Milestone/checklist perkembangan anak | Masuk rencana; diisi coach per anak, dilihat member; daftar keterampilan Claude drafkan lalu Hadi edit | Opus (tabel) + Sonnet (draf daftar) | Desain dulu |
| I | Sembunyikan harga per sesi dari member | SELESAI (6151032, OpenCode batch-8, divalidasi: byte-identik dengan dokumen, tes, lint, build, dicek di browser lokal kecuali jendela konfirmasi beli 1 sesi) | — | — |
| J | Bagian testimoni di landing, tersembunyi sampai ada testimoni asli | Diputuskan | Sonnet | Hadi mengirim teks testimoni 30 Sep; Claude memasang |
| K | Landing: tiket sudah termasuk, durasi 60 menit, perlengkapan bawa sendiri, gabung gratis, kolam tidak menolak coach, persetujuan 1×24 jam, pencairan manual secepatnya, murid bawaan + afiliasi | Diputuskan | Sonnet | Tiket dan penolakan coach menunggu konfirmasi 3 kolam; afiliasi menunggu fitur jadi |
| L | Saldo coach/kolam boleh minus saat koreksi Hadir ke Tidak Hadir; dipotong otomatis dari bagi hasil berikutnya; saldo negatif tidak bisa dicairkan | Diputuskan (coach dan kolam) | Opus | Bareng A dan D; MOU/perjanjian sudah memuat. Risiko: coach/kolam yang berhenti dengan saldo minus tidak melunasi |
| M | Halaman admin untuk mengisi testimoni sendiri | Opsional, nanti | Opus (tabel) | Setelah ada testimoni asli |
| N | Batas les barengan per kolam di sistem (kolom "maks sesi barengan", kosong = tanpa batas) | Ditunda: angka per kolam dicatat di MOU dari jawaban kolam; admin menyesuaikan jadwal manual | Opus (booking) | Sampai ada kolam yang keberatan atau volume naik |

### 10.3 Keputusan yang hanya dicatat (tanpa kerja kode)
- 2.3 data ke AI: dibiarkan (A). 2.4 kolam melihat nama peserta: tetap (A).
- 2.5 sertifikat: bisa dilihat semua yang login (sudah begitu; link sementara).
- 3.1 akun demo Nadia: dibiarkan, dicatat sebagai kerjaan nanti.
- 3 B: tidak ada batas les barengan per kolam per jam.
- Kolam tidak eksklusif atas pengunjung; privat = 1:1 di kolam umum.
- SPH = penyedia platform (keuangan, jadwal, booking); keselamatan = kolam dan coach.
- Penyelenggara: PT Perorangan, proses pendirian.

### 10.4 Tugas Hadi (di luar aplikasi)
1. Isi secret R2 (backup database gagal tiap malam sejak awal).
2. Tanya 3 kolam dengan 6 pertanyaan di bagian "The Assignment" dokumen desain.
3. Isi titik `[ISI HADI]` di draft hukum (MOU 21, coach 20, S&K 10), lalu ke orang hukum.
4. Siapkan tes Meta Ads. Kumpulkan testimoni asli.
5. Simpan kunci enkripsi production di pengelola password.
6. Tanya akuntan: PPN atas uang sesi tidak hadir, pajak komisi afiliasi.
