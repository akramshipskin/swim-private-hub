# Cakupan halaman SPH (dibuat otomatis dari kode, 11 Okt 2026)

Daftar awal untuk sweeping UI dan sweeping sistem: tiap halaman harus punya status per peran (dicek / tidak bisa dicek + alasan). Dibuat dari semua file page.tsx di src/app; buat ulang bila ada halaman baru. Hasil sweeping terakhir: docs/reviews/2026-10-11-sweeping-sistem-total.md.

Total halaman: 72 (70 tayang + /lupa-password dan /reset-password yang masih di jalur kerja reset-password-email, belum tayang)

## Publik dan lintas peran (20)
- `/`
- `/brandguideline`
- `/daftar-coach`
- `/daftar-kolam`
- `/kebijakan-cookie`
- `/kebijakan-pengembalian`
- `/kebijakan-privasi`
- `/kota`
- `/milestone/[dependentId]`
- `/milestone/[dependentId]/sertifikat/[completionId]`
- `/mou-kolam`
- `/notifikasi`
- `/panduan`
- `/pelatih/[coachId]`
- `/pembayaran/gagal`
- `/pembayaran/sukses`
- `/perjanjian`
- `/perjanjian-coach`
- `/profil`
- `/syarat-ketentuan`

## Masuk, daftar, password (6)
- `/ganti-password`
- `/keamanan`
- `/login`
- `/lupa-password`
- `/register`
- `/reset-password`

## Member (8)
- `/member`
- `/member/booking`
- `/member/cari-coach`
- `/member/dashboard`
- `/member/paket`
- `/member/pembayaran`
- `/member/peserta`
- `/member/riwayat`

## Coach (8)
- `/coach`
- `/coach/dashboard`
- `/coach/harga`
- `/coach/jadwal`
- `/coach/kolam`
- `/coach/peserta`
- `/coach/riwayat-sesi`
- `/coach/saldo`

## Pemilik kolam (8)
- `/pool`
- `/pool/coach`
- `/pool/dashboard`
- `/pool/info`
- `/pool/jadwal`
- `/pool/laporan`
- `/pool/paket`
- `/pool/saldo`

## Admin (22)
- `/admin`
- `/admin/afiliasi`
- `/admin/booking-overview`
- `/admin/coach-tanpa-jadwal`
- `/admin/email`
- `/admin/ganti-coach`
- `/admin/kinerja-coach`
- `/admin/kolam`
- `/admin/komisi`
- `/admin/koreksi-saldo`
- `/admin/laporan-coach`
- `/admin/laporan-kehadiran`
- `/admin/milestone`
- `/admin/milestone/butir`
- `/admin/paket`
- `/admin/pembayaran`
- `/admin/peminat-kota`
- `/admin/pesan`
- `/admin/testimoni`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/withdrawals`

Catatan: /profil, /notifikasi, /panduan, /milestone/... dipakai beberapa peran; /perjanjian khusus coach dan pemilik kolam; /kota khusus akun yang belum memilih kota domisili; /lupa-password dan /reset-password baru 11 Okt (reset password lewat email, bukan untuk admin).
