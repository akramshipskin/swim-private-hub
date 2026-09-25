# Standar Tulisan & Pesan — Swim Private Hub

Acuan wajib untuk semua tulisan yang dilihat pengguna: landing page, panduan,
aplikasi (semua peran), notifikasi, pesan WhatsApp, dan materi promosi. Tujuannya
satu: siapa pun yang menulis, hasilnya terdengar seperti produk yang sama.

Terakhir diperbarui: 25 September 2026 (headline & tagline baru).

---

## 1. Posisi produk (satu kalimat)

> Swim Private Hub adalah aplikasi les renang privat yang menyatukan orang tua,
> coach, dan kolam mitra: booking jadwal, kelola paket, dan bagi hasil otomatis
> setiap sesi yang benar-benar terlaksana.

**Klaim yang boleh dipakai** (semuanya bisa dibuktikan di dalam aplikasi):

- Satu aplikasi untuk tiga peran: orang tua, coach, dan pemilik kolam.
- Slot terkunci otomatis begitu diambil member lain.
- Sisa sesi dan jatah pembatalan dihitung per peserta.
- Bagi hasil ke kolam dan coach otomatis setiap sesi ditandai Hadir.
- Paket dan harga diatur per kolam.

**Klaim yang dilarang:**

- "Pertama di Indonesia", "satu-satunya", "terbaik", "nomor 1" — tidak bisa
  dibuktikan; sudah ada pemain lain dengan fitur yang sebagian mirip.
- Angka yang tidak diambil dari database (jumlah member, kolam, sesi).
- Janji hasil ("pasti bisa renang dalam 5 sesi") atau klaim medis.

## 2. Headline & tagline

| Tempat | Aturan | Contoh |
|---|---|---|
| Headline utama (landing, panduan) | 1 kalimat, maksimal 12 kata. Sebut **apa produknya** (aplikasi les renang privat) dan **apa yang bisa dilakukan** (pilih coach, kolam, jam). Tanpa superlatif ("pertama", "nomor 1", "terbaik") | "Aplikasi les renang privat: pilih coach, pilih kolam, dan pilih jamnya." |
| Subheadline | 1–2 kalimat: untuk siapa + siapa melakukan apa. Sebut "anak atau kamu sendiri" supaya pemula dewasa juga merasa dituju. Jelaskan cara kerjanya, bukan janji | "Buat anak atau kamu sendiri yang baru mau belajar. Coach kelola jadwal sendiri, kolam lihat pemakaian harian, semua dalam satu aplikasi." |
| Judul bagian | 2–4 kata, huruf besar hanya di awal | "Kolam mitra", "Kenalan dengan coach" |
| Judul halaman aplikasi | Kata benda, tanpa basa-basi | "Booking Coach", "Riwayat Bayar" |
| Tagline pendek (sosmed, banner, halaman masuk/daftar, gambar berbagi) | Maksimal 12 kata; versi ringkas headline | "Aplikasi les renang privat: pilih coach, kolam, dan jam." |
| Deskripsi meta (mesin pencari, manifest PWA) | Headline + kalimat pertama subheadline | "Aplikasi les renang privat: pilih coach, pilih kolam, dan pilih jamnya. Buat anak atau kamu sendiri yang baru mau belajar." |

**Catatan klaim:** "pilih jam" artinya memilih dari jam yang masih kosong di jadwal coach
(bukan jam apa saja). Jangan tulis "bebas pilih jadwal". Riset pasar per 25 Sep 2026:
belum ditemukan aplikasi les renang privat dengan tiga peran seperti ini (yang ada
klub/kursus renang biasa), tetapi itu **bukan bukti** — jadi "aplikasi les renang
privat" dipakai sebagai nama kategori, bukan klaim "pertama/satu-satunya".

**Satu sumber:** headline, subheadline, dan tagline di atas harus identik di
landing (`landing-view.tsx`), panduan (`panduan-view.tsx`), meta (`layout.tsx`,
`manifest.json`), gambar berbagi (`opengraph-image.tsx`), halaman masuk/daftar,
halaman `/brandguideline`, dan banner sosmed di `brand-kit/social/`.

## 3. Nada bicara

- Sapa pengguna dengan **"kamu"**. Formal secukupnya, tidak kaku, tidak gaul.
- Tulis apa adanya. Jangan membesar-besarkan ("revolusioner", "canggih").
- Kalimat pendek. Satu kalimat, satu ide.
- Sebut akibatnya untuk pengguna, bukan istilah teknis: "sisa sesi kembali",
  bukan "sistem melakukan rollback kuota".
- Halaman hukum (Syarat & Ketentuan, Kebijakan Privasi) memakai "Pengguna" dan
  bahasa formal. Ini satu-satunya pengecualian.

**Kata yang dihindari** (dan penggantinya): login → **masuk**; logout → **keluar**;
klik di sini → tulis tujuannya; submit → **kirim**/**simpan**; user (di teks
pengguna) → **pengguna**/**member**; cancel → **batalkan**; upload → **unggah**
(boleh "upload" di tombol teknis yang sudah lazim); dilewatin, dikelompokin,
nandain, dibikinin → bentuk baku: dilewati, dikelompokkan, menandai, dibuatkan.

## 4. Istilah baku

| Pakai | Jangan |
|---|---|
| Member | pelanggan, customer, user (untuk orang tua/peserta) |
| Peserta | anak (kecuali memang khusus anak), murid |
| Coach | pelatih (di aplikasi), instruktur, trainer |
| Kolam mitra | partner, vendor |
| Paket | membership, langganan |
| Sesi | pertemuan, jam les |
| Jatah batal | kuota cancel |
| Saldo | dompet, wallet |
| Cairkan saldo | withdraw, tarik dana |
| Ditandai Hadir | absen, check-in |

## 5. Angka, tanggal, dan waktu

- Rupiah: `Rp 1.650.000` (pemisah titik, tanpa desimal).
- Persen: `15%` tanpa spasi.
- Tanggal panjang: `18 September 2026`. Tanggal pendek: `18 Sep 2026`.
- Jam: 24 jam, `06:00–21:00` (pakai en dash).
- Rentang sesi: `08.00–09.00` (titik, sesuai kebiasaan jadwal les).
- Waktu selalu WIB. Tidak perlu ditulis kecuali bisa membingungkan.

## 6. Tombol & pesan sistem

- Tombol memakai kata kerja + objek bila perlu: "Simpan", "Tambah peserta",
  "Cairkan saldo", "Kirim usulan". Hindari "OK" dan "Submit".
- Konfirmasi tindakan berbahaya menyebut akibatnya: "Nonaktifkan Budi? Paket &
  booking peserta ini tidak bisa diakses lagi sampai diaktifkan ulang."
- Pesan error: sebut apa yang terjadi + apa yang harus dilakukan. Jangan sebut
  detail teknis internal (nama environment variable, nama tabel, stack trace).
- Kondisi kosong menjelaskan langkah berikutnya: "Belum ada jadwal. Booking sesi
  di menu Booking."

## 7. Checklist sebelum menerbitkan tulisan baru

1. Sapaan "kamu" (kecuali halaman hukum)?
2. Ada klaim yang tidak bisa dibuktikan dari data aplikasi?
3. Istilah sudah sesuai tabel di bagian 4?
4. Format angka, tanggal, jam sudah sesuai bagian 5?
5. Tombol memakai kata kerja, bukan "OK"?
6. Kalimat terpanjang masih di bawah 25 kata?
