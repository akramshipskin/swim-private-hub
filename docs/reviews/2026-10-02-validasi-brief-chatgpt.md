# Validasi brief ChatGPT (SPH_CLAUDE_VALIDATION_BRIEF_2026-10-02), 2 Okt 2026

Dikerjakan Sonnet 5.5 (High), hanya membaca kode dan dokumen serta menghitung; tidak ada perubahan kode dalam validasi ini. Bagian yang menyentuh uang dan login dinilai dari kode, bukan dijalankan di production. Tes balapan dijalankan ulang (161 lulus), lihat bagian F.

Cara baca label: BENAR = bukti kuat dari kode; SEBAGIAN = inti benar, rincian/dampak dikoreksi; SALAH/BASI = bukti tidak mendukung atau sudah ditangani; TIDAK TERUJI = tidak bisa dibuktikan dari sini.

## A. Ringkasan

- **Benar dan penting:** ECON-001 (komisi afiliasi memakan hampir semua biaya layanan transaksi pertama), AUTH-002 (kunci akun bisa dipakai mengunci orang; lebih parah dari tulisan ChatGPT untuk akun admin), DATA-002 (angka landing tidak sama dengan arti labelnya), DOC-001/002 (dokumen lama tanpa penanda "basi").
- **Sebagian benar:** LAND-002 (hero hanya untuk member; jalur coach/kolam ada tapi di bawah), POV-MEMBER-002/003, COPY-001/002/004, MATH-002.
- **Ditolak atau tidak perlu tindakan:** SYS-001, AUTH-001, BOOK-001, CANCEL-001, MATH-001, LAND-001, UI-001 (semua kuat, jangan ditulis ulang); POV-ADULT-001 (hero sudah menyebut "Anak atau kamu"); UI-003 (animasi tetap, ukur kecepatan saja).
- **Temuan baru dari validasi ini (tidak ada di brief ChatGPT):** "Komisi kolam" di langkah pemilik kolam adalah istilah model lama; jumlah coach per kolam menghitung coach nonaktif; tandai-hadir coach belum dijaga gerbang perjanjian (sudah diperbaiki lokal, belum push); komisi afiliasi dihitung dari pembayaran PERTAMA walau itu sesi coba; sisa pembulatan paket (maks Rp7) tidak dikreditkan ke siapa pun.
- **Tiga isu berdampak terbesar yang tersisa:** (1) ekonomi afiliasi sebelum iklan jalan, (2) kunci akun terhadap akun admin, (3) angka dan label landing sebelum iklan.

## B. Tabel temuan

| ID | Label | Bukti | Keputusan Claude | Prioritas | Perlu Hadi? | Model |
|---|---|---|---|---|---|---|
| SYS-001 | BENAR | Tes balapan R1-R16 (booking, batal, hadir, hapus slot); audit buku besar 2 Okt cocok | Jangan tulis ulang | - | tidak | - |
| SYS-002 | SEBAGIAN | Landing sudah menjelaskan saldo, PPh, ganti coach | DEFER, tidak ada tindakan | Rendah | tidak | - |
| AUTH-001 | BENAR | `src/auth.ts` cek ulang DB tiap permintaan, versi sesi, gerbang ganti-password/2FA/perjanjian | Jangan ubah | - | tidak | - |
| AUTH-002 | BENAR (lebih parah) | `src/lib/authorize.ts`: percobaan dicatat SEBELUM cek password; setelah 3 percobaan per akun semua login ke akun itu ditolak 15 menit, termasuk password benar. Batas jaringan 20x/15 menit | Ubah (lihat C) | Sedang-Tinggi | ya (aturan login) | Opus |
| BOOK-001 | BENAR (sebagian teruji) | Tes balapan mencakup rebutan satu slot, satu paket banyak slot, klik dobel, hapus slot, batal vs booking. Belum ada tes balapan: paket kedaluwarsa, coach/kolam dinonaktifkan di tengah booking, akun dihapus di tengah booking | Tambah 3 tes balapan | Rendah-Sedang | tidak | Opus (tes) |
| CANCEL-001 | BENAR | Pesan batal sesi coba dan penutupan jam coach sudah disamakan hari ini | Tidak ada tindakan | - | tidak | - |
| MATH-001 | BENAR | `src/lib/pricing.ts`: biaya = round((kolam+coach) x 6,5%), konstanta 4/8 sesi, 60/90 hari, jatah batal 2/4, sesi coba 7 hari | Tidak ada tindakan | - | tidak | - |
| MATH-002 | SEBAGIAN | Sisa pembulatan biaya layanan memang ke SPH. Tetapi nilai sesi = floor(bayar/jumlah sesi), jadi sisa `bayar mod jumlah sesi` (maks Rp3 paket 4, Rp7 paket 8) tidak dikreditkan ke siapa pun; komentar kode menyebut "sisa pembulatan milik SPH" | Putuskan: kreditkan ke sesi terakhir atau catat sebagai diterima | Rendah | ya (kecil) | Opus (uang) |
| ECON-001 | BENAR, BUKAN BARU | Angka cocok (paket 8: bersih Rp74.955, afiliasi Rp68.160, sisa Rp6.795). Sudah tertulis di `docs/designs/harga-dari-coach.md` dan diputuskan Hadi 2 Okt (tetap 5%, dinilai ulang sebelum iklan). Tabel skenario di bagian D | Perlu keputusan sebelum iklan | Tinggi | ya | Opus (kode) |
| DOC-001 | SEBAGIAN | `docs/designs/marketplace-pivot.md` berstatus "APPROVED" tanpa penanda basi, tetapi isinya sendiri menolak lintas kolam untuk Fase 1 dan menyatakan permintaan belum terbukti. `docs/designs/simulasi-pendapatan-kolam.md` memakai model 29 Sep. Catatan keputusan kronologis sudah ada, tetapi tidak ada satu dokumen "aturan saat ini" | Terima; buat satu dokumen aturan saat ini + banner | Sedang-Tinggi (murah) | tidak | Sonnet tulis, Opus periksa bagian uang |
| DOC-002 | BENAR | `docs/designs/harga-dari-coach.md` kepala "draf, menunggu 'lanjut' Hadi" padahal sudah live | Perbaiki status | Sedang | tidak | Sonnet |
| LAND-001 | BENAR | Brand v2 konsisten | Tidak ada tindakan | - | tidak | - |
| LAND-002 | SEBAGIAN | Hero: dua tombol (Daftar gratis, Lihat kolam), semua untuk member. Pilihan peran ada di bagian "Cara kerjanya" dan jalur Daftar Coach/Kolam di bagian mitra dan footer | Ubah: satu baris "Coach atau punya kolam? Gabung sebagai mitra" di bawah tombol hero | Sedang | ya (tambah elemen hero) | Sonnet |
| POV-MEMBER-002 | SEBAGIAN | Hero: "di kolam dekat rumah". Cakupan kolam sebenarnya tidak saya ketahui; frasa lebih luas dari yang bisa dibuktikan | Ubah ke "di kolam mitra SPH" | Sedang | ya (janji ke pelanggan) | Sonnet |
| POV-MEMBER-003 | BENAR | `src/app/page.tsx` `cheapestPack` mengambil harga terendah dari paket 4 dan 8 semua coach, label "Harga mulai Rp.../paket" tanpa ukuran | Ubah: tampilkan "Paket 4 sesi mulai Rp..." | Sedang | tidak | Sonnet |
| POV-ADULT-001 | SEBAGIAN / DITOLAK | Hero sudah "Anak atau kamu", MESSAGING.md mewajibkannya; kata "peserta" 36x vs "anak" 16x, "orang tua" 12x | DEFER; tidak perlu pembersihan massal | Rendah | tidak | - |
| POV-COACH-001 | BENAR (sama dengan LAND-002) | Bagian coach baru muncul setelah beberapa layar | Ikut perbaikan LAND-002 | Sedang | ya | Sonnet |
| POV-COACH-002 | SEBAGIAN | "50%" besar berdampingan dengan judul "Peserta tidak datang, kamu tetap dibayar" dan isi "50% dari bagianmu"; risiko salah baca kecil | Opsional: tambah label kecil "bagianmu" | Rendah | tidak | Sonnet |
| POV-POOL-002 | SEBAGIAN | Bagian kolam sudah "Kamu yang menentukan harga tiket"; belum ada contoh angka | Tambah contoh berlabel (tiket Rp60.000 masuk Rp59.700 setelah PPh 0,5%), setelah Hadi setuju angkanya | Sedang | ya | Sonnet |
| POV-POOL-003 | SEBAGIAN | Landing memakai "bagi hasil" (3 tempat) dan **"Komisi kolam"** (landing-view.tsx:88, istilah model lama, bertentangan dengan "bukan dipotong dari bagian kolam"). Temuan sendiri | Perbaiki "Komisi kolam" jadi "Bagian kolam (setelah PPh final 0,5%)"; "bagi hasil" boleh tetap | Sedang | tidak | Sonnet |
| MKT-001 | BENAR | Kejadian Meta hanya CompleteRegistration (member) dan Purchase; coach/kolam tidak punya | DEFER sampai iklan perekrutan; PageView di halaman daftar sudah jalan | Rendah (Sedang saat iklan perekrutan) | tidak | Opus (server) |
| DATA-001 | BENAR | Ambang tampil sudah ada | Tidak ada tindakan | - | tidak | - |
| DATA-002 | BENAR | (a) "Member terdaftar" = jumlah semua peran MEMBER, termasuk nonaktif/dianonimkan; (b) "N member les di sini" = member unik yang pernah punya paket mulai, bukan yang masih aktif; (c) jumlah coach per kolam = semua afiliasi termasuk coach nonaktif, padahal daftar coach aktif sudah disaring | Ubah (a) hanya aktif, (b) label "pernah les", (c) pakai daftar yang sudah disaring | Sedang-Tinggi (sebelum iklan) | tidak (bukan karangan angka) | Sonnet |
| COPY-001 | BENAR | Subheadline hero berbeda dari `brand-kit/MESSAGING.md` yang mewajibkan identik | Samakan salah satu | Rendah | ya (pilih versi) | Sonnet |
| COPY-002 | SEBAGIAN | Judul "Keselamatan kolam jelas penanggung jawabnya", isi menyebut kolam mitra yang bertanggung jawab; sejalan dengan S&K 6.2 | Tetap; setelah MOU disamakan (jawaban Hadi 3A) janji jadi sejalan | Rendah | ya (teks hukum) | Opus |
| COPY-003 | SEBAGIAN | Footer "Pembayaran aman lewat Midtrans" | Ganti "Pembayaran diproses lewat Midtrans" (lebih faktual) | Rendah | ya (klaim kepercayaan) | Sonnet |
| COPY-004 | SEBAGIAN | Halaman coach publik sudah ada; yang dikunci: jadwal, fasilitas kolam, file sertifikat. Teks landing "Jadwal dan profil lengkapnya terbuka setelah mendaftar" kurang tepat | Ganti: "Jadwal, fasilitas kolam, dan file sertifikat terbuka setelah mendaftar" | Rendah | tidak | Sonnet |
| UI-001 | BENAR | Kerangka bersama | Tidak ada tindakan | - | tidak | - |
| UI-002 | BENAR | `src/app/landing-tabs.tsx`: tablist/tab/tabpanel ada, `aria-controls`/`aria-labelledby`/id tidak ada | Tambahkan | Rendah | tidak | Sonnet |
| UI-003 | DITOLAK sebagai tindakan | Hadi sendiri meminta animasi lebih banyak hari ini | Tidak dikurangi; ukur kecepatan HP dan desktop setelah batch | Rendah | tidak | Sonnet (ukur) |
| Gap produksi | TIDAK TERUJI | Login/pembayaran/Safari/push/email/hapus akun/buku besar production: belum ada | Tugas Hadi | - | ya | - |

## C. AUTH-002 dengan lebih rinci

- Bukti: `authorizeCredentials` mencatat percobaan per akun SEBELUM memeriksa password. Setelah 3 percobaan dalam 15 menit semua login ke akun itu ditolak, termasuk dari pemilik dengan password benar. Akun yang tidak ada pun dihitung, jadi tidak ada kebocoran "akun ini ada".
- Kelemahan yang tidak disebut ChatGPT: akun admin ikut. Siapa pun yang tahu nomor HP atau email admin bisa menjaga admin terkunci terus dengan 3 percobaan tiap 15 menit; admin tidak punya admin lain untuk meminta reset. Kunci jaringan 20x/15 menit hanya membatasi satu jaringan, bukan siapa yang mengunci.
- Aturan ini keputusan Hadi (25 Sep, diperketat 30 Sep) dan dicatat di `src/lib/rate-limit.ts`. Jadi: sudah diketahui, tetapi dampak ke admin belum dibahas.
- Opsi (belum dipilih): (1) kunci per kombinasi akun+jaringan sebagai kunci utama dan kunci per akun yang jauh lebih tinggi (mis. 10x) sebagai pengaman; pemilik dari jaringan lain tetap bisa masuk; (2) kunci ketat tetap, tetapi pengecualian admin (hanya kunci jaringan + tantangan CAPTCHA); (3) biarkan, catat sebagai risiko yang diterima. Rekomendasi: opsi 1.
- Ini aturan login, jadi dikerjakan Opus dan menunggu keputusan Hadi.

## D. ECON-001, tabel skenario

Asumsi (tidak dicek ke kontrak Midtrans Hadi, hanya tarif umum yang diketahui): VA bank Rp4.000 per transaksi, QRIS 0,7%, dompet digital 2%, tanpa PPN atas biaya Midtrans. Pendapatan bersih SPH = biaya layanan dikurangi PPN 11% yang sudah termasuk. Afiliasi = lantai 5% dari jumlah yang dibayar. Angka dihitung dari konstanta kode saat ini, bukan dijalankan di production.

| Skenario | Dibayar member | Biaya layanan | Bersih setelah PPN | Afiliasi 5% | Sisa tanpa afiliasi (VA / QRIS / dompet digital) | Sisa dengan afiliasi (VA / QRIS / dompet digital) |
|---|---:|---:|---:|---:|---|---|
| A: paket 4, kolam 260rb + coach 440rb | 745.500 | 45.500 | 40.991 | 37.275 | 36.991 / 35.773 / 26.081 | -284 / -1.502 / -11.194 |
| B: paket 8, 480rb + 800rb | 1.363.200 | 83.200 | 74.955 | 68.160 | 70.955 / 65.413 / 47.691 | 2.795 / -2.747 / -20.469 |
| C: paket 4 murah, 100rb + 200rb | 319.500 | 19.500 | 17.568 | 15.975 | 13.568 / 15.332 / 11.178 | -2.407 / -643 / -4.797 |
| D: paket 8 mahal, 800rb + 1,5jt | 2.449.500 | 149.500 | 134.685 | 122.475 | 130.685 / 117.539 / 85.695 | 8.210 / -4.936 / -36.780 |
| E: sesi coba (dari A) | 186.375 | 11.375 | 10.248 | 9.318 | 6.248 / 8.943 / 6.520 | -3.070 / -375 / -2.798 |

Pembacaan:
- Afiliasi memakan sekitar 91% bersih biaya layanan (Rp68.160 dari Rp74.955 di skenario B), karena dasarnya jumlah dibayar member (termasuk harga kolam dan coach), sedangkan pendapatan SPH hanya 6,5% dari harga kolam+coach.
- Dengan biaya pembayaran, transaksi pertama lewat afiliasi mendekati nol atau minus untuk QRIS dan dompet digital, positif tipis hanya untuk VA di paket 8 dan 8 mahal.
- Komisi dibayar sekali per member. Transaksi berikutnya tanpa afiliasi menghasilkan Rp26.081 sampai Rp130.685 (lihat kolom "tanpa afiliasi"), jadi kerugian awal dapat tertutup bila member membeli lagi; ini belum diukur dan tidak ada data pembelian ulang.
- Temuan dari membaca `src/lib/affiliate.ts`: dasar komisi adalah pembayaran SUKSES PERTAMA member. Bila member mulai dari sesi coba (Rp186.375), komisi hanya Rp9.318 dan paket berikutnya (yang lebih besar) tidak menghasilkan komisi. Ini perlu dikonfirmasi lewat tes; baru dibaca dari kode.
- Opsi untuk Hadi: (1) turunkan persen (mis. 3%); (2) hitung dari biaya layanan, bukan dari jumlah dibayar (mis. 50% dari bersih = sekitar Rp37.000 pada B), ini membuat komisi otomatis proporsional dengan pendapatan SPH; (3) komisi hanya untuk pembelian paket (bukan sesi coba), atau dihitung dari paket pertama selain sesi coba; (4) komisi dicairkan setelah pembelian kedua; (5) tetap 5% dan diterima sebagai biaya akuisisi. Rekomendasi: opsi 2.

## E. Yang diperiksa dan bersih

- Dokumen kebijakan dan keputusan: ECON-001 sudah tercatat (KEPUTUSAN 2 Okt), sumber angka sama.
- Halaman coach publik: tidak membocorkan data sensitif tanpa login (jadwal, fasilitas, file sertifikat dikunci).
- Footer, header, brand: konsisten dengan brand v2.

## F. Tes yang dijalankan

- Tes otomatis penuh hari ini: 765 tes lulus (setelah perubahan perjanjian), pengecekan tipe dan pembuatan versi jadi lulus.
- Tes balapan dijalankan ulang saat validasi ini: 15 berkas, 161 tes lulus (114 dtk, database tes lokal). Tes itu tidak mencakup gerbang perjanjian di tandai-hadir (itu tes unit, lulus).

## G. Urutan kerja yang diusulkan

Model per butir ada di tabel B. Urutan: (1) Opus: keputusan ECON dan AUTH-002 (setelah Hadi memilih opsi), aturan batal coach longgar, batas tanggung jawab, keselamatan kolam; (2) Sonnet: perbaikan angka/label landing (DATA-002, POV-MEMBER-003, POV-POOL-003, COPY-004), sitemap keluar + noindex, entry mitra di hero (setelah Hadi setuju), dokumen aturan saat ini + banner DOC-001/002, ARIA tabs; (3) Hadi: cek Pixel, HP asli, pembayaran asli.
