# Uji semua (12 Okt 2026 dini hari, mode TIDUR)

Versi jadi lokal + database lokal + akun dummy. Tidak ada yang dijalankan ke production.

| Uji | Hasil |
|---|---|
| Cek kesalahan penulisan kode (tsc) | lulus |
| Pemeriksa gaya kode (lint) | 0 error, 4 peringatan lama (impor tak terpakai) |
| Tes otomatis (vitest) | 117 berkas, 953 tes lulus |
| Tes balapan permintaan bersamaan (race, Postgres lokal) | 23 berkas, 236 tes lulus |
| Uji alur penuh lewat browser (daftar member, bayar dari saldo, booking, batal, coach tandai Hadir, saldo coach) di database kosong | semua lulus (11 langkah) |
| Audit buku besar uang (baca saja) di database hasil uji alur penuh | "Semua cocok" (1 dompet kolam, 1 coach, 2 booking, PPN dan PPh cocok) |
| Hak akses: 70 halaman x 5 keadaan (tanpa login, admin, coach, kolam, member) dan 20 rute API x 5 | 350 + 100 pemeriksaan: 0 halaman bocor ke peran lain, 0 error server. Rute admin bagi non-admin dialihkan ke /login (bukan data). Webhook pembayaran selalu 200 (aturan Midtrans) dan menolak payload tanpa tanda tangan |
| Formulir (isi kosong dan isi panjang + karakter khusus, validasi browser dimatikan) 5 kelompok | 493 formulir ditemui, 190 diuji, 303 dilewati (hanya isian tersembunyi atau tombol berbahaya: Hapus, Batalkan, dst). 0 error server, 0 error JavaScript, 0 teks berbahaya lolos |
| Reset password dengan tautan asli (lokal): sandi tak sama ditolak, sandi baru berlaku, sandi lama gagal, tautan dipakai ulang ditolak | sesuai |
| Ganti Password wajib (akun buatan admin): halaman lain tertahan, sandi pendek ditolak, setelah ganti masuk | sesuai |
| Pilih Kota (akun tanpa kota): tertahan, setelah simpan lanjut ke Paket | sesuai |
| Halaman Pembayaran Sukses/Gagal dengan nomor order ngawur | tidak error, pesan netral |
| Kecepatan landing, jaringan HP lambat (median 5 ulangan), situs live | tampil pertama 1,08 dtk, elemen terbesar 1,08 dtk, geser tata letak 0, waktu blokir 130 ms, 638 KB, 56 permintaan, tanpa video |
| Kecepatan landing desktop, situs live | tampil pertama 0,42 dtk, 2.275 KB (1 video) |
| Simulator iPhone 17 (iOS 26.3) | TEMUAN: lihat bawah |

## Temuan simulator iPhone (diperbaiki)
Di iPhone, kolom isian yang hurufnya di bawah 16 px membuat Safari memperbesar (zoom) halaman saat disentuh, lalu halaman tertinggal ter-zoom dan bisa digeser ke samping (terlihat di aplikasi pemilik kolam yang sudah dipasang ke layar utama: judul dan header terpotong). Semua isian SPH berhuruf 14 px (text-sm). Perbaikan: di perangkat sentuh, isian/pilihan/teks panjang 16 px (globals.css); desktop tidak berubah. Dicek ulang di simulator: menyentuh kolom login tidak lagi men-zoom.

## Tidak bisa diuji / ditunda
- Notifikasi HP (push): butuh iPhone/Android asli; Safari simulator tidak menerima Web Push. Tugas Hadi.
- Pembayaran Midtrans sungguhan: batas keras (tidak ada transaksi uang).
- Halaman pemilik kolam, member, dan coach di situs LIVE dengan data asli: butuh login Hadi.
- Merapikan pesan "Penarikan ditahan" yang menyebut semua nama peserta (kode uang): ditunda, perlu Opus.
- Simulator sering tidak merespons ketukan/ketik berulang; hanya login layar dan fokus kolom yang berhasil dilihat.
