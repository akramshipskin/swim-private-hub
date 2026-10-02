# Aturan bisnis SPH saat ini (satu sumber, 2 Okt 2026)

Dibuat Claude (Sonnet) dari keputusan Hadi di docs/KEPUTUSAN.md, rancangan docs/designs/harga-dari-coach.md, dan angka di kode (src/lib/policy.ts, src/lib/pricing.ts). Bila dokumen lain bertentangan dengan ini, ini yang berlaku; bila ini bertentangan dengan kode, laporkan ke Hadi. Bagian uang BELUM diperiksa Opus (dicek dari kode, belum dijalankan ulang).

## Harga dan paket
- Kolam memasang harga tiket paket 4 dan 8 sesi (tiket masuk 1 coach + 1 peserta + 1 pendamping per sesi). Coach memasang harga jasa paket 4 dan 8 sesi, satu harga untuk semua kolam. Perubahan harga berlaku untuk pembelian berikutnya.
- Member bayar = harga kolam + harga coach + biaya layanan SPH di atasnya (6,5%; sistem mengunci maksimal 6,9%; ke pengguna disebut "di bawah 7%").
- Paket 4 sesi berlaku 60 hari, batal sendiri maksimal 2x; paket 8 sesi 90 hari, batal 4x. Batal sendiri paling lambat 2 jam sebelum jadwal.
- Sesi coba: 1x per peserta (belum pernah punya paket), berlaku 7 hari, tidak bisa dibatalkan sendiri. Eceran dan "beli 1 sesi di kolam lain" sudah dihapus. Paket terikat ke 1 coach dan 1 kolam.
- Ganti coach: member mengajukan, admin memutuskan; sisa sesi dihitung ulang dengan harga coach baru. Lebih murah = selisih jadi saldo member; lebih mahal = member tambah bayar. Saldo member hanya untuk membeli paket berikutnya, tidak bisa dicairkan.

## Uang per sesi Hadir
- Nilai satu sesi = bayar paket dibagi jumlah sesi (dibulatkan ke bawah). Kolam dan coach menerima harga masing-masing dibagi jumlah sesi; sisanya (biaya layanan + sisa pembulatan, maks Rp7) milik SPH (keputusan Hadi 2 Okt: sisa pembulatan = pendapatan SPH).
- PPh final 0,5% dipotong dari bagian coach dan kolam, disetor SPH atas nama mereka (titipan, bukan pendapatan SPH). Terpisah dari PPN 11% yang termasuk di dalam komisi/biaya layanan SPH.
- Contoh paket 8 sesi: kolam Rp480.000 + coach Rp800.000, biaya layanan 6,5% Rp83.200, member bayar Rp1.363.200. Tiap sesi Hadir: kolam Rp60.000 menjadi Rp59.700 setelah PPh Rp300; coach Rp100.000 menjadi Rp99.500; SPH Rp10.400 (sudah termasuk PPN); titipan PPh Rp800.
- Peserta sudah booking tapi tidak hadir: coach 50% dari bagiannya, kolam Rp0, sisanya SPH. Coach menandai kehadiran paling lambat 24 jam setelah sesi selesai (lewat itu hanya admin); member bisa melaporkan "Tidak Hadir" yang salah dalam 3 hari. Uang SPH ditahan 3 hari sebelum boleh ditarik.
- Pencairan minimal Rp50.000, diproses manual admin; target paling lambat 7 hari kerja (penanda otomatis belum ada, akan dibuat di pekerjaan Opus O8).
- Catatan perkembangan (milestone) wajib tiap 2 sesi Hadir per peserta; pencairan coach ditahan bila terlewat (berlaku untuk sesi sejak 1 Okt 2026).

## Afiliasi
- BERLAKU DI KODE SEKARANG: 5% dari pembayaran paket pertama member yang mendaftar dengan kode coach/kolam, sekali per member, dari bagian SPH, cair setelah sesi pertama Hadir + 3 hari.
- SUDAH DIPUTUSKAN HADI (2 Okt), BELUM DIKERJAKAN (Opus O1): 50% dari biaya layanan bersih (setelah PPN), hanya untuk paket pertama berbayar (sesi coba tidak dihitung); paket lama tetap 5%.

## Login dan perjanjian mitra
- Berlaku sekarang: 3 kali salah mengunci akun 15 menit. Diputuskan, belum dikerjakan (Opus O2): 3x per akun+jaringan, batas per akun 10x, per jaringan 20x, per 15 menit.
- Coach dan pemilik kolam wajib mencentang Perjanjian Kemitraan Coach / MOU Kolam (versi 2 Oktober 2026) sebelum memakai fitur utama. Teksnya masih akan direvisi (Opus O3); berlaku 12 bulan, diperpanjang otomatis, tidak dimulai ulang saat versi teks baru.

## Tidak berlaku lagi (jangan jadi acuan)
- Bagi hasil persen tetap 40/50/10 per kolam dan harga paket yang ditentukan admin lewat template (dokumen lama: marketplace-pivot, simulasi-pendapatan-kolam).
