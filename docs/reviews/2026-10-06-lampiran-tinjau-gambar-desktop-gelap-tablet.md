# Tinjauan tangkapan layar: desktop 1280 gelap dan tablet 768 terang

Dibuat 6 Oktober 2026. Hanya membaca gambar dan sedikit kode (grep); tidak ada berkas repo yang diubah, tidak ada .env dibaca, tidak ada server dijalankan.

## Ringkasan
- Gambar dibuka: 156 dari 156 (semua berkas *__1280__dark.jpg dan *__768__light.jpg di lima subfolder). Tidak ada gambar yang terlewat.
- Temuan: 42 (BERAT 4, SEDANG 17, RINGAN 21); satu di antaranya false alarm (awalan "Coach Coach"), satu kemungkinan sudah beres di kode yang belum di-commit ("Edit").
- Gambar bertanda "ada masalah: ya": 105 dari 156. Catatan: "ya" mencakup temuan RINGAN (gaya penulisan, jarak) dan hampir semua dashboard/tablet; temuan BERAT/SEDANG hanya ada di sebagian kecil gambar (lihat daftar temuan).

## Batas pemeriksaan (jujur)
- Halaman panjang dikecilkan saat dilihat (contoh: Syarat & Ketentuan, Kebijakan Privasi, Perjanjian Coach, MOU Kolam, Brand Guideline, Jadwal Booking admin, Bagi Hasil, landing). Tata letak dan tombol bisa dinilai; salah ketik di isi paragraf panjang TIDAK diperiksa kata per kata.
- Sembilan nama halaman (18 berkas, dua lebar) ternyata bukan halaman yang dimaksud namanya (menampilkan Dashboard/Booking karena dialihkan): lihat tabel cakupan. Halaman aslinya (contoh ganti password) tidak bisa dinilai dari berkas itu.
- Tombol/bar yang menempel di layar ("Butuh bantuan?", bar "Pilih tanggal dan jam") tampil menimpa isi di tangkapan penuh; itu efek tangkapan, tidak dilaporkan sebagai tabrakan kecuali dicatat.
- Foto rusak, ikon foto kosong, peringatan "Unggah file belum aktif", dan skrip analitik diabaikan sesuai perintah. Hanya satu tangkapan per halaman: keadaan kosong/galat/dialog tidak terlihat.
- Tangkapan diambil dengan akun uji yang tidak mewakili semua keadaan (contoh: tidak ada pesanan nyata di halaman sukses).

## (a) Tabel cakupan
| berkas gambar | dibuka | ada masalah |
|---|---|---|
| shots-admin/admin__1280__dark.jpg | ya | ya |
| shots-admin/admin__768__light.jpg | ya | ya |
| shots-admin/admin_afiliasi__1280__dark.jpg | ya | tidak |
| shots-admin/admin_afiliasi__768__light.jpg | ya | tidak |
| shots-admin/admin_booking_overview__1280__dark.jpg | ya | ya |
| shots-admin/admin_booking_overview__768__light.jpg | ya | ya |
| shots-admin/admin_coach_tanpa_jadwal__1280__dark.jpg | ya | tidak |
| shots-admin/admin_coach_tanpa_jadwal__768__light.jpg | ya | tidak |
| shots-admin/admin_email__1280__dark.jpg | ya | ya |
| shots-admin/admin_email__768__light.jpg | ya | ya |
| shots-admin/admin_ganti_coach__1280__dark.jpg | ya | tidak |
| shots-admin/admin_ganti_coach__768__light.jpg | ya | tidak |
| shots-admin/admin_kinerja_coach__1280__dark.jpg | ya | tidak |
| shots-admin/admin_kinerja_coach__768__light.jpg | ya | tidak |
| shots-admin/admin_kolam__1280__dark.jpg | ya | ya |
| shots-admin/admin_kolam__768__light.jpg | ya | ya |
| shots-admin/admin_komisi__1280__dark.jpg | ya | tidak |
| shots-admin/admin_komisi__768__light.jpg | ya | ya |
| shots-admin/admin_koreksi_saldo__1280__dark.jpg | ya | tidak |
| shots-admin/admin_koreksi_saldo__768__light.jpg | ya | tidak |
| shots-admin/admin_laporan_kehadiran__1280__dark.jpg | ya | tidak |
| shots-admin/admin_laporan_kehadiran__768__light.jpg | ya | ya |
| shots-admin/admin_milestone__1280__dark.jpg | ya | tidak |
| shots-admin/admin_milestone__768__light.jpg | ya | tidak |
| shots-admin/admin_milestone_butir__1280__dark.jpg | ya | tidak |
| shots-admin/admin_milestone_butir__768__light.jpg | ya | ya |
| shots-admin/admin_paket__1280__dark.jpg | ya | ya |
| shots-admin/admin_paket__768__light.jpg | ya | ya |
| shots-admin/admin_pembayaran__1280__dark.jpg | ya | ya |
| shots-admin/admin_pembayaran__768__light.jpg | ya | ya |
| shots-admin/admin_peminat_kota__1280__dark.jpg | ya | tidak |
| shots-admin/admin_peminat_kota__768__light.jpg | ya | ya |
| shots-admin/admin_pesan__1280__dark.jpg | ya | ya |
| shots-admin/admin_pesan__768__light.jpg | ya | ya |
| shots-admin/admin_testimoni__1280__dark.jpg | ya | ya |
| shots-admin/admin_testimoni__768__light.jpg | ya | ya |
| shots-admin/admin_users__1280__dark.jpg | ya | ya |
| shots-admin/admin_users__768__light.jpg | ya | ya |
| shots-admin/admin_users_cmuqg55id0004i1h8thpz9sbq__1280__dark.jpg | ya | ya |
| shots-admin/admin_users_cmuqg55id0004i1h8thpz9sbq__768__light.jpg | ya | ya |
| shots-admin/admin_withdrawals__1280__dark.jpg | ya | tidak |
| shots-admin/admin_withdrawals__768__light.jpg | ya | ya |
| shots-admin/ganti_password__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard admin; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-admin/ganti_password__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard admin; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-admin/keamanan__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard admin; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-admin/keamanan__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard admin; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-admin/milestone_cmuehyisf000104l2ioufbnku__1280__dark.jpg | ya | ya |
| shots-admin/milestone_cmuehyisf000104l2ioufbnku__768__light.jpg | ya | ya |
| shots-admin/notifikasi__1280__dark.jpg | ya | ya |
| shots-admin/notifikasi__768__light.jpg | ya | tidak |
| shots-admin/profil__1280__dark.jpg | ya | ya |
| shots-admin/profil__768__light.jpg | ya | ya |
| shots-coach/coach__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard coach; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-coach/coach__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard coach; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-coach/coach_dashboard__1280__dark.jpg | ya | ya |
| shots-coach/coach_dashboard__768__light.jpg | ya | ya |
| shots-coach/coach_harga__1280__dark.jpg | ya | ya |
| shots-coach/coach_harga__768__light.jpg | ya | ya |
| shots-coach/coach_jadwal__1280__dark.jpg | ya | ya |
| shots-coach/coach_jadwal__768__light.jpg | ya | ya |
| shots-coach/coach_kolam__1280__dark.jpg | ya | ya |
| shots-coach/coach_kolam__768__light.jpg | ya | ya |
| shots-coach/coach_peserta__1280__dark.jpg | ya | ya |
| shots-coach/coach_peserta__768__light.jpg | ya | ya |
| shots-coach/coach_riwayat_sesi__1280__dark.jpg | ya | ya |
| shots-coach/coach_riwayat_sesi__768__light.jpg | ya | ya |
| shots-coach/coach_saldo__1280__dark.jpg | ya | ya |
| shots-coach/coach_saldo__768__light.jpg | ya | tidak |
| shots-coach/ganti_password__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard coach; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-coach/ganti_password__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard coach; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-coach/notifikasi__1280__dark.jpg | ya | ya |
| shots-coach/notifikasi__768__light.jpg | ya | tidak |
| shots-coach/perjanjian_coach__1280__dark.jpg | ya | tidak |
| shots-coach/perjanjian_coach__768__light.jpg | ya | tidak |
| shots-coach/profil__1280__dark.jpg | ya | ya |
| shots-coach/profil__768__light.jpg | ya | ya |
| shots-member/ganti_password__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan halaman Booking; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/ganti_password__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan halaman Booking; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/kota__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/kota__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/member__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan halaman Booking; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/member__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan halaman Booking; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-member/member_booking__1280__dark.jpg | ya | ya |
| shots-member/member_booking__768__light.jpg | ya | ya |
| shots-member/member_cari_coach__1280__dark.jpg | ya | ya |
| shots-member/member_cari_coach__768__light.jpg | ya | ya |
| shots-member/member_dashboard__1280__dark.jpg | ya | ya |
| shots-member/member_dashboard__768__light.jpg | ya | ya |
| shots-member/member_paket__1280__dark.jpg | ya | ya |
| shots-member/member_paket__768__light.jpg | ya | ya |
| shots-member/member_pembayaran__1280__dark.jpg | ya | ya |
| shots-member/member_pembayaran__768__light.jpg | ya | tidak |
| shots-member/member_peserta__1280__dark.jpg | ya | ya |
| shots-member/member_peserta__768__light.jpg | ya | ya |
| shots-member/member_riwayat__1280__dark.jpg | ya | tidak |
| shots-member/member_riwayat__768__light.jpg | ya | tidak |
| shots-member/milestone_cmuqg55im0005i1h8pwxkzzps__1280__dark.jpg | ya | tidak |
| shots-member/milestone_cmuqg55im0005i1h8pwxkzzps__768__light.jpg | ya | tidak |
| shots-member/notifikasi__1280__dark.jpg | ya | ya |
| shots-member/notifikasi__768__light.jpg | ya | tidak |
| shots-member/profil__1280__dark.jpg | ya | ya |
| shots-member/profil__768__light.jpg | ya | ya |
| shots-pool/ganti_password__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard pemilik kolam; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-pool/ganti_password__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard pemilik kolam; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-pool/mou_kolam__1280__dark.jpg | ya | tidak |
| shots-pool/mou_kolam__768__light.jpg | ya | tidak |
| shots-pool/notifikasi__1280__dark.jpg | ya | ya |
| shots-pool/notifikasi__768__light.jpg | ya | tidak |
| shots-pool/pool__1280__dark.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard pemilik kolam; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-pool/pool__768__light.jpg | ya | ya (berkas ini menampilkan halaman lain: menampilkan Dashboard pemilik kolam; halaman aslinya TIDAK bisa dicek dari berkas ini; kolom ini menilai halaman yang tampil) |
| shots-pool/pool_coach__1280__dark.jpg | ya | tidak |
| shots-pool/pool_coach__768__light.jpg | ya | tidak |
| shots-pool/pool_dashboard__1280__dark.jpg | ya | ya |
| shots-pool/pool_dashboard__768__light.jpg | ya | ya |
| shots-pool/pool_info__1280__dark.jpg | ya | tidak |
| shots-pool/pool_info__768__light.jpg | ya | ya |
| shots-pool/pool_jadwal__1280__dark.jpg | ya | tidak |
| shots-pool/pool_jadwal__768__light.jpg | ya | tidak |
| shots-pool/pool_laporan__1280__dark.jpg | ya | ya |
| shots-pool/pool_laporan__768__light.jpg | ya | ya |
| shots-pool/pool_paket__1280__dark.jpg | ya | ya |
| shots-pool/pool_paket__768__light.jpg | ya | ya |
| shots-pool/pool_saldo__1280__dark.jpg | ya | ya |
| shots-pool/pool_saldo__768__light.jpg | ya | tidak |
| shots-pool/profil__1280__dark.jpg | ya | ya |
| shots-pool/profil__768__light.jpg | ya | ya |
| shots-publik/brandguideline__1280__dark.jpg | ya | tidak |
| shots-publik/brandguideline__768__light.jpg | ya | tidak |
| shots-publik/daftar_coach__1280__dark.jpg | ya | ya |
| shots-publik/daftar_coach__768__light.jpg | ya | ya |
| shots-publik/daftar_kolam__1280__dark.jpg | ya | ya |
| shots-publik/daftar_kolam__768__light.jpg | ya | ya |
| shots-publik/halaman_yang_tidak_ada__1280__dark.jpg | ya | tidak |
| shots-publik/halaman_yang_tidak_ada__768__light.jpg | ya | tidak |
| shots-publik/kebijakan_cookie__1280__dark.jpg | ya | tidak |
| shots-publik/kebijakan_cookie__768__light.jpg | ya | tidak |
| shots-publik/kebijakan_pengembalian__1280__dark.jpg | ya | tidak |
| shots-publik/kebijakan_pengembalian__768__light.jpg | ya | tidak |
| shots-publik/kebijakan_privasi__1280__dark.jpg | ya | tidak |
| shots-publik/kebijakan_privasi__768__light.jpg | ya | tidak |
| shots-publik/login__1280__dark.jpg | ya | tidak |
| shots-publik/login__768__light.jpg | ya | tidak |
| shots-publik/panduan__1280__dark.jpg | ya | ya |
| shots-publik/panduan__768__light.jpg | ya | ya |
| shots-publik/pelatih_cmtygcifp00025uh8lf88sld5__1280__dark.jpg | ya | ya |
| shots-publik/pelatih_cmtygcifp00025uh8lf88sld5__768__light.jpg | ya | ya |
| shots-publik/pembayaran_gagal__1280__dark.jpg | ya | ya |
| shots-publik/pembayaran_gagal__768__light.jpg | ya | ya |
| shots-publik/pembayaran_sukses__1280__dark.jpg | ya | ya |
| shots-publik/pembayaran_sukses__768__light.jpg | ya | ya |
| shots-publik/register__1280__dark.jpg | ya | ya |
| shots-publik/register__768__light.jpg | ya | ya |
| shots-publik/root__1280__dark.jpg | ya | ya |
| shots-publik/root__768__light.jpg | ya | ya |
| shots-publik/syarat_ketentuan__1280__dark.jpg | ya | tidak |
| shots-publik/syarat_ketentuan__768__light.jpg | ya | tidak |

## (b) Daftar temuan

1. **BERAT** | jenis: mekanis (tata letak)
   - Berkas: shots-admin/admin__768__light.jpg (juga shots-admin/ganti_password__768__light.jpg dan keamanan__768__light.jpg: dua berkas itu ternyata menampilkan Dashboard admin yang sama)
   - Bagian: Dashboard admin, kartu "Perlu tindakan" dan "Saldo belum dicairkan" di 768
   - Masalah: Kartu "Perlu tindakan" terjepit ±100 px; teks pecah per suku kata ("Pesan perlu dibala s", "Permi ntaan hapus akun", "Penca iran menu nggu"). Kartu saldo memecah angka uang: "Rp 472.17 / 5" dan "641.77 / 6". Kartu "Hari ini" dan "Jadwal hari ini/besok" jadi sangat tinggi dan hampir kosong.
   - Usulan: Di lebar tablet, susun kartu satu kolom (Perlu tindakan di atas/bawah Hari ini), jangan 3 kolom. Angka uang jangan boleh pecah di tengah (nowrap / ukuran font mengecil).

2. **BERAT** | jenis: mekanis (tata letak)
   - Berkas: shots-admin/admin_pembayaran__768__light.jpg
   - Bagian: Uang Masuk, tabel per tanggal
   - Masalah: Tabel dipaksa muat: kolom Paket pecah jadi 5-7 baris, Order ID terpotong, dan kolom JUMLAH + STATUS tidak terlihat sama sekali di hampir semua kelompok tanggal (1 Okt, 30 Sep, 24 Sep, 21 Sep, 17 Sep). Hanya 2 Okt dan 12 Sep yang memperlihatkan Jumlah. Admin tidak bisa membaca nominal uang masuk di tablet. Belum dicek: apakah tabel bisa digeser ke samping (tidak ada petunjuk geser di gambar).
   - Usulan: Di tablet ubah baris jadi kartu bertumpuk (Member, Paket, Jumlah, Status), atau pastikan tabel bisa digeser dengan bayangan di tepi.

3. **BERAT** | jenis: mekanis (tata letak)
   - Berkas: shots-pool/pool_laporan__768__light.jpg
   - Bagian: Laporan pemilik kolam, kartu angka dan tabel
   - Masalah: Angka uang pecah di kartu: "Rp 59.8 / 50", "Rp 119. / 700", "Rp 120.00 / 0 – PPh / Rp 300". Tabel rincian hanya menampilkan sampai kolom "PPh 0,5%"; kolom "Masuk saldo" (angka terpenting bagi pemilik kolam) tidak terlihat. Tanggal pecah 3 baris ("Kamis, 1 / Oktober / 2026").
   - Usulan: Kartu angka 2 kolom (bukan 4) di tablet; tabel jadi kartu per sesi atau bisa digeser dengan petunjuk.

4. **BERAT** | jenis: mekanis (tata letak)
   - Berkas: shots-coach/coach_dashboard__768__light.jpg (sama: coach__768__light.jpg dan ganti_password__768__light.jpg); shots-pool/pool_dashboard__768__light.jpg (sama: pool__768, ganti_password__768); shots-admin/admin_withdrawals__768__light.jpg
   - Bagian: Kartu saldo gelap di dashboard coach dan pemilik kolam; tiga kartu hitungan di Pencairan Saldo admin
   - Masalah: Angka uang pecah di tengah karena kartu sempit: coach "Rp 17 / 2.25 / 0" (harusnya Rp 172.250), pemilik kolam "Rp 79 / .700", admin "Rp 304.68 / 9" dan "Rp 220.00 / 0". Tombol "Cairkan saldo" dan "Buka saldo" ikut pecah 2 baris. Di 1280 semua normal.
   - Usulan: Kartu saldo tidak boleh lebih sempit dari angkanya: di tablet buat kartu penuh satu baris (kartu saldo di bawah kartu "Langkah berikutnya") atau perkecil font angka.

5. **SEDANG** | jenis: butuh keputusan (tata letak tablet)
   - Berkas: semua berkas 768 di shots-member, shots-coach, shots-pool, shots-admin (contoh: member_dashboard__768__light.jpg, member_paket__768__light.jpg, coach_harga__768__light.jpg)
   - Bagian: Rangka halaman setelah masuk (sidebar kiri)
   - Masalah: Di 768 sidebar kiri tetap terbuka selebar ±207 px dan menyita ±28% layar, jadi isi tinggal ±470 px. Inilah akar temuan 1-4 dan 5-12: kartu 2 kolom jadi sempit (dashboard member: "Anak Uji O6 · Paket 4 sesi · Coach 10" pecah 3 baris di sebelah "Sisa 4/4 sesi"; Paket: nama kolam pecah "Kolam / Renang Bahari"; Harga coach: 2 kartu sempit). HP sudah memakai menu lain, jadi tablet terjebak di tengah.
   - Usulan: Putuskan: pada <1024 px sidebar jadi menu geser seperti di HP (isi penuh), atau sidebar hanya ikon. Satu perubahan di rangka halaman memperbaiki banyak halaman sekaligus.

6. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-admin/admin_milestone_butir__768__light.jpg
   - Bagian: Butir standar milestone, daftar butir
   - Masalah: Kolom teks butir hanya ±65 px lebar, jadi kalimat butir terpotong ("Mau masuk ke air :", "Mau dibasahi waja"); admin tidak bisa membaca butir yang mau diubah. Di 1280 baik.
   - Usulan: Di tablet tumpuk: nomor + teks penuh lebar di atas, tombol Simpan/Nonaktifkan di bawah.

7. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-admin/admin_komisi__768__light.jpg
   - Bagian: Bagi Hasil, tabel per kolam
   - Masalah: Tabel terpotong di kolom "Platform bersih"; kolom PPN, Kolam, Coach tidak terlihat (angka bagi hasil kolam dan coach). Belum dicek apakah bisa digeser.
   - Usulan: Sama seperti temuan 2: geser dengan petunjuk, atau kartu bertumpuk.

8. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-admin/admin_peminat_kota__768__light.jpg
   - Bagian: Peminat per Kota, tabel
   - Masalah: Kolom "Coach aktif" terpotong dan kolom "Member" tidak terlihat.
   - Usulan: Kecilkan padding sel atau buat bisa digeser.

9. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-coach/coach_jadwal__768__light.jpg dan coach_jadwal__1280__dark.jpg; shots-admin/admin_booking_overview__768__light.jpg dan __1280__dark.jpg
   - Bagian: Jadwal Coach Lain (coach) dan Jadwal Booking (admin)
   - Masalah: Setiap jam ditampilkan sebagai kotak sempit (±300 px di 1280, ±70-100 px di 768) dalam satu kolom, sehingga 60% layar kosong dan halaman sangat panjang (±3900 px). Di 768 jam pecah "09.00– / 10.00" dan "Kosong" terhimpit. Satu hari/kolam hanya dua kotak berdampingan bila kebetulan ada dua coach, jadi tidak konsisten.
   - Usulan: Susun kotak jam dalam grid 3-4 kolom (atau deret per jam seperti Jadwal Kolam milik pemilik kolam yang rapi).

10. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-pool/pool_dashboard__768__light.jpg (sama: pool__768, ganti_password__768)
   - Bagian: Dashboard pemilik kolam, kartu "Jam ramai hari ini" dan "Terisi 7 hari ke depan"
   - Masalah: Teks "Tidak ada les" dan "2 jam kosong" terpotong di tepi kartu ("Tidak ada le", "2 jam koson"); bar hanya ±35 px; judul pecah "Jam ramai hari / ini · 0 sesi les"; link "Lihat jadwal →" turun ke bawah judul. Kartu "Info kolam" ±147 px: "Jam buka: / belum diisi".
   - Usulan: Tablet: dua kartu ini satu kolom penuh. Ringkas 15 baris "Tidak ada les" (di 1280 juga: 14 baris sama yang berulang).

11. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-pool/pool_info__768__light.jpg
   - Bagian: Info Kolam, baris "No. telepon kolam / Jam buka / Jam tutup"
   - Masalah: Kolom nomor telepon hanya ±90 px (nomor tidak muat), berbagi baris dengan dua pilihan jam.
   - Usulan: Pindahkan Jam buka/tutup ke baris sendiri di tablet.

12. **SEDANG** | jenis: butuh keputusan
   - Berkas: shots-publik/panduan__1280__dark.jpg dan panduan__768__light.jpg (dibandingkan dengan kebijakan_cookie__1280__dark.jpg, kebijakan_pengembalian__1280__dark.jpg, kebijakan_privasi__1280__dark.jpg, login__1280__dark.jpg)
   - Bagian: Tema gelap halaman publik
   - Masalah: Panduan tampil TERANG (krem) di tangkapan tema gelap, padahal halaman hukum (cookie, privasi, pengembalian, S&K) dan login benar-benar gelap. Brand guideline (brandguideline__1280__dark.jpg) menyebut "landing, panduan, dan halaman hukum tampil sama di tema terang maupun gelap", tetapi halaman hukum nyatanya ikut gelap. Jadi aturan di dokumen dan yang tampil tidak cocok. (Landing root__1280__dark juga campuran: hero gelap, isi krem, itu sengaja sesuai guideline.)
   - Usulan: Hadi putuskan: halaman hukum ikut tema (dan perbarui guideline) atau halaman hukum dikunci terang seperti panduan.

13. **SEDANG** | jenis: mekanis (tata letak)
   - Berkas: shots-publik/root__768__light.jpg
   - Bagian: Landing, bagian "Kamu di sini sebagai apa?"
   - Masalah: Di 768 tiga baris (Orang tua / Coach / Pemilik kolam) menjepit kalimat besar ke kolom ±140 px: "Cari coach / renang yang / pas untuk / anakmu, / atau untuk / dirimu sendiri." jadi 5-6 baris setinggi ±250 px, sedangkan label dan link di kiri-kanan makan tempat. Di 1280 rapi.
   - Usulan: Tablet: susun label di atas, kalimat penuh lebar, link di bawah (seperti HP).

14. **SEDANG** | jenis: mekanis (tulisan)
   - Berkas: shots-coach/coach_jadwal__1280__dark.jpg dan 768 (tombol "Tambah Slot"); shots-coach/perjanjian_coach__1280__dark.jpg (teks "tombol Tambah Slot" dan "Update milestone"); shots-publik/panduan__1280__dark.jpg (kode: panduan-view.tsx: "Klik Tambah Slot")
   - Bagian: Istilah dilarang "slot"; juga pilihan Kolam di formulir Jadwal terpotong
   - Masalah: Tombol "Tambah Slot" memakai kata "slot" (aturan: tanpa slot). Di formulir yang sama pilihan Kolam terpotong "Kolam Renang Cempaka · buk". Kode juga memuat "Tambah Slot" di cancel-booking-button.tsx dan add-slot-form.tsx (hasil grep).
   - Usulan: Ganti jadi "Tambah jam" / "Buka jam"; lebarkan pilihan Kolam. Teks perjanjian = teks hukum: tunggu Hadi.

15. **SEDANG** | jenis: mekanis (tulisan)
   - Berkas: shots-coach/coach_peserta__1280__dark.jpg dan 768; shots-coach/coach_riwayat_sesi__1280__dark.jpg dan 768
   - Bagian: Kalimat "Isi Update milestone tiap peserta...", tautan "Update milestone →", dan "Peserta: Anak Uji O6 Update milestone"
   - Masalah: Kata Inggris "Update" (aturan: Ubah/Perbarui), huruf besar di tengah kalimat ("Isi Update milestone"). Di Riwayat Sesi tautan menempel langsung setelah nama ("Peserta: Anak Uji O6 Update milestone") tanpa pemisah sehingga terbaca satu kalimat. Kode: coach/peserta/page.tsx, coach/riwayat-sesi/page.tsx, coach/dashboard/page.tsx ("linkLabel"), milestone/[dependentId]/page.tsx (judul "Update milestone").
   - Usulan: "Perbarui catatan" / "Isi catatan perkembangan"; beri jarak dan pemisah (" · ") atau pindahkan tautan ke kanan.

16. **SEDANG** | jenis: butuh keputusan (tampilan menyesatkan)
   - Berkas: shots-coach/coach_riwayat_sesi__1280__dark.jpg dan 768
   - Bagian: Kartu sesi yang sudah "Hadir" / "Tidak Hadir" ditandai coach
   - Masalah: Teks kecil "Lewat 24 jam, hubungi admin" tampil di SEMUA kartu, termasuk yang sudah ditandai Hadir (30 Sep, 1 Okt) dan Tidak Hadir. Seolah masih ada yang harus diurus ke admin. Kemungkinan teks ini seharusnya hanya muncul untuk sesi "Belum ditandai". Belum dicek di kode.
   - Usulan: Tampilkan hanya bila status "Belum ditandai" dan sudah lewat 24 jam.

17. **SEDANG** | jenis: mekanis (tulisan)
   - Berkas: shots-coach/coach_kolam__1280__dark.jpg dan 768; shots-pool/pool_dashboard__1280__dark.jpg
   - Bagian: "Buka belum diisi" (5 baris kolam); kartu Info kolam pemilik
   - Masalah: "Buka belum diisi" ambigu (buka apa?) dan terbaca janggal; di dashboard pemilik tiga gaya pesan kosong berbeda dalam satu kartu: "Jam buka: belum diisi", "Fasilitas belum diisi.", "Deskripsi kolam belum diisi." (yang terakhir kuning).
   - Usulan: "Jam buka belum diisi"; samakan tiga baris itu (semuanya format sama, warna sama).

18. **SEDANG** | jenis: logika (data/tampilan)
   - Berkas: shots-admin/milestone_cmuehyisf000104l2ioufbnku__1280__dark.jpg dan 768
   - Bagian: Halaman milestone Member 12 Uji
   - Masalah: Subjudul "36 tahun · Anak usia dini (4 – 6 tahun)": umur 36 tahun dikelompokkan ke kelompok anak 4-6 tahun. Mungkin data uji (tanggal lahir/kelompok disetel manual) atau penetapan kelompok tidak mengecek umur. Belum dicek di kode.
   - Usulan: Cek apakah kelompok dihitung dari tanggal lahir; bila dari data uji saja, perbaiki data uji.

19. **SEDANG** | jenis: mekanis (tampilan/UX)
   - Berkas: shots-publik/register__1280__dark.jpg dan register__768__light.jpg
   - Bagian: Daftar Member, baris peserta
   - Masalah: Kolom nama peserta tampak nonaktif (latar beda) dengan placeholder terpotong "(isi nama lengkap lebih dulu" (ujung terpotong), dan kolom tanggal lahir tanpa label sendiri. Ini halaman yang dipakai pengunjung iklan, jadi calon pembeli bisa bingung mengisi.
   - Usulan: Placeholder lebih pendek ("Nama peserta"), beri label "Tanggal lahir"; bila diisi otomatis dari nama orang tua, tulis begitu.

20. **SEDANG** | jenis: butuh keputusan
   - Berkas: shots-publik/panduan__1280__dark.jpg dan panduan__768__light.jpg
   - Bagian: Bagian "Kenapa ini beda" dan "Empat peran, empat tampilan"
   - Masalah: (a) Judul "Empat peran" tetapi hanya 3 kartu panduan (Member, Coach, Pemilik Kolam) dengan satu petak kosong di grid. (b) Kartu "Bagi hasil otomatis" berisi satu paragraf padat berjargon (PPh 0,5%, PPN 11%, 50%) sedangkan kartu lain 3-4 baris; tinggi kartu tidak seimbang ("Notifikasi dua arah" setengah kosong). Kesan jargon untuk orang tua.
   - Usulan: Judul jadi "Tiga peran, tiga tampilan" (atau tambah kartu Admin bila memang untuk dilihat); ringkas kartu bagi hasil dan pindahkan rincian ke panduan.

21. **SEDANG** | jenis: butuh keputusan (data uji di halaman jualan)
   - Berkas: shots-publik/root__1280__dark.jpg dan root__768__light.jpg
   - Bagian: Landing, bagian "Kolam mitra"
   - Masalah: Kartu "Kolam Uji Daftar" tampil di halaman jualan dengan isi "Harga paket: Segera hadir", "Jam buka: Hubungi admin", "Coach: 0 coach". Itu data uji/kolam kosong yang tampil ke calon pembeli. Di 768 bagian bawah juga ada tiga kartu bulat kosong (kemungkinan belum muncul karena animasi masuk layar; belum dicek).
   - Usulan: Sembunyikan kolam tanpa harga/jam buka/coach dari landing.

22. **RINGAN** | jenis: butuh keputusan (aturan penulisan)
   - Berkas: banyak: contoh shots-coach/coach_dashboard__1280__dark.jpg ("Salin Link"), shots-coach/profil__1280__dark.jpg ("Ubah Nama", "Ubah Profil Coach", "Simpan Tanda Tangan", "Tambah Sertifikat", "Ganti Password", label "Password Saat Ini"), shots-coach/coach_saldo__1280__dark.jpg ("Rekening Tujuan Pencairan", "Nama Bank"), shots-admin/admin_pesan__1280__dark.jpg, shots-publik/pembayaran_gagal__1280__dark.jpg ("Coba Lagi", "Kembali ke Booking"), shots-publik/pembayaran_sukses__1280__dark.jpg ("Lihat Paket", "Booking Sekarang"), daftar_coach/daftar_kolam ("Nama Lengkap" vs "Kota domisili")
   - Bagian: Huruf besar judul/tombol/label
   - Masalah: Dua gaya tercampur: Title Case ("Ubah Nama", "Ganti Password", "Catat Pencairan", "Beli Paket Baru", "Coba Lagi", label "Nama Lengkap", "Jam Buka") dan sentence case ("Simpan kota", "Minta hapus akun", "Tulis email baru", "Daftar gratis", label "Kota domisili", "Jam buka"). Kadang berdampingan di kartu yang sama (Ubah Nama / Simpan kota). Juga "No. telepon kolam" vs "Nomor HP".
   - Usulan: Hadi putuskan satu gaya (usul: sentence case), lalu sapu mekanis.

23. **RINGAN** | jenis: mekanis (bukan temuan baru bila kode sudah berubah)
   - Berkas: shots-coach/coach_harga__1280__dark.jpg dan 768; shots-pool/pool_paket__1280__dark.jpg dan 768; shots-admin/admin_kolam__1280__dark.jpg dan 768; shots-admin/admin_paket__1280__dark.jpg dan 768
   - Bagian: Tombol "Edit"
   - Masalah: Gambar menunjukkan tombol "Edit" (aturan: Ubah). Kode di folder kerja sekarang sudah "Ubah" (pack-price-form.tsx baris 46-48 dan admin/paket/package-member-card.tsx baris 65-67; keduanya berstatus belum di-commit), jadi gambar kemungkinan diambil sebelum perubahan itu. Belum dicek ulang di browser.
   - Usulan: Ambil ulang tangkapan layar setelah perubahan; bila masih "Edit" di admin Kolam, ganti.

24. **RINGAN** | jenis: false alarm (data uji)
   - Berkas: shots-member/member_riwayat__1280__dark.jpg, member_booking__1280__dark.jpg; shots-admin/admin_afiliasi__1280__dark.jpg, admin_laporan_kehadiran__1280__dark.jpg
   - Bagian: "Coach Coach 6", "Member Member 12 Uji", "coach Coach 6"
   - Masalah: Kata dobel. Kode memberi awalan "Coach"/"Member" di depan nama (admin/afiliasi/page.tsx baris 63, admin/laporan-kehadiran/page.tsx baris 58 dan 61, member/riwayat/page.tsx baris 138), sedangkan nama akun uji sendiri bernama "Coach 6"/"Member 12 Uji". Dengan nama asli ("Coach Rina" -> "Coach Rina") tidak terjadi. Bukan kesalahan aplikasi.
   - Usulan: Tidak perlu diperbaiki; tetap disebut agar tidak dicari lagi.

25. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/member_dashboard__1280__dark.jpg; shots-admin/admin__1280__dark.jpg; shots-pool/pool_dashboard__1280__dark.jpg
   - Bagian: Kartu kosong yang melebar
   - Masalah: Kartu "Jadwal berikutnya" (member) setinggi ±480 px berisi satu kalimat; kartu "Hari ini" (admin) ±380 px dengan setengah kosong dan "Jadwal hari ini/besok" ±160 px kosong; kartu "Terisi 7 hari" (pemilik kolam) kosong separuh karena menyamai tinggi tetangganya. Di admin, label "Pendapatan bersih bisa dicairkan" dua baris membuat angka Rp 232.983 lebih rendah dari tiga angka lain; kolom "Member punya paket aktif" pecah 3 baris.
   - Usulan: Tinggi kartu mengikuti isi (align-items: start), samakan tinggi label.

26. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/notifikasi__1280__dark.jpg, shots-coach/notifikasi__1280__dark.jpg, shots-pool/notifikasi__1280__dark.jpg, shots-admin/notifikasi__1280__dark.jpg
   - Bagian: Halaman Notifikasi
   - Masalah: Kartu hanya selebar ±768 px sedangkan halaman lain selebar ±944 px; radius lebih bulat (pil) dibanding kartu lain; tanpa subjudul (hanya member punya "Semua sudah dibaca"); kartu notifikasi member punya ruang kosong ±22 px di kiri (tempat titik belum dibaca); keadaan kosong coach/pemilik/admin berteks tengah, member rata kiri.
   - Usulan: Samakan lebar dan radius dengan kartu lain.

27. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/member_paket__1280__dark.jpg dan 768
   - Bagian: Halaman Paket member
   - Masalah: Chip "Aktif" di kartu kiri ada di kanan atas, di kartu kanan turun di bawah bar progres karena teks lebih panjang; bar progres paket selebar tetap ±190 px (di Dashboard bar penuh lebar); judul "Beli Paket Baru" Title Case sementara "Paket aktif" sentence case; pilihan Kota memakai tampilan bawaan browser (tanda panah berbeda) sementara pilihan lain memakai panah sendiri.
   - Usulan: Tempatkan chip selalu di kanan atas; samakan bar progres; pakai komponen select yang sama.

28. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/member_cari_coach__1280__dark.jpg dan 768
   - Bagian: Cari Coach, kartu coach
   - Masalah: Tinggi kartu satu baris sama sehingga "Lihat profil lengkap →" tidak sejajar (kiri-kanan beda tinggi); foto cadangan beda (oranye vs abu, foto rusak diabaikan); deskripsi uji tampil "...kelas perempuan. (uji)" dan lencana "Bersertifikat · Sertifikat Pelatih Renang Anak +1" memakai kata "Pelatih" (nama sertifikat dari data, bukan teks aplikasi: belum dicek).
   - Usulan: Tautan di dasar kartu; hapus "(uji)" dari data; cek apakah nama sertifikat boleh memuat "Pelatih".

29. **RINGAN** | jenis: butuh keputusan
   - Berkas: shots-member/member_dashboard__1280__dark.jpg; shots-coach/coach_dashboard__1280__dark.jpg; shots-pool/pool_dashboard__1280__dark.jpg
   - Bagian: Kartu lime di tema gelap; tombol utama olive
   - Masalah: Kartu hero member dan kartu saldo coach/pemilik kolam berlatar lime penuh dan besar (±300x200 px) di tema gelap, padahal aturan Anda: lime hanya aksen di kartu gelap. Tombol utama di tema gelap berwarna olive (±#5C7D12) bukan charcoal/lime; ini cocok dengan guideline ("teks putih di tombol utama" #5A7A12), jadi kemungkinan sengaja. Di terang kartu yang sama charcoal dengan aksen lime (sesuai aturan).
   - Usulan: Konfirmasi bahwa lime penuh di tema gelap memang disengaja.

30. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/member_peserta__1280__dark.jpg; shots-admin/admin_email__1280__dark.jpg; shots-admin/admin_pesan__1280__dark.jpg
   - Bagian: Radio dan kotak centang
   - Masalah: Radio "Anak saya / Saya sendiri" dan kotak centang "Tandai selesai" memakai warna biru bawaan browser, tidak ikut warna merek (di tema gelap mencolok).
   - Usulan: accent-color mengikuti token merek.

31. **RINGAN** | jenis: mekanis
   - Berkas: shots-member/member_booking__1280__dark.jpg dan 768
   - Bagian: Booking, kartu jam dan bar "Pilih tanggal dan jam"; kalimat "Paket peserta ini untuk coach Coach 6"
   - Masalah: Di 768 bar "Pilih tanggal dan jam" (menempel di bawah layar) menutupi kartu jam Coach 10/Coach 5 di tangkapan penuh: belum bisa dinilai karena itu elemen menempel; belum dicek di perangkat. Kotak "Kebijakan pembatalan" berteks ±12 px dan berlatar lebih terang dari kartu lain. Ruang kosong ±130 px antara bar dan kotak itu di 768.
   - Usulan: Cek di browser tablet nyata; samakan gaya kotak kebijakan dengan kartu lain.

32. **RINGAN** | jenis: mekanis
   - Berkas: shots-coach/coach_dashboard__1280__dark.jpg
   - Bagian: Kartu "Sesi belum ditandai Hadir" dan "Kode afiliasi"
   - Masalah: "Lewat 24 jam, hubungi admin" menggantung di tengah-kanan baris (tidak rata kanan, teks kecil kontras rendah); paragraf kode afiliasi menempel ke kolom tautan (jarak ±0 px); tautan afiliasi memakai alamat localhost (data pengembangan).
   - Usulan: Beri jarak 12 px; rata kanan.

33. **RINGAN** | jenis: mekanis
   - Berkas: shots-coach/coach_peserta__1280__dark.jpg; shots-member/member_pembayaran__1280__dark.jpg; shots-member/member_peserta__1280__dark.jpg
   - Bagian: Susunan kartu di halaman beranggota sedikit
   - Masalah: Kartu peserta coach: tautan "Update milestone" beda tinggi antar kartu satu baris; Riwayat Bayar member: satu kartu pembayaran hanya setengah lebar sedangkan kartu total penuh lebar; Peserta member: judul halaman "Peserta" diikuti subjudul bagian "Peserta" (dobel).
   - Usulan: Kartu penuh lebar bila satu; hapus subjudul ganda.

34. **RINGAN** | jenis: mekanis
   - Berkas: shots-coach/profil__1280__dark.jpg dan 768; shots-member/profil__1280__dark.jpg; shots-pool/profil__1280__dark.jpg; shots-admin/profil__1280__dark.jpg
   - Bagian: Profil, kolom "Nama", tanggal lahir, unggah file
   - Masalah: Kolom nama terisi tampak nonaktif (latar redup) walau tombol "Ubah Nama" aktif; Tanggal lahir coach tampil "Jum, 12 April 1996" (ada nama hari pada tanggal lahir); pilihan berkas bawaan browser berbahasa Inggris ("Choose file No file chosen"); kolom kiri sangat panjang sedangkan kolom kanan Profil Coach pendek (±1000 px kosong) di 1280. (Peringatan "Unggah file belum aktif" diabaikan: penyimpanan palsu.)
   - Usulan: Format tanggal tanpa nama hari; tombol unggah berlabel Indonesia.

35. **RINGAN** | jenis: mekanis
   - Berkas: shots-pool/pool_laporan__1280__dark.jpg; shots-pool/pool_saldo__1280__dark.jpg; shots-coach/coach_saldo__1280__dark.jpg
   - Bagian: Laporan dan Saldo
   - Masalah: Angka di tabel Laporan memakai huruf monospasi berbeda dari angka uang di tempat lain; judul kolom kanan ("Komisi Afiliasi", "Riwayat Koreksi Saldo") ±10 px lebih rendah dari kartu kiri; kolom rekening tampak nonaktif.
   - Usulan: Pakai font angka yang sama; sejajarkan judul.

36. **RINGAN** | jenis: mekanis
   - Berkas: shots-admin/admin_users__1280__dark.jpg; shots-admin/admin_users_cmuqg55id0004i1h8thpz9sbq__1280__dark.jpg dan 768
   - Bagian: Pengguna: daftar Member; Detail pengguna
   - Masalah: Daftar Coach/Pemilik Kolam berupa kartu, daftar Member berupa tabel dengan aksi bertumpuk 3 baris ("Hubungi / Reset password / Nonaktifkan") dan tombol "Info detail" di tengah, baris tinggi. Detail pengguna: bagian "Peserta & paket" menumpuk 4 paket dalam satu blok tanpa pemisah, "5 booking terakhir" jadi kalimat panjang dengan chip di dalamnya; "Nonaktifkan" berwarna sama dengan aksi biasa (di halaman lain aksi berbahaya berwarna merah).
   - Usulan: Satu gaya daftar; beri pemisah baris; "Nonaktifkan" merah.

37. **RINGAN** | jenis: mekanis
   - Berkas: shots-admin/admin_uang_masuk (admin_pembayaran__1280__dark.jpg)
   - Bagian: Uang Masuk 1280
   - Masalah: Tiap tabel tanggal punya lebar kolom berbeda (JAM/MEMBER/PAKET/ORDER ID bergeser antar kelompok), jadi kolom tidak lurus ke bawah; Order ID mono bertumpuk dua baris.
   - Usulan: Lebar kolom tetap (table-fixed).

38. **RINGAN** | jenis: mekanis
   - Berkas: shots-admin/admin_testimoni__1280__dark.jpg
   - Bagian: Kartu testimoni
   - Masalah: Tombol "Sembunyikan"/"Tampilkan" (aksi kedua) berwarna utama hijau sedangkan "Simpan perubahan" (aksi utama) polos; kolom "Urutan" dan tombol "Simpan perubahan" tidak sejajar tinggi.
   - Usulan: Tukar penekanan; sejajarkan.

39. **RINGAN** | jenis: mekanis
   - Berkas: shots-admin/admin_laporan_kehadiran__768__light.jpg
   - Bagian: Laporan Kehadiran, pilihan status
   - Masalah: Pilihan "Status kehadiran sekarang" menjorok ±30 px dari tepi kiri teks di atas/bawahnya (tidak sejajar) di 768.
   - Usulan: Hapus margin kiri.

40. **RINGAN** | jenis: mekanis
   - Berkas: shots-publik/pelatih_cmtygcifp00025uh8lf88sld5__1280__dark.jpg dan 768
   - Bagian: Halaman profil coach publik
   - Masalah: "← Kembali" menjorok ±11 px dari tepi konten; kartu kolam hanya berisi nama kolam dan gambar sehingga ±60% kartu kosong; lencana "Bersertifikat · Sertifikat Pelatih Renang Anak +1" (kata "Pelatih" dari nama sertifikat data).
   - Usulan: Rapatkan; tambah kota/jam buka atau kecilkan kartu.

41. **RINGAN** | jenis: butuh keputusan
   - Berkas: shots-publik/pembayaran_sukses__1280__dark.jpg dan 768
   - Bagian: Halaman setelah bayar (tanpa parameter pesanan)
   - Masalah: Halaman berjudul "Cek Status Pembayaran" dengan ikon tanda tanya kuning: untuk pembeli yang baru membayar terbaca ragu-ragu. Bisa jadi cadangan karena tangkapan tanpa pesanan; belum dicek dengan pesanan asli (sandbox).
   - Usulan: Cek tampilan dengan pesanan sandbox sungguhan; pertimbangkan teks "Pembayaran diterima" bila status sudah berhasil.

42. **RINGAN** | jenis: mekanis
   - Berkas: shots-publik/daftar_coach__1280__dark.jpg, daftar_kolam__1280__dark.jpg, register__1280__dark.jpg
   - Bagian: Daftar (tiga formulir)
   - Masalah: Tombol "Daftar" nonaktif sangat redup (kontras rendah) di tema gelap; daftar_kolam memuat judul bagian berhuruf kapital "AKUN PEMILIK KOLAM (UNTUK MASUK)" yang tidak ada di dua formulir lain; formulir kolam (±1900 px) sangat panjang di satu kolom sedangkan sisi kanan layar kosong.
   - Usulan: Naikkan kontras tombol nonaktif; satu gaya judul bagian.

