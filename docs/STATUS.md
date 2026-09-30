# STATUS SPH (diperbarui 1 Okt 2026, malam)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin untuk pendaftar baru (dengan log); testimoni (tabel dan halaman admin); kolom sertifikat lama dibuang; CSP aktif; PPN komisi 11%; landing dirombak kecuali "Kenalan dengan coach" dan "Kolam mitra"; backup database dan storage hijau.
- 1 Okt: fungsi Vercel pindah ke Singapura, terverifikasi live (x-vercel-id sin1::sin1, dulu sin1::iad1; respons awal halaman depan ±0,4-0,5 detik, dulu 1-2 detik).
- 1 Okt: GitHub Actions hijau untuk semua push terbaru (Test: 0f903b1, 04bf065, ad75dd2; Backup DB dan Storage hijau sejak 15:41 UTC 30 Sep).
- 1 Okt: rombak cara main Claude tahap 0-4 selesai (backup, pengaturan, aturan inti, aturan desain, rapikan memori). Rinci: memori project_rombak_cara_main_2026-10-01 dan docs/KEPUTUSAN.md.

- 1 Okt malam: brand v2 digabung dan tayang (8f067b8; GitHub hijau, Vercel selesai, 3 gambar sosial di situs asli identik dengan repo). Banner dirender ulang dengan tagline bertitik; foto profil = tanda saja; skrip render gambar sosial ada di repo.

## Sedang jalan
- Uji sesi baru pertama setelah rombak: cek 3 baris pembuka, format jawaban, hook pengingat, skill baru.

## Tugas Claude berikutnya (sudah disetujui Hadi 1 Okt malam)
1. (Selesai 1 Okt malam, lihat bagian atas.)
2. Animasi landing page dulu (HP ringan: kartu dan section muncul; desktop lebih kaya: hover, muncul bertahap, video perenang di header). Sonnet High. Video: cari stok berlisensi, minta izin Hadi sebelum mengunduh (nama file, sumber, ukuran, lisensi). Ukur kecepatan sebelum dan sesudah.
3. Setelah LP: animasi dalam aplikasi per peran (admin, coach, pemilik kolam, member), lebih halus.
4. Uji jalur ganti model otomatis: skill sph-berisiko (model opus) dan asisten Opus. Alat ganti model sesi sendiri TIDAK bisa (ditolak sistem); untuk kerjaan sensitif yang panjang, minta Hadi pilih Opus di menu model.
5. Cek GitHub Actions sendiri lewat gh setelah tiap push; Hadi tidak perlu membuka GitHub.
6. Ukur ulang simpan milestone di production (dulu ±6 detik).
7. Rapikan draf Syarat & Ketentuan v2 lama yang masih bertanda "BELUM ADA DI SISTEM" (arsip, bukan yang live).

## Tugas Hadi
1. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
2. Tes production yang butuh akun atau perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP (tiap perangkat tekan "Aktifkan Notifikasi"); satu pembayaran sampai paket aktif.
3. Login pemilik kolam dan member di panel browser supaya Claude bisa menguji alurnya.
4. 8 sesi production yang lewat 24 jam belum ditandai Hadir: hanya admin yang bisa menandai (Admin, Jadwal Booking).
5. Hukum, akuntan, kolam: hasil orang hukum (Kebijakan Privasi, perjanjian coach, MOU); jawaban 3 kolam; akuntan (setor PPN 11%, pajak komisi afiliasi, PPh coach, PPN sesi tidak hadir).
6. Membuat secret di GitHub bila diminta (satu-satunya urusan GitHub yang masih di Hadi). Testimoni asli tambahan; masukan landing per nama section.

## Belum terverifikasi
- Notifikasi push di perangkat asli; tampilan landing di HP asli; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; apakah aturan baru (skill sph-berisiko, rules per area, hook pengingat) bekerja di sesi baru.
