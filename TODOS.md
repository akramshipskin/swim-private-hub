# TODOS

## Verifikasi integrasi Midtrans Iris (pencairan otomatis) — menunggu persetujuan Hadi

**Status 18 Sep 2026:** bukan dibatalkan. Hadi mau ini dikerjakan, tapi nunggu
keputusan/persetujuan dia dulu buat daftar akun Iris. Sampai itu ada, pencairan
tetap jalan manual: admin transfer lewat m-banking lalu klik "Tandai Dibayar".

**What:** `src/lib/disbursement.ts` (`disburseViaIris`) nembak endpoint
`/iris/api/v1/payouts` berdasarkan baca dokumentasi doang -- shape
request/response-nya BELUM diverifikasi lawan API beneran, karena belum ada
akun Midtrans Iris. Ditandain eksplisit di kode (comment `ponytail:`-style
di fungsinya).

**Why belum ada:** Iris itu produk terpisah dari Snap (yang udah dipake buat
checkout), butuh KYC bisnis sendiri di Midtrans -- bukan sesuatu yang bisa
didaftarin dari sesi coding ini.

**Fix yang disaranin:** Begitu founder daftar & dapet `MIDTRANS_IRIS_SERVER_KEY`,
test manual dulu 1 pencairan kecil di sandbox Iris, cocokin response shape
beneran lawan yang diasumsikan di kode (field `payouts[0].reference_no`
khususnya), baru percaya penuh sama jalur otomatisnya di `/admin/withdrawals`.

**Depends on / blocked by:** Founder daftar Midtrans Iris (proses bisnis,
bukan teknis).

## Test integrasi DB: sebagian SUDAH ADA (sisanya wallet edge case)

**Status 18 Sep 2026:** `tests/race/` sudah menutup booking bersamaan, CAS
attendance, dan wallet math dasar (`npm run test:race`, 32 tes, Postgres 17
lokal). Sejak 18 Sep ada juga DB development terpisah dari production:
`npm run db:dev` + `npm run db:dev:sync`. Yang BELUM: edge case attendance
di-toggle bolak-balik dan perubahan `coachSharePercent` di tengah transaksi.

**What:** Beberapa path kritis (uang & concurrency) masih diverifikasi manual
(browser + script sekali jalan), belum otomatis:
- `src/app/api/booking/route.ts` -- concurrency test: 2 booking bersamaan buat
  slot yang sama harus cuma 1 yang lolos (CAS pattern yang udah ada di code).
- `scripts/onboard-pools.ts` -- idempotency test: jalanin script 2x, pastiin
  gak bikin Pool/PoolAffiliation duplikat, dan role change cuma kejadian sekali.
- `src/lib/wallet.ts` (`creditPoolFromPackageSale`, `payoutCoachForSession`,
  `reverseCoachPayoutForSession`) -- diverifikasi manual sekali (lihat
  Revision 2026-09-12 di `docs/designs/marketplace-pivot.md`, angkanya cocok
  persis), tapi belum ada test otomatis buat kasus edge: attendance
  di-toggle bolak-balik berkali-kali, `coachSharePercent` berubah PAS ADA
  transaksi di tengah jalan, atau 2 admin mark-attendance bersamaan buat
  booking yang sama.

**Why belum otomatis:** Supabase project buat swim-private-hub SEKARANG UDAH
ADA (`.env` udah keisi, migration udah jalan) -- gap-nya sekarang murni
belum ada test SETUP-nya (schema migrate ke DB test terpisah, seed minimal,
rollback/truncate antar test), bukan lagi soal gak ada DB sama sekali.
Konvensi test project ini masih cuma nutup helper murni di `src/lib/*`
(format, cn, whatsapp, active-package) yang gak butuh DB.

**Fix yang disaranin:** Bikin test setup yang connect ke DB test terpisah
(BUKAN production `DATABASE_URL` yang sekarang -- lihat
`feedback_les_renang_shared_database` di memory, jangan ulang kesalahan yang
sama), lalu tulis test paralel (`Promise.all`) buat tiap path di atas.

**Depends on / blocked by:** Provision Supabase project KEDUA khusus buat
testing (jangan pake yang production -- ini masih perlu dilakukan).

## Tahap 2 — Visibilitas nama anak per role (SELESAI 18 Sep 2026)

**Status:** sudah jalan di semua halaman yang disebut di bawah — coach jadwal &
riwayat sesi, member booking & riwayat, admin booking overview & paket, jadwal
kolam (coach + peserta + akun pemesan), dan link WhatsApp eskalasi. Catatan di
bawah disimpan sebagai riwayat keputusan.

**What:** Tampilan nama anak (bukan nama ortu) di halaman-halaman berikut:
- `/coach/jadwal`, `/coach/riwayat-sesi` — ganti label "Dibooking oleh {parent.name}" jadi nama anak.
- `/member/riwayat`, `/member/booking` — riwayat/booking dikelompokin/dilabel per anak ("buat Budi", "buat Siti").
- `/admin/booking-overview`, `/admin/paket` — nunjukin nama anak DAN nama ortu (buat kontak/WA).
- Link eskalasi WhatsApp (`buildAdminCancelWaLink`) — sertain nama anak, bukan cuma nama ortu.

**Why:** Tahap 1 (data model + booking flow inti: schema `Dependent`, `Package.dependentId`, onboarding wajib isi anak, booking picker pilih anak, admin assign-paket dropdown anak) udah cukup buat sistem jalan bener secara data. Tahap 2 murni polish tampilan read-only — dipisah biar diff Tahap 1 gak kegedean sekali jalan (~14 file jadi terlalu banyak buat 1 putaran review/QA).

**Pros:** Ngerapiin scope, Tahap 1 bisa di-QA & di-verify lebih fokus tanpa kesenggol perubahan tampilan sekaligus.

**Cons:** Selama Tahap 2 belum jalan, admin/coach masih liat nama ORTU di semua halaman booking (bukan nama anak) — walau data-nya di database udah bener per-anak.

**Context:** Ini bagian dari fitur "multi-anak per akun member" (1 akun ortu bisa punya banyak profil anak, 1 paket = 1 anak wajib). Locked via `/plan-eng-review` pada 2026-08-22. Semua field yang dibutuhkan (Booking → Package → dependentId) udah ada di Tahap 1, tinggal query-nya di-JOIN dan ditampilin.

**Depends on / blocked by:** Tahap 1 harus udah di-ship & di-QA dulu (schema `Dependent` + `Package.dependentId` harus ada di production sebelum halaman-halaman ini bisa nampilin nama anak).
