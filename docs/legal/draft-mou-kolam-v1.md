# DRAFT Perjanjian Kerja Sama Kolam Mitra — v1

> **Status: DRAFT template, BELUM BOLEH DITANDATANGANI.** Ditulis Claude
> (Opus) 29 Sep 2026. Claude bukan penasihat hukum; wajib direview orang
> hukum. Angka komisi sengaja dikosongkan: ditentukan per kolam (keputusan
> office hours 29 Sep, premis 6).
>
> Semua mekanisme uang di bawah **sudah dicocokkan dengan kode yang berjalan**
> (`src/lib/wallet.ts`, `src/app/coach/riwayat-sesi/actions.ts`,
> `src/lib/withdrawal.ts`, `src/lib/policy.ts`). Kalau perjanjian ingin
> mekanisme berbeda, kodenya harus diubah dulu — perjanjian tidak boleh
> menjanjikan hal yang sistem tidak lakukan.
>
> Tanda `[ISI HADI: ...]` = keputusan bisnis. `[ISI SAAT TTD]` = data
> per kolam yang diisi saat penandatanganan.

---

**PERJANJIAN KERJA SAMA KOLAM MITRA SWIM PRIVATE HUB**
Nomor: [ISI SAAT TTD]

Pada tanggal [ISI SAAT TTD], yang bertanda tangan di bawah ini:

1. **[ISI HADI: nama penyelenggara SPH — perorangan/CV/PT]**, beralamat di
   [alamat], dalam hal ini diwakili oleh [nama, jabatan], selanjutnya
   disebut **"SPH"**.
2. **[ISI SAAT TTD: nama pengelola kolam / badan usaha]**, pengelola kolam
   renang **[nama kolam]** di [alamat kolam], dalam hal ini diwakili oleh
   [nama, jabatan], selanjutnya disebut **"Kolam Mitra"**.

sepakat mengadakan kerja sama dengan ketentuan berikut.

## Pasal 1 — Ruang Lingkup

1. SPH menyelenggarakan aplikasi Swim Private Hub untuk pemesanan dan
   pembayaran les renang privat antara member, coach mitra, dan kolam mitra.
2. Kolam Mitra menyediakan fasilitas kolam untuk les renang privat yang
   dipesan melalui aplikasi.
3. Les yang dimaksud adalah **les privat satuan**: satu coach untuk satu
   peserta per sesi, bukan kelas/klub gabungan.
4. Jam penggunaan kolam untuk les: mengikuti jam buka Kolam Mitra yang
   tercatat di aplikasi, yaitu [ISI SAAT TTD: jam buka–tutup]. Area kolam
   yang boleh dipakai untuk les: [ISI SAAT TTD: misalnya lintasan tepi /
   kolam anak].

## Pasal 2 — Paket dan Harga

1. Kolam Mitra mengusulkan paket les dan harganya melalui aplikasi. Usulan
   berlaku setelah disetujui SPH. Paket yang sudah dibeli member tidak
   berubah bila harga berubah.
2. Harga paket untuk peserta sudah/belum termasuk tiket masuk kolam:
   [ISI HADI].
3. Coach yang mengajar di Kolam Mitra dalam rangka sesi aplikasi
   dikenakan/tidak dikenakan tiket masuk: [ISI HADI].

## Pasal 3 — Coach

1. Coach yang mengajar di Kolam Mitra adalah coach yang telah disetujui SPH
   dan dikaitkan (diafiliasikan) oleh SPH ke Kolam Mitra.
2. Kolam Mitra dapat mengajukan keberatan atas coach tertentu kepada SPH
   dengan alasan tertulis; keputusan akhir: [ISI HADI: SPH / kesepakatan
   bersama]. [CATATAN: di aplikasi saat ini Kolam Mitra tidak dapat
   menambah atau menolak coach sendiri; semua melalui admin SPH.]
3. Kolam Mitra boleh/tidak boleh mengajukan coach miliknya sendiri untuk
   didaftarkan di aplikasi: [ISI HADI].

## Pasal 4 — Eksklusivitas Les Privat

1. Selama perjanjian berlaku, les privat satuan di Kolam Mitra oleh coach
   yang terdaftar di aplikasi hanya dilaksanakan melalui pemesanan di
   aplikasi.
2. Cakupan eksklusivitas: [ISI HADI: pilih salah satu —
   (a) hanya coach yang terdaftar di aplikasi, atau
   (b) seluruh les privat satuan di Kolam Mitra].
   [CATATAN: pilihan (b) menutup celah terbesar (member dan coach
   bertransaksi langsung tanpa aplikasi), tetapi paling sulit disetujui
   kolam. Ini pertanyaan "The Assignment" office hours: tanyakan ke 3 kolam
   dulu sebelum memilih.]
3. Kolam Mitra membantu memastikan ketentuan ini, dengan cara:
   [ISI HADI: misalnya petugas loket mencocokkan jadwal di aplikasi sebelum
   coach dan peserta masuk]. [CATATAN: fitur daftar hadir harian untuk
   loket belum ada di aplikasi; ditunda sampai ada kolam pertama yang
   menandatangani.]
4. Akibat pelanggaran: [ISI HADI].

## Pasal 5 — Bagi Hasil

1. Member membayar paket kepada SPH melalui Midtrans. Kolam Mitra tidak
   menerima pembayaran langsung dari member untuk sesi aplikasi.
2. **Nilai satu sesi** = harga paket yang dibayar member dibagi jumlah sesi
   paket, dibulatkan ke bawah ke rupiah penuh.
3. Setiap sesi yang ditandai **Hadir**, nilai sesi dibagi:
   - Bagian coach: **[ISI SAAT TTD] %** dari nilai sesi.
   - Bagian Kolam Mitra: **[ISI SAAT TTD] %** dari nilai sesi.
   - Bagian SPH (komisi platform, sudah termasuk PPN bila berlaku): sisanya,
     yaitu **[ISI SAAT TTD] %**, termasuk selisih pembulatan.
   Ketiga persentase berjumlah 100%.
4. Contoh (angka ilustrasi, bukan kesepakatan): paket Rp400.000 untuk 4
   sesi → nilai sesi Rp100.000. Jika coach 55% dan Kolam Mitra 30%, per
   sesi Hadir: coach Rp55.000, Kolam Mitra Rp30.000, SPH Rp15.000.
5. Bagian Kolam Mitra masuk ke saldo Kolam Mitra di aplikasi saat sesi
   ditandai Hadir. Sesi yang **tidak** ditandai Hadir tidak menghasilkan
   bagi hasil, termasuk:
   a. peserta tidak datang tanpa membatalkan: [ISI HADI: tetap tidak ada
      bagi hasil (perilaku sistem saat ini), atau dibagi seperti sesi Hadir
      (butuh perubahan sistem)];
   b. sisa sesi paket yang hangus karena masa berlaku habis: [ISI HADI:
      sama seperti a].
6. Paket yang diberikan gratis/manual oleh admin (tanpa pembayaran) tidak
   menghasilkan bagi hasil.
7. Bila status Hadir dikoreksi menjadi tidak Hadir, bagi hasil sesi itu
   dibatalkan. Koreksi ditolak sistem bila saldo Kolam Mitra sudah tidak
   mencukupi (misalnya sudah dicairkan).
8. Persentase dapat diubah dengan kesepakatan tertulis; perubahan berlaku
   untuk sesi yang ditandai Hadir setelah tanggal perubahan.

## Pasal 6 — Pencairan

1. Kolam Mitra dapat mengajukan pencairan saldo melalui aplikasi, minimal
   Rp50.000 per pengajuan, ke rekening yang terdaftar atas nama
   [ISI SAAT TTD].
2. Saldo dipotong saat pengajuan dibuat. Pengajuan yang gagal/ditolak
   mengembalikan saldo.
3. SPH memproses transfer dan mencatat bukti transfer di aplikasi paling
   lambat [ISI HADI: misalnya 3 hari kerja] sejak pengajuan.
4. Biaya transfer ditanggung: [ISI HADI].
5. Kolam Mitra dapat melihat riwayat saldo, bagi hasil per sesi, dan
   riwayat pencairan di aplikasi setiap saat.

## Pasal 7 — Pembatalan dan Pengembalian Dana

1. Aturan pembatalan member mengikuti Syarat & Ketentuan aplikasi
   (pembatalan mandiri paling lambat 2 jam sebelum jadwal, sesuai jatah).
2. Pengembalian dana kepada member diputuskan SPH sesuai Kebijakan
   Pengembalian. Bila dana dikembalikan untuk sesi yang bagi hasilnya sudah
   masuk ke saldo Kolam Mitra: [ISI HADI: dipotong dari saldo Kolam Mitra
   berikutnya / ditanggung SPH].

## Pasal 8 — Keselamatan dan Tanggung Jawab

1. Kolam Mitra bertanggung jawab atas kelayakan dan keselamatan fasilitas
   selama sesi, termasuk [ISI HADI + reviewer: lifeguard/petugas jaga,
   P3K, kedalaman kolam untuk peserta anak].
2. Coach bertanggung jawab atas pengajaran dan pengawasan peserta selama
   sesi (diatur dalam perjanjian coach).
3. Penanganan insiden, kewajiban melapor ke SPH dalam [ISI HADI] jam, dan
   asuransi: [ISI HADI + reviewer].

## Pasal 9 — Data Pribadi

1. Kolam Mitra dapat melihat di aplikasi: jadwal sesi di kolamnya, nama
   coach, dan [ISI HADI: nama peserta, atau hanya jumlah peserta].
2. Kolam Mitra wajib menjaga kerahasiaan data tersebut, hanya memakainya
   untuk pelaksanaan sesi, dan tidak menghubungi member untuk menawarkan
   les di luar aplikasi.

## Pasal 10 — Jangka Waktu dan Pengakhiran

1. Perjanjian berlaku [ISI HADI: misalnya 12 bulan] sejak ditandatangani
   dan diperpanjang otomatis kecuali salah satu pihak memberi tahu
   secara tertulis paling lambat [ISI HADI] hari sebelumnya.
2. Salah satu pihak dapat mengakhiri lebih awal dengan pemberitahuan
   tertulis [ISI HADI] hari sebelumnya.
3. Saat berakhir: sesi yang sudah dipesan tetap dilaksanakan/dialihkan
   [ISI HADI]; saldo Kolam Mitra dicairkan penuh; kolam dinonaktifkan di
   aplikasi (jadwal kolam nonaktif tidak lagi dapat dipesan).

## Pasal 11 — Lain-lain

1. Perjanjian tunduk pada hukum Republik Indonesia. Sengketa diselesaikan
   secara musyawarah, bila tidak tercapai melalui [ISI HADI + reviewer].
2. Perubahan perjanjian hanya sah bila dibuat tertulis dan ditandatangani
   kedua pihak.

| SPH | Kolam Mitra |
|---|---|
| (nama, jabatan, tanda tangan, meterai) | (nama, jabatan, tanda tangan, meterai) |

---

## Lampiran untuk Hadi: keputusan yang masih kosong

1. Nama penyelenggara SPH.
2. Tiket masuk kolam: peserta (Pasal 2.2) dan coach (Pasal 2.3).
3. Keberatan kolam atas coach & coach milik kolam (Pasal 3).
4. **Cakupan eksklusivitas (Pasal 4.2)** — tanyakan dulu ke 3 kolam.
5. Cara kolam membantu eksklusivitas & sanksi (Pasal 4.3–4.4).
6. **Bagi hasil untuk peserta tidak datang & sesi hangus (Pasal 5.5)** —
   sistem saat ini: tidak dibagi (uang tetap di SPH).
7. SLA & biaya transfer pencairan (Pasal 6).
8. Refund untuk sesi yang bagi hasilnya sudah masuk (Pasal 7.2).
9. Keselamatan, insiden, asuransi (Pasal 8).
10. Kolam lihat nama peserta atau tidak (Pasal 9.1).
11. Jangka waktu & pengakhiran (Pasal 10).
12. Forum sengketa (Pasal 11).
