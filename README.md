# Swim Private Hub

Marketplace les renang privat -- kolam (venue), coach independen yang bisa
mengajar di beberapa kolam, dan member/orang tua yang membeli paket untuk 1 coach
di 1 kolam lalu booking jamnya. Fork dari `les-renang-cianjur` (produk terpisah
100%, zero shared code/DB), multi-tenant lewat model `Pool`/`PoolAffiliation`.

> **Peringatan: README ini ringkasan, bukan acuan aturan bisnis.** Urutan acuan
> bila bertentangan: (1) kode, (2) [docs/aturan-bisnis-saat-ini.md](docs/aturan-bisnis-saat-ini.md),
> (3) docs/KEPUTUSAN.md, (4) brand-kit/MESSAGING.md, (5) dokumen lama dan README ini.
> Dokumen lama seperti docs/designs/marketplace-pivot.md (bagi hasil persen,
> paket lintas kolam) sudah tidak berlaku.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **Auth:** NextAuth v5 (Credentials + JWT)
- **Styling:** Tailwind CSS v4, custom design tokens
- **Pembayaran:** Midtrans (Snap)
- **PWA:** manifest + service worker, web push notification

## Menjalankan Secara Lokal

```bash
npm install
npx prisma generate
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment Variables

Buat file `.env` di root project (lihat `.env.example` untuk daftar lengkap):

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Supabase project TERPISAH dari les-renang-cianjur -- jangan pernah reuse). Untuk migrasi, pakai session pooler (port 5432) -- transaction pooler (port 6543) tidak mendukung advisory lock yang dibutuhkan `prisma migrate`. |
| `AUTH_SECRET` | Secret untuk NextAuth (generate dengan `npx auth secret`). |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` / `MIDTRANS_IS_PRODUCTION` | Kredensial Midtrans PLATFORM (service provider posture -- 1 akun buat semua kolam, bukan per-kolam). |
| `MIDTRANS_IRIS_SERVER_KEY` | Opsional -- pencairan otomatis (lihat `src/lib/disbursement.ts`). Kosong = pencairan tetap manual lewat `/admin/withdrawals`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Kredensial web push (generate dengan `npx web-push generate-vapid-keys`). |
| `NEXT_PUBLIC_APP_URL` | Base URL aplikasi. |

### Migrasi Database

```bash
npx prisma migrate dev
```

Kalau `DATABASE_URL` di `.env` memakai transaction pooler (port 6543), migrasi akan hang -- override sementara ke session pooler (port 5432) saat migrasi:

```bash
DATABASE_URL="<session-pooler-url>" npx prisma migrate dev --name <nama_migrasi>
```

## Struktur Penting

- `src/proxy.ts` -- middleware untuk guard peran (ADMIN/COACH/MEMBER) dan redirect ganti-password wajib. Di Next.js 16, file middleware ini bernama `proxy.ts`, bukan `middleware.ts`.
- `src/lib/cancel-booking.ts` -- logika pembatalan booking dengan row-level lock (`SELECT ... FOR UPDATE`) untuk mencegah race condition saat banyak pembatalan konkuren pada paket yang sama.
- `src/app/api/booking/route.ts` -- klaim slot pake conditional update (CAS). Paket hanya bisa dipakai di kolam tempat beli, untuk coach paket itu, di dalam jam buka kolam.
- `src/app/api/availability/route.ts` -- endpoint pengecekan slot (filter via `?poolId=`), termasuk perhitungan kelayakan pembatalan mandiri per booking.
- `prisma/schema.prisma` -- model utama: `User` (role `ADMIN`/`COACH`/`MEMBER`/`POOL_OWNER`), `Pool`, `PoolAffiliation`, `Package`, `Payment`, `Availability`, `Booking`, `PushSubscription`, `CoachProfile`, `WalletTransaction`, `WithdrawalRequest`, `MemberWalletTransaction`, `CoachChangeRequest`. Kolom/tabel model lama (`PackageTemplate`, `Pool.commissionPercent/coachSharePercent`, `Package.isSingleSession/templateId`) masih ada di database tapi tidak dipakai kode lagi (drop menyusul). Availability constraint `unique(coachId, date, startTime)` SENGAJA gak include poolId -- 1 coach cuma boleh punya 1 slot terbuka per jam di SELURUH kolam.
- `src/lib/pricing.ts` + `src/lib/wallet.ts` -- model harga-dari-coach: member bayar harga kolam + harga coach + biaya layanan SPH; tiap sesi Hadir kolam & coach dapat harga mereka ÷ jumlah sesi (dipotong PPh 0,5%), sisanya SPH. Kolam yang dikredit = kolam tempat sesi diajar. `WalletTransaction` = ledger sumber kebenaran, `walletBalance` di Pool/CoachProfile cuma cache.
- `src/lib/withdrawal.ts` + `src/lib/disbursement.ts` -- pengajuan pencairan (saldo kepotong pas request, bukan pas approve) + integrasi Midtrans Iris opsional (belum aktif sampai `MIDTRANS_IRIS_SERVER_KEY` diisi -- fallback manual di `/admin/withdrawals`).
- `src/app/daftar-kolam/`, `src/app/daftar-coach/` -- pendaftaran mandiri kolam & coach (pola anti-spam sama kayak `/register`). Gak ada lagi migrasi jaringan lama via script -- semua mulai dari 0.
- `src/lib/coach-specialties.ts` -- daftar keahlian coach (checklist tetap, bukan free-text), plus `CoachProfile.hasCertification`/`certificationNote` (badge, bukan proses verifikasi).
- `src/lib/format.ts` -- helper format & validasi (nomor telepon Indonesia, rupiah, proper case nama).
- `src/components/legal-page-layout.tsx` -- layout bersama buat 4 halaman legal (privasi, S&K, pengembalian, cookie).

## Peran & Fitur Utama

**Admin (founder, sole superadmin di Phase 1)** -- kelola user, beri paket gratis manual (tanpa bagi hasil), harga tiket & biaya layanan per kolam (`/admin/kolam`), ganti coach, riwayat pembayaran, overview booking semua coach, laporan kinerja coach, laporan komisi platform (`/admin/komisi`), dan proses pencairan saldo (`/admin/withdrawals`). Belum ada admin per-pool (di luar wallet) -- deferred ke Phase 2.

**Pool Owner** -- memasang harga tiket paket 4/8 sesi, info & jam buka kolam, laporan, saldo & pencairan kolamnya sendiri. Tidak punya akses ke kolam lain.

**Coach** -- membuka slot jadwal per kolam yang dia terafiliasi (`PoolAffiliation`), melihat jadwal coach lain, menandai kehadiran member di sesi yang sudah lewat (memicu payout ke saldonya, `/coach/saldo`), dan mencairkan saldo.

**Member** -- membeli paket 4/8 sesi (atau 1 sesi coba) untuk 1 coach di 1 kolam via Midtrans atau saldo, booking slot coach itu, pembatalan mandiri (jatah per paket), riwayat booking. Uang masuk ke platform dulu, lalu dibagi ke saldo kolam & coach per sesi.

**Coach shortcut (`/pelatih/[coachId]`, publik)** -- halaman statis nunjukin kolam-kolam tempat 1 coach ngajar + link WA, biar parent bisa nemuin coach yang mengajar di kolam lain.

**Guest (publik, tanpa login)** -- landing page jualan (`/`), panduan produk (`/panduan`, `/panduan-member`), dan halaman legal (`/kebijakan-privasi`, `/syarat-ketentuan`, `/kebijakan-pengembalian`, `/kebijakan-cookie`). Pendaftaran (`/register`) punya proteksi anti-spam sederhana (honeypot field + minimum waktu isi form) dan validasi format nomor HP Indonesia di client & server.

## SEO & Metadata

- Tiap halaman punya `<title>`/description sendiri; halaman privat (admin/coach/member/profil/ganti-password) di-set `noindex`.
- `src/app/opengraph-image.tsx` -- generate social preview image (1200x630) secara dinamis, gak perlu file gambar statis.
- `src/app/robots.ts` & `src/app/sitemap.ts` -- robots.txt dan sitemap.xml dibuat otomatis oleh Next.js, area privat di-disallow.
- `src/app/not-found.tsx` -- halaman 404 custom, konsisten sama design system.

## Deploy

Di-deploy otomatis ke Vercel setiap push ke `main`. Environment variables diatur lewat Vercel dashboard, bukan dari `.env` lokal.
