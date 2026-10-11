# Sweeping halaman publik: jalani tugas nyata di HP (12 Okt 2026)

Cakupan otomatis 18 halaman publik x 3 lebar x terang/gelap sudah ada di docs/reviews/2026-10-11-sweeping-sistem-total.md. Sweeping ini menambah: ukuran di HP (375), jalani tugas (daftar member dengan isian salah, baca profil coach, buka formulir mitra), dan cek kontras tema gelap yang lebih ketat (rasio < 4.5). Versi jadi lokal, akun dummy, browser bawaan.

## Tinggi halaman di HP (layar)
Landing 26.9 (11 bagian jualan; layar pertama jelas: judul, tombol Daftar gratis dan Lihat kolam), Daftar Member 1.7, Login 1.0, Lupa Password 1.0, Daftar Coach 2.5, Daftar Kolam 2.7, Panduan 3.7, Profil Coach 1.4, S&K 9.5, Privasi 9.3, Perjanjian Coach 12.6, Brand Guideline 21.2. Tidak ada yang melebar ke samping.

## Temuan dan perbaikan
- Email di tiga formulir daftar (member, coach, kolam) berlabel "Opsional" tanpa alasan: orang yang mengosongkannya tidak tahu bahwa reset password lewat email jadi tidak bisa. Ditambah satu baris: "Isi email supaya kamu bisa membuat password baru sendiri kalau lupa."
- Tugas nyata daftar member dengan isian salah: peringatan salah ketik email muncul ("budi@gmial.com" -> "Maksudmu budi@gmail.com? Pakai Ini"), nomor HP salah ditolak dengan pesan jelas di dekat tombol Daftar. Tidak ada perbaikan.

## Tema gelap
Alat ukur kontras 15 halaman publik: tidak ada teks di bawah 4.5 kecuali tombol Daftar yang nonaktif (3.9) dan tombol Simpan di Brand Guideline (4.0, tombol nonaktif). Landing tampil alarm palsu (teks di atas foto dibaca alat sebagai latar putih) dan blok krem sengaja terang di tema gelap (rancangan landing); dilihat langsung di 4 tangkapan layar, terbaca.

## Belum dicek
- /kota, /pembayaran/sukses, /pembayaran/gagal, /ganti-password, /reset-password dengan token asli: butuh login atau pembayaran; tidak dijalani.
- Kecepatan muat landing di jaringan HP (tidak diukur di sesi ini).
- Daftar sampai berhasil (akun baru) tidak dilanjutkan agar tidak menambah akun dummy.
