# TRD SPH: aturan teknis dan di mana sistem menjaganya

Status: DRAF 2 (10 Okt 2026, Claude Opus 5.5), sudah diperiksa Opus kedua berkonteks segar (hasilnya dimasukkan), menunggu keputusan dan tinjauan Hadi. Dokumen 4 dari 6 (PRD dan Alur Aplikasi sudah disetujui; brief desain ditunda, Hadi 10 Okt).

Isi: setiap aturan penting ditulis bersama tempat kode menjaganya dan statusnya. Dicek dengan membaca kode pada commit 68b9ceb, belum dijalankan ulang satu per satu. Bukti uji yang sudah ada: sweeping sistem 3 Okt malam (445 sel hak akses 0 bocor, audit uang cocok, 4 pemeriksa Opus 0 berat) dan 6 Okt (440 sel 0 bocor, 835 tes + 200 tes balapan). Angka aturan tidak ditulis ulang di sini; sumbernya `src/lib/policy.ts` dan `src/lib/pricing.ts`, aturan bisnisnya `docs/aturan-bisnis-saat-ini.md`.

Tanda status: **Cocok** = kode sama dengan keputusan Hadi. **Celah** = ada yang tidak dijaga atau menyimpang (bagian 11). **Belum dicek** = tidak diperiksa di draf ini.

## 1. Tumpukan dan lingkungan

| Bagian | Pilihan | Catatan |
|---|---|---|
| Aplikasi | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 | Penjaga rute bernama `src/proxy.ts` (bukan middleware) |
| Database | PostgreSQL di Supabase, Prisma 7 + adapter pg | 45 migrasi; terakhir `20261004120000_notifikasi_lonceng` (sudah di production) |
| Login | next-auth v5 beta 32 (dikunci), Credentials + JWT | Lama sesi tidak diatur = bawaan next-auth (30 hari) |
| Bayar | Midtrans Snap, satu akun platform | Webhook gagal tertutup bila kunci server kosong |
| Hosting | Vercel `sin1`, deploy otomatis dari `main` | Satu cron harian 06.00 WIB |
| Email | Resend (masuk lewat webhook, keluar lewat API) | Batas kirim 30 per jam |
| Notifikasi | Web push (VAPID) + lonceng dalam aplikasi | Satu pintu: `src/lib/push.ts` |
| File | Supabase Storage (`coach-photos` publik, `coach-certificates` privat) | |
| Cadangan | GitHub Actions: Backup DB (terenkripsi, 30 hari), Backup Storage, Uji Pulih Backup | Backup DB diperbaiki 9 Okt |

## 2. Peran dan hak akses

| Aturan | Dijaga di | Status |
|---|---|---|
| 4 peran (ADMIN, COACH, MEMBER, POOL_OWNER); area `/admin`, `/coach`, `/member`, `/pool`, `/api/admin` hanya untuk perannya | `src/proxy.ts` (lapis 1) + `requireRole()` di tiap halaman dan aksi server (lapis 2) | Cocok |
| Server tidak percaya header dari proxy; peran dan status akun dibaca ulang dari database setiap `auth()` | `src/auth.ts` (callback jwt), `src/lib/require-role.ts` | Cocok |
| Akun nonaktif atau `sessionVersion` berubah (ganti/reset password) = sesi langsung mati | `src/auth.ts` | Cocok |
| Gerbang berurutan: ganti password sementara, 2FA admin, perjanjian mitra (rev.3), lalu kota (member/coach) | proxy + `requireRole()`; kota di layout member/coach | Cocok untuk halaman peran; **celah ringan T9**: batal booking member (`api/booking/[id]`), aksi Profil, dan aksi milestone hanya memakai `auth()` tanpa cek password sementara |
| Aksi pada data milik orang lain ditolak (contoh: coach hanya menandai sesinya sendiri, member hanya membatalkan booking-nya) | Pemeriksaan pemilik di tiap aksi (contoh `cancel-booking.ts`, `riwayat-sesi/actions.ts`) | Cocok (uji 445 sel, 3 Okt) |
| Milestone: member melihat pesertanya, coach melihat peserta yang pernah dilatih dan mengisi setelah 1 sesi Hadir, admin melihat semua, kolam tidak melihat | `src/lib/milestone-data.ts` | Cocok |

## 3. Login dan keamanan akun

| Aturan | Dijaga di | Status |
|---|---|---|
| Kunci 15 menit: 3x salah per jaringan+akun, 10x per akun, 20x per jaringan | `src/lib/authorize.ts`, `src/lib/rate-limit.ts` (tabel `RateLimitHit`) | Cocok |
| Akun belum disetujui tidak dihitung salah password; pesan login menyebut kemungkinan belum diaktifkan admin | `authorize.ts`, `login-form.tsx` | Cocok |
| Admin wajib 2FA (TOTP), rahasia dienkripsi; kode sekali pakai | `src/lib/totp.ts`, `secret-box.ts`, `authorize.ts` | Cocok |
| Rekening bank mitra dienkripsi saat disimpan, dibuka saat admin memproses | `coach/saldo/actions.ts`, `pool/saldo/actions.ts`, `admin/withdrawals/actions.ts` | Cocok (cara enkripsinya belum dicek) |
| Reset password hanya oleh admin (lewat WhatsApp); reset mandiri lewat email belum ada | `admin/users/actions.ts` | Cocok dengan keputusan (P8 menunggu email production) |
| Pendaftaran dibatasi per jaringan + umpan anti-robot (isian tersembunyi, waktu isi minimal) | `api/register*` | Cocok |
| Teks bebas coach yang dibaca member menolak nomor HP, email, tautan chat (9 Okt) | `src/lib/contact-filter.ts` | Cocok; nomor yang ditulis dengan kata lolos |
| Header keamanan dan CSP | `next.config`, `api/csp-report` | Belum dicek di draf ini |

## 4. Uang: sumber kebenaran

- **Buku besar kolam, coach, dan SPH** = tabel `WalletTransaction`. Kolom `walletBalance` di Pool dan CoachProfile hanya cache yang diubah dalam transaksi yang sama dengan baris buku besarnya (`src/lib/wallet.ts`). Saldo boleh minus (keputusan 29 Sep), tertutup oleh sesi berikutnya.
- **Saldo member** = tabel `MemberWalletTransaction` (COACH_CHANGE_CREDIT, PURCHASE, PURCHASE_REFUND). Hanya untuk membeli paket, tidak bisa ditarik, tanpa masa berlaku (status hangus menunggu akuntan).
- **Pendapatan diakui saat sesi ditandai**, bukan saat bayar. Uang pembayaran yang belum terpakai sesi tidak tercatat di buku besar siapa pun.
- Penyimpanan uang SPH dan titipan PPh: tidak ada rekening terpisah di sistem; bagian SPH tercatat sebagai PLATFORM_REVENUE + PLATFORM_TAX, titipan PPh sebagai PPH_WITHHELD.

## 5. Uang: alur dan aturannya

| Aturan | Dijaga di | Status |
|---|---|---|
| Harga dihitung server dari harga kolam + coach yang tersimpan; biaya layanan dikunci maks 6,9% | `pricing.ts`, `api/payment/checkout` | Cocok |
| Beli paket: saldo member dipakai dulu; sisa lewat Midtrans; saldo cukup = paket langsung aktif (Payment SUCCESS Rp0) | `checkout/route.ts` (dalam satu transaksi + kunci akun) | Cocok |
| Klik beli dobel dalam 1 menit untuk barang yang sama ditolak | `checkout/route.ts` (`withDedupeLock`) | Cocok |
| Notifikasi Midtrans: status SUCCESS tidak bisa diubah notifikasi berikutnya (klaim bersyarat); jumlah tidak cocok = ditahan untuk admin | `api/payment/webhook` | Cocok |
| Bayar gagal/kedaluwarsa: paket berakhir, saldo member yang terpakai kembali; lunas belakangan = aktif lagi dan saldo ditarik lagi | webhook + `stale-payments.ts` | Cocok |
| Pembayaran Menunggu ditutup setelah 24 jam 15 menit oleh pemeriksa harian | `stale-payments.ts` | Cocok; bisa sampai ±2 hari karena pemeriksa sekali sehari |
| Per sesi Hadir: kolam dan coach dapat harga masing-masing ÷ jumlah sesi (dibulatkan ke bawah), dipotong PPh 0,5% kecuali bebas potongan; sisa ke SPH, dipisah PPN 11% | `wallet.ts` (`creditFixedSplit`), `pricing.ts` (`sessionSplit`) | Cocok |
| Dasar pembagian = harga yang tersimpan di paket (bukan uang tunai), jadi paket yang dibayar saldo tetap membagi benar; setelah ganti coach, sesi coach lama memakai harga lama | `riwayat-sesi/actions.ts`, `coach-change.ts` (`pricesForSessionCoach`) | Cocok |
| Tidak Hadir: coach 50%, kolam Rp0; ganti tanda membalik baris lama persis lalu mencatat ulang | `wallet.ts` (`reverseSessionRevenue`) | Cocok |
| Paket pemberian admin: tanpa Payment, sesi tidak membagi uang | `riwayat-sesi/actions.ts` | Cocok |
| Uang SPH ditahan 3 hari sebelum boleh ditarik | `platform-wallet.ts` | Cocok |
| Tarik Saldo: minimal Rp50.000, saldo dipotong saat pengajuan (klaim bersyarat), baris WITHDRAWAL tercatat; gagal = saldo kembali; Tandai Dibayar wajib nomor referensi transfer; lewat 7 hari kerja ditandai | `withdrawal.ts`, `admin/withdrawals/actions.ts`, `withdrawal-deadline.ts` | Cocok |
| Tarik Saldo coach ditolak bila ada peserta yang sudah 2 sesi Hadir tanpa catatan (sesi sejak 1 Okt) | `withdrawal.ts`, `milestone-hold.ts` | Cocok |
| Koreksi saldo admin dengan alasan, tercatat di buku besar, pemilik diberi tahu | `wallet-adjustment.ts` | Cocok |
| Afiliasi: sekali per member, 50% biaya layanan bersih paket berbayar pertama, tertunda sampai sesi Hadir pertama + 3 hari, dibayar dari bagian SPH | `affiliate.ts` | Cocok; lihat celah T3 |
| Rekap PPh per mitra per bulan | `pph-recap.ts`, `api/admin/pph-rekap` | Cocok |
| **Pengembalian dana (refund)** | Tidak ada | **Celah T1** |

## 6. Booking, jadwal, dan kehadiran

| Aturan | Dijaga di | Status |
|---|---|---|
| Satu coach satu slot per jam di semua kolam | indeks unik `Availability(coachId, date, startTime)` | Cocok |
| Coach membuka jam hanya di kolam pilihannya dan di dalam jam buka kolam; jam buka kosong = ditolak + pemilik kolam diberi tahu | `coach/jadwal/actions.ts` | Cocok |
| Booking: klaim slot bersyarat (dua member bersamaan = satu yang menang); jam lewat, kolam/coach/akun nonaktif, pengajuan hapus akun, di luar jam buka, kapasitas harian penuh = ditolak | `api/booking/route.ts` | Cocok |
| Paket harus untuk coach dan kolam itu, masih ada sisa, dan berlaku pada tanggal sesinya; sisa sesi berkurang saat booking | `api/booking/route.ts` | Cocok |
| Batal member: paling lambat 2 jam sebelum, sesuai jatah, terkunci baris paket; coach batal: tanpa jatah, jam ditutup, sesi yang sudah mulai ditolak | `cancel-booking.ts` | Cocok |
| Tandai Hadir/Tidak Hadir setelah sesi selesai, coach paling lambat 24 jam (lewat itu admin); klaim bersyarat supaya tidak dobel kredit dan tidak menandai booking yang baru dibatalkan | `riwayat-sesi/actions.ts` | Cocok |
| Member melapor "Tidak Hadir" salah dalam 3 hari, admin memutuskan | `attendance-report.ts` | Cocok |
| Coach tampil di Paket bila punya minimal 4 jam kosong dalam 14 hari; dicek ulang saat bayar | `coach-open-slots.ts`, `checkout/route.ts` | Cocok |
| Penjaga jadwal: hari ke-2 coach diingatkan, hari ke-10 member + admin diberi tahu, ganti tanpa biaya (paket berbayar saja), 1 catatan pelanggaran per kejadian, bukan salah coach bila kolam nonaktif / coach dilepas | `coach-slot-watch.ts` | Cocok |
| Lepas kolam ditolak selama masih ada paket aktif, menunggu bayar, atau pengajuan ganti coach | `coach-pools.ts` | Cocok |
| Pengingat sebelum sesi 18.00 + 06.00 WIB | Belum ada | Disetujui, akan dibuat (tahap B) |

## 7. Paket dan ganti coach

| Aturan | Dijaga di | Status |
|---|---|---|
| Status paket: PENDING_PAYMENT, ACTIVE, EXPIRED. Paket aktif yang lewat masa berlakunya TIDAK diubah statusnya; semua pemakaian memeriksa tanggal dan sisa sesi | `active-package.ts` | Cocok; lihat T5 |
| Admin bisa mengubah paket (status, sisa sesi) lewat menu Paket | `admin/paket/actions.ts` | Lihat T11 |
| Sesi coba: hanya peserta yang belum pernah punya paket, dicek di dalam kunci yang sama | `trial.ts`, `checkout/route.ts` | Cocok |
| Ganti coach biasa: diajukan member, disetujui admin; booking coach lama yang belum mulai dibatalkan; selisih lebih murah ke saldo member, lebih mahal tambah bayar 24 jam | `coach-change.ts` (kunci baris User dan pengajuan) | Cocok |
| Ganti coach tanpa biaya hari ke-10: sekolam atau kolam lain sekota, nilai per sesi sama/lebih murah | `coach-change-rules.ts`, `free-change-actions.ts` | Cocok |
| Paket pemberian admin tidak bisa diganti lewat pengajuan | `coach-change.ts` | Cocok |

## 8. Akun dan data pribadi

| Aturan | Dijaga di | Status |
|---|---|---|
| Hapus akun: diajukan member, disetujui admin; ditolak bila ada pembayaran Menunggu; akun dianonimkan (nama, HP, email, peserta, IP), riwayat uang dan arsip chat tetap; lonceng ikut dihapus | `account-deletion.ts` | Cocok; tapi paketnya tidak diakhiri (T8) |
| Chat bantuan: pengguna melihat 90 hari terakhir, arsip disimpan untuk sengketa | `api/chat`, `chat-ai.ts` | Cocok |
| Lonceng dihapus setelah 90 hari | `notifications.ts` lewat pemeriksa harian | Cocok |
| Salinan data production ke lokal disamarkan | `scripts/dev-db-sanitize.mjs` | Cocok |

## 9. Notifikasi dan pemeriksa harian

- Semua notifikasi lewat `push.ts`: tersimpan di lonceng lalu dikirim sebagai push. Gagal kirim tidak menggagalkan aksi utamanya.
- Pemeriksa harian `/api/cron/harian` (06.00 WIB, kunci `CRON_SECRET`, gagal tertutup) menjalankan berurutan: penjaga jadwal, hapus lonceng lama, tutup pembayaran Menunggu. Lihat celah T2. Belum terbukti jalan di Vercel (tugas Hadi: cek log).
- Notifikasi baru yang disetujui (tahap B): pengingat sesi, mitra disetujui/ditolak, Hadir/Tidak Hadir ke member, paket mau berakhir, chat diteruskan ke admin, laporan coach.

## 10. Pengujian dan rilis

- Wajib sebelum kirim: cek penulisan kode, 919 tes otomatis (per 10 Okt), versi jadi. Tes balapan (±209) untuk booking, paket, uang. Uji alur penuh di GitHub.
- Uang, booking, login, skema: pemeriksa kedua berkonteks segar + tes sebelum dikirim.
- Migrasi baru: Hadi menjalankannya di production lebih dulu, baru kode dikirim.
- Pelajaran 8 Okt: uji versi jadi dengan data berbentuk asli sebelum tayang.

## 11. Celah dan temuan

| # | Tingkat | Temuan | Dampak bisnis | Usulan |
|---|---|---|---|---|
| T1 | Berat (uang) | Belum ada jalur pengembalian dana. Admin bisa mengakhiri paket lewat menu Paket, tapi: (a) booking yang sudah terjadwal tidak ikut batal, dan Tandai Hadir tidak memeriksa status paket, jadi kolam dan coach tetap dibayar dari paket yang dananya sudah dikembalikan; (b) tidak ada catatan refund untuk akuntan; (c) Kebijakan Pengembalian menjanjikan bagian yang dibayar saldo dikembalikan ke saldo member, tapi admin tidak punya alat untuk itu; (d) notifikasi refund dari Midtrans diabaikan. | Uang bisa keluar dua kali: ke member (refund) dan ke kolam/coach (sesi tetap dibayar). | Tombol admin "Kembalikan Dana": akhiri paket, batalkan booking mendatang, catat jumlah refund, kembalikan bagian saldo member ke saldo. Transfer uangnya tetap manual lewat Midtrans. Butuh keputusan Hadi. |
| T2 | Sedang | Pemeriksa harian: bila penjaga jadwal error, pekerjaan berikutnya (hapus lonceng lama, tutup pembayaran Menunggu) ikut tidak jalan hari itu. Penutupan pembayaran juga dibatasi 50 per putaran. | Pembayaran Menunggu dan saldo member yang tertahan baru dilepas besoknya. | Bungkus penjaga jadwal seperti pekerjaan lain; ulangi putaran sampai habis. |
| T3 | Ringan-sedang (uang) | Komisi afiliasi yang sudah lewat masa tunggu baru masuk saldo saat halaman dasbor, Saldo, atau Afiliasi dibuka. Penarikan uang SPH oleh admin tidak memperhitungkan komisi yang belum cair. | Admin bisa menarik uang yang sebenarnya utang komisi, lalu saldo SPH jadi minus saat komisi cair. | Cairkan komisi di pemeriksa harian dan sebelum penarikan SPH; kurangi saldo yang bisa ditarik dengan komisi yang masih tertunda. |
| T4 | Ringan | Komentar skema database masih menyebut "komisi afiliasi 5%" (3 tempat). | Bisa menyesatkan asisten lain. | Perbaiki komentar (tanpa migrasi). |
| T5 | Ringan | Status paket yang lewat masa berlaku tetap ACTIVE; keamanan bergantung pada setiap kueri memeriksa tanggal. | Kueri baru yang lupa memeriksa tanggal bisa menganggap paket berakhir masih aktif. | Dicatat di aturan kerja; tidak diubah sekarang. |
| T6 | Sedang (login) | Lama sesi login 30 hari (bawaan) untuk semua peran termasuk admin, dan kemungkinan diperpanjang otomatis setiap dipakai (dugaan, belum diuji). | Admin yang lupa keluar di perangkat lain tetap masuk tanpa batas; 2FA hanya diminta saat masuk. | Admin wajib masuk ulang berkala. Butuh keputusan Hadi. |
| T7 | Belum dicek | Header keamanan dan cara enkripsi rekening tidak diperiksa ulang (terakhir diuji 25-29 Sep). | | Masuk sweeping sistem (tahap C). |
| T8 | Sedang | Paket milik akun yang dihapus atau dinonaktifkan tetap "hidup": penjaga jadwal tetap memperingatkan coach dan mencatat pelanggaran untuk member yang sudah tidak ada, dan coach tidak bisa melepas kolam sampai paket itu berakhir (sampai 90 hari). | Contoh: member paket 8 sesi dihapus di hari ke-5; coach-nya ditolak saat melepas kolam dan dapat catatan pelanggaran di hari ke-10. | Butuh keputusan Hadi: nasib paket saat akun dihapus / dinonaktifkan. |
| T9 | Ringan | Batal booking member, aksi Profil, dan aksi milestone tidak memeriksa password sementara. | Akun dengan password sementara bisa melakukan tiga hal itu tanpa mengganti password dulu; tidak menyentuh uang. | Tambah pemeriksaan yang sama dengan aksi lain. |
| T10 | Sedang (tergantung keputusan) | Coach yang dinonaktifkan admin tetap dicatat melanggar "tidak membuka jadwal" oleh penjaga jadwal. | Catatan pelanggaran menumpuk untuk coach yang sedang dinonaktifkan. | Butuh keputusan Hadi: dianggap salah coach atau bukan. |
| T11 | Ringan (kewenangan admin) | Edit Paket admin bisa menaikkan sisa sesi sampai jumlah penuh walau sesi sudah terpakai; tiap sesi tambahan tetap membagi uang ke kolam dan coach. | Kolam dan coach bisa dibayar melebihi yang dibayar member karena salah ketik admin. | Batasi sisa sesi maksimal = jumlah sesi dikurangi yang sudah terpakai. |
| T12 | Ringan (belum aktif) | Jalur penarikan otomatis (Midtrans Iris): Proses dan Tolak yang diklik bersamaan bisa membuat transfer jalan sementara saldo dikembalikan. | Tidak terjadi sekarang karena Iris belum aktif. | Wajib ditutup sebelum penarikan otomatis dinyalakan. |

Pemeriksa kedua juga melaporkan dua dugaan yang ternyata bukan masalah: berkas aksi ganti coach yang tampak tanpa cek peran (semua pemanggilnya memakai requireRole), dan booking yang tidak memeriksa status aktif profil coach (status itu tidak pernah diubah kode). Tidak diperiksa pemeriksa kedua: milestone-data, contact-filter, pendaftaran, rekap PPh, header keamanan, coach-open-slots, aksi admin kolam dan ganti coach.

## Riwayat dokumen
- 10 Okt 2026: draf 1 (Claude, Opus 5.5) dari kode commit 68b9ceb, docs/aturan-bisnis-saat-ini.md, docs/HANDOFF-AGEN.md, KEPUTUSAN. Belum diperiksa Opus kedua.
- 10 Okt 2026: draf 2 setelah pemeriksa Opus kedua berkonteks segar (65 pemeriksaan kode): T1 ditulis ulang, T3 naik tingkat, T6 jadi sedang, T7 sebagian ditutup, temuan baru T8-T12. Dua temuan terpenting (T8, T3) dicocokkan ulang sendiri oleh penulis.
