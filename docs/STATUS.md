# STATUS SPH (diperbarui 3 Okt 2026 sore, setelah kota + rev.3 live dan Hadi menjawab)

Dimuat otomatis di awal sesi. Maksimal 60 baris. Keputusan bertanggal ada di docs/KEPUTUSAN.md; daftar kerjaan lengkap di docs/backlog/sph-backlog-gabungan-2026-09-29.md (bagian paling bawah); daftar halaman per peran di docs/cakupan-halaman.md.

## Terakhir live: 91e5881 (3 Okt; GitHub hijau: tes, tes balapan, uji alur penuh; Vercel sukses). Catatan terakhir eaeb9dd. Migrasi production sudah dijalankan Hadi (kota + penjaga jadwal).

## Sudah selesai dan live (ringkas; rinci di docs/reviews/ dan docs/KEPUTUSAN.md)
- Per 30 Sep-1 Okt: tanggal lahir di semua form daftar, testimoni, CSP, PPN komisi 11%, landing dirombak, backup DB+storage hijau, Vercel Singapura, brand v2, animasi landing + dalam aplikasi.
- 2 Okt: HARGA DARI COACH (kolam pasang harga tiket, coach pasang harga jasa, paket 4/8 sesi, biaya layanan 6,5% maks 6,9%, PPh 0,5% titipan, saldo member, ganti coach lewat pengajuan, sesi coba 7 hari). Komisi afiliasi 50% biaya layanan bersih (5% dihapus), kunci login 3x/10x/20x, perjanjian+MOU rev.2, tanda pencairan >7 hari kerja, rekap PPh, Meta Pixel+CAPI (isi ID/token oleh Hadi; event belum dicek).
- 3 Okt dini hari (Opus): model persen lama dihapus total, admin "Berikan paket" tanpa bagi hasil, batas bayar 24 jam, jam buka kolam dijaga, harga kelipatan Rp1.000, uji alur penuh di GitHub, tombol Uji Pulih Backup, bilah bawah HP semua peran, menu admin 4 kelompok, halaman masuk/daftar baru. Sweeping total 3 Okt: 65 halaman x 5 peran, 420 tangkapan layar, 0 bocor akses, audit uang cocok (docs/reviews/2026-10-03-sweeping-total.md).
- 3 Okt sore (Opus, live 91e5881): KOTA + COACH MEMILIH KOLAM. 10 kota tetap; kota di 3 formulir daftar (+ harga paket & kapasitas harian kolam saat daftar); akun lama pilih kota sekali; menu Kolam Saya (coach pilih/lepas kolam sendiri, kota lain dengan peringatan); beli paket disaring kota + daftar tunggu "Kabari saya" + saran kota terdekat; kapasitas harian kolam dijaga saat booking (kosong = tanpa batas); coach tampil bila >=4 jam kosong dalam 14 hari + "Jadwal terdekat"; penjaga jadwal harian (cron 06.00 WIB, /api/cron/harian): hari ke-2 coach diingatkan, hari ke-10 member+admin diberi tahu, member boleh ganti coach tanpa biaya (sekolam atau kolam lain sekota, harga sama/lebih murah, selisih ke saldo), coach dapat catatan pelanggaran (3 dalam 6 bulan = admin menilai nonaktif), paket TIDAK diperpanjang; kartu "Sesi yang harus kamu sediakan"; admin Peminat per Kota + Coach Tanpa Jadwal. Rancangan: docs/designs/kota-coach-kolam.md. Opus kedua: 0 berat (2 kali).
- 3 Okt sore: REV.3 perjanjian coach, MOU kolam, S&K, Kebijakan Pengembalian dipasang (disetujui orang hukum): semua coach & pemilik kolam diminta centang ulang saat masuk. Skrip isi-jadwal-dummy dijalankan Hadi di production (98 jam kosong untuk 5 coach contoh di 5 kolam contoh).
- Alat di scripts/ (lokal kecuali disebut): ukur-halaman, sweep-halaman, uji-hak-akses, uji-formulir, audit-uang (production: AUDIT_PROD=1, baca-saja), isi-harga-dummy (HARGA_DUMMY_PROD=1; juga mengisi kota kolam), isi-jadwal-dummy (JADWAL_DUMMY_PROD=1), akhiri-paket-lama (AKHIRI_PAKET_LAMA_PROD=1), render-brand-social.

## Sedang jalan
- Hadi akan compact konteks dulu, lalu minta sweeping sistem total ulang (dia sudah bilang "ya"). Sweeping khusus alur baru (174 kunjungan lokal, 5 peran, HP/tablet/desktop, terang/gelap) sudah bersih.
- Pixel Meta + token sudah diisi Hadi di Vercel; event masuk BELUM dicek. Pembayaran asli di production belum pernah ada.

## Tugas Claude berikutnya
1. Sweeping sistem total ulang setelah update kota (skill sweeping): semua 65 halaman x 5 peran, uji-hak-akses termasuk alamat baru (/coach/kolam, /kota, /admin/peminat-kota, /admin/coach-tanpa-jadwal, /api/cron/harian), uji-formulir untuk formulir baru, audit buku besar lokal. Bagian uang/hak akses di Opus (Hadi pilih lewat menu model), tampilan di Sonnet High. Laporan tabel cakupan lengkap.
2. Revisi S&K dari 3 catatan ke orang hukum: Hadi bilang "approved" tapi teks hasilnya belum ada di Claude; JANGAN mengubah S&K sebelum Hadi memberi teks/penjelasan (catatan: S&K Pasal 2 butir 10 paket sebelum 2 Okt, pengecualian paket admin pada hak ganti gratis, kapasitas penuh menolak pemesanan).
3. P8 (reset password via email) setelah email production terbukti. Pantau next-auth v5 stabil (dikunci 5.0.0-beta.32).
4. Ditunda sampai pemicu: rekening format lama, audit buku besar production, event Meta pendaftaran coach/kolam, drop kolom DB model lama (sebulan setelah P1, butuh Hadi), docs/aturan-bisnis-saat-ini.md belum memuat aturan kota/ganti coach gratis/pelanggaran (tulis saat sweeping).

## Tugas Hadi
1. CRON_SECRET: boleh dicek/diisi SEKARANG (tidak perlu menunggu pagi). Vercel > Settings > Environment Variables > Production, nama `CRON_SECRET`, isi teks acak panjang buatan sendiri (`openssl rand -hex 32` di terminal; jangan kirim ke Claude). Lalu Redeploy. Besok setelah 06.00 WIB cek Logs /api/cron/harian: 200 = jalan, 401 = belum terisi.
2. **14 Okt 2026 (INGATKAN Hadi di awal sesi pada/sesudah tanggal ini):** jalankan ulang isi-jadwal-dummy --apply di production (jam kosong contoh habis sekitar 13 Okt; tanpa itu coach contoh hilang dari halaman beli paket). Pengingat cukup catatan ini (Hadi pilih A, bukan kalender).
3. Beri tahu Claude arti "approved" dari orang hukum atas 3 catatan: ada teks revisi S&K yang harus dipasang, atau catatan disetujui untuk dibiarkan.
4. Production: akhiri-paket-lama (lihat dulu, lalu --apply); belum tercatat sudah dijalankan.
5. Tombol GitHub Actions > Uji Pulih Backup sekali.
6. P5: isi DATABASE_CA_CERT di pratinjau Vercel dulu, cek jalan, baru production.
7. Event Meta (jendela penyamaran), lalu hapus META_TEST_EVENT_CODE di Vercel.
8. HP asli + Safari (alur kota, Kolam Saya, notifikasi daftar tunggu); satu pembayaran sungguhan sampai paket aktif; unggah foto/sertifikat, email, notifikasi HP.
9. Akuntan: PPN 11%, pajak komisi afiliasi, PPN sesi tidak hadir, saldo member hangus (+ saldo dari ganti coach ke coach lebih murah). Testimoni asli. Matikan plugin tak terpakai.

## Belum terverifikasi
- HP asli dan Safari; notifikasi push; unggah file ke penyimpanan asli; email; pembayaran asli sampai paket aktif; buku besar production; halaman login di production; pemeriksa harian di Vercel (belum terbukti jalan); uji hak akses/formulir/audit uang setelah update kota (lihat Tugas Claude 1).

## Catatan lingkungan lokal
- Nyalakan lagi bila laptop tidur: `npm run db:dev` (54330), `node scripts/qa-storage.mjs` (54331), `npm run db:race` (54329, untuk `npm run test:race`; bila gagal "postmaster.pid", jalankan `prisma migrate deploy` ke 54329 langsung). Server uji versi jadi: konfigurasi swim-private-hub-start-3110 (`npx next start -p 3110`; bangun ulang dulu).
- Akun uji lokal (password uji dev ada di scripts/dev-db-sync.mjs): admin 089900000001 (2FA, kode lewat scripts/qa-otp.mts), coach 089900000004/10, pemilik kolam 089900000002, member 089977700099 (kota Bandung, paket sudah dipindah lewat uji ganti gratis ke Coach 6). Ketiganya sudah menyetujui rev.3. Database e2e lokal dibuat ulang tiap uji alur penuh (database "e2e" di 54329).
- Data uji lokal: kolam contoh semua kota Jakarta (Cempaka Bandung), jam kosong contoh 4/coach contoh, daftar tunggu Bandung sudah dikabari, kolam uji Malang menunggu persetujuan.
