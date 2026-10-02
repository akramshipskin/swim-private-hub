# STATUS SPH (diperbarui 2 Okt 2026 siang, sapu memori sebelum pindah sesi)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 4c715bd (2 Okt siang; GitHub hijau, situs asli memuat animasi coach baru; 2 migrasi sudah dijalankan Hadi di production). Kecepatan HP landing belum diukur ulang setelah animasi coach (HP tidak kena animasi ini; dicek lebar 375: tanpa animasi, tanpa geser samping).

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

## Sedang jalan
- **Antrean utama: docs/backlog/2026-10-02-rencana-kerja-gabungan.md** (tanggapan atas brief ChatGPT + seluruh antrean lama; Opus O1-O10, Sonnet S1-S16, Tidak dikerjakan, Tugas Hadi). Validasi brief: docs/reviews/2026-10-02-validasi-brief-chatgpt.md (30 temuan; benar penting: ekonomi afiliasi, kunci akun admin, angka landing, dokumen basi; tes balapan 161 lulus).
- Pixel Meta + token sudah diisi Hadi di Vercel (ID Pixel terlihat aktif di kode situs asli, 2311533866264108). Event masuk BELUM dicek (akses Meta Claude menolak ID itu; Hadi cek Test events).
- 2 Okt sore: batch Sonnet S1-S16 (landing, dokumen aturan bisnis) LIVE 3304cb3. Batch Opus O1-O3, O5, O7, O8 + statistik landing akun asli selesai, diperiksa Opus kedua (2 putaran, temuan diperbaiki), di-push: laporan docs/reviews/2026-10-02-opus-batch-o1-o8.md. O6 belum dijalankan terpisah (usul masuk sweeping). Sweeping ulang menunggu aba-aba Hadi.
- Jalur bayar Midtrans diuji di laptop mode uji; di production belum ada pembayaran sungguhan.

## Tugas Claude berikutnya (urutan; model tiap butir ada di rencana gabungan)
1. Tunggu aba-aba Hadi untuk sweeping sistem ulang (termasuk O6 dan cek mitra centang ulang perjanjian rev.2).
2. Cek situs asli setelah deploy batch Opus (kartu afiliasi, halaman perjanjian rev.2, statistik landing).
3. Cek event Meta (kode uji) bersama Hadi, lalu minta Hadi hapus META_TEST_EVENT_CODE.
4. Ditunda sampai ada pemicu: rekening format lama (cek sebelum coach asli), audit buku besar production (setelah transaksi asli), kejadian Meta pendaftaran coach/kolam (iklan perekrutan), tombol stop jual paket kolam berakhir.

## Tugas Hadi
1. Beri aba-aba sweeping ulang bila semua kerjaan dianggap beres.
2. Cek event Meta: situs asli di jendela penyamaran (PageView), daftar satu member dummy (CompleteRegistration), lihat Test events; lalu hapus META_TEST_EVENT_CODE di Vercel.
3. Teruskan butir asuransi, sengketa, keselamatan kolam, bukti potong, pajak afiliasi ke reviewer/akuntan.
4. Cek menu Paket (member) & Ganti Coach (admin) di production; coba satu pembayaran sampai paket aktif. Cek landing di HP asli + Safari.
5. Matikan plugin dan konektor tak terpakai di aplikasi Desktop: Sales, Finance, Marketing, Productivity, Engineering, Design, Cowork.
6. Tes production yang butuh akun/perangkat Hadi: unggah foto, sertifikat, tanda tangan; email masuk dan keluar; notifikasi di HP; ukur waktu simpan milestone.
7. Akuntan: setor PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus. Testimoni asli (testimoni baru tersembunyi sampai ditekan Tampilkan).

## Belum terverifikasi
- HP asli dan Safari (landing, animasi, aplikasi); notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; tampilan halaman yang butuh login di production.

## Catatan lingkungan lokal
- Port 3100 di laptop dipakai server Next lain (bukan dari Claude, tidak dimatikan); uji Claude pakai konfigurasi swim-private-hub-dev-3102 (server ini dinyalakan ulang 2 Okt siang). Nyalakan lagi bila laptop tidur: `npm run db:dev` (port 54330), `node scripts/qa-storage.mjs` (54331), dan `npm run db:race` (54329, hanya untuk `npm run test:race`).
- Gerbang perjanjian aktif di laptop: akun coach 089900000004/10 dan pemilik kolam 089900000002 diarahkan ke /perjanjian sampai mencentang (data setuju dikosongkan lagi setelah uji). Skrip sweeping/QA untuk peran itu berhenti di halaman itu; centang dulu atau kosongkan lewat skrip kecil.
- Data uji lokal: paket uji-hdc-*, saldo Member 8, pengajuan ganti coach Coach 4 -> Coach 5; akun 089977700002-05 (impor/daftar uji); paket & booking Member 12 / Anak Uji Sweep; saldo coach/kolam bergeser karena uji uang; Kolam Bahari 0/60.
- Akun admin lokal (089900000001) ber-2FA; kode lewat scripts/qa-otp.mts (satu kode tidak boleh dipakai dua kali dalam 30 detik).
