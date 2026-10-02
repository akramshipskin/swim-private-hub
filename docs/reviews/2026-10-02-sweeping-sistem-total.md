# Sweeping sistem total (2 Okt 2026 siang, Opus)

Permintaan Hadi: "lanjut sweeping total" (setelah batch Sonnet S1-S16 dan batch Opus O1-O8 tayang). Termasuk O6 (cek ulang dengan dijalankan) dan perubahan hari ini.
Lingkungan: laptop, versi jadi terbaru (`next start` port 3110), database lokal, penyimpanan lokal. Akun uji lokal: admin 089900000001 (2FA), coach 089900000004 / 089900000010, pemilik kolam 089900000002, member 089900000012, member uji baru 089977700099.

## Inventaris dari kode
- 64 halaman (page.tsx) + halaman 404 = 65 rute halaman; 19 route API; 35 file aksi server.
- Diperiksa: 65 halaman x 5 peran (hak akses), 19 API x 5 peran, 420 kunjungan tangkapan layar (5 peran x HP 375 / tablet 768 / desktop 1280 x terang/gelap), uji formulir semua peran, alur uang ujung ke ujung, tes otomatis, tes balapan, audit buku besar.

## Tabel cakupan tampilan
| Peran | Halaman | HP 375 | Tablet 768 | Desktop 1280 | Terang/Gelap | Kunjungan |
|---|---|---|---|---|---|---|
| Publik | 17: /, /brandguideline, /daftar-coach, /daftar-kolam, /halaman-tidak-ada, /kebijakan-cookie, /kebijakan-pengembalian, /kebijakan-privasi, /login, /mou-kolam, /panduan, /pelatih/[id], /pembayaran/gagal, /pembayaran/sukses, /perjanjian-coach, /register, /syarat-ketentuan | dicek | dicek | dicek | dark/light | 102 |
| Member | 11: /keamanan, /member/booking, /member/cari-coach, /member/dashboard, /member/paket, /member/pembayaran, /member/peserta, /member/riwayat, /milestone/[id], /milestone/[id]/sertifikat/[id], /profil | dicek | dicek | dicek | dark/light | 72 |
| Coach | 9: /coach/dashboard, /coach/harga, /coach/jadwal, /coach/peserta, /coach/riwayat-sesi, /coach/saldo, /keamanan, /milestone/[id], /profil | dicek | dicek | dicek | dark/light | 60 |
| Pemilik kolam | 9: /keamanan, /pool/coach, /pool/dashboard, /pool/info, /pool/jadwal, /pool/laporan, /pool/paket, /pool/saldo, /profil | dicek | dicek | dicek | dark/light | 60 |
| Admin | 20: /admin, /admin/afiliasi, /admin/booking-overview, /admin/email, /admin/ganti-coach, /admin/kinerja-coach, /admin/kolam, /admin/komisi, /admin/koreksi-saldo, /admin/laporan-kehadiran, /admin/milestone, /admin/milestone/butir, /admin/paket, /admin/pembayaran, /admin/pesan, /admin/testimoni, /admin/users, /admin/users/[id], /admin/withdrawals, /profil | dicek | dicek | dicek | dark/light | 126 |

Total kunjungan tangkapan layar: 420

Halaman di luar tabel di atas:
| Halaman | Status |
|---|---|
| /member, /coach, /pool, /admin (halaman indeks) | dicek: semuanya mengalihkan ke halaman utama peran (tercatat di hak akses) |
| /perjanjian | dicek: gerbang rev.2 diuji langsung (coach belum centang dialihkan ke sini dari /coach/saldo; centang -> versi "rev.2" tercatat -> dasbor terbuka) + tangkapan layar HP/desktop (putaran terakhir) |
| /ganti-password | dicek: tangkapan layar HP/desktop dengan akun uji yang diwajibkan ganti password; akun tanpa kewajiban dialihkan |
| /keamanan untuk admin | dicek: admin yang sudah ber-2FA dialihkan ke /admin (disengaja, 2FA admin wajib) |

## Hak akses (65 halaman x 5 peran + 19 API x 5 peran)
- Tidak ada halaman peran lain yang terbuka (0 dari 325 kombinasi). Tidak ada error server (5xx).
- Halaman perkembangan peserta: coach/pemilik kolam yang tidak mengajar peserta itu = 404; tanpa login = ke halaman masuk.
- Unduhan rekap PPh baru: hanya admin (peran lain dan tanpa login dialihkan).
- API booking/checkout/ganti coach: hanya member; jadwal coach: hanya coach; webhook Midtrans selalu 200 (disengaja, tanda tangan dicek di dalam); webhook email masuk 401 tanpa tanda tangan.

## O6: cek ulang dengan dijalankan
| Alur | Hasil |
|---|---|
| Daftar member dengan kode afiliasi coach | dicek: akun tercipta, rujukan tercatat |
| Notifikasi Midtrans tiruan bertanda tangan, nominal salah (Rp1.000) | dicek: diabaikan, paket tetap menunggu bayar |
| Notifikasi lunas nominal benar (Rp1.363.200) | dicek: paket aktif, 8 sesi, 90 hari, jatah batal 4 |
| Sesi ditandai Hadir | dicek: kolam Rp60.000 - PPh Rp300; coach Rp100.000 - PPh Rp500; SPH Rp10.400 (Rp9.369 + PPN Rp1.031); komisi afiliasi Rp68.160 menunggu 3 hari (5% karena dibayar sebelum 3 Okt) |
| Dikoreksi jadi Tidak Hadir | dicek: kolam Rp0, coach Rp50.000 - PPh Rp250, SPH Rp120.400 (Rp108.468 + PPN Rp11.932), komisi kembali menunggu sesi Hadir |
| Audit buku besar lokal (sebelum & sesudah) | dicek: semua cocok |
| Rekap PPh Oktober | dicek: 4 mitra, total Rp2.800 = total potongan di buku besar, tiap baris tepat 0,5% bruto |
| Pencairan coach Rp50.000 -> tanggal dimundurkan 14 hari | dicek: lihat putaran terakhir |
| Saldo member, ganti coach, paket versi lama, kedaluwarsa | dicek lewat 166 tes balapan (dijalankan hari ini, semua lulus) dan sweeping pagi; tidak diulang manual |

## Temuan
Tidak ada temuan berat atau sedang.

Ringan, mekanis, sudah diperbaiki:
1. Admin > Pengguna: tautan "Download Template" (bahasa Inggris) -> "Unduh template Excel".
2. Coach > Perkembangan peserta (HP): baris "Butir di level lain" tinggi sentuh 20px -> 44px.
3. Pemilik kolam > Dashboard: "Pendapatan kolam Rp60.000" (bruto) bisa terbaca beda dengan Laporan/Saldo (Rp59.700 setelah PPh) -> label "Bagian kolam" + keterangan "Sebelum PPh 0,5%". Hanya teks, angka tidak diubah.

Ringan, dicatat (tidak diubah):
4. Tablet 768: beberapa pil/chip (pilihan keahlian, fasilitas, navigasi brand guideline) tingginya 30-36px. Di atas batas minimum 24px, di bawah anjuran 44px; HP sudah 44px.

Alarm palsu (dicek, bukan masalah aplikasi):
- Gambar rusak & pesan "melanggar aturan keamanan" untuk foto coach/kolam: penyimpanan lokal (port 54331) tidak ada di daftar izin keamanan halaman versi jadi; di situs asli fotonya dari penyimpanan asli.
- Skrip analitik Vercel 404: hanya tersedia di Vercel.
- Kontras rendah "Kolam mitra"/nama kolam di kartu landing: diukur di atas foto yang gagal dimuat (alasan di atas).
- Kontras rendah tombol Daftar/Unggah/Simpan (3,9-4,0): tombol dalam keadaan nonaktif (belum centang/belum pilih file); aturan kontras tidak berlaku untuk tombol nonaktif.
- Kotak centang persetujuan terbaca "on": sudah terbungkus label, pembaca layar membaca kalimatnya.
- Tombol/tautan "tanpa nama" di admin Kolam/Pengguna: berada di bagian yang terlipat saat diukur.
- Formulir Koreksi Saldo tanpa pesan: membuka dialog konfirmasi dulu, jadi alat uji tidak mengirim ke server (penjagaan server sudah dites otomatis).
- 2 paket "sisa 3 dari total 4 tanpa booking" di audit uang: data uji impor Excel (sisa sesi diambil dari file), bukan kehilangan sesi.

Keterbatasan alat (bukan aplikasi):
- Browser uji tanpa layar kadang lambat menyala (>10 detik) sehingga 2 putaran gagal mulai; batas tunggu alat dinaikkan ke 30 detik, putaran diulang dan lulus.
- Pilihan kehadiran coach mengirim otomatis di bingkai layar berikutnya; saat panel browser tersembunyi bingkai tidak berjalan, jadi formulir dikirim langsung.
- 1 tes otomatis tampilan login gagal sekali saat laptop sibuk sweeping, lulus 4x berturut-turut sendiri dan lulus di putaran penuh berikutnya (tes kadang gagal karena waktu).

Uji formulir: publik 8, member 8, coach 23, pemilik kolam 13, admin 232 catatan (138 percobaan kosong/panjang+karakter khusus): 0 galat server, 0 celah penyisipan kode, isian salah selalu ditolak dengan pesan; tidak ada data uang/kolam yang berubah (audit cocok).
Penanda pencairan: pengajuan uji Rp50.000 dimundurkan 14 hari -> dasbor admin "Pencairan lewat 7 hari kerja: 1" dan kartu "Lewat 7 hari kerja"; lalu ditolak -> saldo coach kembali Rp172.250, audit cocok.
Unduhan rekap PPh (admin): berkas Excel "rekap-pph-2026-10.xlsx" 17 KB; bulan salah ("2026-13") ditolak 400.
Saldo Platform admin Rp232.983 = Rp124.515 (sebelum sweeping) + Rp108.468 (sesi uji Tidak Hadir): cocok.

## Verifikasi
- Cek penulisan kode lulus; pemeriksa gaya kode lulus; tes otomatis 783 lulus; tes balapan 166 lulus (batch Opus, hari ini); versi jadi lulus.
- Belum dicek: HP asli & Safari, tampilan halaman login di production (butuh akun Hadi), notifikasi push, email, unggah file ke penyimpanan asli, pembayaran sungguhan.
- Data uji lokal baru: member 089977700099 (paket 8 sesi aktif, 1 sesi Tidak Hadir, komisi afiliasi menunggu), pengajuan pencairan uji coach 4 (ditolak).
