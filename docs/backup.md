# Backup database otomatis

> **Status: BELUM DIUJI dengan data & akun asli.** Workflow ini ditulis tanpa
> akses ke secret produksi. Rantai perintahnya (dump → enkripsi → cek isi →
> pulihkan ke database baru, dan aturan hapus >30 hari) sudah dicoba di
> komputer uji dengan Postgres 16, tapi belum pernah jalan ke Supabase dan ke
> penyimpanan asli. Setelah secret diisi, jalankan manual sekali dan periksa
> (langkah di bawah) sebelum mengandalkannya.

## Apa yang dibackup

- **Semua data aplikasi** di database: akun, member, peserta, paket, booking,
  pembayaran, saldo & catatan saldo, pencairan, chat, dll. (skema `public`,
  termasuk catatan migrasi `_prisma_migrations`).
- Setiap hari pukul **02:00 WIB**, plus tombol manual.
- File dienkripsi dengan kata sandi (passphrase) sebelum diunggah. Tanpa
  passphrase, file backup tidak bisa dibuka siapa pun — termasuk kamu.
- Disimpan **30 hari terakhir**; yang lebih lama dihapus otomatis (hanya
  setelah backup hari itu berhasil diunggah).

## Yang TIDAK ikut

- **Foto coach & sertifikat di Supabase Storage TIDAK ikut.** Backup ini hanya
  database. Kalau proyek Supabase hilang, file foto/sertifikat ikut hilang;
  database hasil pemulihan hanya berisi alamat file-nya.
- Data internal Supabase (skema `auth`, `storage`, dll.) — aplikasi ini tidak
  memakai login Supabase, jadi tidak dibutuhkan.
- Pengaturan di Vercel, Midtrans, Resend, dan isi `.env` — simpan terpisah
  (password manager).

## Yang harus Hadi siapkan

### 1. Tempat penyimpanan (pilih satu)

- **Cloudflare R2** (disarankan: gratis sampai 10 GB, tanpa biaya unduh), atau
- **Backblaze B2**, atau **Amazon S3**.

Buat satu *bucket* khusus backup (mis. `swim-backup`), **jangan publik**, lalu
buat *access key* yang hanya boleh baca/tulis bucket itu.

### 2. Secret di GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Nama secret | Isi |
|---|---|
| `PROD_DIRECT_URL` | Alamat database produksi (lihat catatan koneksi di bawah) |
| `BACKUP_PASSPHRASE` | Kata sandi panjang acak (≥ 20 karakter). **Simpan juga di password manager** — hilang = semua backup tidak bisa dibuka |
| `BACKUP_S3_ENDPOINT` | R2: `https://<account-id>.r2.cloudflarestorage.com` · B2: `https://s3.<region>.backblazeb2.com` · S3: `https://s3.<region>.amazonaws.com` |
| `BACKUP_S3_BUCKET` | Nama bucket, mis. `swim-backup` |
| `BACKUP_S3_ACCESS_KEY_ID` | Access key ID |
| `BACKUP_S3_SECRET_ACCESS_KEY` | Secret access key |
| `BACKUP_S3_REGION` | (opsional) R2: kosongkan (otomatis `auto`) · B2: mis. `us-west-004` · S3: mis. `ap-southeast-1` |

### 3. Uji pertama

1. Setelah PR ini di-merge ke `main` (jadwal harian hanya jalan dari `main`).
2. Tab **Actions → Backup DB → Run workflow**.
3. Pastikan hijau, dan log langkah "Dump + enkripsi" menulis
   `Ukuran: ..., N tabel berisi data`.
4. Cek di bucket ada file `db/swim-<tanggal>.dump.gpg`.
5. Sekali saja, coba pulihkan ke database kosong (langkah di bawah) supaya
   yakin file-nya benar-benar bisa dipakai.

## Cara memulihkan

Lakukan di komputer yang punya `gpg` dan `pg_restore` **versi 17** (sama
dengan server).

1. Unduh file `db/swim-<tanggal>.dump.gpg` dari dashboard R2/B2/S3.
2. Buka enkripsinya (akan diminta passphrase):
   ```bash
   gpg --output swim.dump --decrypt swim-<tanggal>.dump.gpg
   ```
3. **Pulihkan ke database BARU/kosong dulu**, jangan langsung menimpa
   produksi (mis. proyek Supabase baru, atau Postgres lokal `npm run db:dev`):
   ```bash
   pg_restore --no-owner --no-privileges --dbname "<alamat-database-baru>" swim.dump
   ```
   Satu pesan `schema "public" already exists` itu **normal** (database baru
   sudah punya skema public) dan boleh diabaikan. Pesan error lain = berhenti,
   tanyakan dulu.
4. Periksa isinya (jumlah user, booking terakhir, saldo) sebelum aplikasi
   diarahkan ke database itu (ganti `DATABASE_URL`/`DIRECT_URL` di Vercel).

Menimpa database produksi yang masih berisi data (`pg_restore --clean`) akan
menghapus data yang lebih baru dari backup. Lakukan hanya kalau memang itu
tujuannya, dan backup dulu keadaan sekarang.

## Risiko yang sudah diketahui

- **Koneksi GitHub → Supabase.** Alamat "direct" Supabase
  (`db.<ref>.supabase.co`) biasanya hanya IPv6, sedangkan runner GitHub hanya
  IPv4 → koneksi gagal. Kalau begitu, isi `PROD_DIRECT_URL` di GitHub dengan
  **Session pooler** (host `...pooler.supabase.com`, port **5432**). Jangan
  pakai Transaction pooler (port 6543) — `pg_dump` tidak jalan di sana.
- **Versi pg_dump harus ≥ versi server.** Server produksi Postgres 17;
  workflow memasang `postgresql-client-17` dari repo resmi PostgreSQL. Kalau
  Supabase menaikkan server ke 18, ubah `PG_MAJOR` di
  `.github/workflows/backup-db.yml`. (Sudah dicoba: pg_dump 16 ke server 17
  langsung menolak "server version mismatch".)
- **Password database tersimpan di GitHub.** Siapa pun yang bisa mengubah
  workflow di repo ini bisa membacanya. Batasi akses repo. Idealnya pakai
  user database khusus baca untuk backup.
- **Jadwal GitHub bisa terlambat** beberapa menit/jam saat GitHub sibuk, dan
  memakai menit Actions (repo private: kuota bulanan; ±2–3 menit per hari).
- **Kalau backup gagal, tidak ada notifikasi selain email GitHub** "workflow
  failed" ke pemilik repo. Pastikan notifikasi email Actions aktif.
- **aws cli versi baru** mengirim checksum tambahan yang ditolak sebagian
  penyedia non-AWS; workflow sudah mematikannya
  (`AWS_REQUEST_CHECKSUM_CALCULATION=when_required`), tapi belum dicoba ke
  R2/B2 asli.
