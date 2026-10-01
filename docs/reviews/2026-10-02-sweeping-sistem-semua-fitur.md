# Sweeping sistem: semua fitur dicoba satu per satu (2 Okt 2026, Opus)

Permintaan Hadi: "coba satu per satu semua fitur, bener2 semua, gak ada yang kelewat".
Lingkungan: laptop (localhost:3102, database lokal, Midtrans SANDBOX — dicek dari alamat app.sandbox.midtrans.com).
Akun uji lokal: admin 089900000001 (2FA), coach 089900000004 / 089900000010, member 089900000012, pemilik kolam 089900000002.

Inventaris dari kode: 61 halaman (page.tsx), 18 route API, 33 file aksi server berisi 83 aksi.

Status: ✅ dicoba & benar · ❌ salah (lihat Temuan) · ⚠️ jalan tapi ada catatan · ⛔ tidak bisa dicoba (alasan) · ⏳ belum

## A. Otomatis (semua halaman)
| Cek | Hasil |
|---|---|
| Hak akses: 61 halaman x 5 peran (305) + 18 API x 5 peran | ✅ tidak ada halaman/API yang terbuka untuk peran yang salah; tidak ada error server. Webhook Midtrans selalu membalas 200 (disengaja, tanda tangan dicek di dalam). |
| Tangkapan layar semua halaman x 4 peran + publik, HP 375 & desktop 1280 | ✅ 122 kunjungan (publik 15, member 10, coach 8, kolam 8, admin 20 halaman × 2 lebar): tidak ada halaman melebar ke samping, tidak ada tautan mati. Catatan ringan di bagian D |
| Tes otomatis / tes balapan / build | ✅ 732 tes, 160 tes balapan, cek kesalahan kode & versi jadi lulus (setelah semua perbaikan) |

## B. Fitur per peran

### Publik / akun
| Fitur | Status | Catatan |
|---|---|---|
| Masuk (password salah → pesan) | ✅ | |
| Masuk benar → diarahkan ke dashboard peran | ✅ | member → Booking, coach → Dashboard |
| Kunci 3x salah | ✅ | setelah 3x salah, password benar pun ditolak, hitung mundur 15 menit |
| Keluar (menu akun) | ⚠️ | label menu "Logout" (bahasa Inggris), tempat lain "Keluar" |
| Daftar member / coach / kolam | ✅ | lewat jalur data yang sama dengan form (pemilih tanggal browser tidak bisa diisi alat uji): tanpa setuju S&K ditolak, kode afiliasi salah ditolak, nomor ganda ditolak, daftar coach & kolam berhasil |
| Ganti password dari profil | ✅ | password lama salah ditolak; ganti berhasil, semua sesi otomatis keluar; dikembalikan |
| 2FA pasang / matikan | ✅ | kode salah ditolak; pasang & matikan berhasil (member 12) |
| Chat bantuan | ✅ | pesan member terkirim, diteruskan ke admin (asisten AI tidak aktif di laptop) |
| Notifikasi push | ⛔ | butuh izin notifikasi di HP/browser asli |

### Member
| Fitur | Status | Catatan |
|---|---|---|
| Lihat penawaran paket (harga kolam + coach + 6,5%) | ✅ | hitungan dicocokkan: 260.000 + 440.000 + 45.500 = 745.500 |
| Beli paket → Midtrans | ❌→✅ | DITOLAK Midtrans untuk SEMUA paket model baru (kode barang 53 huruf, batas 50). Diperbaiki + tes, live 9efc7d8 |
| Pembayaran lunas → paket aktif | ✅ | (notifikasi lunas tiruan ke laptop) 4 sesi, 60 hari, jatah batal 2, harga tersimpan |
| Booking / batal booking | ✅ | booking slot coach paket; batal: sesi kembali 4, jatah batal 2→1; paksa booking coach/kolam lain lewat jalur data → ditolak server |
| Sesi coba | ✅ | hanya anak yang belum pernah punya paket; harga 65.000+110.000+11.375 = 186.375; aktif 7 hari, jatah batal 0; batal sendiri ditolak server; riwayat menampilkan tombol WA admin |
| Lapor kehadiran salah | ✅ | tombol Laporkan (batas 3 hari) → admin ubah ke Hadir → buku besar dibalik lalu dibuat ulang (coach 278.900, kolam 189.350 sesuai hitungan) → laporan ditutup |
| Ganti coach: ajukan / tarik / bayar tambahan | ✅ | alasan < 10 huruf ditolak; tarik pengajuan; ke coach lebih mahal: admin setuju → tombol "Bayar Rp 47.925" → Midtrans uji → lunas → paket pindah ke Coach 10 (440.000 + layanan 45.500) |
| Saldo dipakai saat beli | ✅ | saldo 47.925 dipakai dulu, Midtrans menagih 697.575; kedaluwarsa → saldo kembali; lunas belakangan → saldo ditarik lagi, paket aktif |
| Peserta: tambah / tgl lahir / nonaktif | ✅ | tgl lahir tersimpan; anak baru ditambah; nonaktif (dengan konfirmasi) → aktifkan lagi |
| Profil: nama, hapus akun + batal | ✅ | nama > 100 huruf ditolak; ganti nama tampil di header; minta hapus akun → batalkan berhasil |
| Riwayat bayar / lanjut bayar | ✅ | total cocok; "Lanjut bayar" ada di halaman Paket (link Midtrans uji), tidak ada di Riwayat Bayar (temuan) |
| Milestone (lihat) | ✅ | halaman milestone anak tampil untuk member & coach |

### Coach
| Fitur | Status | Catatan |
|---|---|---|
| Tambah jadwal | ✅ | jam lewat ditolak; 08–10 dipecah 2 slot |
| Hapus jadwal | ✅ | ada dialog konfirmasi |
| Atur harga | ✅ | angka terlalu besar ditolak; harga baru langsung tampil di pratinjau (756.150 = 260.000 + 450.000 + 46.150); dikembalikan ke 440.000 |
| Batalkan booking (coach) | ✅ | dialog "sakit/darurat"; sesi member kembali 4, jatah batal tetap 2; slot terbuka lagi untuk member lain (pertanyaan ke Hadi) |
| Tandai hadir / tidak hadir | ✅ | Hadir: kolam 65.000 − PPh 325; coach 110.000 − PPh 550; SPH 11.375 (10.248 + PPN 1.127). Tidak hadir (coach bebas PPh): coach 55.000, kolam 0, SPH 131.375. (Jam sesi digeser ke masa lalu langsung di database lokal agar bisa ditandai.) |
| Saldo: rekening, cairkan | ❌→✅ | (1) angka raksasa memunculkan error mentah berisi alamat file internal → diperbaiki; (2) nomor rekening "12ab" tersimpan → sekarang hanya angka 6–20 digit; minimal 50.000 & saldo kurang ditolak; cairkan 60.000 berhasil (saldo 120.000→60.000, 60.000 dalam proses) |
| Profil: bio, foto, sertifikat, tanda tangan | ✅ | semua tersimpan; sertifikat menunggu persetujuan |
| Milestone: isi, usul butir | ✅ | catatan + butir tercapai tersimpan; usul butir standar terkirim ke admin |

### Pemilik kolam
| Fitur | Status | Catatan |
|---|---|---|
| Harga paket | ✅ | ubah 260.000→270.000→260.000 (tidak ada tulisan "Tersimpan") |
| Info & foto kolam | ✅ | alamat tersimpan; unggah foto 2→3; file palsu berekstensi .png ditolak ("Isi file tidak cocok"). Hapus foto: ⛔ tidak dicoba (aturan tidak menghapus permanen) |
| Saldo: cairkan | ✅ | 79.700 → 29.700, 50.000 dalam proses; admin tolak → saldo kembali 79.700 |
| Laporan, jadwal, coach | ✅ | tampil; laporan menampilkan bagian kolam sebelum PPh (catatan) |

### Admin
| Fitur | Status | Catatan |
|---|---|---|
| Pengguna: buat, nonaktif/aktif, reset password, reset 2FA, impor Excel | ✅ | akun baru wajib ganti password; reset password sementara sekali tampil; reset 2FA dengan konfirmasi; impor 1 baris: akun + anak + paket 3 sesi masuk. Tanggal lahir hilang bila judul kolom persis seperti teks petunjuk → diperbaiki |
| Harga & bebas PPh coach, sertifikat (admin) | ✅ | bebas PPh tersimpan & berpengaruh ke potongan; setujui sertifikat → tampil "Disetujui" |
| Hapus akun member (anonim) | ✅ | nama/HP/peserta dihapus, akun ditandai "Akun dihapus" |
| Kolam: afiliasi, nonaktif, harga & biaya layanan, bebas PPh | ✅ | biaya layanan 7% ditolak (maks 6,9%); centang bebas PPh tersimpan lalu dikembalikan; tambah/lepas coach (dengan dialog); nonaktifkan kolam tidak menghapus jadwal/booking. Catatan: skrip uji sempat ikut menonaktifkan Kolam Bahari di laptop → diaktifkan lagi (kesalahan skrip uji, bukan aplikasi) |
| Paket: beri paket manual, katalog lama, tambah anak | ✅ | paket manual 2 sesi aktif; ubah katalog & kembalikan; tolak usulan paket; tambah anak dari admin (tanpa isian tanggal lahir — temuan) |
| Jadwal booking: tandai hadir/tidak hadir, batalkan | ✅ | batal oleh admin: sesi kembali, jatah batal member tetap, slot terbuka |
| Ganti coach: setujui / tolak | ✅ | pratinjau 47.925 = (186.375 − 170.400) × 3; saldo member cocok buku besar; tolak wajib alasan ≥ 5 huruf |
| Laporan kehadiran: putuskan | ✅ | lihat "Lapor kehadiran salah" |
| Pencairan: tandai dibayar, tolak, tarik saldo platform | ✅ | no. referensi wajib; tolak mengembalikan saldo; tarik platform melebihi yang boleh (ditahan 3 hari) ditolak |
| Koreksi saldo | ✅ | kurangi 10.000 (saldo jadi −10.000, dengan konfirmasi & notifikasi) lalu kembalikan |
| Bagi hasil: catat setor PPh | ✅ | titipan 2.550 cocok buku besar; setor 3.000 ditolak (melebihi); setor 1.000 → belum disetor 1.550. Isian nomor bukti ikut kosong setelah ditolak (temuan) |
| Milestone butir standar & usulan | ✅ | tambah butir lalu nonaktifkan; tolak usulan coach |
| Testimoni | ✅ | tambah → langsung tampil di landing (temuan); sembunyikan (konfirmasi). Hapus: ⛔ tidak dicoba (aturan tidak menghapus permanen) |
| Pesan chat / email | ✅ chat · ⛔ email | email tidak dikirim: mengirim email sungguhan perlu izin Hadi |

## C. Temuan
1. **BERAT, uang (diperbaiki, live 9efc7d8):** tombol Beli paket model baru selalu gagal (layar "gagal"), karena kode barang yang dikirim ke Midtrans 53 huruf (batas 50). Berlaku juga di situs asli sejak harga dari coach tayang. Midtrans mengirim email "VALIDATION" ke Hadi dari uji ini. Tes regresi ditambah (gagal tanpa perbaikan, lulus dengan perbaikan).
2. Ringan, teks: menu akun memakai "Logout"; halaman lain "Keluar".
3. Ringan: setelah simpan harga coach tidak ada tulisan "Tersimpan" (pratinjau berubah, jadi tetap terlihat).
4. Ringan, aksesibilitas: tombol tanggal di kalender jadwal hanya berisi angka ("3") tanpa label bulan untuk pembaca layar; pesan salah harga tidak diumumkan (bukan role=alert).
5. **SEDANG, keamanan (diperbaiki):** pesan error database mentah (nama file server, kolom) tampil ke pengguna saat input aneh. Sumbernya pola yang sama di 18 tempat (pencairan, rekening, peserta, daftar akun, checkout, email admin, dll.) → satu fungsi bersama yang menyembunyikan error database. Plus batas nominal pencairan sebelum menyentuh database. Tes ditambah.
6. **SEDANG, uang (diperbaiki):** nomor rekening coach/kolam boleh berisi huruf/berapa pun panjangnya → transfer pencairan bisa gagal/salah. Sekarang angka 6–20 digit (spasi/strip dibuang). Tes ditambah.
7. Ringan, teks: satu orang disebut beda di halaman berbeda: "Peserta 3" (Booking, Paket) vs "Member 12 (kamu)" / "kamu sendiri" (Peserta, Riwayat).
8. Sedang, tampilan: kartu paket menulis "Sesi habis" padahal sesinya sudah dibooking dan belum berjalan (contoh: sesi coba yang sudah dijadwalkan 4 Okt). Member bisa mengira paketnya hangus.
9. Ringan, teks: pesan saat member mencoba batal sesi coba lewat jalur data: "Jatah pembatalan mandiri sudah habis" (tampilan sendiri sudah benar).
10. Ringan, teks: halaman 2FA untuk member menulis "Akun coach dan pemilik kolam menyimpan saldo".
11. Ringan: jadwal coach menulis "Sudah mulai — tandai di Riwayat Sesi" walau sesi sudah ditandai Hadir.
12. Ringan, risiko salah klik: tombol admin yang langsung memindahkan uang tidak punya dialog konfirmasi: "Setujui & pindahkan" (ganti coach) dan pilihan Hadir/Tidak Hadir di Jadwal Booking. Bandingkan: tandai pencairan & lepas coach sudah pakai konfirmasi.
13. Ringan, teks: halaman Kolam admin dibuka dengan penjelasan model lama ("Persentase pembagian per kolam…") dan rincian saldo masih memuat baris "Dari beli 1 sesi (member kolam lain)" (fitur sudah dihapus). Mengaktifkan ulang kolam nonaktif memakai tombol "Setujui".
14. Ringan, teks: pesan batas biaya layanan memakai titik ("6.9%"), di tempat lain koma ("6,5%").
17. Ringan, teks/alur: halaman Paket admin masih menulis "Katalog Paket … ini yang muncul di halaman Beli Paket member" dan masih punya bagian "Usulan paket dari pemilik kolam" (model lama; member sekarang membeli dari harga kolam + coach).
18. Sedang, butuh keputusan: coach membatalkan sesi karena sakit → slot jam itu terbuka lagi dan bisa dibooking member lain.
19. Ringan: testimoni baru langsung tampil di landing tanpa langkah tinjau.
20. Ringan: setelah satu pengiriman ditolak (mis. setor PPh melebihi titipan), isian lain di form ikut kosong.
21. Ringan: "Lanjut bayar" hanya ada di halaman Paket, tidak di Riwayat Bayar.
22. Ringan: tambah peserta dari admin tidak menanyakan tanggal lahir (member diminta melengkapi sendiri).
23. Ringan: laporan kolam menampilkan bagian kolam sebelum potongan PPh, saldo sesudah PPh.
15. Bukan masalah (false alarm): (a) pilihan peserta di "Beri paket manual" tampak milik akun lain — ternyata gue salah baca urutan pilihan; (b) Jadwal Booking admin tampak "Belum ditandai" — ternyata itu teks daftar pilihan, nilai tersimpan "Hadir"; (c) koreksi kehadiran di Laporan Kehadiran tampak tidak tersimpan — gue mengecek database terlalu cepat; (d) pesan kunci login tampak "sementara.Coba" — dua kalimat itu sebenarnya baris terpisah.
16. Bukan masalah production: di laptop, foto kolam dari penyimpanan tiruan (http) diblokir aturan keamanan browser; production memakai https.

## D. Catatan cakupan & yang tidak bisa dicoba
- Fitur yang memakai jam (batas 24 jam tambah bayar ganti coach, penyapu pembayaran 48 jam, batas tandai hadir 24 jam): dicek lewat tes otomatis, tidak ditunggu di browser.
- Email (kirim/balas) tidak dicoba: mengirim email sungguhan perlu izin Hadi. Notifikasi push: butuh HP asli.
- Hapus permanen (testimoni, foto kolam, sertifikat) tidak dicoba: aturan keamanan.
- Database lokal sempat mati di tengah uji (laptop tidur saat jeda kuota) → dinyalakan ulang; tangkapan layar ulang semua halaman dijalankan setelahnya.
- Data uji tersisa di laptop: akun 089977700002–05, paket & booking uji Member 12/Anak Uji Sweep, saldo coach/kolam bergeser.
- Cek tampilan otomatis (122 kunjungan): kontras rendah di landing (8 elemen) dan brand guideline (4); tombol ikon tanpa nama untuk pembaca layar di admin Kolam (6) dan Pengguna (2); tautan sertifikat kecil di detail pengguna admin (HP). "Kolom website" kecil di form daftar = jebakan bot yang memang tersembunyi (bukan masalah). Gambar rusak = penyimpanan tiruan laptop (bukan masalah production).
- Pemeriksa kedua (Opus, konteks segar) atas perbaikan uang/keamanan: tidak ada temuan berat/sedang; catatan ringan: rekening lama yang tersimpan dengan format lama tidak dinormalisasi otomatis (baru saat pemiliknya menyimpan ulang); error non-database (mis. gagal kirim email) masih tampil apa adanya ke admin.
- Perbaikan teks mekanis yang sudah dikerjakan: menu "Logout" → "Keluar"; batas biaya layanan pakai koma (6,9%); teks 2FA untuk semua peran; penjelasan halaman Paket & Kolam admin disesuaikan model harga dari coach.
