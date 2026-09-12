# Les Renang Cianjur

Aplikasi booking les renang dengan tiga peran (Admin, Coach, Member), mencakup manajemen jadwal dan paket, pembayaran via Midtrans, hingga laporan kinerja coach untuk perhitungan honor.

**Live:** [les-renang-cianjur.vercel.app](https://les-renang-cianjur.vercel.app)

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
| `DATABASE_URL` | Connection string PostgreSQL (Supabase). Untuk migrasi, pakai session pooler (port 5432) -- transaction pooler (port 6543) tidak mendukung advisory lock yang dibutuhkan `prisma migrate`. |
| `AUTH_SECRET` | Secret untuk NextAuth (generate dengan `npx auth secret`). |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | Kredensial Midtrans. Production sudah aktif -- gunakan sandbox key pas develop lokal. |
| `MIDTRANS_IS_PRODUCTION` | `true`/`false`. |
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
- `src/app/api/availability/route.ts` -- endpoint utama pengecekan slot, termasuk perhitungan kelayakan pembatalan mandiri per booking.
- `prisma/schema.prisma` -- delapan model utama: `User`, `PackageTemplate`, `Package`, `Payment`, `Availability`, `Booking`, `PushSubscription`, `CoachProfile`.
- `src/lib/format.ts` -- helper format & validasi (nomor telepon Indonesia, rupiah, proper case nama).
- `src/components/legal-page-layout.tsx` -- layout bersama buat 4 halaman legal (privasi, S&K, pengembalian, cookie).

## Peran & Fitur Utama

**Admin** -- kelola user (termasuk impor massal via xlsx), katalog paket, riwayat pembayaran, overview booking semua coach, dan laporan kinerja coach per rentang tanggal.

**Coach** -- membuka slot jadwal (otomatis terbagi per jam), melihat jadwal coach lain, dan menandai kehadiran member di sesi yang sudah lewat.

**Member** -- booking slot, pembatalan mandiri (jatah per paket), riwayat booking, dan pembelian paket via Midtrans.

**Guest (publik, tanpa login)** -- landing page jualan (`/`), panduan produk (`/panduan`, `/panduan-member`), dan halaman legal (`/kebijakan-privasi`, `/syarat-ketentuan`, `/kebijakan-pengembalian`, `/kebijakan-cookie`). Pendaftaran (`/register`) punya proteksi anti-spam sederhana (honeypot field + minimum waktu isi form) dan validasi format nomor HP Indonesia di client & server.

## SEO & Metadata

- Tiap halaman punya `<title>`/description sendiri; halaman privat (admin/coach/member/profil/ganti-password) di-set `noindex`.
- `src/app/opengraph-image.tsx` -- generate social preview image (1200x630) secara dinamis, gak perlu file gambar statis.
- `src/app/robots.ts` & `src/app/sitemap.ts` -- robots.txt dan sitemap.xml dibuat otomatis oleh Next.js, area privat di-disallow.
- `src/app/not-found.tsx` -- halaman 404 custom, konsisten sama design system.

## Deploy

Di-deploy otomatis ke Vercel setiap push ke `main`. Environment variables diatur lewat Vercel dashboard, bukan dari `.env` lokal.
