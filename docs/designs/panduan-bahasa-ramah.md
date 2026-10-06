# Panduan bahasa aplikasi yang ramah (DRAF, menunggu pilihan Hadi 6 Okt 2026)

Masalah (Hadi 6 Okt): teks aplikasi terlalu kaku ("Butir", "Pengguna", "Tipe"), tapi jangan terlalu santai (kata "diajar" ditolak). Tombol dan label tetap Title Case; yang diubah adalah pilihan katanya.

## Nada
- Seperti staf yang sopan dan hangat, bukan formulir kantor, bukan teman nongkrong.
- Sapa dengan "kamu". Kalimat pendek. Satu kalimat, satu maksud.
- Tulis akibatnya untuk orang itu, bukan istilah sistemnya: "Jadwalmu sudah aman" bukan "Booking berhasil disimpan".
- Pakai "sudah", "tidak", "saja". Jangan "aja", "gak", "udah", "yuk", "diajar".
- Pesan salah: jelaskan apa yang terjadi + apa yang bisa dilakukan, tanpa menyalahkan. Contoh: "Nomor HP ini sudah terdaftar. Coba masuk, atau pakai nomor lain." bukan "Nomor HP sudah digunakan."
- Teks hukum (Syarat & Ketentuan, Kebijakan, Perjanjian, MOU) TIDAK diubah.

## Tabel kata: kaku → luwes (Hadi pilih huruf A/B per baris; usulan Claude ditandai *)
| # | Sekarang (kaku) | Pilihan A | Pilihan B | Contoh sekarang → sesudah |
|---|---|---|---|---|
| 1 | Butir (milestone) | Keterampilan* | Kemampuan | "Butir yang tercapai hari ini" → "Keterampilan yang dikuasai hari ini" |
| 2 | Pengguna (menu admin) | Akun* | Orang | Menu "Pengguna" → "Akun" |
| 3 | Tipe (form tambah peserta) | Untuk Siapa* | Jenis | "Tipe: Anak / Diri sendiri" → "Untuk Siapa: Anak / Diri Sendiri" |
| 4 | Pengajuan / Permintaan | Permohonan | Minta* | "Batalkan Pengajuan" → "Batalkan Permintaan"; "Permintaan Hapus Akun" → "Minta Hapus Akun" |
| 5 | Kedaluwarsa | Berakhir* | Habis Masa | Status paket "Kedaluwarsa" → "Berakhir"; "Pembayaran Kedaluwarsa" → "Waktu Bayar Habis" |
| 6 | Saldo Mengendap (admin) | Saldo Tertahan* | Saldo Belum Cair | |
| 7 | Kota Domisili | Kota Tempat Tinggal* | Kota Kamu | "Kota domisili" → "Kota Tempat Tinggal" |
| 8 | (Opsional) | (Boleh Dikosongkan)* | (Tidak Wajib) | "Email (Opsional)" → "Email (Boleh Dikosongkan)" |
| 9 | Konfirmasi Password Baru | Ulangi Password Baru* | Tulis Lagi Password Baru | |
| 10 | Menunggu Persetujuan | Menunggu Dicek Admin* | Sedang Ditinjau | |
| 11 | Pencairan Saldo (coach/kolam) | Tarik Saldo | Cairkan Saldo* | tombol "Ajukan Pencairan" → "Cairkan Saldo" |
| 12 | Rekening Tujuan Pencairan | Rekening Penerima* | Rekening untuk Cairkan Saldo | |
| 13 | Tandai Hadir / Tidak Hadir | tetap* | Sudah Datang / Tidak Datang | |
| 14 | Perlu Tindakan (dasbor admin) | Perlu Kamu Cek* | Yang Perlu Dikerjakan | |
| 15 | Tambah Slot (coach) | Buka Jam Kosong* | Tambah Jam | "Slot" jarang dimengerti orang tua |
| 16 | Jatah Batal | Sisa Batal Gratis | tetap* | |
| 17 | Nonaktifkan / Aktifkan (admin) | Matikan / Nyalakan | tetap* | |
| 18 | Peserta | tetap* | Murid (TIDAK, ditolak di MESSAGING) | |

## Contoh kalimat sebelum → sesudah (usulan)
- "Pembayaran berhasil. Paket sudah aktif." → "Pembayaran masuk. Paketmu sudah aktif, silakan pilih jadwal."
- "Anda belum memiliki paket aktif." → "Kamu belum punya paket aktif. Pilih paket dulu untuk mulai booking."
- "Terjadi kesalahan. Silakan coba lagi." → "Ada yang belum berhasil. Coba lagi sebentar lagi, atau hubungi admin lewat chat."
- "Data berhasil disimpan." → "Sudah tersimpan."
- "Konfirmasi pembatalan sesi?" → "Batalkan sesi ini?"
- "Peserta ini sudah dinonaktifkan." → "Peserta ini sedang tidak aktif. Aktifkan lagi di menu Peserta kalau mau lanjut les."

## Cara kerja setelah Hadi memilih
1. Claude memperbarui tabel istilah di brand-kit/MESSAGING.md bagian 4 sesuai pilihan.
2. Claude mengganti kata di semua halaman, semua peran (daftar dari docs/cakupan-halaman.md), kecuali teks hukum.
3. Hasil dilaporkan sebagai tabel halaman x peran: berapa potongan diganti, mana yang sengaja dibiarkan.
4. Cek penulisan kode, tes otomatis, versi jadi; kirim; cek di situs.
