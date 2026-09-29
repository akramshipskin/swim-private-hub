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
>
> **Update 29 Sep malam:** memuat keputusan Hadi (kolam tidak eksklusif,
> tiket masuk sudah termasuk, kolam tidak boleh menolak coach, bayaran saat
> peserta tidak datang, komisi afiliasi). Pasal yang bertanda
> **[BELUM ADA DI SISTEM]** menjanjikan perilaku yang BELUM dikode (batas
> 24 jam tandai hadir, bayaran 50% coach saat tidak hadir, tombol Laporkan
> member, komisi afiliasi). Draft ini tidak boleh ditandatangani sebelum
> kodenya jalan atau pasalnya disesuaikan.

---

**PERJANJIAN KERJA SAMA KOLAM MITRA SWIM PRIVATE HUB**
Nomor: [ISI SAAT TTD]

Pada tanggal [ISI SAAT TTD], yang bertanda tangan di bawah ini:

1. **[ISI HADI: nama PT Perorangan — sedang proses pendirian; tanyakan reviewer siapa yang menandatangani sebelum akta/NIB terbit]**, beralamat di
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
5. Kerja sama ini tidak berbayar bagi Kolam Mitra: tidak ada biaya
   pendaftaran maupun langganan. Imbalan SPH hanya komisi pada Pasal 5.
6. SPH tidak menetapkan batas jumlah les yang berjalan bersamaan di Kolam
   Mitra. Bila kapasitas kolam terganggu, Kolam Mitra memberi tahu SPH dan
   SPH menyesuaikan jadwal yang tampil di aplikasi dalam [ISI HADI: berapa
   jam]. [CATATAN: sistem tidak punya batas per jam (keputusan Hadi 29 Sep);
   penyesuaian dilakukan admin secara manual. Fakta lapangan: kolam Cianjur
   sudah penuh 3 club, sehingga kapasitas nyata dan bisa jadi keberatan.]

## Pasal 2 — Paket dan Harga

1. Kolam Mitra mengusulkan paket les dan harganya melalui aplikasi. Usulan
   berlaku setelah disetujui SPH. Paket yang sudah dibeli member tidak
   berubah bila harga berubah. SPH memberi keputusan atas usulan paling
   lambat 1×24 jam sejak diterima [ISI HADI: kalender atau hari kerja].
2. Harga paket untuk peserta **sudah termasuk** tiket masuk kolam untuk
   peserta.
3. Coach yang mengajar di Kolam Mitra dalam rangka sesi aplikasi tidak
   membayar tiket masuk secara terpisah; tiket masuk coach sudah tercakup
   dalam bagian Kolam Mitra dari nilai sesi (Pasal 5).
4. Peserta boleh didampingi 1 (satu) pendamping pada satu waktu (boleh
   bergantian) yang tidak berenang; pendamping tidak dikenakan tiket masuk.
   [CATATAN: butir 2–4 dikonfirmasi Hadi 29 Sep sebagai keinginan SPH;
   setiap kolam harus setuju saat TTD, dan bagian Kolam Mitra pada Pasal 5
   harus cukup menutup tiket coach + peserta.]

## Pasal 3 — Coach

1. Coach yang mengajar di Kolam Mitra adalah coach yang telah disetujui SPH
   dan dikaitkan (diafiliasikan) oleh SPH ke Kolam Mitra.
2. Kolam Mitra tidak dapat menolak coach yang telah disetujui SPH dan
   diafiliasikan ke Kolam Mitra. Kolam Mitra dapat melaporkan pelanggaran
   tata tertib atau keselamatan oleh coach kepada SPH, dan SPH menindaklanjuti
   dalam [ISI HADI: batas waktu]. [CATATAN: keputusan Hadi 29 Sep; sesuai
   sistem (semua melalui admin SPH). Ini butir yang paling mungkin ditawar
   kolam.]
3. Kolam Mitra boleh/tidak boleh mengajukan coach miliknya sendiri untuk
   didaftarkan di aplikasi: [ISI HADI].

## Pasal 4 — Sifat Kerja Sama dan Larangan Transaksi di Luar Aplikasi

1. Kerja sama ini **tidak eksklusif atas pengunjung**. Kolam Mitra tetap
   kolam umum yang menerima pengunjung dari sumber mana pun, termasuk yang
   datang melalui SPH. Kerja sama ini tidak membatasi Kolam Mitra menerima
   pengunjung, klub, atau les dari pihak lain.
2. Les privat melalui SPH adalah les satu lawan satu antara coach dan
   peserta di kolam umum; bukan penyewaan kolam atau lintasan, dan tidak
   memberi SPH maupun coach hak menguasai area kolam.
3. Yang dijaga: les privat satuan di Kolam Mitra oleh **coach yang terdaftar
   di aplikasi** kepada member yang dikenal melalui aplikasi hanya
   dilaksanakan melalui pemesanan di aplikasi. Kewajiban ini mengikat coach
   melalui perjanjian coach; Kolam Mitra tidak memfasilitasi transaksi
   langsung antara coach mitra SPH dan member tersebut.
4. Akibat pelanggaran oleh Kolam Mitra: [ISI HADI].
   [CATATAN: opsi lama "eksklusivitas seluruh les privat di kolam" dihapus.
   Alasan: keputusan Hadi 29 Sep (kolam terbuka untuk semua pengunjung) dan
   fakta kolam Cianjur menolak club karena sudah penuh 3 club, bukan karena
   preferensi. Fitur daftar hadir loket tetap ditunda sampai ada kolam
   pertama yang menandatangani.]

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
4. Contoh (angka ilustrasi, bukan kesepakatan): paket Rp800.000 untuk 8
   sesi → nilai sesi Rp100.000. Jika coach 40%, Kolam Mitra 50%, SPH 10%,
   per sesi Hadir: coach Rp40.000; Kolam Mitra Rp50.000 (setara tiket masuk
   coach Rp25.000 + peserta Rp25.000); SPH Rp10.000 (sudah termasuk PPN 12%
   ± Rp1.071, bersih ± Rp8.929). Bila peserta tidak datang (butir 5a): coach
   Rp20.000, Kolam Mitra Rp0, SPH Rp80.000.
5. Bagian Kolam Mitra masuk ke saldo Kolam Mitra di aplikasi saat sesi
   ditandai Hadir. Sesi yang **tidak** ditandai Hadir tidak menghasilkan
   bagi hasil, dengan pengecualian dan penegasan berikut:
   a. **Peserta sudah memesan tetapi tidak datang** (tanpa membatalkan
      sesuai S&K): Coach menerima 50% dari bagian coach yang normal,
      Kolam Mitra menerima Rp0, dan sisanya menjadi milik SPH.
      **[BELUM ADA DI SISTEM — sistem saat ini tidak membagi apa pun.]**
      [CATATAN NEGOSIASI: SPH menerima jauh lebih banyak dari sesi tidak
      hadir (contoh Rp80.000 vs Rp10.000) sementara kolam menyiapkan
      lintasan dan menerima Rp0. Kolam kemungkinan menawar; siapkan
      jawabannya. Perlakuan PPN atas selisih ini: tanya akuntan.]
   b. **Sisa sesi paket yang hangus** karena masa berlaku habis: tidak ada
      bagi hasil bagi siapa pun.
6. Paket yang diberikan gratis/manual oleh admin (tanpa pembayaran) tidak
   menghasilkan bagi hasil.
7. Bila status Hadir dikoreksi menjadi tidak Hadir, bagi hasil sesi itu
   dibatalkan. Bila saldo Kolam Mitra sudah tidak mencukupi (misalnya sudah
   dicairkan), saldo menjadi negatif dan dipotong otomatis dari bagi hasil
   sesi berikutnya; saldo negatif tidak dapat dicairkan. Saat perjanjian
   berakhir, saldo negatif diselesaikan: [ISI HADI]. **[BELUM ADA DI SISTEM —
   sistem saat ini menolak koreksi bila saldo tidak cukup.]** [KONFIRMASI
   HADI: keputusan Hadi 29 Sep untuk coach; Claude mengasumsikan berlaku
   sama untuk kolam.]
8. Persentase dapat diubah dengan kesepakatan tertulis; perubahan berlaku
   untuk sesi yang ditandai Hadir setelah tanggal perubahan.
9. Coach menandai kehadiran paling lambat 24 jam setelah sesi selesai; lewat
   itu hanya administrator SPH yang dapat menandai, dan sesi yang belum
   ditandai tidak menghasilkan bagi hasil sampai ditandai.
   **[BELUM ADA DI SISTEM]**
10. Member dapat melaporkan status Tidak Hadir yang tidak sesuai (tombol
    Laporkan) paling lambat 3 hari sejak sesi selesai. SPH memeriksa dan
    dapat mengoreksi status; koreksi menjadi Hadir menghasilkan bagi hasil
    normal, dan koreksi sebaliknya mengikuti butir 7.
    **[BELUM ADA DI SISTEM]**

## Pasal 6 — Pencairan

1. Kolam Mitra dapat mengajukan pencairan saldo melalui aplikasi, minimal
   Rp50.000 per pengajuan, ke rekening yang terdaftar atas nama
   [ISI SAAT TTD].
2. Saldo dipotong saat pengajuan dibuat. Pengajuan yang gagal/ditolak
   mengembalikan saldo.
3. SPH memproses transfer secara manual secepatnya dan mencatat bukti
   transfer di aplikasi paling lambat [ISI HADI: batas maksimum]
   sejak pengajuan. [CATATAN: Hadi tidak mau menjanjikan jumlah hari sampai
   pencairan otomatis Midtrans disetujui; perjanjian umumnya butuh batas
   angka, putuskan bersama reviewer.]
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
4. SPH adalah penyedia platform dan bertanggung jawab atas pemesanan,
   jadwal, pencatatan, penerimaan pembayaran, dan pembagian dana. SPH tidak
   mengelola fasilitas kolam dan tidak mengajar. [CATATAN REVIEWER: batas
   pelepasan tanggung jawab SPH terhadap konsumen belum tentu berlaku penuh
   karena SPH memegang dana dan mempertemukan para pihak.]

## Pasal 9 — Data Pribadi

1. Kolam Mitra dapat melihat di aplikasi: jadwal sesi di kolamnya, nama
   coach, serta nama dan jumlah peserta (keputusan Hadi 29 Sep).
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

## Pasal 11 — Komisi Afiliasi

**[BELUM ADA DI SISTEM — pasal ini menjanjikan fitur yang belum dibuat.]**

1. SPH memberi Kolam Mitra satu kode afiliasi singkat yang unik.
2. Member baru yang saat mendaftar memasukkan kode itu tercatat dibawa oleh
   Kolam Mitra. Kode dimasukkan saat pendaftaran dan tidak dapat diubah
   kemudian kecuali oleh administrator SPH. Kolam Mitra tidak dapat memakai
   kodenya untuk dirinya sendiri.
3. Komisi afiliasi diberikan **satu kali per member baru** (bukan komisi
   tiap sesi), sebesar **5% dari harga paket pertama yang dibayar member**
   (contoh: paket Rp800.000 → Rp40.000; besarnya sama untuk Coach dan
   Kolam Mitra). Dikreditkan setelah member menghadiri sesi pertamanya
   (ditandai Hadir) dan lewat masa 3 hari laporan, supaya pendaftaran palsu
   tidak menghasilkan uang. [KONFIRMASI HADI: apakah paket trial dihitung
   sebagai "paket pertama" — bila ya, komisinya 5% dari harga trial.]
4. Program tidak dibatasi waktu selama perjanjian berlaku. SPH dapat
   mengubah ketentuan afiliasi melalui pembaruan perjanjian atau Syarat &
   Ketentuan, berlaku untuk member yang mendaftar setelah perubahan;
   komisi yang sudah dikreditkan tidak ditarik kembali.
5. Komisi afiliasi dibayar SPH dari bagian SPH, bukan dari Member dan bukan
   dari bagian coach atau bagian Kolam Mitra lainnya. Harga yang dibayar
   Member tidak berubah karena kode.
6. Saldo afiliasi dicairkan mengikuti Pasal 6.
7. Pajak atas komisi afiliasi ditanggung SPH (keputusan Hadi 29 Sep):
   penerima menerima komisi penuh. [ISI HADI + akuntan: mekanisme — SPH
   memotong dan menyetorkan atas nama penerima, atau menambahkan sebesar
   pajak. Claude tidak dapat memastikan besar dan kewajiban pajaknya;
   akuntan wajib mengonfirmasi. Jangan menulis "bebas pajak".]
8. Pendaftaran fiktif atau kecurangan lain: komisi dibatalkan; akibat
   lainnya [ISI HADI].

## Pasal 12 — Lain-lain

1. Perjanjian tunduk pada hukum Republik Indonesia. Sengketa diselesaikan
   secara musyawarah, bila tidak tercapai melalui [ISI HADI + reviewer].
2. Perubahan perjanjian hanya sah bila dibuat tertulis dan ditandatangani
   kedua pihak.

| SPH | Kolam Mitra |
|---|---|
| (nama, jabatan, tanda tangan, meterai) | (nama, jabatan, tanda tangan, meterai) |

---

## Lampiran untuk Hadi

### Sudah diputuskan Hadi (29 Sep) dan sudah masuk pasal
- SPH = penyedia platform; SPH tanggung jawab keuangan, jadwal, booking;
  kolam dan coach tanggung jawab keselamatan (Pasal 8.4).
- Tiket masuk peserta dan coach sudah termasuk; pendamping gratis (Pasal 2).
- Kolam tidak boleh menolak coach (Pasal 3.2).
- Kolam tidak eksklusif atas pengunjung; privat = 1 lawan 1 di kolam umum
  (Pasal 4); tidak ada batas les barengan (Pasal 1.6).
- Bagi hasil contoh 40/50/10; peserta tidak datang: coach 50% dari bagian
  coach, kolam Rp0, sisanya SPH; sesi hangus: tidak ada (Pasal 5).
- Batas 24 jam tandai hadir; member 3 hari untuk melaporkan (Pasal 5.9–5.10).
- Kolam melihat nama peserta (Pasal 9.1). Gabung gratis (Pasal 1.5).
- Komisi afiliasi satu kali per member baru, kode singkat, 5% dari harga
  paket pertama, cair setelah sesi pertama Hadir + 3 hari, pajak ditanggung
  SPH (Pasal 11).
- Pendamping 1 orang pada satu waktu, boleh bergantian (Pasal 2.4).
- Saldo boleh negatif saat koreksi, dipotong dari bagi hasil berikutnya
  (Pasal 5.7).

### Masih kosong
1. Nama penyelenggara SPH (PT Perorangan, proses pendirian) dan siapa yang
   menandatangani sebelum akta terbit.
2. Penyelesaian saldo negatif saat perjanjian berakhir (Pasal 5.7).
3. Batas waktu SPH menyesuaikan jadwal saat kapasitas terganggu (1.6),
   menindaklanjuti laporan atas coach (3.2), keputusan usulan paket (2.1).
4. Akibat pelanggaran anti-bypass oleh kolam (Pasal 4.4).
5. Batas maksimum waktu pencairan dan biaya transfer (Pasal 6).
6. Refund untuk sesi yang bagi hasilnya sudah masuk (Pasal 7.2).
7. Insiden, jam pelaporan, asuransi (Pasal 8).
8. Mekanisme pajak komisi afiliasi, paket trial dihitung "paket pertama"
   atau tidak, sanksi (Pasal 11).
9. Jangka waktu dan pengakhiran (Pasal 10), forum sengketa (Pasal 12).
10. Angka persentase coach/kolam/SPH per kolam (Pasal 5.3) dan tanya 3
    kolam soal 4 pertanyaan baru.
