# Analisis: alur di desain Claude Design vs aplikasi sekarang (4 Okt 2026)

Dasar: prototipe iPhone (Swim Private Hub App) dibaca penuh, Katalog Halaman dicek untuk dasbor, dibandingkan dengan kode asli (booking-board, pelatih, withdrawal-row, riwayat-sesi/actions, nav-links, dashboard). Dicek dari kode, belum dijalankan. Batasan Hadi 4 Okt: suka tampilannya, desktop dasbor pakai gaya bento, JANGAN ubah alur yang ada.

## Desktop bento
Kode sudah bento: grid 6 kolom (BentoCard) di dasbor member, coach, pemilik kolam, admin. Katalog hanya daftar blok contoh dari judul halaman, bukan rancangan bento. Jadi: tata letak bento tetap, yang diganti gaya (kartu gelap besar, radius, segmen paket, warna). Tata letak bento per peran perlu kita rancang sendiri.

## Alur yang BERUBAH bila desain diikuti persis
| # | Layar | Sekarang | Di desain | Risiko / sikap |
|---|---|---|---|---|
| 1 | Booking | 1 ketukan "Booking" di slot langsung membuat booking | Pilih tanggal + jam, lalu tombol menempel | Alur berubah (lebih aman dari salah ketuk). Butuh keputusan |
| 2 | Booking selesai | Pesan hijau, tetap di halaman | Layar sukses penuh + kode + "Ke beranda" | Alur berubah kecil |
| 3 | Booking: cara memilih | Pilih peserta + kolam, semua coach di kolam terlihat, coach lain terlipat | Satu coach, dipilih lewat "Ganti" ke Cari Coach | Pemilih kolam & coach lain hilang bila diikuti; harus dipertahankan |
| 4 | Beli paket | Menu Paket, bagian "Beli paket baru", bayar Midtrans | TIDAK ADA tombol beli di mana pun; profil coach hanya daftar harga | Member tak tahu cara beli; wajib tambah jalan ke Paket |
| 5 | Menu bawah member | 4 menu + Lainnya | 3 tab saja | Paket, Riwayat, Peserta, Riwayat Bayar kehilangan tempat; pertahankan Lainnya |
| 6 | Beranda member | Semua peserta tampil sekaligus; kartu "Langkah berikutnya" punya banyak keadaan | Chip peserta (satu per satu); hanya 2 keadaan | Pertahankan keadaan lain (paket habis/kedaluwarsa, belum punya paket, hapus akun, dll) |
| 7 | Tandai hadir (coach) | Di Riwayat Sesi; bisa diubah ulang (pendapatan dibalik); kunci 24 jam | Dua tombol di dasbor; hasil final, tulisan "saldo bertambah" | Wajib tetap bisa diubah, kunci 24 jam tetap; "saldo bertambah" bisa menyesatkan (ada penahanan) |
| 8 | Pencairan admin | Salin rekening, proses/tandai dibayar manual (ada konfirmasi), tolak, tanda lewat 7 hari kerja | Hanya Setujui / Tolak | Menyentuh uang: tampilan saja, alur asli utuh |
| 9 | Cairkan saldo (coach, pemilik kolam) | Lewat halaman Saldo (rekening, syarat) | Tombol langsung di dasbor | Boleh hanya bila tombolnya membuka halaman Saldo yang ada |
| 10 | Lonceng | Tidak ada (tak ada tabel notifikasi, hanya push) | Ikon lonceng di header | Fitur baru + migrasi, bukan sekadar tampilan |

## Tidak berubah alur (aman)
Kalender bertitik, kartu jadwal berikutnya, segmen paket, profil coach, Cari Coach, pemilih tema, token warna (tombol utama tetap charcoal, keputusan Hadi 4 Okt).

## Data contoh salah (jangan disalin)
Paket 30/60 hari (aturan: 60/90), jatah batal 1 (aturan: 2x untuk 4 sesi, 4x untuk 8 sesi), sapaan "Ibu Rina", Cari Coach tanpa kota, saldo "bertambah setiap sesi Hadir".

## Tidak ada di desain
Keadaan memuat/kosong/error, ganti coach, paket habis, hapus akun, sesi coba, daftar tunggu kota, 2FA, perjanjian, semua formulir.
