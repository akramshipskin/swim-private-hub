# Sweeping sistem total (11 Okt 2026, mode tidur Hadi)

Penulis: Claude (Opus 5.5). Lingkungan: versi jadi LOKAL (cabang tahap-b-migrasi = isi live + tahap B2 yang belum tayang), database lokal, akun uji dummy. Live tidak disapu (aturan: tidak mengetik password ke production).

## Inventaris dari kode
70 berkas halaman (page.tsx), 21 rute API. Peran: publik, member, coach, pemilik kolam, admin. Halaman baru sejak 6 Okt: /admin/laporan-coach; API baru: /api/cron/malam.

## Cakupan
| Bagian | Isi | Hasil |
|---|---|---|
| Tampilan otomatis | 504 kunjungan = publik 18 halaman, member 14, coach 12, pemilik kolam 12, admin 28; masing-masing x 375/768/1280 x terang/gelap | 0 melebar ke samping, 0 tautan mati. Sisa alarm = lingkungan lokal (foto contoh tidak ada di penyimpanan lokal, skrip analitik Vercel 404, tombol nonaktif terbaca kontras rendah, kolom jebakan bot, tombol Unggah Foto di dalam lipatan tertutup terbaca tanpa nama) |
| Dilihat mata | ±20 tangkapan: Riwayat/Dasbor gelap/Paket/Booking/Riwayat Bayar/Cari Coach/Peserta (member), Saldo/Dasbor/Riwayat Sesi/Jadwal/Harga/Dasbor desktop gelap (coach), Dasbor/Laporan/Info/Paket/Coach (kolam), Laporan Coach/Dasbor desktop gelap/Akun/Paket desktop/Kolam (admin), Masuk, 404 | temuan di bawah. Sisanya (±480) hanya pemeriksa otomatis |
| Uji langsung di browser (admin) | Kembalikan Dana (buka, batas maks, kirim kosong), Tolak Pendaftar (2x), Aktifkan pendaftar | 1 bug ditemukan dan diperbaiki (lihat 1) |
| Hak akses | 72 alamat x 5 sesi = 360 sel; 21 API x 5 = 105 sel | 0 bocor ke peran lain, 0 error server. Milestone/profil/notifikasi menjawab 200 tanpa login = pengalihan ke Masuk di dalam halaman (dicek isinya: tanpa data) |
| Formulir | 178 kiriman (kosong, panjang + karakter khusus), 116 dilewati (tombol berisiko/unggah file/isian tersembunyi) | 0 error server, 0 skrip tersisip |
| Audit buku besar lokal | dompet kolam 8, coach 9, member 2, 34 booking, 9 pencairan | "Semua cocok"; dasbor admin: Saldo Mengendap Rp 1.377.000 = kolam 472.175 + coach 641.776 + SPH 232.983 + PPN 30.066 (dihitung ulang, cocok) |
| Hitungan dicek manual | Harga coach: 260.000 + 440.000 + 6,5% (45.500) = 745.500; 8 sesi 1.363.200; hemat 8%; contoh komisi afiliasi 83.200 / 1,11 x 50% = 37.477 | cocok |
| Tes | cek kode, 947 tes otomatis, 228 tes balapan, lint, versi jadi | lulus (1 kali satu tes gagal saat laptop sibuk membangun; 3 putaran ulang lulus; tes yang mana belum diketahui) |
| Pemeriksa kedua Opus | perbaikan B2 (d2f20b8) + urutan kunci refund (7a01574) | 0 berat; 1 cacat sedang (refund vs ganti coach bisa saling tunggu) diperbaiki 7a01574 dan dinyatakan benar |

Tidak tercakup: halaman Ganti Password (tidak ada akun uji berpassword sementara), /keamanan tampilan admin (2FA sudah aktif, langsung dialihkan), formulir Laporkan Coach dengan lampiran (unggah file dilewati), HP asli/Safari, live.

## Diperbaiki (commit di cabang tahap-b-migrasi)
1. **Tolak Pendaftar (bug, 4f1f0c5):** sesudah menolak, halaman memuat ulang dan tautan "Kabari Penolakan Lewat WhatsApp" langsung hilang, jadi admin tidak bisa mengabari. Sekarang tautan tetap tampil di kartu "Ditolak" sampai diklik. Diuji ulang di browser. Tautan "Kabari Lewat WhatsApp" setelah Aktifkan: dicek, sudah benar.
2. **Refund vs ganti coach (7a01574):** urutan kunci disamakan; angka "maks" di halaman Paket sama dengan batas server.
3. **Kata dan huruf (4f1f0c5):** "Cairkan"/"Cairkan saldo" -> "Tarik Saldo" (tombol saldo coach/kolam, dasbor coach, dasbor admin, Bagi Hasil); Title Case tombol kartu dasbor (Booking Sekarang, Beli Paket, Tandai Sekarang, Buka Jadwal, Pilih Kolam, Isi Jam Buka, Lengkapi Info, Buka Saldo), tombol booking (Pilih Tanggal dan Jam, Sesi Paket Habis), Belum Ditandai, label Laporan kolam, label Info Kolam, 8 label formulir, label dasbor admin, "Menunggu Persetujuan" di detail akun; tanda pisah panjang di Laporan kolam dihapus. MESSAGING.md: baris lama "Cairkan saldo" diselaraskan dengan tabel kata ramah 6 Okt ("Tarik Saldo").

## Catatan (bukan bug, tidak diubah)
- Cari Coach menampilkan Coach 4 mengajar di Kolam Cempaka (Bandung), tapi Beli Paket member Bandung bilang "Belum tersedia di Bandung": sesuai aturan (Cari Coach = etalase; beli paket butuh harga + jam kosong).
- Judul kartu dasbor campur ("Jadwal berikutnya" vs "Perlu Kamu Cek"): aturan Title Case hanya untuk tombol dan label, jadi dibiarkan.
- "Update milestone" tetap (terikat perjanjian coach, catatan C1 6 Okt). Nama data uji "Coach Coach 6" karena nama akun uji memang "Coach 6".
- Landing masih memakai judul "Cairkan saldo" di section mitra (materi jualan, tidak diubah tanpa Hadi).
