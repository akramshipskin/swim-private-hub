# STATUS SPH (diperbarui 2 Okt 2026 dini hari)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin untuk pendaftar baru (dengan log); testimoni (tabel dan halaman admin); kolom sertifikat lama dibuang; CSP aktif; PPN komisi 11%; landing dirombak kecuali "Kenalan dengan coach" dan "Kolam mitra"; backup database dan storage hijau.
- 1 Okt: fungsi Vercel pindah ke Singapura, terverifikasi live (x-vercel-id sin1::sin1, dulu sin1::iad1; respons awal halaman depan ±0,4-0,5 detik, dulu 1-2 detik).
- 1 Okt: GitHub Actions hijau untuk semua push terbaru (Test: 0f903b1, 04bf065, ad75dd2; Backup DB dan Storage hijau sejak 15:41 UTC 30 Sep).
- 1 Okt: rombak cara main Claude tahap 0-4 selesai (backup, pengaturan, aturan inti, aturan desain, rapikan memori). Rinci: memori project_rombak_cara_main_2026-10-01 dan docs/KEPUTUSAN.md.

- 1 Okt malam: brand v2 digabung dan tayang (8f067b8; GitHub hijau, Vercel selesai, 3 gambar sosial di situs asli identik dengan repo). Banner dirender ulang dengan tagline bertitik; foto profil = tanda saja; skrip render gambar sosial ada di repo.

## Sedang jalan
- Hadi tidur: semua pekerjaan berurutan sudah dikerjakan; menunggu keputusan Hadi (daftar di bawah).

## Sudah selesai 1-2 Okt (live setelah push terakhir)
- Tahap 2 animasi landing: bug bagian kosong saat "kurangi gerakan" diperbaiki; pembuka tanpa JavaScript; elemen terbesar di HP ±2,4 -> ±1,1-1,5 detik; judul hero = tagline resmi. Video: kode siap, KOSONG menunggu izin unduh. Laporan + angka: docs/reviews/2026-10-01-animasi-landing.md.
- Tahap 3 animasi dalam aplikasi (4 peran), dialog, tombol.
- Sweeping UI+sistem penuh (528 kunjungan tampilan, 59 halaman x 5 kondisi, 17 API, 68 aksi, ±160 pengiriman formulir): 7 kelompok perbaikan mekanis. Laporan: docs/reviews/2026-10-01-sweeping-ui-sistem.md.
- Uji jalur Opus: asisten Opus berfungsi; skill sph-berisiko tampak memindahkan giliran ke Opus. Draf S&K v2 lama dirapikan (arsip). Alat: scripts/ukur-halaman, sweep-halaman, uji-hak-akses, uji-formulir, render-brand-social (semua hanya localhost/lokal).

## Tugas Claude berikutnya
1. Pasang video hero setelah Hadi pilih dan izinkan unduh (kandidat di laporan animasi); ukur ulang sebelum/sesudah (alat: scripts/ukur-halaman.mjs).
2. Kerjaan Opus hasil sweeping (login/akun): batas panjang kunci pembatas login; batas panjang nama di pendaftaran/createUser. Butuh Opus + pemeriksa Opus.
3. Bagian sistem yang belum diuji (perlu Opus): rekonsiliasi ledger menyeluruh, hitungan PPN/bagi hasil, klik aksi yang mengubah uang/status.
4. Cek GitHub Actions dan situs asli setelah tiap push (gh + scripts/ukur-halaman).

## Tugas Hadi
1. Jawab Pertanyaan di laporan (video hero mana; 7 butir "menunggu keputusan" di docs/reviews/2026-10-01-sweeping-ui-sistem.md bagian 4).
2. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
3. Tes production yang butuh akun atau perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP; satu pembayaran sampai paket aktif; lihat landing dan aplikasi di HP asli (animasi).
4. Ukur waktu simpan milestone di production (dulu ±6 detik): butuh login production, Claude tidak boleh.
5. 8 sesi production yang lewat 24 jam belum ditandai Hadir: hanya admin (Admin, Jadwal Booking).
6. Hukum, akuntan, kolam: hasil orang hukum (Kebijakan Privasi, perjanjian coach, MOU); jawaban 3 kolam; akuntan (setor PPN 11%, pajak komisi afiliasi, PPh coach, PPN sesi tidak hadir).
7. Membuat secret di GitHub bila diminta. Testimoni asli tambahan.

## Belum terverifikasi
- Di HP asli dan Safari: landing, animasi, aplikasi; notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; apakah perbaikan sweeping tampil benar di production (baru dicek di laptop).
