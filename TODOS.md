# TODOS

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
