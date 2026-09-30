---
paths:
  - "src/auth.ts"
  - "src/proxy.ts"
  - "src/lib/{auth-actions,authorize,require-role,login-lock,totp,secret-box,rate-limit,account-deletion}.ts"
  - "src/lib/{authorize,login-lock,totp,secret-box,rate-limit}.test.ts"
  - "src/app/(auth)/**"
  - "src/app/ganti-password/**"
  - "src/app/keamanan/**"
  - "src/app/api/auth/**"
  - "src/app/api/register/**"
  - "src/app/api/register-coach/**"
  - "src/app/api/register-pool/**"
  - "src/app/admin/users/**"
---

# Kerjaan login dan hak akses

- Mengubah alur login atau hak akses = Opus. Model aktif bukan Opus? Jangan mengubah logikanya. Urutan: skill sph-berisiko, lalu minta izin Hadi ganti model, lalu asisten Opus dengan brief lengkap, lalu berhenti dan tulis "perlu Opus".
- Login dikunci 15 menit setelah 3 kali salah pada satu akun; kode 2FA yang salah atau dipakai ulang dalam 30 detik ikut dihitung salah. Jangan login admin berulang dalam 30 detik saat menguji.
- Setiap aksi dicek di server: siapa yang boleh, dan apakah datanya miliknya. Anggap API bisa dipanggil langsung tanpa lewat tampilan.
- Jangan menulis password, kunci, atau token asli ke file, memori, atau chat. Jangan mengetik password ke situs production.
- Perubahan alur login atau hak akses wajib ditutup dengan tes "peran lain tidak boleh".
