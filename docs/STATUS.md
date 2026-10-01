# STATUS SPH (diperbarui 2 Okt 2026)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 9181551 (2 Okt; GitHub test + race hijau, Vercel selesai, dicek di situs asli)

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin pendaftar baru; testimoni; CSP aktif; PPN komisi 11%; landing dirombak; backup database dan storage hijau.
- 1 Okt: Vercel di Singapura (sin1); rombak cara main Claude; brand v2 + gambar sosial hi-res (foto profil = tanda saja, transparan; tagline bertitik; skrip render di repo).
- 1 Okt malam: animasi landing tahap 2 (bug bagian kosong saat "kurangi gerakan" diperbaiki), animasi dalam aplikasi tahap 3 (4 peran), sweeping UI+sistem pertama. docs/reviews/2026-10-01-sweeping-ui-sistem.md.
- 2 Okt (Opus): animasi landing v2 bertema air (riak, judul muncul dari air, gelombang, HP miring, perenang di lintasan, coretan cara lama, parallax, sorotan, tombol magnetis) + video perenang desktop. Situs asli: elemen terbesar HP 0,93 dtk (awal 2,37). docs/reviews/2026-10-01-animasi-landing.md bagian v2.
- 2 Okt (Opus): kunci pembatas login diringkas; batas nama 100 di semua jalur akun/peserta (diperiksa Opus kedua); audit buku besar + aksi uang lewat tampilan + 146 tes balapan: cocok/lulus; sweeping ulang + konsistensi gaya. docs/reviews/2026-10-02-sweeping-opus.md.
- Alat di scripts/ (hanya lokal kecuali disebut): ukur-halaman (kecepatan, boleh situs asli), sweep-halaman, uji-hak-akses, uji-formulir, audit-uang, render-brand-social.

## Sedang jalan
- Tidak ada. Menunggu Hadi melihat animasi v2 di HP asli dan laptop.

## Tugas Claude berikutnya
1. Revisi animasi sesuai masukan Hadi per bagian; ukur ulang sebelum/sesudah.
2. Cek GitHub Actions dan situs asli setelah tiap push.
3. Audit buku besar production: ditunda sampai ada transaksi asli (usul Claude; menunggu jawaban Hadi). Skrip audit menolak DB non-lokal; Hadi yang menjalankan bila perlu.

## Tugas Hadi
1. Lihat landing v2 di HP asli dan laptop, beri masukan per bagian; jawab soal audit production (tunda atau jalankan).
2. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
3. Tes production yang butuh akun/perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP; satu pembayaran sampai paket aktif.
4. Ukur waktu simpan milestone di production (dulu ±6 detik): butuh login production, Claude tidak boleh.
5. 8 sesi production yang lewat 24 jam belum ditandai Hadir: hanya admin (Admin, Jadwal Booking).
6. Hukum, akuntan, kolam: hasil orang hukum (Kebijakan Privasi, perjanjian coach, MOU); jawaban 3 kolam; akuntan (setor PPN 11%, pajak komisi afiliasi, PPh coach, PPN sesi tidak hadir).
7. Membuat secret di GitHub bila diminta. Testimoni asli tambahan.

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Akun admin lokal (089900000001) sekarang ber-2FA; kode lewat scripts/qa-otp.mts. Data uji lokal: Kolam Bahari 0/60 (uji 30 Sep), 5 sesi Hadir tanpa uang (pembayaran disisipkan belakangan), saldo kolam/coach berubah karena uji aksi uang 2 Okt.
