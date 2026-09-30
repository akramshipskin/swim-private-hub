# Backlog Gabungan SPH — 29 Sep 2026

> **Bagian 11 (paling bawah) = DAFTAR KERJA GABUNGAN TERBARU (29 Sep malam, setelah Batch 1–4 + S&K v2 LIVE).** Pakai bagian 11 sebagai acuan. Bagian 7 (landing) juga sudah diperbarui. Bagian lain = riwayat; bila bertentangan, bagian 11 yang berlaku.

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

> **Diperbarui 29 Sep malam (setelah Batch 2–4 + S&K v2 live).** Dicocokkan ke
> teks landing production (dibaca tanpa login, curl) + keputusan hari ini.
> Sumber item: `~/Downloads/2026-09-26-sweep-dan-landing-blindspot.md` bagian 2.
> Kolom "Di landing?" = kondisi LIVE sekarang. Semua kerjaan teks landing
> dikumpulkan jadi paket **L1** di bagian 11.

### Member

| # | Item | Status keputusan | Di landing? | Kerjaan |
|---|---|---|---|---|
| M1 | Tiket masuk kolam sudah termasuk paket? | DIPUTUSKAN: termasuk (S&K 2.8 live; Hadi: 3 kolam sudah konfirmasi) | BELUM | L1 |
| M2 | 1 coach : 1 anak atau grup? | SELESAI | ✅ FAQ | — |
| M3 | Durasi 1 sesi | SELESAI: 60 menit | ✅ FAQ | — |
| M4 | Perlengkapan renang | SELESAI: bawa sendiri | ✅ FAQ | — |
| M5 | Target belajar per paket | Bisa dijawab: milestone + sertifikat level LIVE (Batch 3) | BELUM | L1 |
| M6 | Social proof angka kecil | SEBAGIAN: strip statistik tersembunyi (<20 member), TAPI kartu kolam masih "3 member les di sini" | BOCOR | L1 (butuh keputusan b) |
| M7 | Narasi sebelum/sesudah | SEBAGIAN ADA | sebagian | L1 opsional |
| M8 | Arti badge "Bersertifikat" | SELESAI (FAQ presisi) | ✅ | — |
| M9 | Bagian keamanan/kepercayaan | Bahan faktual ada (S&K 6.2 lifeguard/P3K, sertifikat diperiksa admin, sertifikat bisa banyak) | BELUM | L1 |
| M10 | Trial / coba 1 sesi | SELESAI di sistem (Batch 4 LIVE) | BELUM | L1 (trial baru tampil kalau admin sudah membuat paket trial) |
| M11 | Screenshot produk | TERBUKA | BELUM | nanti (butuh data non-demo) |
| M12 | Testimoni asli | DIPUTUSKAN (bagian tersembunyi sampai ada) | tersembunyi | Hadi kirim teks → Claude pasang |
| M13 | (baru) Sisa sesi hangus saat masa berlaku habis | DIPUTUSKAN (S&K 2.7) | BELUM | L1 (FAQ, jujur di depan) |

### Coach

| # | Item | Status keputusan | Di landing? | Kerjaan |
|---|---|---|---|---|
| C1 | Persentase komisi | DIPUTUSKAN: JANGAN sebut angka sampai MOU pertama | tidak (benar) | — |
| C2 | "Kenapa dipotong komisi?" | Bisa dijawab dengan fitur LIVE: milestone, sertifikat level bertanda tangan coach, afiliasi, sesi pengganti otomatis, bayaran 50% kalau peserta tidak datang | BELUM | L1 |
| C3 | "Murid saya datang dari mana?" | DIPUTUSKAN: jangan janji demand; afiliasi = jalur jujur "bawa murid sendiri" | BELUM (afiliasi) | L1 |
| C4 | Biaya masuk kolam buat coach | DIPUTUSKAN: tidak ditagihkan ke coach (perjanjian coach 3.6) | BELUM | L1 |
| C5 | Murid bawaan sendiri | DIPUTUSKAN: lewat kode afiliasi (LIVE) | BELUM | L1 |
| C6 | Waktu pencairan | DIPUTUSKAN: manual secepatnya, tidak janji hari | ✅ FAQ | — |
| C7 | Coach/kolam dibayar kalau peserta tidak datang | SELESAI & LIVE: coach 50%, kolam Rp0 | ✅ FAQ | — |
| C8 | FAQ beli 1 sesi | SELESAI & LIVE | ✅ | — |
| C9 | Siapa nentuin harga | SELESAI | ✅ FAQ | — |
| C10 | Transaksi di luar platform | DIPUTUSKAN: di perjanjian coach & MOU (12 bulan, nonaktif + daftar hitam), member tidak kena | BELUM | L1 (butuh keputusan a: disebut atau tidak) |
| C11 | (baru) Wajib catatan milestone tiap 2 sesi Hadir + penahanan pencairan (mulai 1 Okt) | SELESAI & LIVE | BELUM | L1 — wajib, supaya coach tidak kaget |
| C12 | (baru) Langkah 1 "upload sertifikat" → sertifikat bisa banyak | SELESAI & LIVE | teks lama | L1 (kecil) |

### Pemilik Kolam

| # | Item | Status keputusan | Di landing? | Kerjaan |
|---|---|---|---|---|
| K1 | "SPH bawa pelanggan atau software?" | SELESAI (janji dilunakkan) | ✅ | — |
| K2 | "Saya dapat berapa?" | DIPUTUSKAN: jangan sebut angka sampai MOU | tidak (benar) | — |
| K3 | Simulasi pendapatan vs tiket | Dokumen ada (`docs/designs/simulasi-pendapatan-kolam.md`), belum untuk landing | tidak | nanti |
| K4 | Monopoli lintasan | SELESAI | ✅ FAQ | — |
| K5 | Tanggung jawab keselamatan/insiden | DIPUTUSKAN (S&K 6.2 & 6.5 live) | BELUM | L1 |
| K6 | Prosedur loket/kasir | DITUNDA (sampai MOU kolam pertama) | — | — |
| K7 | Wajib coach platform / boleh menolak coach | "Kolam tidak menolak coach" MENUNGGU jawaban 3 kolam | ditahan | setelah jawaban kolam |
| K8 | Lama persetujuan admin | SELESAI: 1×24 jam | ✅ FAQ | — |
| K9 | Gabung gratis? | SELESAI | ✅ FAQ | — |
| K10 | Studi kasus kolam | TERBUKA (belum ada kolam asli) | — | nanti |
| K11 | (baru) Kode afiliasi kolam 5% | SELESAI & LIVE | BELUM | L1 |
| K12 | (baru) Paket trial: harga dari SPH, bagi hasil dari harga trial (kolam ikut menanggung diskon) | SELESAI & LIVE | BELUM | L1 — wajib terbuka |
| K13 | (baru) Tiket peserta tercakup di bagian kolam (tidak ditagih terpisah ke member) | DIPUTUSKAN | BELUM | L1 |

### Lintas peran

| # | Item | Status | Kerjaan |
|---|---|---|---|
| X1 | Pemilihan peran setelah hero | TERBUKA, prioritas rendah sampai tes Meta Ads jalan | nanti |
| X2 | (baru) **Data uji/demo tampil sebagai data asli di landing production**: "Harga mulai Rp 5.000/paket" (paket uji Renang 1x Rp5.000 & Renang 1 Menit Rp10.000 masih dijual), coach demo (Dewi, Ayu, Fajar, Nadia, Rian) | TERBUKA — bertentangan dengan prinsip "landing jujur" | D1 (Hadi matikan paket uji) + keputusan c (coach demo) |

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
| A | Coach tandai hadir maksimal 24 jam setelah sesi; admin bebas | **SELESAI di kode (branch feat/opus-batch-1), belum live.** Diputuskan lengkap (dikonfirmasi Hadi 29 Sep): 24 jam dari jam sesi selesai; lewat batas hanya admin; coach tidak dibayar sampai admin menandai | Opus | — |
| B | Saldo platform "aman ditarik" H+3 | **SELESAI di kode, belum live.** Diputuskan lengkap: hanya uang dari sesi yang sudah lewat 3 hari; hanya saldo platform (coach/kolam tetap); PPN dipisah dan mengendap di saldo, tidak ikut bisa ditarik, baru ditarik saat dibayar ke negara (penarikan bertanda setor pajak + bukti transfer) | Opus | — |
| C | Penarikan platform wajib bukti transfer (1.2) | **SELESAI di kode, belum live.** Diputuskan (A) | Opus | — |
| D | Peserta booking tidak datang | **SELESAI di kode, belum live.** Coach 50% dari bagian coach masuk saldo LANGSUNG seperti sesi Hadir (dikonfirmasi); kolam Rp0; sisanya SPH; sesi hangus tidak dibayar | Opus | Perlu ubah aturan uang; PPN atas selisih → akuntan |
| E | Tombol Laporkan (member, hanya status Tidak Hadir, maks 3 hari) | **SELESAI di kode, belum live; S&K live pasal 3 ikut diperbarui.** Diputuskan; S&K ikut (draft v2 sudah memuat) | Opus (booking/uang) + Sonnet (teks) | Bareng A dan D |
| F | Komisi afiliasi | Diputuskan lengkap: kode singkat per coach dan per kolam (diisi di form daftar member); satu kali per member baru; 5% dari harga paket pertama apa pun (reguler atau trial); coach = kolam; cair setelah sesi pertama Hadir + 3 hari; pajak ditanggung SPH (besar pajak: akuntan, tidak menghalangi pembangunan) | Opus (tabel + uang) | — |
| G | Trial: paket trial berbayar (opsi B) | Diputuskan lengkap: penanda di template paket, member baru, 1 kali per anak; harga diatur SPH per kolam; bagi hasil persen normal dari harga trial (selisih ditanggung bersama); tertulis di S&K member, MOU, perjanjian coach | Opus (tabel) | — |
| H | Milestone/checklist perkembangan anak | Masuk rencana; diisi coach per anak, dilihat member; daftar keterampilan Claude drafkan lalu Hadi edit | Opus (tabel) + Sonnet (draf daftar) | Desain dulu |
| I | Sembunyikan harga per sesi dari member | SELESAI (6151032, OpenCode batch-8, divalidasi: byte-identik dengan dokumen, tes, lint, build, dicek di browser lokal kecuali jendela konfirmasi beli 1 sesi) | — | — |
| J | Bagian testimoni di landing, tersembunyi sampai ada testimoni asli | Diputuskan | Sonnet | Hadi mengirim teks testimoni 30 Sep; Claude memasang |
| K | Landing: tiket sudah termasuk, durasi 60 menit, perlengkapan bawa sendiri, gabung gratis, kolam tidak menolak coach, persetujuan 1×24 jam, pencairan manual secepatnya, murid bawaan + afiliasi | Diputuskan | Sonnet | Tiket dan penolakan coach menunggu konfirmasi 3 kolam; afiliasi menunggu fitur jadi |
| L | Saldo coach/kolam boleh minus saat koreksi Hadir ke Tidak Hadir; dipotong otomatis dari bagi hasil berikutnya; saldo negatif tidak bisa dicairkan | **SELESAI di kode, belum live.** Diputuskan (coach dan kolam) | Opus | Bareng A dan D; MOU/perjanjian sudah memuat. Risiko: coach/kolam yang berhenti dengan saldo minus tidak melunasi |
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

### 10.5 Opus batch 1 (29 Sep malam) — di kode, BELUM LIVE
Isi: batas 24 jam coach, bayaran Tidak Hadir (coach 50%, kolam 0), saldo coach/kolam
boleh minus, saldo platform ditahan 3 hari + bukti transfer wajib, tombol Laporkan
(member) + halaman admin Laporan Kehadiran, tanggal lahir peserta (wajib untuk
peserta baru, peserta lama diminta melengkapi), halaman Bagi Hasil admin ikut
menghitung sesi Tidak Hadir, S&K live pasal 3 + FAQ + panduan.
Migrasi baru: `20260929080637_attendance_report_platform_proof_birthdate`
(WAJIB dijalankan Hadi ke prod SEBELUM push).
Verifikasi: tsc 0, vitest 485 lulus / 61 file, tes race 104 lulus / 10 file
(termasuk tes baru: saldo minus, toggle berulang, laporan dobel), lint, build;
browser lokal: laporan member -> admin -> ubah Hadir/Tidak Hadir (angka ledger dicek
di DB), kunci 24 jam coach, tanggal lahir peserta.
Tidak diuji: halaman /admin/withdrawals mencatat penarikan sungguhan (hanya tampilan);
notifikasi push ke admin (VAPID tidak aktif di lokal).
Sekalian: tes race 2FA yang rusak sejak enkripsi 29 Sep diperbaiki (config race belum
diberi kunci tes).
Catatan teknis: migrasi otomatis sempat menyelipkan DROP INDEX EmailThread_externalEmail_idx
(index dobel, tidak berbahaya) — dibuang dari migrasi supaya scope bersih.


---

## 11. DAFTAR KERJA GABUNGAN — posisi 29 Sep malam (ACUAN TERBARU)

Semua sumber digabung: bagian 1–10 di atas, dokumen blind spot 26 Sep
(`~/Downloads/2026-09-26-sweep-dan-landing-blindspot.md`), verifikasi 28 Sep,
office hours 29 Sep, dan pekerjaan Batch 1–4 hari ini. Yang sudah LIVE tidak
diulang di daftar kerja.

### 11.1 Sudah LIVE per 29 Sep malam
| Commit | Isi |
|---|---|
| 0be083e | Batch 1: batas 24 jam tandai hadir, bayaran tidak hadir (coach 50%), saldo boleh minus, saldo platform ditahan 3 hari + bukti transfer, tombol Laporkan + Laporan Kehadiran admin, tanggal lahir peserta |
| b029d65 | Batch 2: sertifikat coach bisa banyak (maks 10), badge "Bersertifikat · nama +N" |
| 2e9747f | Batch 3: milestone (40 butir standar A–D), sertifikat level bertanda tangan coach, penahanan pencairan coach (≥2 sesi Hadir tanpa catatan, mulai 1 Okt 2026) |
| 750c555, ff1373b, 4e48c53 | S&K v2 (PT Makna Krabat Indonesia, tanggung jawab 100%, musyawarah) |
| f01ac66 | Batch 4: kode afiliasi coach/kolam + komisi 5%, paket trial per anak; S&K rev 4 (pasal afiliasi & trial) |

### 11.2 Tugas Hadi (di luar kode) — urut penting
| # | Tugas | Kenapa |
|---|---|---|
| H1 | Uji di production: (a) coach isi catatan milestone + unggah tanda tangan, (b) member lihat perkembangan, (c) admin buka Milestone & Afiliasi, (d) unggah 1 sertifikat coach, (e) coach buka dashboard → kartu kode afiliasi | Claude dilarang login production; unggah file tidak bisa diuji di lokal |
| H2 | Matikan paket uji "Renang 1x Rp5.000" & "Renang 1 Menit Rp10.000" (admin → Paket → tidak dijual) | Landing production menulis "Harga mulai Rp 5.000/paket" (X2) |
| H3 | Kabari semua coach: aturan catatan milestone tiap 2 sesi Hadir (penahanan mulai 1 Okt) + minta login sekali supaya kode afiliasinya terbentuk | Aturan uang baru; perjanjian belum ditandatangani |
| H4 | Buat paket trial per kolam kalau mau trial dijual (admin → Paket → centang Paket trial) | Trial tidak tampil ke member sebelum ada paket trial |
| H5 | Kabari orang hukum: S&K 2.9 disesuaikan jadi "untuk Peserta yang belum pernah memiliki paket, satu kali per Peserta" | Beda dari teks yang dia setujui ("Member baru") |
| H6 | Revisi 40 butir milestone (draf Claude, bukan standar resmi) | Belum ada UI admin untuk mengedit; kirim revisi ke Claude |
| H7 | Kirim testimoni asli | Bagian testimoni landing masih tersembunyi |
| H8 | Isi secret R2 | Backup DB gagal tiap malam sejak awal = belum ada cadangan |
| H9 | Simpan kunci enkripsi production di pengelola password | Kunci hilang = rekening & 2FA terenkripsi tidak bisa dibuka |
| H10 | Tanya akuntan: PPN atas uang sesi tidak hadir, pajak komisi afiliasi | Angka pajak belum pasti |
| H11 | Jawaban 3 kolam (termasuk "kolam tidak menolak coach", kapasitas barengan) | Menahan K7 & MOU |
| H12 | Isi `[ISI HADI]` perjanjian coach (18 titik) & MOU kolam (20 titik) → orang hukum → tanda tangan | Aturan uang coach/kolam baru mengikat setelah ditandatangani |
| H13 | Tes Meta Ads | Validasi permintaan (office hours 29 Sep) |

### 11.3 Keputusan yang ditunggu dari Hadi
| # | Pertanyaan | Menahan |
|---|---|---|
| Q-a | Larangan transaksi di luar aplikasi (coach/kolam, 12 bulan) disebut di landing atau cukup di perjanjian? | L1 |
| Q-b | Kartu kolam "3 member les di sini": dibuang, atau ikut ambang 20 member seperti strip statistik? | L1 |
| Q-c | Coach demo (Dewi, Ayu, Fajar, Nadia, Rian) di landing: disembunyikan sampai ada coach asli? | L2 |
| Q-d | Saldo pendapatan SPH bisa minus sementara karena komisi afiliasi cair setelah sesi pertama (contoh: paket Rp800rb → komisi Rp40rb, bagian SPH sesi 1 ± Rp13rb). Oke, atau waktu cair diubah? Penarikan SPH tetap ditolak selama minus | U2 |
| Q-e | (1.1) Pembalikan Hadir setelah saldo platform ditarik: platform boleh minus sementara? (H+3 hold sudah mengurangi risiko, belum menghapus) | U1 |
| Q-f | Anak yang didaftarkan lewat form daftar member TIDAK diminta tanggal lahir (dicek dari kode `src/app/api/register/route.ts`, hanya nama). Wajibkan di form daftar? | P1 |

### 11.4 Kerjaan kode (menu)
Aturan: uang/booking/auth/skema/webhook = Claude langsung (haram OpenCode & Cloud).
Migrasi baru = Hadi jalankan di prod DULU, baru push.

| # | Kerjaan | Berat | Gear / model | Lewat OpenCode/Cloud? | Syarat |
|---|---|---|---|---|---|
| L1 | Revisi teks landing: semua baris "BELUM" di bagian 7 (tiket termasuk, milestone & sertifikat level, trial, keamanan, sisa sesi hangus, afiliasi coach/kolam, biaya masuk coach, catatan milestone + penahanan, sertifikat banyak, tanggung jawab keselamatan, trial menurunkan bagian kolam, tiket dari bagian kolam) | Ringan–sedang (teks saja, ± 15 perubahan) | Sonnet Medium: Claude tulis dokumen eksekusi `docs/plans/landing-revisi-batch-9.md` | Ya, OpenCode (teks murni); Claude validasi | Q-a, Q-b |
| L2 | Sembunyikan coach demo/data demo dari landing | Sedang (filter query + penanda demo) | Sonnet High | Tidak (sentuh data) | Q-c |
| P1 | Wajibkan tanggal lahir anak di form daftar member | Sedang (form + validasi API daftar) | Sonnet High | Tidak (jalur pendaftaran/auth) | Q-f |
| P2 | Cek dugaan tanggal lahir coach bergeser 1 hari (`updateCoachProfile` pakai +07:00, umur pakai tengah malam UTC) — dugaan dari baca kode, belum dijalankan | Kecil | Sonnet High (reproduksi dulu) | Tidak | — |
| P3 | Buang kolom lama `certificateUrl`/`certificateStatus` + rapikan `seed-prod-demo.mts` (password hardcoded, kolom lama) | Kecil, tapi migrasi skema | Opus Low | Tidak (skema) | Setelah H1 membuktikan sertifikat baru jalan |
| P4 | Halaman admin untuk mengedit butir standar milestone (teks, urutan, nonaktif) | Sedang (nonaktif butir memengaruhi hitungan level) | Opus Low | Tidak | Hadi mau / H6 |
| P5 | Uji checkout trial & `/pembayaran/sukses` dengan order sungguhan | Sedang | Sonnet High | Tidak (pembayaran) | Hadi sediakan key Midtrans SANDBOX di lokal (sekarang key production) |
| U1 | 1.1 pembalikan pendapatan platform setelah ditarik | Sedang, uang | Opus Medium | Tidak | Q-e |
| U2 | Ubah waktu cair komisi afiliasi (kalau Q-d = ubah) | Sedang, uang | Opus Medium | Tidak | Q-d |
| I1 | Tes race di CI (Postgres service di GitHub Actions) | Sedang | Sonnet High | Cloud session boleh (bukan area haram) | — |
| I2 | Aktifkan CSP | Sedang | Sonnet High | Cloud session boleh | Daftar domain Midtrans Snap + Vercel |
| I3 | Backup file storage (foto/sertifikat/tanda tangan) + uji pemulihan penuh | Sedang–berat | Opus Medium (desain) | Tidak | H8 |
| X-L | Testimoni: pasang teks asli | Ringan | Sonnet Medium | Ya | H7 |

### 11.5 Ditunda (ada pemicu)
| Item | Pemicu |
|---|---|
| Pemilihan peran setelah hero (X1), screenshot produk (M11), studi kasus kolam (K10) | Setelah tes Meta Ads / ada data non-demo |
| Daftar hadir loket (K6), komisi bertingkat | Setelah MOU kolam pertama |
| Batas les barengan per kolam (N) | Ada kolam keberatan / volume naik |
| Halaman admin testimoni (M) | Setelah ada testimoni asli |
| Rate limit berlapis (5.3), email thread per percakapan (5.4) | Volume naik |
| Hapus `.qa-otp.mts` | Setelah QA lokal tidak dipakai lagi |
| File lama belum di-commit (`laporan-*.md`, `docs/plans/sweep-total-opencode*.md`, `ui-inconsistency-report-2026-09-20.md`) | Hadi putuskan: commit ke arsip atau hapus |

### 11.6 Urutan yang disarankan
1. H1–H3 (uji production + matikan paket uji + kabari coach) — sebelum 1 Okt.
2. Jawab Q-a, Q-b, Q-c → L1 (+ L2) supaya landing jujur sebelum iklan jalan.
3. Q-d, Q-e (uang) → U1/U2 bila perlu.
4. Q-f → P1; P2.
5. H8 → I3; I1, I2.
6. P3, P4, P5 menyusul.

### 11.7 Jawaban Hadi & hasil kerja Sonnet — 29 Sep malam (setelah 11.6)

Jawaban Q-a..Q-f (Hadi, 29 Sep malam):
| # | Jawaban | Akibat |
|---|---|---|
| Q-a | Larangan transaksi di luar aplikasi TIDAK disebut di landing | L1 tidak memuatnya |
| Q-b | "N member les di sini" tampil kalau kolam sudah punya 15 member | KODE SELESAI (di bawah 15 baris dikosongkan) |
| Q-c | Coach demo dibiarkan; kalau coach asli ada, otomatis menggantikan satu per satu | KODE SELESAI: akun @example.com hanya mengisi slot kosong (`src/lib/landing-rank.ts`) |
| Q-d | Saldo SPH boleh minus sementara karena komisi afiliasi | U2 TIDAK perlu (tidak ada perubahan) |
| Q-e | Platform boleh minus setelah pembalikan Hadir | Keputusan tercatat; U1 (Opus Medium) masih menunggu dikerjakan kalau mau perilaku pembalikannya dibuat eksplisit |
| Q-f | Tanggal lahir wajib di form daftar | KODE SELESAI (P1) |

Status kerja:
| # | Status |
|---|---|
| P1 | SELESAI (2bebd3d): tanggal lahir wajib untuk diri sendiri & tiap anak di form daftar + API. Jalur lain (admin buat akun member, pilih peserta saat ganti password pertama) belum meminta tanggal lahir; prompt "Lengkapi tanggal lahir" di menu Peserta yang menutupinya |
| P2 | SELESAI (2bebd3d): dugaan TERBUKTI (coach lahir 15 Jan 2000: umur naik 14 Jan). Diperbaiki di `ageFromBirthDate` (baca tanggal di WIB, cocok untuk data coach lama & peserta, tanpa migrasi data) + tes regresi |
| L2 | SELESAI lewat keputusan Q-c (lihat di atas). Kolam demo (Melati, Tirta Asri) TIDAK disentuh: belum ditanya |
| L1 | DOKUMEN SIAP (95abcc3): `docs/plans/landing-revisi-batch-9.md`, 6 hunk, dicoba dulu & dikembalikan (tsc 0, vitest 519, lint bersih). Tinggal dijalankan OpenCode, lalu Claude validasi |
| I1 | KODE DITULIS: job `race` di `.github/workflows/test.yml` (Postgres 17 service, migrasi asli, `npm run test:race`). BELUM diuji di GitHub (tidak ada runner lokal); cek tab Actions setelah push |
| I2 | DITUNDA: CSP butuh diuji dengan checkout sungguhan (Midtrans Snap), dan itu menunggu P5 (key sandbox). Salah satu domain terlewat = pembayaran macet di production |
| P5, X-L | Menunggu Hadi (key sandbox / testimoni) |
| P3, P4, U1, I3 | Opus, tidak dikerjakan di sesi Sonnet ini |

**Update 29 Sep larut (Opus):**
| # | Status |
|---|---|
| L1 | SELESAI (fdeb38c): dieksekusi OpenCode, hasilnya identik byte-per-byte dengan acuan Claude |
| U1 | SELESAI (3620f18): perilaku kode sudah sesuai Q-e (pembalikan tidak ditolak, platform boleh minus, penarikan tertahan). Ditambah tes race P1/P2, invariant diganti "penarikan ≤ pendapatan yang pernah masuk", label dashboard admin "bisa ditarik" dibetulkan (dulu menampilkan total termasuk dana tertahan) |
| P4 | SELESAI (9ff41eb): `/admin/milestone/butir`. Tampilan belum dicek di browser (panel browser tersembunyi); tes race M-A1..M-A3 + build lulus |
| P5, I2 | Key Midtrans SANDBOX dipasang di `.env.local` (terverifikasi sandbox). Tes checkout DIBLOKIR pemeriksa izin otomatis Claude Code (kategori transaksi) → Hadi yang klik, atau beri izin |
| P3 | TIDAK dikerjakan: syaratnya H1 (bukti unggah sertifikat baru jalan di production) belum ada |
| I3 | TIDAK dikerjakan: menunggu H8 (secret R2) |
| Push | Ditolak pemeriksa izin otomatis → Hadi push manual. Tidak ada migrasi di commit yang belum di-push |

---

## 12. STATUS 30 SEP 2026 SIANG (menggantikan bagian 11 bila bertentangan)

Sumber: `docs/reviews/2026-09-30-sweep-total.md` (bagian "Sweep lanjutan"). Semua sudah live di `main` (3548c82 dan sesudahnya).

### 12.1 Keputusan Hadi 30 Sep (final)
- Aplikasi masih pengembangan, semua akun dummy/sandbox termasuk production; tes semua fitur tanpa izin lagi. (Batas nyata dari sistem keamanan sesi Claude: tidak mengetik password ke situs non-lokal, tidak membaca `.env`, `git push` sering diblokir, DROP kolom diblokir.)
- Kolam contoh ikut digeser kolam asli, maksimal 5 di landing. Bagi hasil final 10/40/50. Afiliasi 5% sekali dari paket pertama. Kebijakan Privasi diperbarui. Login salah 3x per akun + hitung mundur. Satu logo (teks logotype ikut tema). File lama diarsipkan. Pajak (PPN sesi tidak hadir, komisi afiliasi) ditanggung SPH. S&K 2.9 sudah disetujui orang hukum. 40 butir milestone disetujui. H13 (tes Meta Ads) nanti.

### 12.2 Selesai
| Item | Status |
|---|---|
| Migrasi `20260930120000_pool_split_default` | Sudah di production (Hadi, 30 Sep) |
| H2 matikan paket uji, bagi hasil 10/40, H4 paket trial per kolam | Skrip `rapikan-data-produksi.mts` dijalankan Hadi di production (2 paket dimatikan, 2 kolam ke 10/40, 2 trial Rp50.000 dibuat) |
| Kolam contoh + foto contoh | `fill-demo-pools.mts` dijalankan Hadi di production (Bahari, Cempaka, Samudra dibuat; foto kolam & 5 coach demo). Langkah hubungkan coach contoh ke kolam contoh baru ditambah setelahnya (jalankan ulang skrip) |
| L1/L2, P1, P2, P4, U1 | Sudah live sebelumnya |
| I1 tes race di CI | Job ditulis; diuji di klon bersih dengan env kosong (135 tes lulus). Hasil run GitHub belum dilihat |
| I2 CSP | Mode pantau (Report-Only) + `/api/csp-report`; aktifkan setelah log Vercel bersih 1-2 hari |
| I3 backup file storage | `scripts/backup-storage.mjs` + `.github/workflows/backup-storage.yml`, diuji lawan penyimpanan palsu lokal; belum ke Supabase/S3 asli |
| P5 tes checkout sandbox | Dijalankan lokal (Midtrans sandbox + notifikasi simulasi `scripts/qa-webhook.mts`) |
| Persetujuan pemilik kolam | Persetujuan pertama sekarang menyalakan kolamnya juga; setujui/tolak sertifikat juga ada di detail coach |
| Riwayat komisi afiliasi | Tampil di Saldo coach & pemilik kolam |
| Keamanan kecil | Alamat langganan push wajib layanan resmi (cegah SSRF buta); body JSON rusak jadi 400 |

### 12.3 Belum / butuh Hadi
- P3 buang kolom `certificateUrl/certificateStatus`: ditolak pemeriksa izin (DROP COLUMN); perlu persetujuan + dijalankan Hadi. Kolom tidak dibaca kode.
- H1: tes production yang tidak bisa Claude lakukan: unggah ke Supabase asli, email Resend, push, satu pembayaran asli sampai paket aktif (termasuk notifikasi Midtrans masuk ke production).
- H3: kabari coach (aturan milestone berlaku 1 Okt; akun sekarang dummy, jadi tidak mendesak).
- H5, H6, H10: sudah dijawab Hadi (lihat 12.1).
- H7: testimoni asli (nama, peran, kutipan 1-3 kalimat, izin mereka) -> X-L.
- H8: secret R2 + `PROD_SUPABASE_URL`/`PROD_SUPABASE_SERVICE_ROLE_KEY`; jalankan Backup DB & Backup Storage manual sekali (`docs/backup.md`).
- H9: kunci enkripsi (`SECRET_ENCRYPTION_KEY`, ada di Vercel production) disimpan di password manager.
- H11: jawaban 3 kolam (6 pertanyaan di `docs/designs/validasi-permintaan-dan-kejujuran-landing.md`, bagian The Assignment).
- H12: isi `[ISI HADI]` draft perjanjian coach & MOU kolam -> orang hukum -> tanda tangan. Tag "BELUM ADA DI SISTEM" sudah dibuang (semua fitur live).
- Kebijakan Privasi baru (30 Sep) dicek orang hukum. Pengguna lama belum diminta setuju ulang (fitur belum ada).
- Ganti nama merchant Midtrans dari "Les Renang Cianjur".
- Harga trial Rp50.000 dan kolam contoh tambahan adalah isian sementara Claude.

### 12.4 Ditunda (pemicu tetap)
Daftar hadir loket & komisi bertingkat (setelah MOU kolam pertama), batas les barengan (kolam keberatan), halaman admin testimoni (ada testimoni asli), rate limit berlapis & email per percakapan (volume naik), studi kasus kolam & screenshot dari data asli (setelah tes Meta Ads), Payouts A/B/L (jawaban Midtrans).
