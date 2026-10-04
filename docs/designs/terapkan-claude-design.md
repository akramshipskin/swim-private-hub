# Menerapkan hasil Claude Design (rancangan, 4 Okt 2026)

Sumber: zip "Mobile app design request-handoff" dari Hadi (salinan di docs/designs/claude-design-2026-10-04/). Isi: (1) prototipe iPhone interaktif "Swim Private Hub App" (member lengkap + ringkasan coach, pemilik kolam, admin), (2) "Katalog Halaman" 66 halaman desktop+HP. HANDOFF.md-nya sendiri bilang: prototipe iPhone = eksplorasi baru yang tidak mengikuti token kode; katalog mengikuti kode tapi isi blok = data contoh dari judul halaman (pemilik kolam, admin, publik belum dicocokkan).

## Yang bisa langsung diadopsi (tampilan saja, logika tidak berubah)
1. Beranda member: kartu utama gelap besar (jadwal berikutnya, jam 38px, tombol booking) + varian "Paket dulu" (angka sisa sesi 72px + 8 segmen). Pengganti NextStepCard yang sekarang.
2. Progres paket berbentuk segmen (sisa/total) di kartu paket.
3. Switcher peserta berbentuk chip di atas dasbor.
4. Booking: kalender bulanan bertitik, daftar jam kartu besar, tombol booking MENEMPEL di bawah dengan label dinamis ("Booking Senin, 5 Okt · 16.00"), layar sukses "Slot terkunci untukmu" + kode booking. Sudah ada di rencana rombak UI tahap berikut.
5. Coach: kartu saldo di atas, tombol Hadir / Tidak hadir langsung di dasbor (memakai aksi yang sudah ada).
6. Pemilik kolam: saldo di atas + dua angka + batang "Terisi minggu ini".
7. Kepala halaman HP: logo + lonceng; tab bawah.

## Yang BERTENTANGAN dengan aturan sekarang (butuh keputusan Hadi atau jangan diikuti)
- Tombol utama lime #C6FF3D di seluruh aplikasi. Brand guideline v2 + kode: tombol utama charcoal, lime hanya CTA marketing/kartu aksen.
- Data contoh salah terhadap aturan bisnis: paket 4 sesi "30 hari" dan 8 sesi "60 hari" (aturan: 60 dan 90 hari); "jatah batal 1" untuk paket 8 sesi (aturan: 4x, paket 4 sesi 2x). Harus dibaca dari data asli, bukan dari contoh.
- "Halo, Ibu Rina": sapaan Ibu/Bapak tidak boleh ditebak; pakai nama akun saja.
- Tab bawah member cuma 3 (Beranda, Cari coach, Booking); Paket, Riwayat, Peserta, Riwayat Bayar tidak punya tempat -> tetap perlu "Lainnya".
- Cari Coach di prototipe tanpa kota (keputusan 7: tampilkan kota; hanya coach berkolam aktif).
- Admin Pencairan: Setujui/Tolak tanpa langkah bukti transfer/alasan; alur asli harus dicek dulu.

## Tidak ada di desain
Keadaan memuat/kosong/error, ganti coach, paket habis, hapus akun, sesi coba, daftar tunggu kota, 2FA, perjanjian, foto kolam asli, semua formulir. Katalog = daftar blok contoh, bukan desain per halaman.

## Rencana bertahap (urutan; tiap tahap diverifikasi di browser HP+desktop, 0 perubahan logika uang/booking/login)
T0. Hadi putuskan: warna tombol utama (lime / charcoal) dan cakupan.
T1. Fondasi: kartu utama gelap ("hero") + segmen paket + chip peserta sebagai komponen bersama; mode terang & gelap.
T2. Dasbor 4 peran memakai komponen T1.
T3. Booking: tombol menempel + layar sukses; Paket: tombol beli menempel.
T4. Navigasi HP satu sumber (header logo+lonceng, tab bawah + Lainnya).
T5. Halaman lain per peran mengikuti pola (admin/pemilik kolam dicocokkan dengan halaman asli dulu).
T6. Sweeping UI penuh (semua halaman x 5 peran x HP/desktop) + ukur kecepatan sebelum/sesudah.

## Hasil pelajaran kode (4 Okt, fokus HP; dibaca dari kode, belum dijalankan)
Hadi: desktop desain ~ sama dengan yang ada; HP yang disukai. Kesimpulan: HP bisa diterapkan hampir seluruhnya di atas sistem yang ada; tidak perlu mengubah data/logika.
- Beranda member: kartu "Langkah berikutnya" + paket aktif + jadwal sudah ada (dashboard.tsx, member/dashboard/page.tsx); desain = kemasan lebih kuat. Data (sisaSesi, totalSesi, jatahCancel, expiredDate, peserta) sudah diambil. Chip peserta = penyaringan tampilan, tersedia datanya.
- Booking: sekarang SATU KETUK pada "Booking" per slot langsung membuat booking (booking-board.tsx handleBook). Desain = pilih slot lalu tombol menempel (dua langkah, lebih aman dari salah ketuk) + layar sukses + kode booking (API mengembalikan id; 6 karakter terakhir sudah dipakai di dasbor). Server tidak berubah. Kalender titik sudah ada (AvailabilityDatePicker, data /api/availability/available-dates); jadi inline. Perlu dipertahankan: peserta/kolam, batas tanggal paket, coach lain terlipat, tombol batal + Hubungi Admin, pemuatan 5 detik, keadaan kosong/gagal.
- Coach: tandai hadir sekarang dropdown di riwayat sesi (AttendanceToggle, kunci 24 jam). Dasbor hanya daftar + tautan. Desain = dua tombol di dasbor; wajib mempertahankan kunci 24 jam + konfirmasi admin.
- Shell HP: header (logo + menu pengguna) dan bilah bawah 4 menu + Lainnya sudah ada (nav-bar.tsx, mobile-bottom-nav.tsx). Lonceng di desain: TIDAK ADA data (tidak ada tabel notifikasi, hanya push). Menambah = fitur baru + migrasi; usul: tunda.
- Token: kartu gelap "hero" butuh token baru (lime penuh di mode gelap; kode punya brand-500 #9fcc1f/#bde85a, lime #C6FF3D hanya token tetap). Font: heading sudah Sora; isi Plus Jakarta Sans.
