# Skema Data SPH: apa yang disimpan, di mana, dan apa yang berubah di tahap B

Status: DRAF 2 (11 Okt 2026, Claude Opus 5.5), sudah diperiksa Opus kedua berkonteks segar (hasilnya dimasukkan), menunggu keputusan dan tinjauan Hadi. Dokumen 5 dari 6. Sumber: `prisma/schema.prisma` pada commit 642e2d3 (35 tabel, 19 jenis isian tetap/enum, 44 migrasi; terakhir `20261004120000_notifikasi_lonceng`, sudah di production). Aturan teknisnya di `docs/TRD.md`.

Cara baca: tiap tabel dijelaskan dengan bahasa biasa. Kolom yang ditulis hanya yang penting untuk aturan bisnis. Uang selalu disimpan dalam rupiah bulat (tanpa sen).

## 1. Peta besar

| Kelompok | Tabel | Isi singkat |
|---|---|---|
| Akun | User, CoachProfile, PushSubscription, RateLimitHit | Semua orang yang masuk, profil coach, langganan notifikasi HP, catatan percobaan login/daftar |
| Kolam | Pool, PoolOwnership, PoolAffiliation | Kolam, pemiliknya, coach yang memilih mengajar di sana |
| Peserta & paket | Dependent, Package, Payment, CityWaitlist | Peserta (anak/diri sendiri), paket yang dibeli, pembayaran Midtrans, daftar tunggu kota |
| Jadwal | Availability, Booking, AttendanceReport | Jam kosong coach, booking, laporan "Tidak Hadir" yang salah |
| Uang | WalletTransaction, WithdrawalRequest, PlatformWithdrawal, PphRemittance, MemberWalletTransaction, AffiliateCode, AffiliateCommission | Tiga buku besar (kolam/coach/SPH, saldo member, afiliasi), pengajuan tarik saldo, setoran PPh |
| Ganti coach & disiplin | CoachChangeRequest, CoachViolation, CoachCertificate | Pengajuan ganti coach, catatan pelanggaran tidak membuka jadwal, sertifikat coach |
| Milestone | MilestoneItem, MilestoneAchievement, MilestoneNote, MilestoneLevelCompletion | Daftar keterampilan, yang sudah tercapai, catatan perkembangan, level selesai |
| Komunikasi | InAppNotification, ChatThread, ChatMessage, EmailThread, EmailMessage, Testimonial | Lonceng, chat bantuan, inbox email admin, testimoni landing |
| Model lama | PackageTemplate (+ kolom lama di Pool dan Package) | Tidak dipakai kode lagi (bagian 6) |

## 2. Akun

**User** (satu baris per orang). Kolom penting:
- Identitas: `name`, `phone` (unik), `email` (unik, opsional), `city`.
- Peran dan status: `role` (ADMIN/COACH/MEMBER/POOL_OWNER), `isActive` (nonaktif = tidak bisa masuk; pendaftar coach/kolam baru = nonaktif sampai disetujui), `approvedAt`.
- Keamanan: `passwordHash` (password disimpan teracak, tidak bisa dibaca balik), `mustChangePassword`, `sessionVersion` (naik = semua sesi lama mati), `totpSecret` (rahasia 2FA, terenkripsi), `totpEnabledAt`, `totpLastStep` (kode 2FA sekali pakai).
- Persetujuan: `termsAcceptedAt/Version` (S&K), `partnerAgreementAcceptedAt/Version` (perjanjian coach / MOU kolam).
- Hapus akun: `deletionRequestedAt`, `anonymizedAt`.
- Uang member: `memberBalance` = cache saldo member; sumber kebenarannya MemberWalletTransaction.
- Afiliasi: `referralCodeId` (kode yang dipakai saat daftar), `registeredIp`, `registeredReferer`.

**CoachProfile** (satu per coach): bio, keahlian, foto, tanggal lahir, jenis kelamin, harga paket 4/8, `pphExempt` (sudah menyerahkan surat omzet), `walletBalance` (cache saldo coach), rekening (`bankAccountNumber` terenkripsi), `signaturePath` (tanda tangan untuk sertifikat milestone).

**PushSubscription**: alamat notifikasi HP per perangkat. **RateLimitHit**: catatan percobaan (login salah, daftar) untuk kunci 15 menit.

## 3. Kolam, peserta, paket, jadwal

**Pool**: nama, kota, alamat, `contactPhone` (hanya dilihat pemilik dan admin), jam buka/tutup, `dailyCapacity` (kosong = tanpa batas), deskripsi, fasilitas, foto, harga tiket paket 4/8, `serviceFeeBps` (biaya layanan SPH, 650 = 6,5%), `pphExempt`, `walletBalance` (cache), rekening terenkripsi, `isActive`.
**PoolOwnership**: pemilik kolam ↔ kolam. **PoolAffiliation**: coach ↔ kolam tempat ia mengajar (unik per pasangan).

**Dependent** (peserta): milik satu member, `isSelf` ("Saya"), `birthDate`, `milestoneGroup` (A-D), `isActive`.

**Package**: satu paket untuk satu peserta, satu kolam, satu coach.
- Isi: `totalSesi`, `sisaSesi` (berkurang saat booking), `jatahCancel`, `isTrial`.
- Harga yang disalin saat beli: `poolPrice`, `coachPrice`, `serviceFee`, `durationDays`, `saldoUsed`. Dasar semua pembagian uang sesi.
- Status: PENDING_PAYMENT / ACTIVE / EXPIRED, `startDate`, `expiredDate`. Paket lewat masa berlaku tetap ACTIVE (TRD T5).
- Penjaga jadwal: `noSlotSince` (mulai tanpa jam kosong), `freeCoachChangeAt` (hak ganti tanpa biaya diberikan).

**Payment**: satu tagihan Midtrans (`midtransOrderId` unik), jumlah tunai, status, `paidAt`, isi notifikasi Midtrans terakhir, `metaTracking` (data iklan Meta, dihapus saat akun dihapus). Lunas dari saldo dicatat Payment SUCCESS Rp0.

**Availability** (jam kosong coach): coach, kolam, tanggal, jam mulai/selesai, status. Unik per coach + tanggal + jam (satu coach satu slot per jam di semua kolam).
**Booking**: member, jam, paket, status (BOOKED/CANCELLED; nilai COMPLETED ada tapi tidak dipakai), siapa membatalkan, `attended` (kosong = belum ditandai, ya, tidak), siapa dan kapan menandai.
**AttendanceReport**: laporan member atas "Tidak Hadir" yang salah (satu per booking), status dan keputusan admin.
**CityWaitlist**: member ↔ kota yang ditunggu, `notifiedAt`.

## 4. Uang

Dua buku besar yang isinya hanya ditambah, tidak pernah diubah (koreksi = baris baru): WalletTransaction dan MemberWalletTransaction. AffiliateCommission bukan buku besar, melainkan catatan status yang berubah (WAITING ↔ PENDING → RELEASED); saat cair, komisi dicatat sebagai baris AFFILIATE_COMMISSION berpasangan dengan PLATFORM_REVENUE negatif senilai sama (dibayar dari bagian SPH).

| Buku besar | Pemilik | Jenis baris | Cache saldo |
|---|---|---|---|
| WalletTransaction | kolam (poolId), coach (coachProfileId), SPH (keduanya kosong) | SESSION_REVENUE (kolam), SESSION_PAYOUT (coach), PLATFORM_REVENUE + PLATFORM_TAX (SPH dan PPN-nya), PPH_WITHHELD (potongan PPh, negatif), WITHDRAWAL (tarik saldo, negatif), AFFILIATE_COMMISSION, koreksi admin | Pool.walletBalance, CoachProfile.walletBalance |
| MemberWalletTransaction | member | COACH_CHANGE_CREDIT, PURCHASE (negatif), PURCHASE_REFUND | User.memberBalance |
| AffiliateCommission (catatan status) | pemilik kode afiliasi | satu baris per member yang direferensikan (unik per member): WAITING ↔ PENDING → RELEASED | masuk ke WalletTransaction saat RELEASED |

- `bookingId`, `paymentId`, `withdrawalRequestId` di WalletTransaction menghubungkan tiap baris ke penyebabnya; pembalikan tanda Hadir membaca baris dengan bookingId yang sama.
- **WithdrawalRequest**: pengajuan tarik saldo kolam/coach. Salinan rekening saat pengajuan (nomor terenkripsi), status PENDING/PROCESSING/PAID/FAILED, nomor referensi transfer, alasan gagal.
- **PlatformWithdrawal**: penarikan uang SPH oleh admin (pendapatan + PPN), wajib nomor referensi.
- **PphRemittance**: catatan setoran PPh ke negara.
- **AffiliateCode**: satu kode per coach atau per kolam.

## 5. Ganti coach, disiplin, milestone, komunikasi

- **CoachChangeRequest**: paket, member, coach lama → baru, alasan, status, jumlah sesi, tambah bayar, harga lama (`oldCoachPrice`, `oldServiceFee`, `oldPoolPrice`, supaya sesi lama tetap dibayar harga lama), `free` (ganti tanpa biaya), `saldoUsed`, catatan admin.
- **CoachViolation**: satu baris per kejadian "tidak membuka jadwal" per paket (unik per paket + awal kejadian).
- **CoachCertificate**: nama dan file sertifikat, status (menunggu/disetujui/ditolak).
- **Milestone**: MilestoneItem (keterampilan standar per kelompok/level, atau tambahan coach untuk satu peserta, dengan status usulan), MilestoneAchievement (unik per peserta + keterampilan, `priorSkill` = sudah bisa sebelumnya), MilestoneNote (catatan perkembangan; dasar penahanan tarik saldo coach), MilestoneLevelCompletion (unik per peserta + kelompok + level).
- **InAppNotification**: lonceng (judul, isi, tautan, `readAt`), dihapus setelah 90 hari.
- **ChatThread/ChatMessage**: satu percakapan bantuan per akun; pengguna melihat 90 hari, arsip disimpan.
- **EmailThread/EmailMessage**: inbox admin, satu percakapan per alamat luar; `resendId` unik (cegah dobel simpan).
- **Testimonial**: testimoni landing dengan catatan izin (`consentNote`).

## 6. Kolom dan tabel lama yang tidak dipakai

Tidak dipakai kode aplikasi (`src/`): tabel `PackageTemplate`; kolom `Pool.commissionPercent`, `Pool.coachSharePercent`, `Package.templateId`, `Package.isSingleSession`, `Availability.recurrenceRule`; nilai isian `BookingStatus.COMPLETED` dan `CertificateStatus.NONE`. Masih disebut di alat bantu: `scripts/dev-db-sanitize.mjs`, `scripts/audit-uang.mjs`, `tests/race/fx.ts`, jadi bila nanti dihapus, ketiganya ikut diubah. Datanya masih ada di database. Menghapusnya butuh migrasi yang membuang data, jadi butuh izin Hadi; tidak mendesak.

## 7. Data pribadi dan perlindungannya

| Data | Disimpan | Perlindungan |
|---|---|---|
| Password | `User.passwordHash` | Teracak (bcrypt), tidak bisa dibaca balik |
| Rahasia 2FA, nomor rekening | `totpSecret`, `bankAccountNumber` (CoachProfile, Pool, WithdrawalRequest) | Baris baru terenkripsi AES-256-GCM (kunci di Vercel). Pembacaannya juga menerima teks biasa, jadi baris lama yang belum dienkripsi tetap terbaca; apakah skrip enkripsi data lama sudah dijalankan di production belum dipastikan |
| Nomor HP, email, nama, IP daftar | User | Dianonimkan saat hapus akun disetujui |
| Tanggal lahir peserta (sering anak) | Dependent | Hanya member pemilik, coach yang melatih, admin |
| Isi chat dan email | Chat*, Email* | Arsip disimpan untuk sengketa (keputusan 25 Sep) |
| Data iklan Meta | `Payment.metaTracking` | Dihapus saat akun dihapus |
| Salinan ke laptop | `scripts/dev-db-sanitize.mjs` | Data disamarkan; lonceng tidak disalin |

## 8. Perubahan skema untuk tahap B (usulan, draf 2)

Usulan: **satu migrasi** yang murni menambah (kolom baru boleh kosong, nilai isian baru hanya ditulis kode baru), supaya lu cukup sekali menjalankan migrasi production sebelum kode dikirim. Kode lama tetap jalan dengan skema baru. Setelah kode baru menulis nilai isian baru, kode tidak boleh dikembalikan ke versi lama tanpa diperiksa dulu.

| Kebutuhan (keputusan Hadi) | Perubahan | Catatan |
|---|---|---|
| Kembalikan Dana (T1) | Kolom di Package: `refundedAt`, `refundCash`, `refundSaldo`, `refundReference`, `refundNote`, `refundedById` | Satu paket paling banyak satu refund. Tandai Hadir menolak paket yang `refundedAt` terisi di dalam klaim bersyaratnya. Hitungan refund ikut memperhitungkan tambah bayar ganti coach (lebih dari satu pembayaran). Status paket diubah Berakhir, booking mendatang dibatalkan. |
| Saldo member kembali saat refund | Jenis baru `ADMIN_REFUND` di MemberWalletTransaction | Dipisah dari PURCHASE_REFUND (pengembalian otomatis saat bayar gagal) supaya jelas untuk akuntan |
| Komisi afiliasi paket yang direfund | Status baru `VOID` di AffiliateCommission | Tanpa status ini komisi bisa aktif lagi saat sesi Hadir berikutnya. Aturannya butuh keputusan Hadi (Pertanyaan) |
| Pengingat sesi 18.00 + 06.00 | Kolom di Booking: `reminderEveningAt`, `reminderMorningAt` | Diklaim bersyarat supaya pemeriksa yang jalan dua kali tidak mengirim dua kali. Lebih sederhana dari tabel baru dan tidak perlu dibersihkan berkala |
| Paket mau berakhir (14 dan 3 hari) | Kolom di Package: `expiryNotice14At`, `expiryNotice3At` | Sama seperti di atas |
| Tolak pendaftar coach/kolam | Kolom di User: `rejectedAt`, `rejectionReason` | "Aktifkan" mengosongkan keduanya. Pesan ke pendaftar tidak bisa lewat lonceng (belum bisa masuk), jadi lewat WhatsApp atau email |
| Lapor coach | Tabel baru `CoachReport` (pelapor, coach, booking opsional, isi, status Baru/Selesai, keputusan admin, waktu) + jenis status | Indeks (status, waktu) dan (coach, waktu). Penghapusan akun pelapor atau coach TIDAK menghapus laporannya (bukti daftar hitam); pelapor disamarkan bila akunnya dihapus |
| Pemilik kolam nonaktif = kolam nonaktif (T19) | Kolom di Pool: `deactivatedReason` | Supaya saat pemilik diaktifkan lagi, kolam yang dimatikan admin karena alasan lain tidak ikut menyala |
| Admin masuk ulang tiap 14 hari (T6) | Tidak perlu kolom | Waktu masuk disimpan di token login; token lama tanpa waktu masuk dianggap kedaluwarsa (admin masuk ulang sekali) |
| Kinerja buku besar | Indeks `WalletTransaction(bookingId)` dan `(type, createdAt)` | Dipakai setiap tanda Hadir diubah, di dalam transaksi |
| T13, T14, T8, T10, T11, dan perbaikan teknis lain | Tidak perlu skema | Cukup aturan di kode |

Syarat yang wajib ikut: setiap tabel dan kolom baru didaftarkan di `scripts/dev-db-sanitize.mjs` (skrip sengaja berhenti bila ada yang belum terdaftar), dan isi teks bebas (alasan tolak, isi laporan, catatan refund) disamarkan saat disalin ke laptop.

Jadwal pemeriksa: 06.00 menumpang jadwal harian yang sudah ada; jadwal baru hanya 18.00 di `vercel.json`. Dugaan (belum dicek di akun lu): di paket Vercel gratis, jadwal hanya tepat sampai level jam, jadi pengingat "18.00" bisa terkirim antara 18.00 dan 18.59.

## 9. Temuan

| # | Tingkat | Temuan | Usulan |
|---|---|---|---|
| S1 | Ringan (sekarang) | Hapus berantai bila akun dihapus langsung di database (aplikasi sendiri tidak pernah menghapusnya). Paling berbahaya: menghapus akun coach ikut menghapus jam kosongnya, lalu booking dan laporan kehadiran member, buku besar coach, dan pengajuan ganti coach yang memuat harga lama untuk pembagian uang. Kolam yang punya paket tidak bisa dihapus (database menolak). | Tidak diubah di migrasi tahap B (mengubah aturan hapus bukan penambahan murni). Aturan kerja: jangan pernah menghapus akun atau kolam langsung di database; pakai nonaktif / anonimkan. Bisa diperketat nanti bersama penghapusan kolom lama. |
| S2 | Ringan | Kolom dan nilai isian lama yang tidak dipakai bertambah: `recurrenceRule`, `BookingStatus.COMPLETED`, `CertificateStatus.NONE`. | Masuk daftar bagian 6. |
| S3 | Ringan | Komentar skema "komisi afiliasi 5%". | Diperbaiki kapan saja (komentar tidak butuh migrasi). |
| S4 | Sedang (kinerja) | Buku besar belum punya indeks untuk pencarian per booking dan per jenis. | Masuk migrasi tahap B (bagian 8). |
| S5 | Ringan | "Satu pembayaran lunas per paket" dan "satu peserta Saya per member" hanya dijaga kode, belum oleh database. | Bisa ditambah indeks unik bersyarat di migrasi tahap B setelah dicek tidak ada data lama yang melanggar. |
| S6 | Ringan | Skrip hapus akun demo tidak menghitung riwayat saldo member saat menilai akun "bersih". | Dampak kecil (saldo bersihnya 0); perbaiki sebelum skrip dipakai lagi. |
| S7 | Info | Uang bertipe bilangan bulat biasa (batas sekitar Rp2,1 miliar per baris atau saldo). | Aman untuk sekarang. |

Dugaan pemeriksa yang ternyata aman: nomor kontak kolam tidak bocor ke publik; tidak ada jalur kode yang menghapus kolam atau akun; semua jalur tulis rekening mengenkripsi; satu coach tidak bisa punya dua slot tumpang tindih (jam dibulatkan per jam).

Belum diperiksa: isi database production (rekening lama, rujukan yatim), perilaku database saat menghapus member yang punya paket (perlu uji di database lokal), batas jadwal paket Vercel lu, selisih skema dengan migrasi selain jumlahnya.

## Riwayat dokumen
- 11 Okt 2026: draf 1 (Claude, Opus 5.5) dari `prisma/schema.prisma` commit 642e2d3 dan pencarian pemakaian kolom di kode. Belum diperiksa Opus kedua.
- 11 Okt 2026: draf 2 setelah pemeriksa Opus kedua (42 pemeriksaan): koreksi kolom lama (masih dipakai alat bantu), AffiliateCommission bukan buku besar, catatan enkripsi data lama, S1 ditulis ulang (kolam terlindungi, akun coach paling berisiko), usulan bagian 8 diganti kolom (lebih sederhana), ditambah status VOID, ADMIN_REFUND, Pool.deactivatedReason, indeks buku besar, syarat penyamaran. Klaim kunci (kolam tidak bisa dihapus, indeks buku besar) dicocokkan ulang sendiri.
