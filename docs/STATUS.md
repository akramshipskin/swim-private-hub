# STATUS SPH (diperbarui 1 Okt 2026)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah).

## Sudah selesai dan live (per 30 Sep)
- Tanggal lahir di semua form daftar; notifikasi admin untuk pendaftar baru (dengan log); testimoni (tabel dan halaman admin); kolom sertifikat lama dibuang; CSP aktif; PPN komisi 11%; landing dirombak kecuali "Kenalan dengan coach" dan "Kolam mitra"; backup database dan storage hijau.
- 1 Okt: commit 0f903b1 (fungsi Vercel dipindah ke Singapura, dekat database) sudah live. Terverifikasi 1 Okt: header x-vercel-id kini sin1::sin1 (dulu sin1::iad1); respons awal halaman depan ±0,4-0,5 detik (dulu 1-2 detik; percobaan pertama setelah deploy 1,8 detik karena dingin).

## Sedang jalan
- Rombak cara main Claude (1 Okt): tahap 0-4 (backup, fondasi, aturan inti, aturan desain, rapikan memori) dikerjakan di sesi 1 Okt; tahap 5 (animasi) belum dimulai. Rinci: memori project_rombak_cara_main_2026-10-01 dan docs/KEPUTUSAN.md.

## Tugas Hadi
1. Cek GitHub Actions run terbaru (test dan race) hijau atau tidak.
2. Buka sesi baru supaya aturan dan gaya jawab baru aktif. Matikan plugin dan konektor tak terpakai di aplikasi Desktop (daftar di laporan rombak 1 Okt).
3. Tes production yang butuh akun atau perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP (tiap perangkat tekan "Aktifkan Notifikasi"); satu pembayaran sampai paket aktif.
4. Login pemilik kolam dan member di panel browser supaya Claude bisa menguji alurnya.
5. 8 sesi production yang lewat 24 jam belum ditandai Hadir: hanya admin yang bisa menandai (Admin, Jadwal Booking).
6. Hukum, akuntan, kolam: hasil orang hukum (Kebijakan Privasi, perjanjian coach, MOU); jawaban 3 kolam; akuntan (setor PPN 11%, pajak komisi afiliasi, PPh coach, PPN sesi tidak hadir).
7. Testimoni asli tambahan; masukan landing per nama section.

## Tugas Claude berikutnya
- Ukur ulang simpan milestone di production setelah pindah region (dulu ±6 detik). Bila masih lambat, cari penyebabnya.
- Brand guideline: cabang brand-guideline-v2 punya 2 commit aset resolusi tinggi yang belum masuk ke cabang utama; putuskan penggabungan bersama Hadi.
- Animasi (HP ringan, desktop lebih kaya, LP paling kaya) setelah aturan desain dan brand guideline beres. Video header: cari stok berlisensi, minta izin Hadi sebelum mengunduh.
- Uji jalur ganti model: skill sph-berisiko (model opus) dan alat ganti model sesi. Butuh persetujuan Hadi di aplikasi.
- Rapikan draf Syarat & Ketentuan v2 lama yang masih bertanda "BELUM ADA DI SISTEM" (arsip, bukan yang live).

## Belum terverifikasi
- Notifikasi push di perangkat asli; tampilan landing di HP asli; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; apakah aturan baru (skill sph-berisiko, rules per area, hook pengingat) benar-benar bekerja di sesi baru.
