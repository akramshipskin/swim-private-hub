# TODOS

## Test integrasi DB buat concurrency booking & onboarding script (belum ada, butuh Postgres nyata)

**What:** Dua path paling kritis dari `/plan-eng-review` 2026-09-12 (marketplace
pivot) belum punya test otomatis:
- `src/app/api/booking/route.ts` -- concurrency test: 2 booking bersamaan buat
  slot yang sama harus cuma 1 yang lolos (CAS pattern yang udah ada di code,
  tinggal diverifikasi lewat test beneran, bukan cuma dibaca).
- `scripts/onboard-pools.ts` -- idempotency test: jalanin script 2x, pastiin
  gak bikin Pool/PoolAffiliation duplikat, dan role downgrade ADMIN->MEMBER
  cuma kejadian sekali (gak double-apply/gak ada efek samping run kedua).

**Why belum ada:** Repo ini belum punya Supabase project sendiri (`.env` belum
disetup, `DATABASE_URL` masih placeholder) -- kedua test ini butuh Postgres
beneran (transaksi, row lock, unique constraint race), bukan yang bisa
di-mock. Konvensi test project ini sekarang cuma nutup helper murni di
`src/lib/*` (format, cn, whatsapp, active-package, pool-credentials) --
`cancel-booking.ts` yang udah lama ada di codebase pun belum punya test
karena alasan yang sama.

**Fix yang disaranin:** Begitu Supabase project buat swim-private-hub udah
jalan, tambah test setup yang bisa nyambung ke DB test (schema migrate,
seed minimal, test lalu rollback/truncate) buat 2 path di atas, baru
verifikasi actual race-condition behavior-nya lewat test paralel
(`Promise.all` 2 request bersamaan), bukan cuma baca code dan percaya CAS-nya
bener.

**Depends on / blocked by:** Setup Supabase project + `DATABASE_URL` asli
buat swim-private-hub (belum dilakukan -- lihat README, "New Supabase project
required").

## Button component: hover state pakai `brand-700` sebagai background, bukan teks

**What:** `src/components/ui/button.tsx` variant `primary` pakai
`hover:bg-brand-700`. Root cause sama kayak bug CTA band di landing page
yang udah difix (`bb07074`): `--color-brand-700` didefinisikan beda antara
light mode (`#0e7490`, teal gelap -- aman dipakai background) dan dark mode
(`#67e8f9`, cyan terang -- dimaksudkan cuma buat teks/foreground di atas
permukaan gelap). Dipakai sebagai `hover:bg-*` di sini artinya pas dark mode,
hover state tombol primary bisa nyala terang gak semestinya (persis gejala
yang di CTA band sebelum difix).

**Why belum difix:** Ketemu pas `/design-review` (audit landing page), tapi
di luar scope waktu itu (fokusnya landing page doang) -- di-flag lewat
`spawn_task`, bukan langsung diubah biar gak ngerembet ke shared component
yang dipake di semua halaman tanpa QA visual penuh.

**Fix yang disaranin:** Ganti `hover:bg-brand-700` ke hex literal yang
sengaja sama di kedua tema (pola yang sama dipake buat fix CTA band), atau
tambah token terpisah khusus buat "background yang gak boleh invert ikut
tema" biar gak kejadian lagi di komponen lain.

## Tahap 2 — Visibilitas nama anak per role (deferred dari fitur multi-anak)

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
