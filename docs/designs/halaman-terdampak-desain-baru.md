# Halaman yang kena gaya baru (Claude Design) -- 4 Okt 2026

Dasar: 68 file halaman di src/app (daftar dari kode). Satu basis kode untuk HP dan desktop: komponen baru responsif. HP = perubahan besar (header, bilah bawah, tombol menempel). Desktop = sidebar dan grid bento tetap; hanya komponen bersama yang ikut (kartu gelap, segmen paket, chip peserta, warna).

## Tingkat 1 -- otomatis kena lewat kerangka (shell): 45 halaman
Header HP baru (logo + lonceng), bilah bawah baru, radius/warna/kartu bersama. Satu perubahan di kerangka mengenai semuanya.
- Member (7): dashboard, booking, cari-coach, paket, riwayat, pembayaran, peserta
- Coach (7): dashboard, jadwal, kolam, harga, peserta, riwayat-sesi, saldo
- Pemilik kolam (7): dashboard, jadwal, coach, paket, info, laporan, saldo
- Admin (21): dashboard, afiliasi, booking-overview, coach-tanpa-jadwal, email, ganti-coach, kinerja-coach, kolam, komisi, koreksi-saldo, laporan-kehadiran, milestone, milestone/butir, paket, pembayaran, peminat-kota, pesan, testimoni, users, users/[userId], withdrawals
- Lintas peran dalam kerangka (3): /profil, /milestone/[dependentId], /pelatih/[coachId] (hanya saat login)

## Tingkat 2 -- isi ditata ulang sesuai desain: 12 halaman
- Member: dashboard (kartu gelap jadwal + varian paket + chip peserta), booking (kalender langsung, jam kartu besar, tombol menempel, layar sukses + kode), cari-coach (kartu kolam geser, daftar coach, kota tetap tampil), /pelatih/[coachId] (profil coach: paket + harga), paket (segmen sisa sesi, tombol beli menempel)
- Coach: dashboard (kartu saldo, Hadir/Tidak hadir di dasbor, jadwal terbuka), riwayat-sesi (tombol Hadir/Tidak hadir, kunci 24 jam tetap), saldo
- Pemilik kolam: dashboard (kartu saldo, dua angka, batang "Terisi minggu ini")
- Admin: dashboard (kartu ringkas), withdrawals (Setujui/Tolak: alur asli dijaga)
- Layar sukses seragam: /pembayaran/sukses (tampilan saja)
(Hitungan: member 5 + coach 3 + pemilik kolam 1 + admin 2 + sukses 1 = 12.)

## Tingkat 3 -- ikut kerangka + komponen bersama, isi tidak dirombak: 34 halaman
= 45 halaman Tingkat 1 dikurangi 11 yang ada di Tingkat 2 dan berada dalam kerangka (/pembayaran/sukses di Tingkat 2 tidak masuk 45 karena di luar kerangka). Contoh: member riwayat/pembayaran/peserta, coach jadwal/kolam/harga/peserta, pemilik kolam selain dasbor (6), admin selain dasbor dan withdrawals (19), profil, milestone.

## Tidak kena
Landing (/), masuk/daftar, daftar-coach, daftar-kolam, kota, perjanjian, ganti-password, keamanan, halaman legal (4), panduan, brandguideline, /pembayaran/gagal, 404. (Sudah dirombak 3 Okt atau di luar permintaan.)

## Fitur baru yang menyertai
- Lonceng notifikasi dalam aplikasi: tabel baru (migrasi), diisi dari satu pintu (push.ts / notify.ts: ±30 titik kirim sudah ada), tanda dibaca, ketuk = buka halaman terkait.
- Booking dua langkah. Server dan aturan booking tidak berubah.
