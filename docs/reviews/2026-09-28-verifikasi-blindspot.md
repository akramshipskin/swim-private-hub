# Verifikasi dokumen blind spot (ChatGPT + Antigravity) ke kode — 28 Sep 2026

Sumber: `~/Downloads/2026-09-26-sweep-dan-landing-blindspot.md`. Dicek Claude ke kode (baca kode, tidak dijalankan) di commit 842880f.
Label: BENAR / BENAR-TAPI (ada konteks) / SALAH-USANG / SUDAH-DIPUTUSKAN (keputusan Hadi 25 Sep) / KEPUTUSAN-BISNIS.

## Bagian 1 — Sistem

| Item | Status | Bukti & catatan |
|---|---|---|
| 1.1 Pembalikan pendapatan platform setelah ditarik | BENAR-TAPI | `src/lib/wallet.ts:133-136` tanpa cek saldo (pool/coach dicek). Saldo platform dihitung dari ledger − `PlatformWithdrawal` (`platform-wallet.ts`) → bisa minus. Uang milik platform sendiri, tidak merugikan kolam/coach. Serius di PPN: pajak sudah disetor lalu dibalik = kelebihan setor. Pembalikan tidak ikut advisory lock `platform-withdrawal`. Konteks: 26 Sep Hadi memutuskan koreksi saldo boleh minus. |
| 1.2 Jejak audit penarikan platform tipis | BENAR | `PlatformWithdrawal`: revenueAmount, taxAmount, note, createdById (string, tanpa relasi), createdAt. Tanpa status/bukti transfer/konfirmator. |
| 1.3 Rekening polos | BENAR + SUDAH-DIPUTUSKAN sebagian | Polos di Pool, CoachProfile, WithdrawalRequest. Nomor lengkap hanya ke admin (pencairan manual) dan pemilik sendiri; tempat lain `•••• 1234`. Tidak ada log. Keputusan 25 Sep: samarkan setelah pencairan otomatis. Enkripsi belum dibahas. |
| 2.1 totpSecret polos | BENAR | Terbukti: kode 2FA admin dev bisa dibuat dari DB. |
| 2.2 dev-db-sync salin data asli prod | BENAR, lebih parah | `scripts/dev-db-sync.mjs` salin semua tabel tanpa penyamaran, termasuk totpSecret admin prod (gabung 2.1 = laptop dev bisa bikin kode 2FA admin asli). |
| 2.3 Data ke AI tanpa filter | BENAR-TAPI | `chat-ai.ts`: nama + peran + 12 giliran. AI tidak baca DB (tanpa booking/saldo/anak), hanya ketikan user. Prompt melarang kontak coach/transaksi luar. Retensi chat SUDAH-DIPUTUSKAN (90 hari tampil + arsip). Status AI di prod belum dicek. |
| 2.4 Pemilik kolam lihat nama anak | BENAR | `pool/jadwal/page.tsx:40,86`, `pool/laporan/page.tsx:60,147`. |
| 2.5 Sertifikat terbuka untuk semua yang login | BENAR + SUDAH-DIPUTUSKAN sebagian | 25 Sep: member login boleh. Kode (`pelatih/[coachId]/page.tsx:62`) cuma cek `session` → coach & pemilik kolam juga bisa. Bagian ini belum diputuskan. |
| 3.1 `qwertyuiop` di seed prod | BENAR di kode | `scripts/seed-prod-demo.mts:68`. Status akun Nadia di prod tidak bisa dicek; memori bertabrakan (25 Sep "hapus", 24 Sep "cleanup ditunda"). Tanya Hadi. |
| 4.1 /pelatih tidak cek profil aktif | BENAR-TAPI dampak nol | `CoachProfile.isActive` tidak pernah ditulis di mana pun (selalu true) = kolom mati. Coach akun nonaktif sudah 404. |
| 4.2 Pool.isActive belum di semua jalur | BENAR sebagian | Booking (`api/booking/route.ts:79`) & checkout menolak kolam nonaktif. `/api/availability` masih menampilkan slot kolam nonaktif → masalah tampilan, bukan integritas. |
| 5.1 Backup belum DR utuh | SALAH di satu poin | Dokumen bilang backup "sudah jalan" — nyatanya gagal tiap malam (secret R2 belum diisi). Storage (foto/sertifikat) tidak ikut, belum ada uji restore: BENAR. |
| 5.2 CI tanpa build/race | BENAR | `test.yml`: lint, typegen, tsc, test. Build tidak pernah ada (git log -S kosong). Memori 25 Sep yang menulis "CI + build" salah. |
| 5.3 Rate limit satu lapis | BENAR | Saran infra (edge/WAF), bukan bug. |
| 5.4 Satu email = satu thread | BENAR | `EmailThread.externalEmail @unique`. Dampak kecil di volume sekarang. |
| 5.5 CSP belum aktif | BENAR | Komentar di `next.config.ts:12`. |
| 6.1 Hukum vs alur dana | BENAR, KEPUTUSAN-BISNIS | S&K `syarat-ketentuan/page.tsx:62` "sarana bantu administrasi", padahal dana masuk Midtrans platform dulu. |

§7 keputusan: #7 retensi chat SUDAH; #3, #4 sebagian; #1, #2, #5, #6, #8-#12 belum. #8-#12 (marketplace/software/hybrid dst.) = akar banyak item Bagian 2.

## Bagian 2 — Landing (`src/app/landing-view.tsx`)

Member:
- BENAR (landing tidak bahas): tiket masuk kolam, durasi sesi, perlengkapan, target belajar, testimoni, screenshot produk, keselamatan, trial untuk member baru (1 sesi yang ada cuma untuk pemegang paket aktif). Tiket & durasi juga tidak ada di sistem → keputusan dulu.
- #2 1:1 atau grup: BENAR, landing tidak sebut. Sistem: 1 slot = 1 member.
- #6 social proof kecil: BENAR, lebih luas — hero juga (lokal: 5 kolam · 5 coach · 10 member · 3 sesi; prod belum dicek).
- #7 / narasi sebelum-sesudah: SEBAGIAN USANG — sudah ada paragraf baris 368 "Dulu jadwal les diatur lewat chat...", belum berbentuk perbandingan.
- #8 badge Bersertifikat: SEBAGIAN USANG — FAQ baris 111 sudah presisi; badge berdiri sendiri masih bisa disalahpahami.

Coach:
- BENAR: #1 persen komisi, #2 kenapa dipotong, #3 murid dari mana, #4 biaya masuk kolam (tidak ada di sistem), #5 murid bawaan, #6 waktu pencairan, #8 off-platform.
- #7 siapa tentukan harga: BENAR sebagian — FAQ kolam jelas, FAQ coach tidak.
- TAMBAHAN (terlewat dokumen): FAQ baris 125 "kolam mitra bisa menambahkanmu" SALAH — hanya admin yang bisa (`admin/kolam/actions.ts`), `/pool/coach` hanya lihat.

Pemilik kolam:
- #1-#10 BENAR. #7: sistem sekarang = kolam tidak bisa tambah/tolak coach; semua lewat admin.
- TAMBAHAN: FAQ baris 171 "kolam langsung tampil di halaman ini" jadi salah begitu kolam > 5 (landing batasi 5 paling laris).

Lintas peran: 4 poin BENAR. 5 keputusan sisi landing: semua belum.

## Ringkasan
1. Temuan sistem hampir semua akurat; 4 item sebagian sudah dijawab 25 Sep (1.3, 2.3 retensi, 2.5, CI).
2. Satu salah: backup "sudah jalan".
3. Dua terlalu keras: 1.1, 4.1.
4. Tiga terlewat: dev-db-sync bawa totpSecret admin prod; FAQ "kolam bisa tambah coach"; FAQ "kolam langsung tampil".
5. Akar: SPH marketplace / software / hybrid — ditentukan di /office-hours, lalu hasilnya dipetakan ke tabel ini.
