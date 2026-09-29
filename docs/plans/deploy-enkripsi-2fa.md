# Langkah pasang "kunci 2FA terenkripsi" ke aplikasi asli

Untuk Hadi. Ditulis Claude, 29 Sep 2026.

## Ini apa

Kode rahasia login 2 langkah (2FA) sekarang disimpan polos di database.
Kalau salinan database bocor, orang bisa bikin kode login admin. Setelah
perubahan ini, kode itu disimpan dalam bentuk terkunci; kuncinya cuma ada
di pengaturan server (Vercel), bukan di database.

Pengguna tidak merasakan perubahan apa pun: cara login dan cara pasang
2FA tetap sama.

## Urutan WAJIB (jangan ditukar)

> ⚠️ **Langkah 4 tidak boleh dijalankan sebelum langkah 2 selesai.** Kalau
> data di database sudah dikunci tapi server belum punya kuncinya, admin
> tidak bisa login sampai kuncinya dipasang.

**1. Bikin kunci production** (sekali saja). Di terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Hasilnya teks acak ±44 karakter. **Simpan di pengelola password** (misal
1Password/Bitwarden). Kalau kunci ini hilang, semua pengguna harus pasang
ulang 2FA. Jangan pakai kunci yang sama dengan yang ada di `.env` laptop.

**2. Pasang kunci di Vercel.** Vercel → project swim-private-hub →
Settings → Environment Variables → Add:
- Key: `SECRET_ENCRYPTION_KEY`
- Value: kunci dari langkah 1
- Environment: **Production** saja

**3. Push kode** (Claude kasih tahu kapan siap). Vercel otomatis deploy
dan membaca kunci dari langkah 2. Tidak ada migrasi database.

**4. Kunci data 2FA yang sudah ada.** Tambahkan baris ini ke file
`.env.prod` di laptop (kunci yang SAMA dengan langkah 1):
```
SECRET_ENCRYPTION_KEY="<kunci dari langkah 1>"
```
Lalu jalankan (cek dulu, belum mengubah apa pun):
```bash
set -a; source .env.prod; set +a; DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/encrypt-secrets.mts
```
Hasilnya menampilkan jumlah kunci yang masih polos. Kalau angkanya masuk
akal, jalankan versi yang benar-benar mengunci:
```bash
set -a; source .env.prod; set +a; DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/encrypt-secrets.mts --apply
```

**5. Cek.** Logout lalu login lagi ke admin asli pakai kode dari Google
Authenticator. Harus bisa masuk seperti biasa. Kirim hasil langkah 4 ke
Claude.

## Kalau ada yang salah

- **Admin tidak bisa login setelah langkah 4:** hampir pasti kunci di
  Vercel beda dengan kunci di `.env.prod`. Samakan, redeploy.
- **Kunci production hilang:** jalankan `scripts/reset-admin-2fa.mts`
  (sudah ada) untuk admin, lalu pasang 2FA lagi; pengguna lain yang
  memakai 2FA juga harus pasang ulang.

## Yang sudah diuji Claude (di laptop, database uji)

- Pasang 2FA admin → yang tersimpan terkunci, halaman tetap menampilkan
  kode untuk di-scan.
- Logout, login lagi: kode salah ditolak, kode benar masuk.
- Akun dengan kode lama yang masih polos tetap bisa login (masa transisi).
- Skrip langkah 4: mode cek, lalu mengunci 1 kode, login tetap jalan;
  dijalankan ulang tidak mengubah apa pun; tanpa kunci langsung berhenti
  sebelum menyentuh data.
- Belum diuji: ke database production (Claude tidak punya akses).
