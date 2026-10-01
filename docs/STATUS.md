# STATUS SPH (diperbarui 2 Okt 2026)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 6012572 (2 Okt malam; GitHub hijau, Vercel sukses; tanpa migrasi baru)

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin pendaftar baru; testimoni; CSP aktif; PPN komisi 11%; landing dirombak; backup database dan storage hijau.
- 1 Okt: Vercel di Singapura (sin1); rombak cara main Claude; brand v2 + gambar sosial hi-res (foto profil = tanda saja, transparan; tagline bertitik; skrip render di repo).
- 1 Okt malam: animasi landing tahap 2 (bug bagian kosong saat "kurangi gerakan" diperbaiki), animasi dalam aplikasi tahap 3 (4 peran), sweeping UI+sistem pertama. docs/reviews/2026-10-01-sweeping-ui-sistem.md.
- 2 Okt (Opus): animasi landing v2 bertema air (riak, judul muncul dari air, gelombang, HP miring, perenang di lintasan, coretan cara lama, parallax, sorotan, tombol magnetis) + video perenang desktop. Situs asli: elemen terbesar HP 0,93 dtk (awal 2,37). docs/reviews/2026-10-01-animasi-landing.md bagian v2.
- 2 Okt (Opus): kunci pembatas login diringkas; batas nama 100 di semua jalur akun/peserta (diperiksa Opus kedua); audit buku besar + aksi uang lewat tampilan + 146 tes balapan: cocok/lulus; sweeping ulang + konsistensi gaya. docs/reviews/2026-10-02-sweeping-opus.md.
- 2 Okt (Opus): HARGA DARI COACH tahap 1+2 live. Kolam (tiket) & coach (jasa) pasang harga paket 4 sesi (60 hari, batal 2x) / 8 sesi (90 hari, batal 4x); member bayar + biaya layanan SPH 6,5% (maks 6,9%); sesi coba 7 hari, tidak bisa dibatalkan sendiri; eceran & kartu kredit dihapus; paket terikat coach; bagi uang per rupiah + PPh 0,5% (titipan, bukan pendapatan SPH); saldo member; ganti coach lewat pengajuan + admin (menu Ganti Coach); catat setor PPh (Bagi Hasil). Harga dummy production diisi (kolam 260/480rb, coach 440/800rb). Rancangan: docs/designs/harga-dari-coach.md.
- 2 Okt: indeks email lama dicatat di schema (migrasi baru tidak lagi memunculkan DROP INDEX). Teks hukum harga-dari-coach disetujui orang hukum dan dipasang (+ S&K 4.5e saldo saat hapus akun; peringatan saldo di Profil member & layar persetujuan admin) (S&K, Pengembalian, Privasi; perjanjian coach & MOU kolam disesuaikan, masih ada [ISI HADI]).
- 2 Okt malam (Opus): cek menyeluruh SEMUA fitur x 4 peran + publik di laptop (docs/reviews/2026-10-02-sweeping-sistem-semua-fitur.md). Diperbaiki: tombol Beli paket ditolak Midtrans (live 9efc7d8), error database mentah tampil ke pengguna (18 tempat), nomor rekening boleh huruf, kolom tgl lahir impor Excel, teks mekanis. Temuan menunggu keputusan Hadi ada di laporan.
- Alat di scripts/ (hanya lokal kecuali disebut): ukur-halaman (kecepatan, boleh situs asli), sweep-halaman, uji-hak-akses, uji-formulir, audit-uang (production: AUDIT_PROD=1, baca-saja, Hadi), isi-harga-dummy (production: HARGA_DUMMY_PROD=1, Hadi), render-brand-social.

## Sedang jalan
- 2 Okt dini hari (Opus, BELUM push, ada 2 migrasi baru: partner_agreement + payment_meta_tracking -> Hadi migrate production dulu): (1) coach batal sakit = slot ditutup; (2) laporan kolam tampil PPh & masuk saldo; (3) mekanisme centang perjanjian coach/MOU kolam (belum aktif: versi null sampai teks [ISI HADI] final + halaman teksnya dibuat); (4) Meta Pixel + Conversions API (mati sampai ID Pixel & token diisi di Vercel), Privasi/Cookie/banner disesuaikan. Pemeriksa Opus kedua: perjanjian & slot tidak ada temuan berat (catatan ringan sudah diperbaiki); bagian Meta sedang diperiksa.
- Sisa jawaban Hadi: 6 perbaikan ringan (Sonnet/OpenCode), isi [ISI HADI] (daftar dikirim ke Hadi 2 Okt).
- Jalur bayar Midtrans (beli, sesi coba, tambah bayar ganti coach, saldo dipakai dulu) sudah diuji di laptop mode uji + notifikasi tiruan; di production belum ada pembayaran sungguhan.

## Tugas Claude berikutnya
1. Setelah Hadi migrate production: push batch Opus 2 Okt, cek GitHub & situs. Lalu 6 perbaikan ringan (Sonnet; label teks lewat OpenCode) dan halaman teks perjanjian/MOU setelah [ISI HADI] dijawab.
2. Nilai ulang komisi afiliasi 5% (sisa SPH tipis setelah biaya Midtrans) sebelum iklan jalan.
3. Animasi landing v2: revisi sesuai masukan Hadi (ditunda; belum ada masukan tertunda).
4. Rekening coach/kolam yang tersimpan format lama tidak dinormalisasi otomatis: cek sebelum ada coach asli.
5. Audit buku besar production diulang setelah ada transaksi asli (2 Okt: cocok). Cek GitHub & situs asli setelah tiap push.

## Tugas Hadi
1. Jalankan migrasi production (2 migrasi baru), kirim jawaban [ISI HADI], ID Pixel + isi token Conversions API di Vercel. Cek menu Paket (member) & Ganti Coach (admin) di production; coba satu pembayaran sampai paket aktif (tombol Beli sudah dibetulkan).
2. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
3. Tes production yang butuh akun/perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP; satu pembayaran sampai paket aktif.
4. Ukur waktu simpan milestone di production (dulu ±6 detik): butuh login production, Claude tidak boleh.
5. Isi [ISI HADI] perjanjian coach & MOU kolam (teks harga-dari-coach sudah disetujui orang hukum); jawaban 3 kolam; akuntan (setor PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus).
6. Membuat secret di GitHub bila diminta. Testimoni asli tambahan.

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Port 3100 di laptop dipakai server Next lain (bukan dari Claude, tidak dimatikan); uji Claude pakai konfigurasi swim-private-hub-dev-3102. Data uji harga-coach lokal: paket uji-hdc-*, saldo Member 8, pengajuan ganti coach Coach 4 -> Coach 5.
- Sweep 2 Okt malam meninggalkan data uji lokal: akun 089977700002-05 (impor, daftar member/coach/kolam; 089977700003 terkunci 15 menit), paket & booking Member 12 / Anak Uji Sweep, saldo coach/kolam bergeser. Database lokal (db:dev) & penyimpanan tiruan (qa-storage) harus dinyalakan ulang setelah laptop tidur.
- Akun admin lokal (089900000001) sekarang ber-2FA; kode lewat scripts/qa-otp.mts. Data uji lokal: Kolam Bahari 0/60 (uji 30 Sep), 5 sesi Hadir tanpa uang (pembayaran disisipkan belakangan), saldo kolam/coach berubah karena uji aksi uang 2 Okt.
