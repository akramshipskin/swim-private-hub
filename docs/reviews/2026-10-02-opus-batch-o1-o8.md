# Batch Opus 2 Okt 2026 sore (O1-O5, O7, O8, statistik landing)

Model: Opus 5.5. Keputusan dasar: docs/KEPUTUSAN.md (2 Okt sore, jawaban 1-8 + "pertanyaan 1 = A").

## Yang dikerjakan
| # | Hasil | Bukti |
|---|---|---|
| O1 | Komisi afiliasi: pembayaran sejak 3 Okt 2026 00:00 WIB = 50% biaya layanan bersih (setelah PPN) paket berbayar pertama; sebelum itu tetap 5% dari jumlah dibayar. Sesi coba tidak dihitung dan tidak memicu komisi; pembayaran selisih ganti coach diabaikan; biaya layanan yang dipakai = saat paket dibeli (sebelum ganti coach). Teks kartu afiliasi, perjanjian, MOU ikut. | tes afiliasi (contoh Rp83.200 -> Rp37.477; Rp68.160 untuk paket lama) |
| O2 | Login: 3x per akun+jaringan, 10x per akun, 20x per jaringan (15 menit). Konfirmasi password di Keamanan tetap 3x. Teks Kebijakan Privasi disamakan. | tes balapan L1-L3d (termasuk 14 tebakan barengan dari 14 jaringan: tepat 10 dicek) |
| O3 | Perjanjian Coach + MOU Kolam: batal coach jadi pedoman longgar (tanpa 12 jam, tanpa 2x/4x), batas tanggung jawab SPH ke mitra (tanpa angka), keselamatan kolam MOU = S&K bagian 6, komisi afiliasi baru, peralihan paket lama (persen saat sesi ditandai, tanpa PPh), 12 bulan tidak dimulai ulang. Versi naik ke "2 Oktober 2026 rev.2" -> mitra diminta centang ulang. | dicek pemeriksa Opus kedua (rujukan butir tidak bergeser, cocok dengan kode) |
| O5 | 3 tes balapan baru: kolam dinonaktifkan saat 8 member booking (B1), paket baru saja habis (B2), coach paket terikat dinonaktifkan saat booking (B3). Aturan tidak diubah. | sebaran B1: 0-8 booking sempat masuk; B3: 0/1/4 sempat lalu dibatalkan; semua konsisten |
| O7 | Sisa pembulatan paket (maks Rp7) = pendapatan SPH: tetap di rekening SPH, tanpa baris buku besar terpisah (catatan kode + dokumen diperbaiki; sebelumnya komentar keliru). | dibaca dari kode |
| O8 | Pencairan lewat 7 hari kerja ditandai di halaman Pencairan + dasbor admin (libur nasional belum dihitung). Unduhan rekap PPh per mitra per bulan (xlsx) di halaman Bagi Hasil; mitra bebas potongan tidak masuk. | tes hari kerja + tes rekap |
| Q1 | Strip statistik landing hanya akun asli (akun/kolam demo tidak dihitung). | dicek dari kode + pemeriksa |

## Pemeriksa Opus kedua (konteks segar)
- Putaran 1: tidak ada temuan berat. 2 sedang + 1 ringan, semua diperbaiki: (1) komisi memakai biaya layanan setelah ganti coach, (2) rekap PPh memasukkan kolam bebas potongan bila coach di sesi yang sama dipotong, (3) sesi coba Hadir bisa memicu komisi. Catatan: rekap bulan koreksi bisa berisi angka minus (akurat menurut buku besar); kunci per jaringan bergantung pada header jaringan dari Vercel.
- Putaran 2 (perbaikan diperiksa ulang): aman, tidak ada regresi. Catatan ringan: bila catatan ganti coach paling awal tidak punya biaya layanan lama (data sebelum kolom ada), dipakai biaya layanan sekarang; fitur baru sejak 2 Okt, kemungkinan tidak ada datanya.

## Tidak dikerjakan terpisah
- O6 (periksa ulang dengan dijalankan: webhook, saldo member, ganti coach, paket lama, kedaluwarsa, audit buku besar): tidak dijalankan sebagai pekerjaan sendiri di batch ini. Tes balapan yang ada (166) mencakup sebagian; sisanya diusulkan masuk sweeping sistem berikutnya.
- Draf teks hukum di docs/legal belum disamakan dengan halaman rev.2 (halaman di aplikasi yang berlaku).

## Verifikasi
- Cek penulisan kode lulus; tes otomatis 783 lulus; tes balapan 166 lulus; versi jadi lulus. Tidak ada perubahan skema database (tanpa migrasi).
