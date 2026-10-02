# STATUS SPH (diperbarui 2 Okt 2026 siang)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 4c715bd (2 Okt siang; GitHub hijau, situs asli memuat animasi coach baru; 2 migrasi sudah dijalankan Hadi di production). Kecepatan HP landing belum diukur ulang setelah animasi coach (HP tidak kena animasi ini; dicek lebar 375: tanpa animasi, tanpa geser samping).

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin pendaftar baru; testimoni; CSP aktif; PPN komisi 11%; landing dirombak; backup database dan storage hijau.
- 1 Okt: Vercel di Singapura (sin1); rombak cara main Claude; brand v2 + gambar sosial hi-res (foto profil = tanda saja, transparan; tagline bertitik; skrip render di repo).
- 1 Okt malam: animasi landing tahap 2 (bug bagian kosong saat "kurangi gerakan" diperbaiki), animasi dalam aplikasi tahap 3 (4 peran), sweeping UI+sistem pertama. docs/reviews/2026-10-01-sweeping-ui-sistem.md.
- 2 Okt (Opus): animasi landing v2 bertema air (riak, judul muncul dari air, gelombang, HP miring, perenang di lintasan, coretan cara lama, parallax, sorotan, tombol magnetis) + video perenang desktop. Situs asli: elemen terbesar HP 0,93 dtk (awal 2,37). docs/reviews/2026-10-01-animasi-landing.md bagian v2.
- 2 Okt (Opus): kunci pembatas login diringkas; batas nama 100 di semua jalur akun/peserta (diperiksa Opus kedua); audit buku besar + aksi uang lewat tampilan + 146 tes balapan: cocok/lulus; sweeping ulang + konsistensi gaya. docs/reviews/2026-10-02-sweeping-opus.md.
- 2 Okt (Opus): HARGA DARI COACH tahap 1+2 live. Kolam (tiket) & coach (jasa) pasang harga paket 4 sesi (60 hari, batal 2x) / 8 sesi (90 hari, batal 4x); member bayar + biaya layanan SPH 6,5% (maks 6,9%); sesi coba 7 hari, tidak bisa dibatalkan sendiri; eceran & kartu kredit dihapus; paket terikat coach; bagi uang per rupiah + PPh 0,5% (titipan, bukan pendapatan SPH); saldo member; ganti coach lewat pengajuan + admin (menu Ganti Coach); catat setor PPh (Bagi Hasil). Harga dummy production diisi (kolam 260/480rb, coach 440/800rb). Rancangan: docs/designs/harga-dari-coach.md.
- 2 Okt: indeks email lama dicatat di schema (migrasi baru tidak lagi memunculkan DROP INDEX). Teks hukum harga-dari-coach disetujui orang hukum dan dipasang (+ S&K 4.5e saldo saat hapus akun; peringatan saldo di Profil member & layar persetujuan admin) (S&K, Pengembalian, Privasi; perjanjian coach & MOU kolam disesuaikan, masih ada [ISI HADI]).
- 2 Okt malam (Opus): cek menyeluruh SEMUA fitur x 4 peran + publik di laptop (docs/reviews/2026-10-02-sweeping-sistem-semua-fitur.md). Diperbaiki: tombol Beli paket ditolak Midtrans (live 9efc7d8), error database mentah tampil ke pengguna (18 tempat), nomor rekening boleh huruf, kolom tgl lahir impor Excel, teks mekanis. Temuan menunggu keputusan Hadi ada di laporan.
- 2 Okt dini hari (Opus, live): coach batal sakit = jam ditutup (+ tes balapan R9b); Laporan Kolam menampilkan Bagian Kolam / PPh 0,5% / Masuk Saldo; mekanisme centang perjanjian coach & MOU kolam (MATI sampai teks final, lihat Sedang jalan); Meta Pixel + Conversions API (MATI sampai ID/token). Opus kedua: tidak ada temuan berat, catatan diperbaiki.
- 2 Okt pagi (Sonnet High, live): 8 perbaikan ringan sweeping, dialog konfirmasi admin untuk aksi uang, isian form dipertahankan saat ditolak, tgl lahir di tambah peserta admin, saldo/laporan kolam rapi di HP, tap target tablet, landing: animasi desktop per section + teks sesuai sistem harga-dari-coach + jawaban blind spot. Sweeping ulang penuh: docs/reviews/2026-10-02-sweeping-sonnet-high.md.
- 2 Okt siang (Sonnet High, live 4c715bd): animasi desktop "Kenalan dengan coach" (tali lintasan berkelok tergambar saat scroll, kartu masuk dari sisinya + melayang, foto bergeser, isi panel muncul bergiliran, kilau label sertifikat); susunan kartu tidak diubah (Hadi: B).
- Alat di scripts/ (hanya lokal kecuali disebut): ukur-halaman (kecepatan, boleh situs asli), sweep-halaman, uji-hak-akses, uji-formulir, audit-uang (production: AUDIT_PROD=1, baca-saja, Hadi), isi-harga-dummy (production: HARGA_DUMMY_PROD=1, Hadi), render-brand-social.

## Sedang jalan
- SIAP TAPI BELUM DI-PUSH (commit lokal 65c714e): teks final Perjanjian Coach (/perjanjian-coach) & MOU Kolam (/mou-kolam) dari 22 isian yang disetujui Hadi + centang persetujuan AKTIF (versi "Perjanjian Coach 2 Oktober 2026" / "MOU Kolam 2 Oktober 2026") + tombol Keluar di halaman persetujuan + gerbang di tandai-hadir coach & API tanggal jadwal. Diperiksa Opus kedua; tsc, 765 tes, build lulus. Ditahan sampai Hadi menjawab pertanyaan (butir reviewer belum diperiksa; kalau teks berubah, versi diganti dan semua mitra centang ulang). Catatan pemeriksa dan sisa: lihat KEPUTUSAN 2 Okt siang.
- 2 Okt siang: validasi brief ChatGPT selesai (docs/reviews/2026-10-02-validasi-brief-chatgpt.md): 30 temuan + 1 baris gap produksi diberi label; benar penting = ekonomi afiliasi, kunci akun admin, angka landing, dokumen basi; tes balapan 161 lulus.
- Menunggu Hadi: (0) pilih opsi ECON-001 (komisi afiliasi) dan AUTH-002 (kunci akun) dari laporan validasi; (1) aba-aba model: Opus dulu (batas tanggung jawab, keselamatan kolam, aturan batal longgar, push perjanjian) lalu Sonnet (angka/label landing, sitemap noindex, entry mitra di hero, dokumen aturan saat ini); (2) ID Pixel + token Conversions API (META_CAPI_TOKEN, diisi Hadi di Vercel).
- Jalur bayar Midtrans diuji di laptop mode uji; di production belum ada pembayaran sungguhan.

## Tugas Claude berikutnya
1. Setelah Hadi memutuskan: tambah batas tanggung jawab & samakan keselamatan kolam dengan S&K 6.2 bila disetujui, sesuaikan teks 'bukan dijaga sistem', lalu push + cek situs asli.
2. Setelah ID Pixel & token: cek event masuk di Meta Events Manager (kode uji), lalu hapus kode uji.
3. Nilai ulang komisi afiliasi 5% sebelum iklan jalan.
4. Rekening format lama tidak dinormalisasi otomatis: cek sebelum ada coach asli.
5. Audit buku besar production diulang setelah ada transaksi asli. Cek GitHub & situs asli setelah tiap push.

## Tugas Hadi
1. Putuskan pertanyaan perjanjian/MOU (di chat 2 Okt siang); teruskan butir asuransi, sengketa, keselamatan kolam, bukti potong, pajak afiliasi ke reviewer/akuntan.
2. Kirim ID Pixel Meta (di chat), isi token Conversions API sendiri di Vercel dengan nama META_CAPI_TOKEN (jangan dikirim ke chat).
3. Cek menu Paket (member) & Ganti Coach (admin) di production; coba satu pembayaran sampai paket aktif. Cek landing di HP asli + Safari.
4. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
5. Tes production yang butuh akun/perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP; ukur waktu simpan milestone.
6. Akuntan: setor PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus. Testimoni asli (testimoni baru kini tersembunyi sampai ditekan Tampilkan).

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Port 3100 di laptop dipakai server Next lain (bukan dari Claude, tidak dimatikan); uji Claude pakai konfigurasi swim-private-hub-dev-3102. Data uji harga-coach lokal: paket uji-hdc-*, saldo Member 8, pengajuan ganti coach Coach 4 -> Coach 5.
- Sweep 2 Okt malam meninggalkan data uji lokal: akun 089977700002-05 (impor, daftar member/coach/kolam; 089977700003 terkunci 15 menit), paket & booking Member 12 / Anak Uji Sweep, saldo coach/kolam bergeser. Database lokal (db:dev) & penyimpanan tiruan (qa-storage) harus dinyalakan ulang setelah laptop tidur.
- Akun admin lokal (089900000001) sekarang ber-2FA; kode lewat scripts/qa-otp.mts. Data uji lokal: Kolam Bahari 0/60 (uji 30 Sep), 5 sesi Hadir tanpa uang (pembayaran disisipkan belakangan), saldo kolam/coach berubah karena uji aksi uang 2 Okt.
