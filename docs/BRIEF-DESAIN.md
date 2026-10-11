# Brief desain SPH

Status: DRAF 1 (11 Okt 2026, ditulis Claude dalam mode tidur siang Hadi; rencana 11 butir disetujui lewat "kerjain sesuai rekomendasi lu"). MENUNGGU TINJAUAN HADI. Dokumen perencanaan ke-3 dari 6 (PRD, alur aplikasi, brief desain, TRD, skema data, rencana kerja).

Aturan urutan acuan: kode aplikasi > halaman /brandguideline (versi 2.1) > dokumen ini > brand-kit/MESSAGING.md > dokumen lama di docs/designs/. Semua angka dan nama di bawah diambil dari kode per 11 Okt; bila kode berubah, kode yang benar.

## 1. Untuk siapa dan prinsipnya
- Pengguna: orang tua (member), coach, pemilik kolam, admin. Trafik landing dari iklan Meta, mayoritas HP.
- Prinsip (dari PRD): HP dulu, cepat, jelas, jujur. Satu layar = satu tugas utama. Angka uang selalu rinci (tiket kolam, jasa coach, biaya layanan) dan sama di semua halaman.
- Tidak terasa buatan AI: tanpa gradien ungu/biru, tanpa ikon emoji, tanpa angka atau testimoni karangan, tanpa tiga kartu identik sebagai hiasan.

## 2. Sumber kebenaran
| Hal | Sumber |
|---|---|
| Warna, huruf, contoh komponen | halaman /brandguideline (data.ts dan brandguideline-view.tsx) |
| Token warna terang dan gelap | src/app/globals.css (dijaga tes theme-scope.test.ts) |
| Kata dan gaya tulisan | brand-kit/MESSAGING.md (tabel kata ramah 6 Okt) |
| Komponen | src/components/ui/* dan src/components/dashboard.tsx |
| Daftar halaman | docs/cakupan-halaman.md (dibuat dari kode) |

## 3. Warna, huruf, bentuk
- Inti: charcoal #14140f (teks, tombol utama, brand-600/700), lime #9fcc1f (brand-500: aksen, cincin fokus, kartu saldo), latar #f6f6ee, permukaan #ffffff, garis #dedaca. Mode gelap memakai token yang sama namanya (globals.css bagian dark).
- Status: success / warning / danger (latar + teks), disabled, whatsapp. Jangan memakai warna lepas di komponen; selalu token.
- Kartu utama gelap (hero): charcoal di mode terang, lime di mode gelap (token hero, hero-ink, hero-muted, hero-accent).
- Huruf: Sora untuk judul dan logotype, Plus Jakarta Sans untuk isi, JetBrains Mono untuk kode (keputusan Hadi 10 Okt: tetap Sora).
- Bentuk: kartu rounded-2xl, isian dan tombol rounded-xl (tombol kecil rounded-lg), lencana rounded-full. Bayangan tipis hanya di kartu yang perlu terangkat.
- Tombol: primary (charcoal), secondary (garis), ghost, danger. Tombol utama TIDAK lime (aturan 6 Okt), kecuali di dalam kartu saldo/hero yang memang lime.

## 4. Kerangka per peran
- HP dan tablet (di bawah 1024 px): bilah atas (logo, lonceng, menu) + bilah bawah 5 tombol + tombol bantuan bulat di kanan bawah. Jarak samping 16 px (dirapatkan 10 Okt).
- Desktop (1024 px ke atas): menu samping kiri berkelompok + konten.
- Bilah bawah: member Dashboard, Booking, Paket, Riwayat, Lainnya; coach Dashboard, Jadwal, Riwayat, Saldo, Lainnya; pemilik kolam Dashboard, Jadwal, Laporan, Saldo, Lainnya; admin Dashboard, Jadwal, Keuangan, Pesan, Lainnya.
- Menu samping admin: Operasional, Mitra & Member, Keuangan, Lainnya (nama menu = judul halaman).

## 5. Pola layar inti
| Layar | Pola yang dipakai |
|---|---|
| Dashboard keempat peran | Kartu "Langkah Berikutnya" (NextStepCard) paling atas, lalu kartu saldo/sisa sesi, Ringkasan (Stat), daftar sesi (SessionList) |
| Dashboard admin | Kotak "Perlu Kamu Cek" (ActionRow dengan angka), Pendapatan platform, Ringkasan tiap kolam |
| Paket (member) | Kartu per kolam, segmen sisa sesi (SegmentBar), lalu Beli Paket Baru dengan rincian harga |
| Booking | Dua langkah: pilih tanggal dan jam, tombol menempel di bawah, layar sukses dengan kode |
| Saldo coach/kolam | Kartu saldo, Tarik Saldo, Rekening Penerima (terkunci, ubah butuh password), riwayat koreksi dan penarikan |
| Antrean admin | Daftar kartu dengan tombol aksi di kanan bawah; aksi berisiko memakai konfirmasi (ConfirmDialog) |
| Menu Email admin | Gaya kotak masuk: daftar percakapan (Perlu Dibalas dulu, lalu terbaru), pesan terbaru di atas, pesan lama dilipat |

## 6. Keadaan wajib di tiap layar
Memuat (Loader), kosong (kalimat + tindakan berikutnya, contoh "Belum ada jadwal. Booking sesi di menu Booking."), error (kotak danger dengan kalimat yang bisa ditindaklanjuti), terkunci (alasan + kapan terbuka, contoh hitung mundur di Masuk), berhasil (pesan singkat atau layar sukses). Teks panjang membungkus, tidak memotong; tidak ada scroll ke samping di 375/768/1280 px.

## 7. Aturan tulisan
- Tombol dan label isian: Title Case, kata sambung kecil ("Pilih Tanggal dan Jam"). Kalimat penuh dan judul kartu boleh huruf biasa.
- Kata ramah (MESSAGING.md): Akun, Keterampilan, Untuk Siapa, Pengajuan, Berakhir, Tarik Saldo/Penarikan, Rekening Penerima, Buka Jam Kosong, Perlu Kamu Cek. "Update milestone" tetap karena disebut di perjanjian coach.
- Sapaan "kamu". Tanpa tanda pisah panjang (—), tanpa "OK"/"Submit".
- Klaim dilarang: janji jumlah peserta, batas waktu yang tidak dijaga sistem, logo pembayaran yang tidak diterima, angka contoh yang tidak nyata.

## 8. Gerak
- HP: hanya kartu/section muncul pelan saat masuk layar, sekali; tanpa hover, tanpa video header.
- Desktop: hover di kartu dan tombol, muncul bertahap; landing boleh video perenang di header.
- Hanya transform dan opacity, 150-300 ms (aplikasi), 400-700 ms (landing). Hormati "kurangi gerakan" (aturannya ada di globals.css).

## 9. Layar kerjaan baru (Okt) dan polanya
| Fitur | Tempat | Pola |
|---|---|---|
| Pengingat sesi 18.00 + 06.00, paket mau berakhir | Lonceng + notifikasi HP | Judul pendek berisi waktu ("Pengingat sesi besok 09.00-10.00"), isi menyebut peserta, kolam, coach, batas batal |
| Tolak pendaftar | Kartu akun admin | Tombol Tolak -> kotak alasan -> tautan "Kabari Penolakan Lewat WhatsApp" yang bertahan sampai diklik |
| Laporkan Coach | Bawah Riwayat Booking member; menu Laporan Coach admin | Kotak penjelasan + Buat Laporan (boleh tangkapan layar); admin menutup dengan catatan |
| Kembalikan Dana | Panel Ubah di admin Paket | Kotak danger berisi akibat, nominal maks, referensi, alasan; tombol "Simpan Pengembalian" |
| Lupa Password (belum tayang) | /lupa-password, /reset-password | Kartu tunggal seperti Masuk; jawaban sama untuk email terdaftar/tidak |

## 10. Larangan
- Tombol utama lime di luar kartu saldo/hero; warna lepas di luar token.
- Data contoh yang salah disalin ke desain (contoh lama: beli 1 sesi eceran, booking satu ketuk, kolam Jakarta beralamat Cianjur).
- Menebak sapaan atau kata ganti orang; menulis nomor WhatsApp coach di layar member.
- Mengubah alur aplikasi lewat desain tanpa izin Hadi (tampilan boleh dirombak, alur dan aturan tidak).

## 11. Peta halaman dan status desain
72 halaman (docs/cakupan-halaman.md). Status per 11 Okt: semua halaman tayang sudah memakai kerangka dan token di atas (sweeping 11 Okt: 504 kunjungan, 0 melebar ke samping). Yang belum punya desain khusus: tidak ada. Yang masih memakai pola lama dan layak dirapikan bila Hadi meminta rombak tampilan: halaman Harga coach dan Paket & Harga kolam (tombol Ubah hanya di samping isian kedua), kartu Akun admin di HP (tombol aksi membungkus ke baris kedua), halaman hukum (lebar teks).

## Dokumen lama
docs/designs/rombak-ui-aplikasi.md, terapkan-claude-design.md, analisis-alur-desain-baru.md, halaman-terdampak-desain-baru.md, claude-design-2026-10-04/: arsip (sudah diterapkan 4 Okt); bila bertentangan, dokumen ini yang berlaku.
