# Sweeping peran Pemilik Kolam dengan data ramai (12 Okt 2026)

Cara: versi jadi lokal + kolam dummy diisi 44 coach, ±54 sesi per hari, 60 penarikan, 24 koreksi saldo. Diukur di lebar 375 (HP) dan 1280 (desktop). Browser bawaan, bukan simulator.

## Tinggi halaman di HP (dalam layar), sebelum -> sesudah
| Halaman | Sebelum | Sesudah | Perbaikan |
|---|---|---|---|
| Coach di Kolam | 10.3 | 3.5 | kolom cari (muncul bila coach > 12) + 12 per tampilan |
| Jadwal Kolam | 6.8 | 6.4 | jam tanpa les diringkas satu baris (dulu satu baris per jam); sisanya isi nyata 54 sesi/hari |
| Laporan | (tak terukur: data seed tanpa pembayaran) | 1.7 pada rentang 6 bulan | daftar sesi 20 per tampilan + tombol; ringkasan di atas tetap menghitung semua sesi |
| Saldo | tidak diukur di kolam (komponen sama dengan coach: 18.1) | 4.3 | riwayat koreksi dan penarikan 5 terbaru + tombol (perubahan komponen bersama dengan coach) |
| Dashboard, Paket, Info Kolam | 1.0-3.1 | tidak diubah | tidak ada masalah ditemukan |

Desktop 1280: Jadwal 3.4, Coach 2.0, Saldo 3.2, Laporan 1.0, Dashboard 1.8 layar, tanpa scroll ke samping.

## Belum dicek / catatan
- Laporan dengan ratusan sesi berbayar: data seed tidak punya pembayaran sukses, jadi hanya kodenya yang dicek (potongan daftar 20; angka total tidak berubah karena dihitung sebelum dipotong). Dicek ulang bila ada data berbayar.
- Jadwal Kolam tidak punya kolom cari kode booking (dipakai di loket); usulan, bukan perbaikan.
- Tema gelap tiga peran: belum dicek.
