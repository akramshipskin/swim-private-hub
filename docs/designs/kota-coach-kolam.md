# Rancangan: kota, coach memilih kolam, kapasitas kolam, tanggungan sesi coach (3 Okt 2026)

Status: DISETUJUI Hadi 3 Okt. Dikerjakan bertahap (bagian 7). Sumber keputusan: docs/KEPUTUSAN.md entri "3 Okt" (brainstorm penautan coach-kolam). Ditulis Claude (Opus).

## 1. Tujuan
Aplikasi siap dipakai di banyak kota tanpa admin menautkan coach ke kolam satu per satu, dan member terlindungi dari coach yang tidak membuka jadwal setelah paketnya dibeli.

## 2. Keputusan Hadi yang dipakai
1. Kota (daftar tetap, kota + kabupaten digabung): Jakarta, Depok, Bekasi, Bogor, Tangerang, Bandung, Cianjur, Sukabumi, Surabaya, Malang.
2. Kolam daftar: alamat lengkap, kota, jam buka, harga paket 4/8 sesi, kapasitas harian khusus pelanggan SPH (bisa diubah kapan saja).
3. Coach daftar: kota domisili + harga paket. Setelah disetujui, coach memilih sendiri kolam di kotanya; kolam kota lain boleh dengan peringatan.
4. Kolam tidak menyetujui coach (kolam hanya menyediakan tempat; sesuai MOU "tidak dapat menolak coach").
5. Member daftar dengan kota; disuguhi kolam & coach sekotanya; kota lain boleh dengan peringatan.
6. Paket dirakit sistem (harga kolam + harga coach + biaya layanan) hanya untuk pasangan coach-kolam yang dipilih coach.
7. Alur booking tetap: coach buka jam -> member beli paket -> member pilih jam.
8. Coach tampil untuk dibeli bila punya minimal 4 jam kosong dalam 14 hari ke depan; kartunya menulis "Jadwal terdekat".
9. Dasbor coach: "Sesi yang harus kamu sediakan".
10. Peringatan ke coach mulai hari ke-2 tanpa jam yang bisa dibooking member, diulang tiap hari. Hari ke-10: admin + member diberi tahu, member boleh ganti coach gratis ke coach dengan harga sama atau lebih murah (lebih murah = selisih ke saldo member; lebih mahal = lewat persetujuan admin seperti sekarang). Coach dapat catatan pelanggaran; berulang = nonaktif (masuk perjanjian rev.3).
11. Paket TIDAK diperpanjang saat coach diam (cegah member ditarik keluar; solusinya ganti coach).
12. Kapasitas kolam per HARI, tanpa batas per jam.
13. Kota tanpa pasangan coach-kolam: layar "belum tersedia" + daftar tunggu + saran kota terdekat + angka peminat untuk admin.
14. Uji pulih backup: tombol GitHub otomatis bulanan saja; skrip laptop tidak dibuat.

## 3. Alur per peran

### Kolam (pemilik)
- Daftar: + pilihan kota, alamat lengkap (jalan, kelurahan/kecamatan, tautan Google Maps opsional), harga paket 4/8 sesi (kelipatan Rp1.000, aturan sama dengan menu Paket), kapasitas harian ("berapa sesi pelanggan SPH yang masih bisa kolam terima per hari; 1 sesi = 1 coach + 1 peserta + 1 pendamping; bisa diubah kapan saja").
- Info Kolam: kota & kapasitas bisa diubah. Kapasitas diturunkan = booking yang sudah ada tetap, booking baru ditolak bila hari itu penuh.
- Jadwal Kolam: tampil "N dari kapasitas M terpakai" per hari.

### Coach
- Daftar: + kota domisili, harga paket 4/8 sesi.
- Menu baru "Kolam Saya": daftar kolam aktif di kotanya (nama, alamat, jam buka, harga kolam, kapasitas). Tombol Pilih / Lepas. Tab "Kota lain" dengan peringatan "Kolam ini di luar kota domisili kamu. Pastikan kamu sanggup datang ke sana tiap jadwal."
- Lepas kolam ditolak bila masih ada member aktif berpaket coach ini di kolam itu.
- Dasbor: kartu "Sesi yang harus kamu sediakan" = jumlah sesi member aktif yang belum terjadwal, rinci per member (nama, kolam, sisa sesi belum terjadwal, paket berakhir N hari lagi). Merah bila ada member tanpa jam yang bisa dibooking.

### Member
- Daftar: + kota. Member lama tanpa kota diminta mengisi sekali saat masuk.
- Beli paket: pilih kota (bawaan kota sendiri) -> kolam -> coach (hanya yang lolos syarat 4 jam/14 hari, tampil "Jadwal terdekat") -> paket. Pilih kota lain = peringatan "Kolam di kota ini jauh dari domisili kamu."
- Kota tanpa pasangan: "Belum tersedia di <kota>", tombol "Kabari saya", saran kota terdekat (peta tetap: Depok/Bekasi/Bogor/Tangerang -> Jakarta, Cianjur/Sukabumi -> Bogor, Malang -> Surabaya, sebaliknya).
- Hari ke-10 coach diam: kartu "Coach kamu belum membuka jadwal. Paket tetap berlaku sampai <tanggal>. Ganti coach gratis sekarang supaya sesimu tidak hangus." + tombol ke pilihan coach yang memenuhi syarat.

### Admin
- Kelola Kolam: tautan coach-kolam tetap bisa ditambah/dicabut admin (pengganti, bukan jalur utama).
- Halaman baru "Peminat per kota": jumlah daftar tunggu per kota.
- Notifikasi hari ke-10 + daftar "Coach tanpa jadwal" (coach, member terdampak, hari ke-berapa, jumlah pelanggaran).

### Landing
- Kartu kolam menampilkan kota; saringan kota bila kolam > 1 kota. (Teks landing lain tidak diubah tanpa izin.)

## 4. Aturan yang dijaga server (bukan tampilan)
- Booking: tolak bila jumlah booking SPH aktif di kolam itu pada tanggal itu (WIB) sudah = kapasitas. Dicek di transaksi yang sama dengan klaim slot, dengan kunci per kolam-tanggal supaya dua booking bersamaan tidak sama-sama lolos.
- Buat paket/checkout: cek ulang syarat 4 jam/14 hari dan pasangan coach-kolam masih ada (tampilan bisa basi).
- Buka slot: coach hanya di kolam yang ia pilih (sama seperti sekarang, sumbernya tautan coach-kolam).
- "Tanpa jam yang bisa dibooking" untuk satu paket = paket aktif, ada sisa sesi belum terjadwal, dan tidak ada slot kosong coach itu di kolam itu antara sekarang dan paket berakhir.
- Pemeriksa harian (06.00 WIB): menandai paket yang memenuhi kondisi di atas (tanggal mulai disimpan), kirim peringatan coach hari ke-2 dst, hari ke-10 kirim ke admin + member, buka hak ganti coach gratis, catat 1 pelanggaran per kejadian. Kondisi hilang (coach buka jam) = tanda dihapus. Jalan lewat penjadwal Vercel (Vercel Cron) dengan kunci rahasia.
- Ganti coach gratis: hanya untuk paket yang sudah ditandai hari ke-10; coach tujuan lolos syarat tampil; harga sama/lebih murah dihitung pakai rumus ganti coach yang ada (sisa sesi x harga baru). Lebih mahal = jalur pengajuan biasa (admin).

## 5. Perubahan data (migrasi baru, semua kolom boleh kosong, tidak menghapus data)
- Kolam: kota, kapasitas harian.
- Coach (profil): kota.
- Member (akun): kota.
- Paket: tanggal mulai tanpa jam (penanda pemeriksa harian), tanggal hak ganti coach gratis.
- Tabel baru: daftar tunggu kota (akun, kota, tanggal, sudah dikabari); catatan pelanggaran coach (coach, paket, tanggal).
- Daftar kota disimpan di kode (bukan tabel) karena tetap.
- Data dummy production: kota diisi lewat skrip isi-harga-dummy (Hadi).

## 6. Teks hukum (draf rev.3, disusun Claude, dikirim Hadi ke orang hukum)
- Perjanjian coach: coach memilih sendiri kolam (ganti "dikaitkan oleh SPH"); kewajiban menyediakan jadwal bagi member aktif; peringatan hari ke-2, pelanggaran hari ke-10, nonaktif bila berulang; hapus komisi 5% & pasal peralihan.
- MOU kolam: kapasitas harian dari SPH; coach memilih kolam sendiri; hapus 5% & pasal peralihan.
- S&K / Kebijakan Pengembalian: hak ganti coach gratis saat coach tidak membuka jadwal 10 hari; paket tidak diperpanjang.

## 7. Tahapan kerja (semua Opus kecuali disebut)
1. Data kota + daftar 3 peran + member lama isi kota + coach "Kolam Saya" + saringan kota di beli paket + daftar tunggu.
2. Kapasitas harian kolam (daftar, Info Kolam, booking ditolak bila penuh, tes balapan).
3. Syarat 4 jam/14 hari + "Jadwal terdekat".
4. Tanggungan sesi + pemeriksa harian + ganti coach gratis + pelanggaran (tes balapan).
5. Teks layar, peringatan, landing kota (Sonnet).
6. Draf rev.3 (Sonnet untuk teks, Opus memeriksa kesesuaian dengan kode).
Tiap tahap: tes otomatis, tes balapan, Opus kedua memeriksa. Migrasi dijalankan Hadi di production sebelum kirim ke GitHub.

## 8. Keputusan tambahan (Hadi 3 Okt, rancangan DISETUJUI)
1. Ganti coach gratis: coach di kolam sama ATAU kolam lain sekota, selama total harga sisa sesi (kolam + coach) sama/lebih murah.
2. Kolam lama tanpa kapasitas: tetap bisa dibooking tanpa batas + spanduk pengingat ke pemilik.
3. Coach dinonaktifkan setelah 3 pelanggaran dalam 6 bulan (admin tetap menilai).
4. Coach lama tanpa kota diminta mengisi saat masuk (sama dengan member).
