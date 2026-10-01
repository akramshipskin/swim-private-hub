# Rancangan: harga dari coach (2 Okt 2026, draf, menunggu "lanjut" Hadi)

Keputusan yang mendasari ada di docs/KEPUTUSAN.md tanggal 2 Okt. Dikerjakan Opus (uang, booking, skema).

## Aturan (dari Hadi)
- Kolam memasang harga paket 4 dan 8 sesi = tiket masuk 1 coach + 1 peserta + 1 pendamping per sesi.
- Coach memasang harga paket 4 dan 8 sesi untuk jasanya; satu harga untuk semua kolam; perubahan langsung berlaku; paket yang sudah dibeli tidak ikut berubah.
- Harga per sesi = hasil bagi; tidak ada harga coret. Paket 8 boleh lebih murah per sesi (diskon ditanggung pembuat harga).
- Member bayar = harga kolam + harga coach + komisi SPH 6,5% (ditambahkan di atas). Bahasa ke pengguna: "biaya layanan SPH di bawah 7%". Sistem mengunci komisi maksimal 6,9%.
- Masa aktif: 4 sesi = 2 bulan, 8 sesi = 3 bulan.
- Eceran dan "beli 1 sesi di kolam lain" dihapus; sesi coba 1x per peserta tetap ada.
- Paket terikat ke 1 coach dan 1 kolam. Coach berhalangan = sesi dibatalkan coach, sesi kembali ke paket, dijadwal ulang (sudah ada).
- Ganti coach: member mengajukan dengan alasan (kecocokan/personal) -> admin memutuskan -> sisa sesi dihitung ulang dengan harga coach baru. Lebih murah = selisih jadi saldo member; lebih mahal = member tambah bayar.
- Saldo member: hanya untuk membeli paket berikutnya, tidak bisa dicairkan.
- PPh 0,5% dipotong dari bagian coach dan kolam sejak sekarang (PMK 37/2025); TERPISAH dari PPN 11% atas komisi SPH.
- Komisi afiliasi tetap 5% dari pembayaran paket pertama, dari bagian SPH.
- Milestone di jualan: target "biasanya X-Y sesi, tergantung pesertanya", tanpa jaminan.

## Contoh rupiah (paket 8 sesi)
- Kolam Rp480.000 (Rp60.000/sesi), coach Rp800.000 (Rp100.000/sesi) -> subtotal Rp1.280.000.
- Komisi 6,5% = Rp83.200 -> member bayar Rp1.363.200.
- Tiap sesi Hadir: kolam Rp60.000 - PPh Rp300 = Rp59.700; coach Rp100.000 - PPh Rp500 = Rp99.500; SPH Rp10.400 (bersih Rp9.369 + PPN Rp1.031); titipan PPh Rp800.
- Paket pertama lewat kode afiliasi: komisi afiliasi 5% x Rp1.363.200 = Rp68.160; komisi SPH total Rp83.200 (bersih Rp74.955) -> sisa SPH Rp6.795 sebelum biaya Midtrans.

## Perubahan sistem
### Tahap 1: harga coach, paket terikat coach, uang per sesi
1. Data: harga paket coach (4/8), paket menyimpan coach, harga kolam, harga coach, komisi, tarif PPh saat dibeli (snapshot). Template kolam dibatasi 4/8 sesi, masa aktif 60/90 hari.
2. Coach: halaman atur harga paket 4 dan 8.
3. Member: pilih kolam -> coach -> paket 4/8; rincian harga (kolam, coach, biaya layanan SPH); hemat paket 8 dibanding paket 4.
4. Checkout: harga dihitung server dari harga terkini, tidak dipercaya dari browser.
5. Booking: paket hanya bisa dibooking dengan coach paket itu di kolam paket itu.
6. Uang per sesi: paket baru dibagi per rupiah (kolam/coach/SPH) dari snapshot, bukan persen kolam; PPh 0,5% dicatat sebagai titipan pajak terpisah dari pendapatan SPH; pembalikan dan "tidak hadir" ikut. Paket lama tetap aturan lama.
7. Eceran disembunyikan (paket eceran lama tetap bisa dipakai sampai habis).
8. Admin: komisi per kolam maks 6,9%; laporan titipan PPh.
9. Audit buku besar dan tes balapan diperbarui.

### Tahap 2: saldo member + ganti coach
1. Saldo member dengan buku besar sendiri; dipakai saat checkout (sebagian atau penuh), dikembalikan bila pembayaran gagal/kedaluwarsa.
2. Pengajuan ganti coach (member) -> keputusan admin -> hitung ulang sisa sesi, selisih ke saldo atau tagihan tambah bayar.

### Tahap 3: teks
- Landing, halaman paket, Syarat & Ketentuan (dicek orang hukum), teks milestone.

## Belum diputuskan (lihat chat)
- Biaya Midtrans tidak boleh dibebankan ke member (aturan BI) -> SPH yang menanggung?
- PPh 0,5%: semua coach/kolam, atau kecuali yang menyerahkan surat pernyataan omzet < Rp500 juta?
- Tidak hadir: kolam tetap Rp0 dan sisanya SPH?
- Harga sesi coba.
- Perubahan harga kolam: tetap perlu persetujuan admin atau langsung seperti coach?
