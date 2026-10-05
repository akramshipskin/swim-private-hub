# Tinjauan tangkapan layar HP, tema terang, lebar 375

Cakupan jujur: 78 dari 78 berkas dibuka. Tapi 12 berkas di antaranya gambarnya IDENTIK (hash sama) dengan berkas lain (lihat kolom Catatan), jadi halaman unik yang benar-benar ditinjau = 69. Rute ganti_password dan keamanan tampaknya menampilkan dashboard (dialihkan), bukan halaman sendiri; halaman aslinya BELUM ditinjau lewat gambar. 13 gambar terpotong di 4200px (bagian bawahnya tidak terlihat). Teks hukum panjang (S&K, privasi, perjanjian coach, MOU kolam) hanya dibaca sebagian: S&K potongan 1,3,4; privasi 1 dan 4; perjanjian coach 1,2,4; MOU kolam 1,2; potongan lain tidak dibuka. Gambar foto rusak, ikon kosong, alamat localhost diabaikan sesuai arahan. Ini baca gambar + sedikit kode (cek kata "Edit"/"Ubah"); belum ada yang dijalankan.

## (a) Tabel cakupan

| Berkas (subfolder/halaman) | Dibuka | Ada masalah | Catatan |
|---|---|---|---|
| admin/admin | ya | ya |  |
| admin/admin_afiliasi | ya | ya |  |
| admin/admin_booking_overview | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_coach_tanpa_jadwal | ya | ya |  |
| admin/admin_email | ya | ya |  |
| admin/admin_ganti_coach | ya | ya |  |
| admin/admin_kinerja_coach | ya | ya |  |
| admin/admin_kolam | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_komisi | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_koreksi_saldo | ya | ya |  |
| admin/admin_laporan_kehadiran | ya | ya |  |
| admin/admin_milestone | ya | tidak |  |
| admin/admin_milestone_butir | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_paket | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_pembayaran | ya | ya |  |
| admin/admin_peminat_kota | ya | tidak |  |
| admin/admin_pesan | ya | ya |  |
| admin/admin_testimoni | ya | ya |  |
| admin/admin_users | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| admin/admin_users_cmuqg55id0004i1h8thpz9sbq | ya | ya |  |
| admin/admin_withdrawals | ya | ya |  |
| admin/ganti_password | ya | ya | gambar identik dengan admin/admin |
| admin/keamanan | ya | ya | gambar identik dengan admin/admin |
| admin/milestone_cmuehyisf000104l2ioufbnku | ya | tidak |  |
| admin/notifikasi | ya | tidak |  |
| admin/profil | ya | ya |  |
| coach/coach | ya | ya |  |
| coach/coach_dashboard | ya | ya | identik dengan coach/coach |
| coach/coach_harga | ya | ya |  |
| coach/coach_jadwal | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| coach/coach_kolam | ya | ya |  |
| coach/coach_peserta | ya | ya |  |
| coach/coach_riwayat_sesi | ya | ya |  |
| coach/coach_saldo | ya | ya |  |
| coach/ganti_password | ya | ya | identik dengan coach/coach |
| coach/notifikasi | ya | tidak |  |
| coach/perjanjian_coach | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| coach/profil | ya | ya |  |
| member/ganti_password | ya | ya | identik dengan member/member |
| member/kota | ya | ya | identik dengan member/member_dashboard |
| member/member | ya | ya |  |
| member/member_booking | ya | ya | identik dengan member/member |
| member/member_cari_coach | ya | ya |  |
| member/member_dashboard | ya | ya |  |
| member/member_paket | ya | ya |  |
| member/member_pembayaran | ya | ya |  |
| member/member_peserta | ya | ya |  |
| member/member_riwayat | ya | tidak |  |
| member/milestone_cmuqg55im0005i1h8pwxkzzps | ya | tidak |  |
| member/notifikasi | ya | ya |  |
| member/profil | ya | ya |  |
| pool/ganti_password | ya | ya | identik dengan pool/pool |
| pool/mou_kolam | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| pool/notifikasi | ya | tidak |  |
| pool/pool | ya | ya |  |
| pool/pool_coach | ya | ya |  |
| pool/pool_dashboard | ya | ya | identik dengan pool/pool |
| pool/pool_info | ya | ya |  |
| pool/pool_jadwal | ya | ya |  |
| pool/pool_laporan | ya | ya |  |
| pool/pool_paket | ya | ya |  |
| pool/pool_saldo | ya | ya |  |
| pool/profil | ya | ya |  |
| publik/brandguideline | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| publik/daftar_coach | ya | ya |  |
| publik/daftar_kolam | ya | ya |  |
| publik/halaman_yang_tidak_ada | ya | tidak |  |
| publik/kebijakan_cookie | ya | ya |  |
| publik/kebijakan_pengembalian | ya | ya |  |
| publik/kebijakan_privasi | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| publik/login | ya | tidak |  |
| publik/panduan | ya | ya |  |
| publik/pelatih_cmtygcifp00025uh8lf88sld5 | ya | tidak |  |
| publik/pembayaran_gagal | ya | tidak |  |
| publik/pembayaran_sukses | ya | ya |  |
| publik/register | ya | ya |  |
| publik/root | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |
| publik/syarat_ketentuan | ya | ya | terpotong 4200px, bagian bawah tidak terlihat |

## (b) Temuan

Penting: tanda "FAB chat" (tombol bulat chat di kanan bawah) dan bar menu bawah tampak menimpa konten di tengah gambar. Itu efek tangkapan layar penuh dari elemen yang menempel di layar (fixed), bukan temuan. Tidak dihitung.

### SEDANG

1. publik/brandguideline (potongan 2): tabel "Unsur / Nilai / Aturan" terpotong di tepi kanan, kolom Aturan terbaca separuh ("Kapital di awa…", "teks biasa, juc…"). Tabel menembus tepi layar. Jenis: mekanis. Usulan: bungkus tabel dengan scroll mendatar atau ubah ke kartu bertumpuk di HP. Gambar logo "lockup-on-light/dark" tampil kosong (hanya keterangan); belum bisa dipastikan apakah berkas aset hilang atau efek lokal.
2. coach/coach_riwayat_sesi: kartu sesi berantakan. Tautan "Update milestone" menyelip di tengah baris "Peserta: Anak Uji O6 Update milestone", kolom kanan ("Belum ditandai" + "Lewat 24 jam, hubungi admin") menyempit sampai badge pecah dua baris. Jenis: mekanis. Usulan: pindahkan tautan jadi baris sendiri di bawah, beri kolom status lebar tetap.
3. coach/coach_riwayat_sesi dan coach/coach_peserta: kata Inggris "Update milestone" (tautan) dan kalimat "Isi Update milestone tiap peserta minimal sekali per 2 sesi Hadir". Jenis: mekanis. Usulan: "Perbarui milestone"; kalimat: "Perbarui milestone tiap peserta minimal sekali setiap 2 sesi Hadir."
4. coach/coach_jadwal (+ perjanjian_coach potongan 2 "tombol Tambah Slot"): tombol "Tambah Slot" memakai kata "slot" yang dilarang di teks pengguna. Jenis: mekanis untuk tombol; kalimat di perjanjian = teks hukum, lapor dan tunggu Hadi. Usulan: "Tambah Jam" atau "Buka Jam".
5. coach/coach_jadwal: kolam di pilihan terpotong "Kolam Renang Cempaka · buka belu…"; "Jam mulai 08 / Jam selesai 16" tampil angka mentah tanpa ":00" sehingga ambigu. Halaman sangat panjang (lebih dari 4200px) karena daftar "Jadwal Coach Lain" berisi puluhan baris "Kosong" yang sama; aksi utama (tambah jam) tertimbun. Jenis: mekanis (teks pilihan, format jam) + butuh keputusan (ringkas/lipat daftar coach lain). 
6. coach/coach_kolam: tulisan "Buka belum diisi" ganjil/ambigu pada tiap kolam. Jenis: mekanis. Usulan: "Jam buka belum diisi".
7. Kapitalisasi tidak seragam di seluruh peran. Tombol/judul/label Title Case ("Ubah Nama", "Ganti Password", "Ubah Profil Coach", "Tambah Sertifikat", "Unggah Foto", "Catat Pencairan", "Ubah Info Kolam", "Password Saat Ini", "Konfirmasi Password Baru", "Nama Lengkap", "Tanggal Lahir", "Riwayat Pencairan", "Komisi Afiliasi", "Riwayat Koreksi Saldo", "Salin Link", "Coba Lagi", "Booking Sekarang") bercampur dengan kalimat biasa ("Simpan kota", "Minta hapus akun", "Simpan perubahan", "Berikan paket (langsung Aktif)", "Nama orang tua / pemilik akun", "Alamat lengkap"). Contoh satu halaman: member/profil punya "Ubah Nama", "Simpan kota", "Ganti Password" bersebelahan. Jenis: mekanis. Usulan: pilih satu (disarankan huruf kapital hanya di awal kalimat) lalu sapu semua.
8. member/profil: tiga tombol dengan tiga gaya: "Ubah Nama" lebar penuh outline, "Simpan kota" outline selebar teks rata kiri, "Ganti Password" lebar penuh charcoal. Jenis: mekanis. Usulan: satu aturan lebar dan satu aturan warna (aksi utama per kartu charcoal, sisanya outline) dan terapkan juga di coach/profil, pool/profil.
9. member/member_peserta: pilihan "Anak saya / Saya sendiri" memakai radio bawaan browser berwarna BIRU, di luar palet (charcoal/cream/lime). Jenis: mekanis. Usulan: accent-color charcoal atau radio kustom. Bentuk checkbox bawaan kecil (±18px) di register, daftar_coach, daftar_kolam juga di bawah 44px target sentuh.
10. member/member_paket: pilihan kota terpotong "Bandung (domisili) · belu…" di sebelah tombol "Tampilkan". Tautan "Ajukan ganti coach" diulang di tiap paket sebagai teks bergaris bawah kecil (target sentuh ±20px). Jenis: mekanis.
11. member/member_paket vs coach_harga/pool_paket: member membaca "biaya layanan SPH di bawah 7%", sedangkan coach dan pemilik kolam membaca "layanan 6,5%". Mungkin 7% batas maksimal dan 6,5% angka berjalan, tapi pembaca bisa mengira salah. Jenis: logika-uang (tulisan). Usulan: lapor, tunggu Hadi: seragamkan jadi satu angka atau jelaskan "6,5% (maksimal 7%)".
12. member/member_booking: area di bawah label "Tanggal" tampak kosong lalu langsung "Paket peserta ini untuk coach Coach 6…"; belum bisa dipastikan apakah pemilih tanggal hilang atau tertutup bar tombol "Pilih tanggal dan jam" yang menempel. Perlu dicek di layar HP sungguhan. Kontras "Kosong" hijau muda di atas putih pada daftar coach lain rendah. Jenis: mekanis (kontras).
13. member/member_cari_coach: kartu coach tidak punya tombol aksi, hanya tautan "Lihat profil lengkap →" kecil; teks info ("Domisili Jakarta · 32 tahun · Perempuan") ±11px abu-abu muda, kontras rendah; nama kolam + "· Jakarta" diulang tiap baris dan putus di tengah ("Kolam Renang Samudra · / Jakarta"). Tiga gaya chip berbeda (hijau teal sertifikat, lime keahlian, abu-abu). Jenis: butuh keputusan (aksi utama kartu) + mekanis (ukuran/kontras teks, tulis kota sekali di judul).
14. admin/admin_users dan admin_users_<id>: baris aksi "Hubungi", "Reset password", "Aktifkan/Nonaktifkan" berupa tautan teks yang tersebar tidak rata (satu di kiri, satu di tengah, satu baris sendiri di kanan), di halaman detail badge "Aktif" melorot ke baris sendiri di bawah tautan. "Nonaktifkan" (aksi merusak) tidak merah di sini, tapi merah outline di admin_milestone_butir. Target sentuh ±20px. Jenis: mekanis. Usulan: satu baris tombol kecil seragam, aksi merusak bergaya merah.
15. admin/admin_users: dua formulir ("Tambah Pengguna Baru", "Tambah Peserta", "Berikan Paket ke Peserta") mendahului daftar "Semua Pengguna" sehingga daftar tertimbun; "Tambah Peserta" ditaruh di kartu dalam kartu sehingga input lebih sempit (66–309px) daripada form lain (49–326px). "Berikan paket (langsung Aktif)" kapital A tanpa alasan. Jenis: mekanis (lebar, kapital) + butuh keputusan (urutan halaman).
16. admin/admin_komisi: kalimat pengantar 7 baris; judul kolam ("Kolam Renang Bahari") terpecah dua baris karena tautan "Riwayat pencairan →" berebut tempat; "Unduh 2026-09 · Unduh 2026-10" memakai format tanggal mentah dan tautan kecil berdempetan; kalimat "Riwayat paket model lama" berbau istilah internal; input "Nominal disetor" setengah lebar, beda dari form lain. Jenis: mekanis (tulisan, tata letak). 
17. admin/admin_withdrawals: "Total termasuk yang masih ditahan: Rp 232.983" ditulis sama persis dengan "Pendapatan bersih bisa dicairkan Rp 232.983"; pembaca tak tahu berapa yang benar-benar ditahan (Rp 0 atau semua). Kartu "Perlu diproses Rp 0 / 0 pengajuan" diberi garis lime tebal seolah penting padahal kosong. Jenis: logika-uang (tulisan label), lapor dan tunggu Hadi.
18. admin/admin_koreksi_saldo: kolom "Sumber dana" berisi "Membetulkan salah catat" (itu alasan, bukan sumber dana). Format tanggal "1 Okt 2026, 19.49" beda dari "1 Oktober 2026 pukul 07.45" di coach_saldo dan "Rab, 30 September 2026" di tempat lain. Jenis: logika-uang untuk label "Sumber dana" (butuh keputusan Hadi); format tanggal mekanis. Usulan: satu format tanggal di semua halaman.
19. admin/admin_milestone_butir: tiap butir adalah input satu baris yang memotong teks ("Mau masuk ke air sambil digendong or…"), kolom angka urutan tanpa label ("1", "2", "3"), tombol Simpan dan Nonaktifkan berulang puluhan kali; halaman sangat panjang. Jenis: mekanis (textarea, label "Urutan") + butuh keputusan (lipat per level).
20. admin/admin_paket: kalimat pengantar ukuran ±12px (jauh lebih kecil daripada pengantar halaman lain ±15px); tombol "Edit" masih tampil di gambar (lihat temuan 33). Jenis: mekanis.
21. admin/admin_testimoni: tombol "Tampilkan" untuk testimoni tersembunyi berwarna abu-abu gelap seperti tombol nonaktif padahal aksi aktif. Jenis: mekanis. Juga contoh data "Ibu Clara … Saya sangat terbantu dengan aplikasi Swim Private Hub…" terbaca seperti tulisan AI dan tampil di landing bagian "Kata mereka" bila status Tampil. Jenis: butuh keputusan (data uji jangan tampil di produksi).
22. admin/admin_booking_overview: tombol hijau "Kabari Grup WhatsApp" diulang di tiap tanggal tiap coach (puluhan kali) dengan hijau WhatsApp di luar palet; halaman >4200px berisi baris "Kosong" yang sama. Jenis: butuh keputusan (warna di luar brand; lipat hari yang kosong).
23. admin/admin_kinerja_coach: susunan judul kartu tidak seragam: "Coach 10 4 sesi valid · 1 Tidak Hadir" satu baris, "Coach 6 / 0 sesi valid · 3 belum ditandai" dua baris; di dalam kartu "0 valid · 3 belum ditandai · 0 / Tidak Hadir" putus di tengah frasa. Jenis: mekanis.
24. coach/coach_dashboard: kartu "Ringkasan" memuat kolom "Kolam tempat mengajar 3" dengan daftar nama kolam 12px dijejal dalam setengah lebar (4 baris sempit); "Kode afiliasi" paragraf 8 baris sebelum tombol. Jenis: mekanis.
25. coach/coach_harga: pengantar 6 baris sebelum formulir; tombol "Edit" (stale, lihat 33) hanya di samping isian paket 8 sesi sehingga tampak miring; sama di pool/pool_paket dan admin_kolam. Jenis: mekanis.
26. coach/profil: input berkas bawaan browser berbahasa Inggris "Choose file No file chosen" (3 kali); banner kuning "Unggah file belum aktif. Hubungi admin." (kemungkinan efek lingkungan lokal, belum dicek). Jenis: mekanis (kustom tombol pilih berkas).
27. pool/pool_jadwal: kontrol tanggal bertumpuk tiga baris: "← Sebelumnya" di atas, pemilih tanggal + "Lihat" di tengah, "Berikutnya →" di bawah; urutan membingungkan dan menyita 150px. Jenis: mekanis. Usulan: Sebelumnya, tanggal, Berikutnya satu baris.
28. pool/pool_laporan: angka rupiah di baris sesi memakai huruf monospace (beda dari semua halaman lain), tanda minus "-Rp 300" memakai tanda hubung biasa sedangkan halaman lain "–Rp 10.000/–Rp 650" memakai en dash. Catatan kaki 9 baris kecil. Jenis: mekanis.
29. pool/pool_coach: kalimat "Bulan ini di kolammu: 1 sesi / Hadir · 0 sesi akan datang · 0 / jam masih kosong" putus di tengah frasa ("sesi" / "Hadir"). Jenis: mekanis (pecah jadi baris per statistik).
30. publik/root: tombol utama tidak konsisten: "Daftar gratis" lime di hero dan bar menempel bawah (di atas latar krem), tetapi charcoal di bagian lain halaman; aturan: utama = charcoal, lime aksen. Tautan "Daftar sebagai coach · Daftarkan kolam" ±13px, target sentuh kecil. Jenis: butuh keputusan (lime pada latar gelap hero boleh?). Bagian bawah halaman terpotong, footer tidak terlihat.
31. publik/panduan: tombol hero "Daftar gratis" berwarna hijau lime gelap, padahal tombol "Daftar" di header charcoal. Judul "Kenapa ini beda" dan "Pembatalan yang adil" terbaca seperti tulisan AI/ambigu; pengantar "Bukan aplikasi booking umum: setiap bagian mengikuti cara kerja les renang privat." tidak menjelaskan apa-apa. Footer hanya "Syarat & Ketentuan" sedangkan halaman hukum menampilkan 4 kebijakan. Jenis: mekanis (tulisan) + butuh keputusan (warna tombol).
32. publik (4 halaman hukum + register area): footer tautan kebijakan ±11px dengan jarak baris besar (tidak rapat), target sentuh kecil (kebijakan_cookie, kebijakan_pengembalian, kebijakan_privasi, syarat_ketentuan). Jenis: mekanis.
33. admin/admin_paket, admin_kolam; coach/coach_harga; pool/pool_paket: tombol masih berlabel "Edit" di gambar. KODE SUDAH "Ubah" (dicek: komponen harga paket dan kartu paket admin memakai "Ubah", commit 5515cdc). Kemungkinan gambar diambil sebelum build terbaru. Jenis: bukan temuan baru, perlu tangkap ulang untuk memastikan. Belum dicek dengan menjalankan aplikasi.
34. publik/pembayaran_sukses: halaman berjudul "Cek Status Pembayaran" dengan ikon tanda tanya kuning; file dinamai "sukses" tetapi tidak menyatakan berhasil. Belum dicek kode apakah ini tampilan tanpa parameter pesanan. Jenis: butuh keputusan (tulisan).
35. coach/coach_saldo: kalimat pengantar 4 baris memuat angka PPh; "Gagal / ditolak" memakai garis miring di badge; "No. referensi" vs "Nomor Rekening" singkatan tidak seragam. Jenis: mekanis.

### RINGAN

36. Beberapa halaman menampilkan data uji mencolok: "[isi email disamarkan #2]", "[isi chat disamarkan #5]", "kontak2@dev.invalid", "(uji sweep)", "Testimoni uji sweep, bukan asli", "Paket Tidak Ada", "Impor Uji". Hanya data lokal. Jenis: data uji, tidak perlu diperbaiki di kode.
37. "Coach Coach 6" / "Coach Coach 10" (member_booking, member_riwayat, admin_afiliasi, admin_users detail): kode menambahkan "Coach" di depan nama yang memang sudah "Coach 6". Hanya muncul karena nama uji; nama nyata aman. Jenis: false alarm kode, data uji.
38. coach/perjanjian_coach potongan 4: "Rp800.000 … Rp100.000" tanpa spasi (aturan: "Rp 1.000"). Teks hukum: lapor dan tunggu Hadi.
39. coach/coach_dashboard dan sejenis: tautan "Selengkapnya →", "Semua sesi →", "Lihat jadwal →", "Pasang 2FA →" hanya teks 14px; target sentuh ±20px.
40. member/profil: paragraf "Hapus akun" memakai pemutus baris manual sehingga lebar baris tidak rata ("…dan jadwal / yang belum berjalan akan dibatalkan. / Riwayat transaksi tetap disimpan / tanpa identitasmu.").
41. member/member_pembayaran: judul "Riwayat Bayar" terdengar santai dibanding "Riwayat Pencairan"/"Riwayat Booking"; "No. transaksi: #O6" kode pendek ganjil. Jenis: mekanis.
42. member/notifikasi: kartu notifikasi punya ruang kosong di kiri teks (±20px, bekas titik belum dibaca). Admin dashboard daftar "Perlu tindakan" menjorok 8px dari judul kartu.
43. admin/admin_laporan_kehadiran: pemilih "Hadir" menjorok dari label "Status kehadiran sekarang" (65px vs 49px) dan terlalu sempit.
44. pool/pool_dashboard dan pool_jadwal: 15 baris "Tidak ada les" sama ketika hari kosong; judul "Jam ramai hari ini · 0 sesi les" terbaca janggal bila 0.
45. admin/admin_coach_tanpa_jadwal dan coach/profil: huruf "l" pada judul tebal tampak seperti "1" ("Jadwa1", "Profi1 Coach"). Kemungkinan sekadar render font di tangkapan, belum dicek di perangkat nyata; judul "Jadwal Booking/Jadwal Kolam" tampil benar.
46. URL profil coach publik memakai "pelatih" (/pelatih/<id>); kata "Pelatih" di teks pengguna hanya pada nama sertifikat dan definisi hukum. Tidak perlu diubah kecuali Hadi mau.

## Rekap jumlah
BERAT: 0 | SEDANG: 35 (temuan 1–35) | RINGAN: 11 (temuan 36–46).
Tidak ditemukan yang layak BERAT dari gambar. Yang paling dekat: temuan 1 (tabel terpotong) dan 17/18 (tulisan uang yang membingungkan).
Konsisten baik: lebar halaman dan jarak judul di semua peran (judul di y≈108, gutter 32px di dalam aplikasi), radius kartu, "Rp 1.000" ber-spasi, "Tidak Hadir", "Coach", "Ubah", sapaan "kamu".
