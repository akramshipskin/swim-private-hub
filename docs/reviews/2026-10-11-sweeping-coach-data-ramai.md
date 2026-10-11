# Sweeping peran Coach dengan data ramai (11 Okt 2026 malam)

Cara: versi jadi lokal + akun coach dummy diisi 70 peserta, 215 sesi lampau, 120 jam kosong 30 hari ke depan, 40 penarikan, 25 komisi, 15 koreksi saldo. Diukur di lebar 375 (HP) dan 1280 (desktop), lalu jalani tugas nyata (tandai kehadiran, cari peserta, tarik saldo). Browser bawaan, bukan simulator iOS (simulator hanya bila Hadi menyuruh).

## Tinggi halaman di HP (dalam jumlah layar), sebelum -> sesudah
| Halaman | Sebelum | Sesudah | Perbaikan |
|---|---|---|---|
| Dashboard | 9.0 | 4.4 | "Sesi yang harus kamu sediakan" 5 teratas (member yang belum bisa booking dulu) + "+N lainnya"; "Penarikan ditahan" 3 nama + "dan N peserta lain" |
| Jadwal | 18.5 | 5.2 | 7 tanggal per tampilan + Tampilkan Lebih Banyak; Jadwal Coach Lain dilipat |
| Peserta | 14.2 | 4.8 | kolom cari (muncul bila peserta > 20) + 20 per tampilan |
| Riwayat Sesi | 59.4 | 3.8 | 7 tanggal per tampilan; kartu Belum Ditandai jadi saringan; angka di atas, penjelasan di bawah angka |
| Saldo | 18.1 | 4.9 | tiga riwayat (komisi, koreksi, penarikan) 5 terbaru + tombol |
| Harga, Kolam Saya, Keamanan, Milestone, Profil, Panduan, Notifikasi | 1.0-4.3 | tidak diubah | tidak ada masalah ditemukan |

Desktop 1280: semua halaman 2.5-3.8 layar, tanpa scroll ke samping.

## Belum dicek / catatan
- Tema gelap peran coach: belum dicek.
- Foto profil di header patah di lokal karena penyimpanan file lokal tidak aktif (bukan temuan).
- Pesan "Penarikan ditahan" saat tarik saldo menyebut SEMUA nama peserta yang tertinggal; dengan puluhan peserta jadi sangat panjang. Ada di kode penarikan (uang): tidak diubah, perlu Opus bila mau dirapikan.
- Saldo-view dipakai juga oleh pemilik kolam: perubahannya ikut berlaku di sana; dicek saat sweeping pemilik kolam.
