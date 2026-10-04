# STATUS SPH (diperbarui 4 Okt 2026 siang, setelah rombak UI desain Claude Design)

Dimuat otomatis di awal sesi (Claude). Pengembang berikutnya: OpenCode + Fable 5, mulai dari docs/HANDOFF-AGEN.md. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 7017f6e (4 Okt siang; GitHub Test hijau, Vercel sukses; rute lonceng di situs menjawab 401 tanpa login = ada). Migrasi lonceng (20261004120000) SUDAH dijalankan Hadi di production 4 Okt.

## Sudah selesai dan live (ringkas; rinci di docs/reviews/ dan docs/KEPUTUSAN.md)
- Per 30 Sep-1 Okt: tanggal lahir di semua form daftar, testimoni, CSP, PPN komisi 11%, landing dirombak, backup DB+storage hijau, Vercel Singapura, brand v2, animasi landing + dalam aplikasi.
- 2 Okt: HARGA DARI COACH (kolam pasang harga tiket, coach pasang harga jasa, paket 4/8 sesi, biaya layanan 6,5% maks 6,9%, PPh 0,5% titipan, saldo member, ganti coach lewat pengajuan, sesi coba 7 hari). Komisi afiliasi 50% biaya layanan bersih (5% dihapus), kunci login 3x/10x/20x, perjanjian+MOU rev.2, tanda pencairan >7 hari kerja, rekap PPh, Meta Pixel+CAPI (isi ID/token oleh Hadi; event belum dicek).
- 3 Okt dini hari (Opus): model persen lama dihapus total, admin "Berikan paket" tanpa bagi hasil, batas bayar 24 jam, jam buka kolam dijaga, harga kelipatan Rp1.000, uji alur penuh di GitHub, tombol Uji Pulih Backup, bilah bawah HP semua peran, menu admin 4 kelompok, halaman masuk/daftar baru. Sweeping total 3 Okt: 65 halaman x 5 peran, 420 tangkapan layar, 0 bocor akses, audit uang cocok (docs/reviews/2026-10-03-sweeping-total.md).
- 3 Okt sore (Opus, live 91e5881): KOTA + COACH MEMILIH KOLAM. 10 kota tetap; kota di 3 formulir daftar (+ harga paket & kapasitas harian kolam saat daftar); akun lama pilih kota sekali; menu Kolam Saya (coach pilih/lepas kolam sendiri, kota lain dengan peringatan); beli paket disaring kota + daftar tunggu "Kabari saya" + saran kota terdekat; kapasitas harian kolam dijaga saat booking (kosong = tanpa batas); coach tampil bila >=4 jam kosong dalam 14 hari + "Jadwal terdekat"; penjaga jadwal harian (cron 06.00 WIB, /api/cron/harian): hari ke-2 coach diingatkan, hari ke-10 member+admin diberi tahu, member boleh ganti coach tanpa biaya (sekolam atau kolam lain sekota, harga sama/lebih murah, selisih ke saldo), coach dapat catatan pelanggaran (3 dalam 6 bulan = admin menilai nonaktif), paket TIDAK diperpanjang; kartu "Sesi yang harus kamu sediakan"; admin Peminat per Kota + Coach Tanpa Jadwal. Rancangan: docs/designs/kota-coach-kolam.md. Opus kedua: 0 berat (2 kali).
- 3 Okt sore: REV.3 perjanjian coach, MOU kolam, S&K, Kebijakan Pengembalian dipasang (disetujui orang hukum): semua coach & pemilik kolam diminta centang ulang saat masuk. Skrip isi-jadwal-dummy dijalankan Hadi di production (98 jam kosong untuk 5 coach contoh di 5 kolam contoh).
- Alat di scripts/ (lokal kecuali disebut): ukur-halaman, sweep-halaman, uji-hak-akses, uji-formulir, audit-uang (production: AUDIT_PROD=1, baca-saja), isi-harga-dummy (HARGA_DUMMY_PROD=1; juga mengisi kota kolam), isi-jadwal-dummy (JADWAL_DUMMY_PROD=1), akhiri-paket-lama (AKHIRI_PAKET_LAMA_PROD=1), render-brand-social.

- 3 Okt malam: sweeping sistem total ulang (Opus): 474 kunjungan, hak akses 445 sel 0 bocor, formulir 174 kiriman 0 error, audit uang cocok, 4 pemeriksa Opus 0 berat, 14 kelompok perbaikan (docs/reviews/2026-10-03-sweeping-sistem-malam.md). 3 catatan orang hukum: dibiarkan (S&K tidak diubah).
- 4 Okt dini hari (mode tidur, Opus, live): 9 keputusan Hadi dikerjakan (pelanggaran per kejadian coach, kolam nonaktif bukan salah coach + hitungan dimulai ulang, tolak batal sesi sebelum ganti coach, Cari Coach berkolam+kota, tolak beli/booking saat hapus akun & peserta nonaktif, milestone setelah sesi Hadir, rupiah "Rp 1.000", nama menu = judul halaman, sweeping kata ±300 potongan). Rombak UI tahap A (docs/designs/rombak-ui-aplikasi.md): kartu "Langkah berikutnya" di dasbor member/coach/kolam, kebijakan batal di bawah papan booking, tautan beli paket. Kecepatan: server cepat (8-65 md lokal); lambat = server Vercel "bangun tidur" (0,8-2,3 dtk kunjungan pertama). Sweeping tampilan akhir 474 kunjungan 0 masalah; 766 tes + 195 tes balapan lulus.

- 4 Okt siang (live fcef4e8 + 5624d62): ROMBAK UI desain Claude Design (docs/designs/analisis-alur-desain-baru.md; alur TIDAK diubah kecuali booking). Kartu utama gelap (lime di mode gelap), kartu saldo (coach, kolam), segmen sisa sesi (dasbor member + Paket), chip peserta, batang "Terisi 7 hari ke depan" (kolam), beranda member otomatis (jadwal dulu / angka sisa sesi), tombol Hadir/Tidak hadir di dasbor coach (aksi & kunci 24 jam lama, + konfirmasi), BOOKING DUA LANGKAH (pilih jam, tombol menempel, layar sukses + kode; server tidak berubah). 2 pemeriksa Opus: 0 cacat berat; diperbaiki: kalender tertutup tombol menempel, dialog di luar form. Tes: 785 lulus (main), uji alur penuh lokal lulus. Belum ada tes untuk logika pilih-jam di papan booking.
- LONCENG notifikasi (LIVE 7017f6e; 822 tes lulus, build lulus; isi lonceng dengan akun asli di production belum dicek): tabel InAppNotification, 1 pintu di push.ts, lencana dari klien (tanpa query tambahan di render), halaman /notifikasi, hapus >90 hari di cron, dihapus saat akun dianonimkan. Migrasi: prisma/migrations/20261004120000_notifikasi_lonceng (murni tambahan). 1 pemeriksa Opus: 0 cacat berat.

## Sedang jalan / menunggu Hadi
- Pertanyaan terbuka: (1) tolak ganti coach saat member minta hapus akun? (rek. A tolak); (2) tombol "Edit" -> "Ubah" di semua peran? (rek. A); (3) lonceng admin/coach menyimpan nama member yang akunnya dihapus sampai 90 hari: terima atau ikut dibersihkan? (rek. terima, hilang otomatis); (4) beli paket: tombol menempel di halaman Paket belum dibuat (kartu beli per paket); lanjut bentuk lain?
- Pixel Meta + token sudah diisi Hadi di Vercel; event masuk BELUM dicek. Pembayaran asli di production belum pernah ada.

## Tugas Claude berikutnya
1. Kerjakan jawaban 4 pertanyaan terbuka; sapu halaman lain yang ikut kerangka + ukur kecepatan. Opsi C (rombak alur total) tunggu data pemakaian.
2. P8 (reset password via email) setelah email production terbukti. Pantau next-auth v5 stabil (dikunci 5.0.0-beta.32).
3. Ditunda sampai pemicu: rekening format lama, audit buku besar production, event Meta pendaftaran coach/kolam, drop kolom DB model lama (sebulan setelah P1, butuh Hadi), (aturan kota/ganti gratis/pelanggaran sudah ditulis di docs/aturan-bisnis-saat-ini.md 3 Okt malam).

## Tugas Hadi
1. CRON_SECRET sudah dipasang + Redeploy (3 Okt malam). 4 Okt setelah 06.00 WIB cek Vercel > Logs /api/cron/harian: 200 = jalan, 401 = kunci tidak cocok. Sekalian cek Settings > Functions: Fluid Compute aktif? (mengurangi server "bangun tidur").
2. **14 Okt 2026 (INGATKAN Hadi di awal sesi pada/sesudah tanggal ini):** jalankan ulang isi-jadwal-dummy --apply di production (jam kosong contoh habis sekitar 13 Okt; tanpa itu coach contoh hilang dari halaman beli paket). Pengingat cukup catatan ini (Hadi pilih A, bukan kalender).
3. Production: akhiri-paket-lama (lihat dulu, lalu --apply); belum tercatat sudah dijalankan.
4. Tombol GitHub Actions > Uji Pulih Backup sekali.
5. P5: isi DATABASE_CA_CERT di pratinjau Vercel dulu, cek jalan, baru production.
6. Event Meta (jendela penyamaran), lalu hapus META_TEST_EVENT_CODE di Vercel.
7. HP asli + Safari (alur kota, Kolam Saya, notifikasi daftar tunggu); satu pembayaran sungguhan sampai paket aktif; unggah foto/sertifikat, email, notifikasi HP.
8. Akuntan: PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus (+ saldo dari ganti coach ke coach lebih murah). Testimoni asli. Matikan plugin tak terpakai.

## Belum terverifikasi
- HP asli dan Safari; notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; halaman login di production; pemeriksa harian di Vercel (belum terbukti jalan); tablet 768 hanya pemeriksa otomatis.

## Catatan lingkungan lokal
- Nyalakan lagi bila laptop tidur: `npm run db:dev` (54330), `node scripts/qa-storage.mjs` (54331), `npm run db:race` (54329, untuk `npm run test:race`; bila gagal "postmaster.pid", jalankan `prisma migrate deploy` ke 54329 langsung). Server uji versi jadi: konfigurasi swim-private-hub-start-3110 (`npx next start -p 3110`; bangun ulang dulu).
- Akun uji lokal (password uji dev ada di scripts/dev-db-sync.mjs): admin 089900000001 (2FA, kode lewat scripts/qa-otp.mts), coach 089900000004/10, pemilik kolam 089900000002, member 089977700099 (kota Bandung, paket sudah dipindah lewat uji ganti gratis ke Coach 6). Ketiganya sudah menyetujui rev.3. Database e2e lokal dibuat ulang tiap uji alur penuh (database "e2e" di 54329).
- Data uji lokal: kolam contoh semua kota Jakarta (Cempaka Bandung), jam kosong contoh 4/coach contoh, daftar tunggu Bandung sudah dikabari, kolam uji Malang menunggu persetujuan.
