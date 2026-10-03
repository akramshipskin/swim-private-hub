# STATUS SPH (diperbarui 3 Okt 2026 dini hari, mode tidur: rencana ChatGPT ke-2 dikerjakan)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 0e021af (3 Okt dini hari; GitHub hijau: tes, tes balapan, uji alur penuh; Vercel sukses). Tanpa migrasi baru.

## Sudah selesai dan live
- Per 30 Sep: tanggal lahir di semua form daftar; notifikasi admin pendaftar baru; testimoni; CSP aktif; PPN komisi 11%; landing dirombak; backup database dan storage hijau.
- 1 Okt: Vercel di Singapura (sin1); rombak cara main Claude; brand v2 + gambar sosial hi-res (foto profil = tanda saja, transparan; tagline bertitik; skrip render di repo).
- 1 Okt malam: animasi landing tahap 2 (bug bagian kosong saat "kurangi gerakan" diperbaiki), animasi dalam aplikasi tahap 3 (4 peran), sweeping UI+sistem pertama. docs/reviews/2026-10-01-sweeping-ui-sistem.md.
- 2 Okt (Opus): animasi landing v2 bertema air (riak, judul muncul dari air, gelombang, HP miring, perenang di lintasan, coretan cara lama, parallax, sorotan, tombol magnetis) + video perenang desktop. Situs asli: elemen terbesar HP 0,93 dtk (awal 2,37). docs/reviews/2026-10-01-animasi-landing.md bagian v2.
- 2 Okt (Opus): kunci pembatas login diringkas; batas nama 100 di semua jalur akun/peserta (diperiksa Opus kedua); audit buku besar + aksi uang lewat tampilan + 146 tes balapan: cocok/lulus; sweeping ulang + konsistensi gaya. docs/reviews/2026-10-02-sweeping-opus.md.
- 2 Okt (Opus): HARGA DARI COACH tahap 1+2 live. Kolam (tiket) & coach (jasa) pasang harga paket 4 sesi (60 hari, batal 2x) / 8 sesi (90 hari, batal 4x); member bayar + biaya layanan SPH 6,5% (maks 6,9%); sesi coba 7 hari, tidak bisa dibatalkan sendiri; eceran & kartu kredit dihapus; paket terikat coach; bagi uang per rupiah + PPh 0,5% (titipan, bukan pendapatan SPH); saldo member; ganti coach lewat pengajuan + admin (menu Ganti Coach); catat setor PPh (Bagi Hasil). Harga dummy production diisi (kolam 260/480rb, coach 440/800rb). Rancangan: docs/designs/harga-dari-coach.md.
- 2 Okt: indeks email lama dicatat di schema (migrasi baru tidak lagi memunculkan DROP INDEX). Teks hukum harga-dari-coach disetujui orang hukum dan dipasang (+ S&K 4.5e saldo saat hapus akun; peringatan saldo di Profil member & layar persetujuan admin) (S&K, Pengembalian, Privasi; perjanjian coach & MOU kolam: teks final sudah jadi, lihat Sedang jalan).
- 2 Okt malam (Opus): cek menyeluruh SEMUA fitur x 4 peran + publik di laptop (docs/reviews/2026-10-02-sweeping-sistem-semua-fitur.md). Diperbaiki: tombol Beli paket ditolak Midtrans (live 9efc7d8), error database mentah tampil ke pengguna (18 tempat), nomor rekening boleh huruf, kolom tgl lahir impor Excel, teks mekanis. Temuan menunggu keputusan Hadi ada di laporan.
- 2 Okt dini hari (Opus, live): coach batal sakit = jam ditutup (+ tes balapan R9b); Laporan Kolam menampilkan Bagian Kolam / PPh 0,5% / Masuk Saldo; mekanisme centang perjanjian coach & MOU kolam (MATI sampai teks final, lihat Sedang jalan); Meta Pixel + Conversions API (MATI sampai ID/token). Opus kedua: tidak ada temuan berat, catatan diperbaiki.
- 2 Okt pagi (Sonnet High, live): 8 perbaikan ringan sweeping, dialog konfirmasi admin untuk aksi uang, isian form dipertahankan saat ditolak, tgl lahir di tambah peserta admin, saldo/laporan kolam rapi di HP, tap target tablet, landing: animasi desktop per section + teks sesuai sistem harga-dari-coach + jawaban blind spot. Sweeping ulang penuh: docs/reviews/2026-10-02-sweeping-sonnet-high.md.
- 2 Okt siang (Sonnet High, live 4c715bd): animasi desktop "Kenalan dengan coach" (tali lintasan berkelok tergambar saat scroll, kartu masuk dari sisinya + melayang, foto bergeser, isi panel muncul bergiliran, kilau label sertifikat); susunan kartu tidak diubah (Hadi: B).
- Alat di scripts/ (hanya lokal kecuali disebut): ukur-halaman (kecepatan, boleh situs asli), sweep-halaman, uji-hak-akses, uji-formulir, audit-uang (production: AUDIT_PROD=1, baca-saja, Hadi), isi-harga-dummy (production: HARGA_DUMMY_PROD=1, Hadi), render-brand-social.

- 2 Okt sore (live): batch Sonnet S1-S16 (3304cb3) + batch Opus O1-O8 (5bc6b97: komisi afiliasi 50% biaya layanan bersih sejak 3 Okt, kunci login 3x/10x/20x, perjanjian+MOU rev.2 DISETUJUI orang hukum, tanda pencairan >7 hari kerja, rekap PPh, statistik landing akun asli). Laporan docs/reviews/2026-10-02-opus-batch-o1-o8.md.
- 2 Okt siang-sore (live af7bbc1): sweeping sistem total + O6 (bayar -> Hadir -> Tidak Hadir -> audit cocok), 0 temuan berat/sedang. docs/reviews/2026-10-02-sweeping-sistem-total.md.
- 3 Okt dini hari (Opus, live): rencana sweeping ChatGPT ke-2 P1-P7 + P9 + S1-S19 (rinci di docs/reviews/2026-10-03-validasi-rencana-chatgpt-2.md): model lama dihapus total, admin "Berikan paket" model baru tanpa bagi hasil, batas bayar 24 jam, jam buka kolam dijaga, harga kelipatan Rp1.000, verifikasi sertifikat DB (siap, belum aktif), uji alur penuh di GitHub, tombol Uji Pulih Backup, bilah bawah HP semua peran, menu admin 4 kelompok, halaman masuk/daftar baru, dst. Pemeriksa Opus kedua: 0 berat.

## Sedang jalan
- Sweeping total 3 Okt selesai: 420 tangkapan layar, 0 bocor akses, 0 error server, audit cocok, 3 perbaikan mekanis (docs/reviews/2026-10-03-sweeping-total.md).
- Pixel Meta + token sudah diisi Hadi di Vercel; event masuk BELUM dicek. Pembayaran asli di production belum pernah ada.

## Tugas Claude berikutnya
1. KOTA + COACH MEMILIH KOLAM LIVE (91e5881, 3 Okt; GitHub hijau, Vercel sukses): kota di 3 formulir daftar, akun lama pilih kota, Kolam Saya, saringan kota + daftar tunggu, kapasitas harian dijaga saat booking, coach tampil bila >=4 jam kosong/14 hari, penjaga jadwal harian (cron 06.00 WIB), ganti coach tanpa biaya hari ke-10, tanggungan sesi coach, admin Peminat per Kota & Coach Tanpa Jadwal. Rev.3 perjanjian coach/MOU kolam/S&K/Pengembalian dipasang (disetujui orang hukum): semua coach & pemilik kolam diminta centang ulang. Sweeping alur baru lokal: 5 peran x HP/tablet/desktop x terang/gelap, 0 halaman rusak. Rancangan: docs/designs/kota-coach-kolam.md.
2. P8 (reset password via email) setelah email production terbukti.
3. Pantau rilis stabil next-auth v5 (sekarang dikunci 5.0.0-beta.32).
4. Ditunda sampai pemicu: rekening format lama, audit buku besar production, event Meta pendaftaran coach/kolam, drop kolom DB model lama (sebulan setelah P1, butuh Hadi).

## Tugas Hadi
0a. **14 Okt 2026 (INGATKAN Hadi di awal sesi pada/ sesudah tanggal ini):** jalankan ulang skrip isi-jadwal-dummy dengan --apply di production (jam kosong contoh yang diisi 3 Okt habis sekitar 13 Okt; tanpa ini coach contoh hilang dari halaman beli paket).
0. Production: skrip isi-jadwal-dummy SUDAH dijalankan 3 Okt (98 jam kosong). Cek CRON_SECRET terisi di Vercel + Logs pemeriksa harian 06.00 WIB. Kirim ke orang hukum 3 catatan di KEPUTUSAN.md (S&K butir paket lama, pengecualian paket admin, kapasitas penuh).
1. Production: jalankan skrip akhiri-paket-lama (lihat dulu, lalu --apply) dan isi-harga-dummy (mengisi jam buka kolam yang kosong; tanpa jam buka coach tidak bisa buka jadwal).
2. Jalankan sekali tombol GitHub Actions > Uji Pulih Backup.
3. P5: isi DATABASE_CA_CERT (sertifikat CA dari Supabase) di pratinjau Vercel dulu, cek situs pratinjau jalan, baru production.
4. Cek event Meta (jendela penyamaran), lalu hapus META_TEST_EVENT_CODE di Vercel.
5. Cek HP asli + Safari; satu pembayaran sungguhan sampai paket aktif; unggah foto/sertifikat, email, notifikasi HP.
6. Akuntan: PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus. Testimoni asli. Matikan plugin tak terpakai.

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Port 3100 di laptop dipakai server Next lain (bukan dari Claude, tidak dimatikan); uji Claude pakai konfigurasi swim-private-hub-dev-3102 (server ini dinyalakan ulang 2 Okt siang). Nyalakan lagi bila laptop tidur: `npm run db:dev` (port 54330), `node scripts/qa-storage.mjs` (54331), dan `npm run db:race` (54329, hanya untuk `npm run test:race`).
- Gerbang perjanjian aktif di laptop: akun coach 089900000004/10 dan pemilik kolam 089900000002 diarahkan ke /perjanjian sampai mencentang (data setuju dikosongkan lagi setelah uji). Skrip sweeping/QA untuk peran itu berhenti di halaman itu; centang dulu atau kosongkan lewat skrip kecil.
- Data uji lokal: paket uji-hdc-*, saldo Member 8, pengajuan ganti coach Coach 4 -> Coach 5; akun 089977700002-05 (impor/daftar uji); paket & booking Member 12 / Anak Uji Sweep; saldo coach/kolam bergeser karena uji uang; Kolam Bahari 0/60; member uji 089977700099 (paket 8 sesi Coach 4, 1 sesi Tidak Hadir, komisi afiliasi menunggu); akun coach/kolam uji sudah centang rev.2. Server uji versi jadi: `npx next start -p 3110`.
- Akun admin lokal (089900000001) ber-2FA; kode lewat scripts/qa-otp.mts (satu kode tidak boleh dipakai dua kali dalam 30 detik).
