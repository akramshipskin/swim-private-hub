# Cakupan halaman SPH (dibuat otomatis dari kode, 1 Okt 2026)

Dipakai sebagai daftar awal untuk sweeping UI dan sweeping sistem: tiap halaman harus punya status per peran (dicek / tidak bisa dicek + alasan). Dibuat dari semua file page.tsx di src/app; perbarui bila ada halaman baru.

Total halaman: 59

## publik / lintas peran (17)
- `/`
- `/brandguideline`
- `/daftar-coach`
- `/daftar-kolam`
- `/ganti-password`
- `/keamanan`
- `/kebijakan-cookie`
- `/kebijakan-pengembalian`
- `/kebijakan-privasi`
- `/milestone/[dependentId]`
- `/milestone/[dependentId]/sertifikat/[completionId]`
- `/panduan`
- `/pelatih/[coachId]`
- `/pembayaran/gagal`
- `/pembayaran/sukses`
- `/profil`
- `/syarat-ketentuan`

## auth (masuk/daftar) (2)
- `/(auth)/login`
- `/(auth)/register`

## admin (18)
- `/admin`
- `/admin/afiliasi`
- `/admin/booking-overview`
- `/admin/email`
- `/admin/kinerja-coach`
- `/admin/kolam`
- `/admin/komisi`
- `/admin/koreksi-saldo`
- `/admin/laporan-kehadiran`
- `/admin/milestone`
- `/admin/milestone/butir`
- `/admin/paket`
- `/admin/pembayaran`
- `/admin/pesan`
- `/admin/testimoni`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/withdrawals`

## coach (6)
- `/coach`
- `/coach/dashboard`
- `/coach/jadwal`
- `/coach/peserta`
- `/coach/riwayat-sesi`
- `/coach/saldo`

## member (8)
- `/member`
- `/member/booking`
- `/member/cari-coach`
- `/member/dashboard`
- `/member/paket`
- `/member/pembayaran`
- `/member/peserta`
- `/member/riwayat`

## pemilik kolam (8)
- `/pool`
- `/pool/coach`
- `/pool/dashboard`
- `/pool/info`
- `/pool/jadwal`
- `/pool/laporan`
- `/pool/paket`
- `/pool/saldo`
