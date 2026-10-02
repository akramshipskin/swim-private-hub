# Aturan bisnis SPH saat ini (satu sumber, 2 Okt 2026)

Dibuat Claude (Sonnet) dari keputusan Hadi di docs/KEPUTUSAN.md, rancangan docs/designs/harga-dari-coach.md, dan angka di kode (src/lib/policy.ts, src/lib/pricing.ts). Bila dokumen lain bertentangan dengan ini, ini yang berlaku; bila ini bertentangan dengan kode, laporkan ke Hadi. Diperbarui Opus 2 Okt sore setelah O1, O2, O3, O7, O8.

## Harga dan paket
- Kolam memasang harga tiket paket 4 dan 8 sesi (tiket masuk 1 coach + 1 peserta + 1 pendamping per sesi). Coach memasang harga jasa paket 4 dan 8 sesi, satu harga untuk semua kolam. Perubahan harga berlaku untuk pembelian berikutnya.
- Member bayar = harga kolam + harga coach + biaya layanan SPH di atasnya (6,5%; sistem mengunci maksimal 6,9%; ke pengguna disebut "di bawah 7%").
- Paket 4 sesi berlaku 60 hari, batal sendiri maksimal 2x; paket 8 sesi 90 hari, batal 4x. Batal sendiri paling lambat 2 jam sebelum jadwal.
- Sesi coba: 1x per peserta (belum pernah punya paket), berlaku 7 hari, tidak bisa dibatalkan sendiri. Eceran dan "beli 1 sesi di kolam lain" sudah dihapus. Paket terikat ke 1 coach dan 1 kolam.
- Ganti coach: member mengajukan, admin memutuskan; sisa sesi dihitung ulang dengan harga coach baru. Lebih murah = selisih jadi saldo member; lebih mahal = member tambah bayar. Saldo member hanya untuk membeli paket berikutnya, tidak bisa dicairkan.

## Uang per sesi Hadir
- Nilai satu sesi = bayar paket dibagi jumlah sesi (dibulatkan ke bawah). Kolam dan coach menerima harga masing-masing dibagi jumlah sesi; sisanya (biaya layanan + sisa pembulatan, maks Rp7) milik SPH (keputusan Hadi 2 Okt: sisa pembulatan = pendapatan SPH; uangnya tetap di rekening SPH, tidak dibuat baris buku besar terpisah).
- PPh final 0,5% dipotong dari bagian coach dan kolam, disetor SPH atas nama mereka (titipan, bukan pendapatan SPH). Terpisah dari PPN 11% yang termasuk di dalam komisi/biaya layanan SPH.
- Contoh paket 8 sesi: kolam Rp480.000 + coach Rp800.000, biaya layanan 6,5% Rp83.200, member bayar Rp1.363.200. Tiap sesi Hadir: kolam Rp60.000 menjadi Rp59.700 setelah PPh Rp300; coach Rp100.000 menjadi Rp99.500; SPH Rp10.400 (sudah termasuk PPN); titipan PPh Rp800.
- Peserta sudah booking tapi tidak hadir: coach 50% dari bagiannya, kolam Rp0, sisanya SPH. Coach menandai kehadiran paling lambat 24 jam setelah sesi selesai (lewat itu hanya admin); member bisa melaporkan "Tidak Hadir" yang salah dalam 3 hari. Uang SPH ditahan 3 hari sebelum boleh ditarik.
- Pencairan minimal Rp50.000, diproses manual admin, paling lambat 7 hari kerja.
- Catatan perkembangan (milestone) wajib tiap 2 sesi Hadir per peserta; pencairan coach ditahan bila terlewat (berlaku untuk sesi sejak 1 Okt 2026).

## Afiliasi
- Sekali per member yang mendaftar dengan kode coach/kolam, dari bagian SPH, cair setelah sesi Hadir pertama dari paket berbayar + 3 hari.
- 50% dari biaya layanan SPH bersih (setelah PPN 11%) pada paket berbayar pertama; sesi coba dan pembayaran selisih ganti coach tidak dihitung. Contoh paket 8: biaya layanan Rp83.200 -> bersih Rp74.955 -> komisi Rp37.477.
- Aturan lama 5% dari jumlah dibayar dihapus (2 Okt malam); komisi yang sudah tercatat tidak dihitung ulang. Paket pertama model lama (tanpa biaya layanan tersimpan) tidak menghasilkan komisi.

## Login dan perjanjian mitra
- Salah password ditahan 15 menit: 3x dari jaringan yang sama untuk satu akun, 10x dari semua jaringan untuk satu akun, 20x per jaringan untuk semua akun. Konfirmasi password di menu Keamanan tetap 3x.
- Coach dan pemilik kolam wajib mencentang Perjanjian Kemitraan Coach / MOU Kolam (versi "2 Oktober 2026 rev.2") sebelum memakai fitur utama. Batal oleh coach: pedoman longgar (peringatan, admin menilai, sakit/darurat tidak dihitung); berlaku 12 bulan sejak pertama disetujui, tidak dimulai ulang saat versi baru.
- Pencairan yang lewat 7 hari kerja ditandai di halaman Pencairan dan dasbor admin (libur nasional belum dihitung). Rekap PPh per mitra per bulan bisa diunduh dari halaman Bagi Hasil.

## Paket pemberian admin
- Admin memberi paket gratis lewat Pengguna > Berikan Paket: peserta + kolam + coach + 4/8 sesi. Harga kolam & coach saat itu disalin (masa berlaku dan jatah batal sama dengan paket beli), tanpa pembayaran, jadi sesinya tidak membagi uang ke kolam, coach, atau SPH. Paket ini tidak bisa diganti coach lewat pengajuan (supaya selisih harga tidak jadi saldo uang member); admin memberi paket baru saja.

## Tidak berlaku lagi (jangan jadi acuan)
- Model lama DIHAPUS dari kode (Hadi 2 Okt malam, #9): bagi hasil persen per kolam (commissionPercent/coachSharePercent), katalog/template paket, usulan paket dari pemilik kolam, beli 1 sesi eceran, impor Excel member, komisi afiliasi 5%. Kolom database lamanya belum dihapus (menyusul). Riwayat buku besar & saldo model lama tetap, tidak dihitung ulang; paket lama yang masih aktif ditandai Berakhir lewat skrip akhiri-paket-lama. Tandai hadir paket berbayar model lama ditolak sistem (koreksi lewat admin).
- Dokumen lama marketplace-pivot dan simulasi-pendapatan-kolam.
