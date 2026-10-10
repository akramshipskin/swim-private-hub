# TRD SPH: aturan teknis dan di mana sistem menjaganya

Status: DISETUJUI Hadi 11 Okt 2026 (draf 3, diperiksa dua pemeriksa Opus berkonteks segar). Keputusan atas semua temuan yang butuh Hadi ada di docs/KEPUTUSAN.md (10 Okt malam dan 11 Okt); ringkasannya di bagian 12. Dokumen 4 dari 6 (PRD dan Alur Aplikasi sudah disetujui; brief desain ditunda, Hadi 10 Okt).

Isi: setiap aturan penting ditulis bersama tempat kode menjaganya dan statusnya. Dicek dengan membaca kode pada commit 68b9ceb, belum dijalankan ulang satu per satu. Bukti uji yang sudah ada: sweeping sistem 3 Okt malam (445 sel hak akses 0 bocor, audit uang cocok, 4 pemeriksa Opus 0 berat) dan 6 Okt (440 sel 0 bocor, 835 tes + 200 tes balapan). Angka aturan tidak ditulis ulang di sini; sumbernya `src/lib/policy.ts` dan `src/lib/pricing.ts`, aturan bisnisnya `docs/aturan-bisnis-saat-ini.md`.

Tanda status: **Cocok** = kode sama dengan keputusan Hadi. **Celah** = ada yang tidak dijaga atau menyimpang (bagian 11). **Belum dicek** = tidak diperiksa di draf ini.

## 1. Tumpukan dan lingkungan

| Bagian | Pilihan | Catatan |
|---|---|---|
| Aplikasi | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 | Penjaga rute bernama `src/proxy.ts` (bukan middleware) |
| Database | PostgreSQL di Supabase, Prisma 7 + adapter pg | 44 migrasi; terakhir `20261004120000_notifikasi_lonceng` (sudah di production) |
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
| Milestone: member melihat pesertanya; coach boleh melihat bila punya booking apa pun dengan peserta itu (termasuk yang belum terjadi) dan baru boleh mengisi setelah 1 sesi Hadir; admin melihat semua; kolam tidak melihat | `src/lib/milestone-data.ts` | Cocok |

## 3. Login dan keamanan akun

| Aturan | Dijaga di | Status |
|---|---|---|
| Kunci 15 menit: 3x salah per jaringan+akun, 10x per akun, 20x per jaringan | `src/lib/authorize.ts`, `src/lib/rate-limit.ts` (tabel `RateLimitHit`) | Cocok |
| Akun belum disetujui tidak dihitung salah password; pesan login menyebut kemungkinan belum diaktifkan admin | `authorize.ts`, `login-form.tsx` | Cocok |
| Admin wajib 2FA (TOTP), rahasia dienkripsi; kode sekali pakai | `src/lib/totp.ts`, `secret-box.ts`, `authorize.ts` | Cocok |
| Rekening bank mitra dienkripsi saat disimpan, dibuka saat admin memproses | `coach/saldo/actions.ts`, `pool/saldo/actions.ts`, `admin/withdrawals/actions.ts` | Cocok (cara enkripsinya belum dicek) |
| Reset password hanya oleh admin (lewat WhatsApp); reset mandiri lewat email belum ada | `admin/users/actions.ts` | Cocok dengan keputusan (P8 menunggu email production) |
| Pendaftaran dibatasi per jaringan + umpan anti-robot (isian tersembunyi, waktu isi minimal) | `api/register*` | Sebagian: cek "HP/email sudah terdaftar" berjalan sebelum batas per jaringan, dan pemeriksa waktu isi bisa dilewati dengan tidak mengirim isiannya (T16) |
| Teks bebas coach yang dibaca member menolak nomor HP, email, tautan chat (9 Okt) | `src/lib/contact-filter.ts` di bio, catatan sertifikasi, catatan perkembangan, keterampilan tambahan | Sebagian: belum dipasang di nama akun, deskripsi kolam, dan nama sertifikat; nomor yang ditulis dengan kata lolos (T15) |
| Header keamanan dan CSP | `next.config`, `api/csp-report` | Cocok (HSTS diduga dari Vercel, belum dicek) |
| Webhook email masuk memverifikasi tanda tangan; isi email HTML ditampilkan di bingkai tanpa skrip | `api/webhooks/resend-inbound`, `admin/email/email-body.tsx` | Cocok |
| Unggah file: jenis dan isi awal file dicek, maks 3 MB, sertifikat dibuka lewat tautan sementara 10 menit | `src/lib/storage.ts` | Cocok (pengaturan bucket di Supabase belum dicek) |
| Ganti rekening bank mitra | `coach/saldo/actions.ts`, `pool/saldo/actions.ts` | Celah T13 |

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
| Lepas kolam ditolak selama masih ada paket aktif, menunggu bayar, atau pengajuan ganti coach | `coach-pools.ts` | Cocok untuk coach; admin bisa mencopot coach dari kolam walau masih ada paket aktif (T17) |
| Daftar jam kosong (`api/availability`) | bisa dipanggil peran apa pun yang sudah masuk, tanpa wajib kolam | Celah T14 |
| Pengingat sebelum sesi 18.00 + 06.00 WIB | Belum ada | Disetujui, akan dibuat (tahap B) |

## 7. Paket dan ganti coach

| Aturan | Dijaga di | Status |
|---|---|---|
| Status paket: PENDING_PAYMENT, ACTIVE, EXPIRED. Paket aktif yang lewat masa berlakunya TIDAK diubah statusnya; semua pemakaian memeriksa tanggal dan sisa sesi | `active-package.ts` | Cocok; lihat T5 |
| Admin bisa mengubah paket (status, sisa sesi) lewat menu Paket | `admin/paket/actions.ts` | Lihat T11 |
| Sesi coba: hanya peserta yang belum pernah punya paket, dicek di dalam kunci yang sama | `trial.ts`, `checkout/route.ts` | Cocok |
| Ganti coach biasa: diajukan member, disetujui admin; booking coach lama yang belum mulai dibatalkan; selisih lebih murah ke saldo member, lebih mahal tambah bayar 24 jam | `coach-change.ts` (kunci baris User dan pengajuan) | Cocok |
| Ganti coach tanpa biaya hari ke-10: sekolam atau kolam lain sekota, nilai per sesi sama/lebih murah | `coach-change.ts` (`freeCoachChange`), `free-change-actions.ts` | Cocok |
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

- Wajib sebelum kirim: cek penulisan kode, 919 tes otomatis (hasil jalan terakhir 10 Okt; 112 berkas tes), versi jadi. Tes balapan (±209) untuk booking, paket, uang. Uji alur penuh di GitHub.
- Uang, booking, login, skema: pemeriksa kedua berkonteks segar + tes sebelum dikirim.
- Migrasi baru: Hadi menjalankannya di production lebih dulu, baru kode dikirim.
- Pelajaran 8 Okt: uji versi jadi dengan data berbentuk asli sebelum tayang.

## 11. Celah dan temuan

| # | Tingkat | Temuan | Dampak bisnis | Usulan |
|---|---|---|---|---|
| T1 | Berat (uang) | Belum ada jalur pengembalian dana. Admin bisa mengakhiri paket lewat menu Paket, tapi: (a) booking yang sudah terjadwal tidak ikut batal, dan Tandai Hadir tidak memeriksa status paket, jadi kolam dan coach tetap dibayar dari paket yang dananya sudah dikembalikan; (b) tidak ada catatan refund untuk akuntan; (c) Kebijakan Pengembalian menjanjikan bagian yang dibayar saldo dikembalikan ke saldo member, tapi admin tidak punya alat untuk itu; (d) notifikasi refund dari Midtrans diabaikan. | Uang bisa keluar dua kali: ke member (refund) dan ke kolam/coach (sesi tetap dibayar). Tambahan pemeriksa 2: komisi afiliasi dari paket yang direfund tetap cair; isian status di Edit Paket tidak divalidasi, jadi admin bisa mengubah paket Menunggu Pembayaran jadi Aktif tanpa bayar. | Tombol admin "Kembalikan Dana": akhiri paket, batalkan booking mendatang, catat jumlah refund, kembalikan bagian saldo member ke saldo. Transfer uangnya tetap manual lewat Midtrans. Butuh keputusan Hadi. |
| T2 | Sedang | Pemeriksa harian: bila penjaga jadwal error, pekerjaan berikutnya (hapus lonceng lama, tutup pembayaran Menunggu) ikut tidak jalan hari itu. Penutupan pembayaran juga dibatasi 50 per putaran. | Pembayaran Menunggu dan saldo member yang tertahan baru dilepas besoknya. | Bungkus penjaga jadwal seperti pekerjaan lain; ulangi putaran sampai habis. Pemeriksa 2: pembayaran yang sengaja ditahan (jumlah tidak cocok) ikut memakan jatah 50; bila ada 50 baris seperti itu, penutupan berhenti total. |
| T3 | Ringan-sedang (uang) | Komisi afiliasi yang sudah lewat masa tunggu baru masuk saldo saat halaman dasbor, Saldo, atau Afiliasi dibuka. Penarikan uang SPH oleh admin tidak memperhitungkan komisi yang belum cair. | Admin bisa menarik uang yang sebenarnya utang komisi, lalu saldo SPH jadi minus saat komisi cair. | Cairkan komisi di pemeriksa harian dan sebelum penarikan SPH; kurangi saldo yang bisa ditarik dengan komisi yang masih tertunda. |
| T4 | Ringan | Komentar skema database masih menyebut "komisi afiliasi 5%" (3 tempat). | Bisa menyesatkan asisten lain. | Perbaiki komentar (tanpa migrasi). |
| T5 | Ringan | Status paket yang lewat masa berlaku tetap ACTIVE; keamanan bergantung pada setiap kueri memeriksa tanggal. | Kueri baru yang lupa memeriksa tanggal bisa menganggap paket berakhir masih aktif. | Dicatat di aturan kerja; tidak diubah sekarang. |
| T6 | Sedang (login) | Lama sesi login 30 hari (bawaan) untuk semua peran termasuk admin, dan kemungkinan diperpanjang otomatis setiap dipakai (dugaan, belum diuji). | Terbukti (pemeriksa 2): sesi diperpanjang otomatis setiap dibaca, jadi admin yang aktif tidak pernah keluar. | Diputuskan Hadi: admin masuk ulang dengan 2FA setiap 14 hari. Cara teknis: penanda waktu masuk tersendiri yang diisi saat login (penanda bawaan diisi ulang tiap perpanjangan, tidak bisa dipakai). |
| T7 | Belum dicek | Header keamanan dan cara enkripsi rekening tidak diperiksa ulang (terakhir diuji 25-29 Sep). | | Masuk sweeping sistem (tahap C). |
| T8 | Sedang | Paket milik akun yang dihapus atau dinonaktifkan tetap "hidup": penjaga jadwal tetap memperingatkan coach dan mencatat pelanggaran untuk member yang sudah tidak ada, dan coach tidak bisa melepas kolam sampai paket itu berakhir (sampai 90 hari). | Contoh: member paket 8 sesi dihapus di hari ke-5; coach-nya ditolak saat melepas kolam dan dapat catatan pelanggaran di hari ke-10. | Butuh keputusan Hadi: nasib paket saat akun dihapus / dinonaktifkan. |
| T9 | Ringan | Batal booking member, aksi Profil, dan aksi milestone tidak memeriksa password sementara. | Akun dengan password sementara bisa melakukan tiga hal itu tanpa mengganti password dulu; tidak menyentuh uang. Pemeriksa 2: chat bantuan juga, dan aksi coach di Profil (bio, foto, sertifikat, tanda tangan) tidak memeriksa perjanjian mitra. | Tambah pemeriksaan yang sama dengan aksi lain. |
| T10 | Sedang (tergantung keputusan) | Coach yang dinonaktifkan admin tetap dicatat melanggar "tidak membuka jadwal" oleh penjaga jadwal. | Catatan pelanggaran menumpuk untuk coach yang sedang dinonaktifkan. | Butuh keputusan Hadi: dianggap salah coach atau bukan. |
| T11 | Ringan (kewenangan admin) | Edit Paket admin bisa menaikkan sisa sesi sampai jumlah penuh walau sesi sudah terpakai; tiap sesi tambahan tetap membagi uang ke kolam dan coach. | Kolam dan coach bisa dibayar melebihi yang dibayar member karena salah ketik admin. | Batasi sisa sesi maksimal = jumlah sesi dikurangi yang sudah terpakai. |
| T12 | Ringan (belum aktif) | Jalur penarikan otomatis (Midtrans Iris): Proses dan Tolak yang diklik bersamaan bisa membuat transfer jalan sementara saldo dikembalikan. | Tidak terjadi sekarang karena Iris belum aktif. Pemeriksa 2: Tandai Dibayar manual saat Iris memproses juga bisa membuat transfer dua kali. | Wajib ditutup sebelum penarikan otomatis dinyalakan. |

| T13 | Sedang (uang) | Rekening bank coach dan kolam bisa diganti tanpa konfirmasi password dan tanpa pemberitahuan ke pemiliknya, lalu langsung bisa ajukan Tarik Saldo. | Contoh: sesi login coach dipakai orang lain, rekening diganti, saldo Rp2.000.000 ditarik ke rekening orang itu. Penjaganya hanya mata admin saat transfer manual. | Butuh keputusan Hadi (lihat Pertanyaan). |
| T14 | Sedang (data) | Daftar jam kosong bisa dibuka peran apa pun yang sudah masuk untuk kolam mana pun. | Pemilik kolam bisa melihat jadwal, nama coach, dan kepadatan booking kolam lain. | Butuh keputusan Hadi: boleh atau dibatasi. |
| T15 | Ringan-sedang | Penyaring kontak (9 Okt) belum dipasang di nama akun coach, deskripsi kolam, dan nama sertifikat. | Nomor WA bisa ditulis di nama atau deskripsi, bertentangan dengan keputusan "nomor coach tidak boleh sampai ke member". | Pasang penyaring yang sama (perbaikan teknis). |
| T16 | Ringan | Pendaftaran: cek nomor HP/email terdaftar berjalan sebelum batas per jaringan, dan pemeriksa waktu isi bisa dilewati. | Siapa pun bisa mengecek apakah nomor HP terdaftar, tanpa batas. | Pindah urutan; wajibkan isian waktu (perbaikan teknis). |
| T17 | Ringan | Admin bisa mencopot coach dari kolam walau masih ada paket aktif; coach sendiri ditolak untuk hal yang sama. | Paket member bisa kehilangan coach-nya di kolam itu (dihitung penjaga jadwal sebagai bukan salah coach). | Butuh keputusan Hadi: admin boleh atau ditolak seperti coach. |
| T18 | Ringan | Akun coach, pemilik kolam, dan admin yang dibuat admin tidak wajib ganti password saat pertama masuk (hanya member). | Admin tahu password mereka seterusnya. | Butuh keputusan Hadi. |
| T19 | Ringan | Menonaktifkan pemilik kolam tidak menonaktifkan kolamnya; kolam tetap menerima booking. | Bisa disengaja (kolam tetap jalan) atau tidak. | Butuh keputusan Hadi. |
| T20 | Ringan (teknis) | Buat akun oleh admin tidak memvalidasi peran; chat bantuan error 500 bila isinya bukan teks; panjang tag enkripsi tidak dipaksa (hanya berbahaya bila database sudah dibobol). | | Perbaikan teknis kecil. |
| T21 | Ringan | Rekap PPh tidak mengisi kolom Kontak untuk kolam. Hitungan PPh-nya sendiri benar. | Rekap untuk akuntan kurang lengkap. | Perbaikan teknis kecil. |

Dugaan yang ternyata aman (dua pemeriksa): berkas aksi ganti coach tanpa cek peran (semua pemanggilnya memakai requireRole); booking tidak memeriksa status aktif profil coach (status itu tidak pernah diubah); header dari proxy tidak dibaca di mana pun; webhook email masuk memverifikasi tanda tangan; enkripsi rekening AES-256-GCM dengan IV acak; unggah file dicek jenis dan isinya; lonceng selalu disaring per pengguna; kunci cron memakai perbandingan waktu-tetap; hitungan jam kosong coach dan ganti coach tanpa biaya benar.

Belum diperiksa siapa pun: pengaturan bucket Supabase (tidak terlihat dari kode), apakah rekening lama sudah dienkripsi ulang, HSTS di Vercel, isi `push.ts`.

## 12. Keputusan Hadi atas temuan (dikerjakan di tahap B)

| # | Keputusan |
|---|---|
| T1 | Tombol admin "Kembalikan Dana": akhiri paket, batalkan booking mendatang, catat jumlah refund, bagian saldo kembali ke saldo member; transfer manual lewat Midtrans. Ikut ditutup: komisi afiliasi paket yang direfund, status Edit Paket divalidasi. |
| T6 | Admin wajib masuk ulang dengan 2FA setiap 14 hari. |
| T8 | Hapus akun disetujui = paket diakhiri, sisa sesi hangus. Akun dinonaktifkan = paketnya dikecualikan dari penjaga jadwal. |
| T10 | Coach yang dinonaktifkan admin = bukan salah coach. |
| T11 | Sisa sesi di Edit Paket maksimal jumlah sesi dikurangi yang sudah terpakai. |
| T13 | Ganti rekening bank wajib password + pemilik diberi tahu (tanpa penahanan 24 jam). |
| T14 | Pemilik kolam hanya melihat jadwal kolamnya sendiri. |
| T17 | Admin tetap boleh mencopot coach dari kolam dengan peringatan bila masih ada paket aktif. |
| T18 | Akun coach, pemilik kolam, admin yang dibuat admin wajib ganti password saat pertama masuk. |
| T19 | Pemilik kolam dinonaktifkan = kolamnya ikut nonaktif. |
| Lainnya | T2, T3, T4, T9, T12, T15, T16, T20, T21: perbaikan teknis oleh Claude (T5 dicatat saja, T7 masuk sweeping sistem). |

## Riwayat dokumen
- 10 Okt 2026: draf 1 (Claude, Opus 5.5) dari kode commit 68b9ceb, docs/aturan-bisnis-saat-ini.md, docs/HANDOFF-AGEN.md, KEPUTUSAN. Belum diperiksa Opus kedua.
- 10 Okt 2026: draf 2 setelah pemeriksa Opus kedua berkonteks segar (65 pemeriksaan kode): T1 ditulis ulang, T3 naik tingkat, T6 jadi sedang, T7 sebagian ditutup, temuan baru T8-T12. Dua temuan terpenting (T8, T3) dicocokkan ulang sendiri oleh penulis.
- 10 Okt 2026: draf 3 setelah pemeriksa Opus kedua (67 pemeriksaan kode): koreksi jumlah migrasi (44), tempat aturan ganti coach gratis, hak lihat milestone coach, klaim pendaftaran dan penyaring kontak; T1, T2, T3, T6, T9, T12 diperluas; T13-T21 baru. Temuan T13 (rekening) dan T14 (jadwal) dicocokkan ulang sendiri oleh penulis.
- 11 Okt 2026: DISETUJUI Hadi setelah keputusan T13, T14, T17, T18, T19; ditambah bagian 12.
