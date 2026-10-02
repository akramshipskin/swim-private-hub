# STATUS SPH (diperbarui 2 Okt 2026 malam, sapu memori sebelum compact)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: e86cb24 / 6e9ce0b dokumen (2 Okt malam; GitHub hijau, Vercel sukses). Kode aplikasi terakhir: af7bbc1 (sweeping total). Tanpa migrasi baru.

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
## Sedang jalan
- **Antrean utama: docs/backlog/2026-10-02-rencana-sweeping-chatgpt-2.md** (32 temuan sweeping ChatGPT ke-2, SEMUA sudah diputuskan Hadi 2 Okt malam, rincian di KEPUTUSAN.md "2 Okt malam"). Opus P1-P9, Sonnet S1-S19, daftar "tidak dikerjakan". BELUM dikerjakan; Hadi memilih compact dulu lalu mulai.
- Inti keputusan: hapus model lama total (data dummy; kolom DB tidak di-drop dulu), batas bayar 24 jam di semua tempat, jam buka kolam dijaga di slot+booking, harga kelipatan Rp1.000, verifikasi sertifikat DB, uji alur penuh di GitHub, uji pulih backup, reset password via email terkonfirmasi (setelah email prod terbukti), navigasi HP bilah bawah, menu admin 4 kelompok.
- Koreksi Claude 2 Okt malam: (1) klaim "tidak ada sisa model lintas-kolam di kode" salah (cari "lintas kolam" tanpa tanda hubung); README + komentar saldo/skema masih lama -> S1. (2) Label "pernah les" (S1 pagi) tidak cocok dengan dasar hitung paket -> S2.
- Pixel Meta + token sudah diisi Hadi di Vercel; event masuk BELUM dicek (Hadi cek Test events). Pembayaran asli di production belum pernah ada.

## Tugas Claude berikutnya
1. Setelah aba-aba Hadi (sesi baru): Opus P1 (hapus model lama) -> P2-P5 -> pemeriksa Opus kedua + tes balapan -> push; skrip production (paket lama berakhir) dijalankan Hadi.
2. Sonnet S1-S19 satu batch (S5, S12, S19 sesudah P1); lalu Opus P6 (uji alur penuh), P7 (uji pulih backup); P8 setelah email production terbukti.
3. Ditunda sampai pemicu: rekening format lama, audit buku besar production, event Meta pendaftaran coach/kolam, drop kolom DB lama (sebulan setelah P1).

## Tugas Hadi
1. Beri aba-aba mulai rencana sweeping ChatGPT ke-2 (sesi baru, Opus dulu).
2. Cek event Meta (jendela penyamaran: PageView, daftar 1 member dummy), lalu hapus META_TEST_EVENT_CODE di Vercel.
3. Cek landing + aplikasi di HP asli + Safari; satu pembayaran sungguhan sampai paket aktif; menu Paket (member) & Ganti Coach (admin).
4. Tes production butuh akun/perangkat Hadi: unggah foto/sertifikat/tanda tangan, email masuk & keluar (syarat P8), notifikasi HP.
5. Akuntan: PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus. Testimoni asli.
6. Matikan plugin/konektor tak terpakai di aplikasi Desktop.

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Port 3100 di laptop dipakai server Next lain (bukan dari Claude, tidak dimatikan); uji Claude pakai konfigurasi swim-private-hub-dev-3102 (server ini dinyalakan ulang 2 Okt siang). Nyalakan lagi bila laptop tidur: `npm run db:dev` (port 54330), `node scripts/qa-storage.mjs` (54331), dan `npm run db:race` (54329, hanya untuk `npm run test:race`).
- Gerbang perjanjian aktif di laptop: akun coach 089900000004/10 dan pemilik kolam 089900000002 diarahkan ke /perjanjian sampai mencentang (data setuju dikosongkan lagi setelah uji). Skrip sweeping/QA untuk peran itu berhenti di halaman itu; centang dulu atau kosongkan lewat skrip kecil.
- Data uji lokal: paket uji-hdc-*, saldo Member 8, pengajuan ganti coach Coach 4 -> Coach 5; akun 089977700002-05 (impor/daftar uji); paket & booking Member 12 / Anak Uji Sweep; saldo coach/kolam bergeser karena uji uang; Kolam Bahari 0/60; member uji 089977700099 (paket 8 sesi Coach 4, 1 sesi Tidak Hadir, komisi afiliasi menunggu); akun coach/kolam uji sudah centang rev.2. Server uji versi jadi: `npx next start -p 3110`.
- Akun admin lokal (089900000001) ber-2FA; kode lewat scripts/qa-otp.mts (satu kode tidak boleh dipakai dua kali dalam 30 detik).
