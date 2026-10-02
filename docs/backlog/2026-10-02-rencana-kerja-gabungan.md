# Rencana kerja gabungan, 2 Okt 2026 (dari validasi brief ChatGPT + antrean yang sudah ada)

Sumber: docs/reviews/2026-10-02-validasi-brief-chatgpt.md, jawaban Hadi 2 Okt siang (1-7 sudah dijawab A), catatan pemeriksa Opus kedua atas perjanjian/MOU. Model per butir = rekomendasi; Hadi yang memberi aba-aba "Opus dulu" atau "Sonnet dulu" dan mengganti modelnya.

## A. OPUS (uang, login, teks hukum mitra, tes balapan)

| # | Pekerjaan | Asal | Catatan |
|---|---|---|---|
| O1 | Komisi afiliasi diubah jadi 50% dari biaya layanan bersih (setelah PPN), bukan 5% dari jumlah dibayar. Perbarui kode hitung, tes, teks dasbor, teks perjanjian/MOU | ECON-001, jawaban 1A | Menunggu 2 keputusan kecil (Pertanyaan 1-2) |
| O2 | Kunci login: kunci utama per akun+jaringan (3x/15 menit), batas per akun jauh lebih tinggi (usul 10x/15 menit), batas per jaringan 20x tetap. Tes, termasuk skenario admin tidak bisa dikunci terus oleh orang asing | AUTH-002, jawaban 2A | Menunggu angka (Pertanyaan 3) |
| O3 | Teks Perjanjian Coach + MOU Kolam: (a) hapus angka 12 jam dan 2x/4x, ganti pedoman longgar (peringatan, admin menilai, sakit/darurat tidak dihitung, nonaktif sementara oleh admin; Hadir palsu tetap tegas); (b) tambah batas tanggung jawab SPH ke mitra (rumusan konservatif tanpa angka); (c) keselamatan kolam di MOU = S&K 6.2; (d) teks komisi afiliasi ikut O1; (e) pasal peralihan paket lama: persentase yang tercatat saat sesi ditandai dan tanpa potongan PPh; (f) 12 bulan tidak dimulai ulang saat versi baru | Pemeriksa Opus kedua #3-#7, #10; jawaban 7A; antrean 2 Okt | Menunggu satu keputusan (Pertanyaan 4) |
| O4 | Pemeriksa Opus kedua (konteks segar) untuk O1 sampai O3 | aturan SPH | Wajib sebelum push |
| O5 | Tiga tes balapan baru: paket kedaluwarsa vs booking; coach/kolam dinonaktifkan di tengah booking; akun dihapus di tengah booking | BOOK-001 | Tes saja, tanpa ubah aturan |
| O6 | Periksa ulang dengan dijalankan: webhook pembayaran, saldo member, ganti coach, paket versi lama, kedaluwarsa paket, wallet audit | Phase B brief | Hanya melapor; perbaikan hanya bila ada salah |
| O7 | Sisa pembulatan paket (maks Rp7): dicatat sebagai diterima SPH, atau dikreditkan ke sesi terakhir | MATH-002 | Menunggu keputusan (Pertanyaan 5) |

Ditunda (tidak dikerjakan sekarang): kejadian Meta untuk pendaftaran coach/kolam (MKT-001, tunggu iklan perekrutan); tombol "stop jual paket baru" untuk kolam yang kerja samanya berakhir; menjaga gerbang perjanjian di /profil dan chat (tidak menyentuh uang).

## B. SONNET (tampilan, teks, data landing, dokumen)

| # | Pekerjaan | Asal |
|---|---|---|
| S1 | Angka landing sesuai arti label: "Member terdaftar" hanya akun aktif; kartu kolam "N member pernah les di sini"; jumlah coach per kolam hanya coach aktif; cek "Sesi selesai" dan "jumlah kolam" | DATA-002 |
| S2 | "Harga mulai" menyebut ukuran paket ("Paket 4 sesi mulai Rp...") | POV-MEMBER-003 |
| S3 | "Komisi kolam" di langkah pemilik kolam diganti "Bagian kolam (setelah PPh final 0,5%)" | temuan baru, POV-POOL-003 |
| S4 | Baris di bawah tombol hero: "Coach atau punya kolam? Gabung sebagai mitra" (dua tautan) | LAND-002, POV-COACH-001, jawaban 3A |
| S5 | Hero: "di kolam dekat rumah" diganti "di kolam mitra Swim Private Hub" | POV-MEMBER-002, jawaban 4A |
| S6 | Contoh angka bagian pemilik kolam: tiket Rp60.000 masuk Rp59.700 setelah PPh 0,5% (berlabel contoh) | POV-POOL-002, jawaban 5A |
| S7 | "Pembayaran aman lewat Midtrans" jadi "Pembayaran diproses lewat Midtrans" | COPY-003, jawaban 6A |
| S8 | Teks profil coach di landing: "Jadwal, fasilitas kolam, dan file sertifikat terbuka setelah mendaftar" | COPY-004 |
| S9 | Subheadline hero dan dokumen pesan merek disamakan (arah menunggu keputusan) | COPY-001 |
| S10 | Label kecil "bagianmu" di bawah angka 50% (opsional, risiko salah baca kecil) | POV-COACH-002 |
| S11 | Tab landing: aria-controls, aria-labelledby, id panel | UI-002 |
| S12 | /perjanjian-coach dan /mou-kolam keluar dari sitemap + tanda "jangan diindeks" | jawaban 2A |
| S13 | Dokumen "aturan bisnis saat ini" (satu sumber) + penanda "SUPERSEDED" di marketplace-pivot dan simulasi-pendapatan-kolam + status harga-dari-coach jadi "live"; sapu penuh sisa istilah model lama (bagian uang diperiksa Opus) | DOC-001, DOC-002, Phase F |
| S14 | Pesan error pendaftaran coach/kolam menyebut perjanjian/MOU, bukan hanya S&K dan Kebijakan Privasi | pemeriksa #8 |
| S15 | Sisa validasi: baca landing sebagai 4 orang, tabel label ke database lengkap, saran POV-MEMBER-001, format laporan akhir (rencana uji, kode per kategori) | Phase C, D, 24 |
| S16 | Ukur kecepatan halaman HP dan desktop setelah batch | UI-003 |

Sudah selesai (tidak diulang): teks komisi di dasbor "dari jumlah yang dibayar member" (nanti diubah lagi oleh O1); tandai-hadir coach dijaga gerbang; nama menu "Tambah Slot"; animasi coach.

## C. Urutan kerja yang diusulkan

1. Opus: O1, O2, O3, O7, O5, O6 (urutan: keputusan dulu, lalu kode, lalu tes) lalu O4 pemeriksa.
2. Sonnet: S1 sampai S14 (satu batch), S15, S16.
3. Build, tes, push, cek GitHub dan situs asli.

## D. Tidak dikerjakan (ditolak dengan alasan)

- Menulis ulang arsitektur, skema, login, booking, dompet (SYS-001, AUTH-001, BOOK-001): bukti menunjukkan kuat.
- Pembersihan massal kata "anak" untuk pembelajar dewasa (POV-ADULT-001): hero sudah "Anak atau kamu", aturan merek sudah mewajibkan.
- Mengurangi animasi (UI-003): permintaan Hadi hari ini justru menambah; hanya diukur.
- Mengganti kerangka UI bersama (UI-001).

## E. Tugas Hadi (di luar kode)

- Cek event Meta di jendela penyamaran (PageView, CompleteRegistration), lalu hapus META_TEST_EVENT_CODE di Vercel.
- Teruskan butir asuransi, sengketa, keselamatan kolam, bukti potong, pajak afiliasi ke reviewer/akuntan.
- Cek HP asli/Safari, satu pembayaran sungguhan, email, push, unggah file.
