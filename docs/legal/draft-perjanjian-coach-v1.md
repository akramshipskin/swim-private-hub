# DRAFT Perjanjian Kemitraan Coach — v1

> **Status: DRAFT template, BELUM BOLEH DITANDATANGANI.** Ditulis Claude
> (Opus) 29 Sep 2026. Claude bukan penasihat hukum; wajib direview orang
> hukum. Pasangan dari `draft-mou-kolam-v1.md`; mekanisme uang sama dan
> sudah dicocokkan dengan kode (`src/lib/wallet.ts`, `src/lib/cancel-booking.ts`,
> `src/lib/withdrawal.ts`). Persentase coach mengikuti kolam tempat sesi
> diajar (per kolam, bukan per coach).
>
> [CATATAN REVIEWER: status coach adalah mitra independen, bukan karyawan.
> Pastikan isi perjanjian (kendali jadwal oleh coach sendiri, tidak ada gaji
> tetap) konsisten dengan status itu.]
>
> **Update 29 Sep malam:** memuat keputusan Hadi (batas 24 jam tandai
> hadir, bayaran 50% saat peserta tidak datang, tombol Laporkan member,
> murid bawaan lewat kode afiliasi, gabung gratis). Pasal bertanda
> **[BELUM ADA DI SISTEM]** menjanjikan perilaku yang BELUM dikode; draft
> tidak boleh ditandatangani sebelum kodenya jalan atau pasalnya disesuaikan.

---

**PERJANJIAN KEMITRAAN COACH SWIM PRIVATE HUB**
Nomor: [ISI SAAT TTD]

Pada tanggal [ISI SAAT TTD], antara:

1. **[ISI HADI: nama PT Perorangan — sedang proses pendirian; tanyakan reviewer siapa yang menandatangani sebelum akta/NIB terbit]**, selanjutnya disebut **"SPH"**; dan
2. **[ISI SAAT TTD: nama coach]**, NIK [ISI SAAT TTD], beralamat di
   [ISI SAAT TTD], selanjutnya disebut **"Coach"**,

sepakat sebagai berikut.

## Pasal 1 — Hubungan Para Pihak

1. Coach adalah mitra independen yang mengajar les renang privat melalui
   aplikasi Swim Private Hub. Perjanjian ini bukan perjanjian kerja.
2. Coach menentukan sendiri jadwal yang dibuka di aplikasi, per kolam mitra
   tempat Coach diafiliasikan oleh SPH.
3. Bergabung sebagai Coach tidak dikenakan biaya pendaftaran maupun
   langganan. Imbalan SPH hanya komisi platform (bagian SPH dari nilai sesi,
   Pasal 4).

## Pasal 2 — Syarat Coach

1. Akun Coach aktif setelah disetujui SPH.
2. Sertifikat renang/lifeguard yang diunggah diperiksa SPH; badge
   "Bersertifikat" hanya tampil setelah disetujui.
3. Coach menjamin data profil (nama, umur, keahlian, sertifikat) benar.
4. Persyaratan tambahan (misalnya sertifikat minimal untuk mengajar anak):
   [ISI HADI].

## Pasal 3 — Pelaksanaan Sesi

1. Setiap sesi adalah les privat satu coach untuk satu peserta.
2. Coach wajib hadir tepat waktu dan menandai kehadiran peserta (Hadir /
   Tidak Hadir) di aplikasi paling lambat 24 jam setelah sesi selesai. Lewat
   batas itu hanya administrator SPH yang dapat menandai, dan sesi yang
   belum ditandai tidak menghasilkan bagi hasil sampai ditandai.
   **[BELUM ADA DI SISTEM]** [CATATAN: Hadi menyebut alasannya supaya coach
   disiplin.]
3. Bila berhalangan, Coach membatalkan sesi melalui aplikasi selambatnya
   [ISI HADI] jam sebelum jadwal. Sesi peserta otomatis kembali ke paketnya
   dan peserta mendapat notifikasi.
4. Pembatalan oleh Coach yang berulang: [ISI HADI: batas & akibatnya].
5. Coach dilarang menandai Hadir untuk sesi yang tidak terlaksana, dan
   dilarang menandai peserta Tidak Hadir bila peserta sebenarnya hadir atau
   bila Coach sendiri yang tidak hadir/tidak mengajar. Pelanggaran:
   [ISI HADI].
6. Tiket masuk kolam untuk Coach dalam sesi aplikasi tidak ditagihkan kepada
   Coach (sudah tercakup dalam bagian Kolam Mitra dari nilai sesi).

## Pasal 4 — Bagi Hasil

1. Coach tidak menentukan tarif sendiri. Harga paket ditentukan per kolam
   (diusulkan kolam, disetujui SPH).
2. **Nilai satu sesi** = harga paket yang dibayar member dibagi jumlah sesi
   paket, dibulatkan ke bawah ke rupiah penuh.
3. Untuk setiap sesi yang ditandai **Hadir**, Coach menerima persentase
   bagian coach yang berlaku di **kolam tempat sesi itu diajar**, sesuai
   perjanjian SPH dengan kolam tersebut. Persentase per kolam dapat dilihat
   Coach di aplikasi: [ISI HADI: pastikan ini benar-benar tampil untuk
   coach, atau cantumkan di lampiran perjanjian].
4. Sesi yang tidak ditandai Hadir tidak menghasilkan bagi hasil, dengan
   pengecualian: bila peserta **sudah memesan tetapi tidak datang** (tanpa
   membatalkan sesuai S&K) dan Coach menandainya Tidak Hadir dalam batas
   waktu, Coach menerima **50% dari bagian coach yang normal** untuk sesi
   itu (contoh: nilai sesi Rp100.000, coach 40% = Rp40.000 → Rp20.000
   bila peserta tidak datang). Kolam Mitra menerima Rp0; sisanya menjadi
   milik SPH. Sisa sesi paket yang hangus karena masa berlaku habis tidak
   menghasilkan bagi hasil apa pun. **[BELUM ADA DI SISTEM]**
5. Paket gratis/manual dari admin tidak menghasilkan bagi hasil.
6. Bila status Hadir dikoreksi menjadi tidak Hadir, bagi hasil sesi itu
   dibatalkan. Bila saldo Coach sudah tidak mencukupi (misalnya sudah
   dicairkan), saldo menjadi negatif dan dipotong otomatis dari bagi hasil
   sesi berikutnya; saldo negatif tidak dapat dicairkan. Saat perjanjian
   berakhir, saldo negatif diselesaikan: [ISI HADI]. **[BELUM ADA DI
   SISTEM — sistem saat ini menolak koreksi bila saldo tidak cukup.]**
7. Member dapat melaporkan status Tidak Hadir yang tidak sesuai (tombol
   Laporkan) paling lambat 3 hari sejak sesi selesai. SPH memeriksa dan
   dapat mengoreksi status. Bila terbukti Coach yang tidak hadir atau
   menandai tidak sesuai, bagi hasil sesi itu dibatalkan dan Pasal 3.5
   berlaku. **[BELUM ADA DI SISTEM]** [CATATAN: pengaman terhadap coach
   yang tidak datang lalu menandai peserta Tidak Hadir adalah laporan
   member ini.]
8. Paket trial: harga trial ditetapkan SPH. Bagi hasil sesi trial dihitung
   dengan persentase normal dari harga trial; selisih harga dibanding sesi
   reguler ditanggung bersama oleh Coach, Kolam Mitra, dan SPH sesuai
   persentase masing-masing. **[BELUM ADA DI SISTEM]**

## Pasal 5 — Pencairan

1. Coach mengajukan pencairan melalui aplikasi, minimal Rp50.000, ke
   rekening atas nama Coach sendiri.
2. Saldo dipotong saat pengajuan; pengajuan gagal/ditolak mengembalikan
   saldo.
3. SPH memproses transfer secara manual secepatnya dan mencatat bukti
   transfer paling lambat [ISI HADI: batas maksimum] sejak pengajuan. Biaya
   transfer: [ISI HADI]. [CATATAN: Hadi tidak mau menjanjikan jumlah hari
   sampai pencairan otomatis Midtrans disetujui.]
4. Pajak penghasilan atas bagi hasil Coach: [ISI HADI + reviewer: dipotong
   SPH atau dilaporkan Coach sendiri].

## Pasal 6 — Larangan Transaksi di Luar Aplikasi

1. Selama perjanjian berlaku dan [ISI HADI: misalnya 6 bulan] setelah
   berakhir, Coach tidak menawarkan atau menerima pembayaran les secara
   langsung dari member yang dikenal melalui aplikasi.
2. Coach tidak membagikan nomor kontak pribadinya kepada member melalui
   aplikasi untuk tujuan tersebut.
3. Murid yang sudah menjadi murid Coach sebelum bergabung dengan SPH boleh
   didaftarkan ke aplikasi menggunakan kode afiliasi Coach, dengan komisi
   sesuai Pasal 10. Murid bawaan yang tetap dilayani di luar aplikasi:
   [ISI HADI: dikecualikan dari pasal ini atau tidak].
4. Akibat pelanggaran: [ISI HADI: misalnya penonaktifan akun dan/atau
   ganti rugi].

## Pasal 7 — Keselamatan dan Tanggung Jawab

1. Coach bertanggung jawab atas pengajaran dan pengawasan peserta selama
   sesi, termasuk menyesuaikan materi dengan kemampuan dan umur peserta.
2. Coach wajib segera melapor ke SPH dan pihak kolam bila terjadi insiden,
   paling lambat [ISI HADI] jam.
3. Asuransi dan batas tanggung jawab: [ISI HADI + reviewer].
4. SPH adalah penyedia platform dan bertanggung jawab atas pemesanan,
   jadwal, pencatatan, penerimaan pembayaran, dan pembagian dana. SPH tidak
   mengelola fasilitas kolam dan tidak mengajar. [CATATAN REVIEWER: batas
   pelepasan tanggung jawab SPH terhadap konsumen belum tentu berlaku penuh.]

## Pasal 8 — Data Pribadi

1. Coach menerima data peserta sebatas yang diperlukan untuk sesi (nama
   peserta, jadwal, kolam).
2. Coach wajib menjaga kerahasiaan data peserta, termasuk data anak, dan
   tidak memakainya di luar pelaksanaan sesi.

## Pasal 9 — Jangka Waktu dan Pengakhiran

1. Perjanjian berlaku [ISI HADI] dan dapat diakhiri salah satu pihak dengan
   pemberitahuan [ISI HADI] hari.
2. Saat berakhir: sesi terjadwal diselesaikan atau dibatalkan dengan sesi
   dikembalikan ke peserta; saldo Coach dicairkan penuh; akun dinonaktifkan.

## Pasal 10 — Komisi Afiliasi

**[BELUM ADA DI SISTEM — pasal ini menjanjikan fitur yang belum dibuat.]**

1. SPH memberi Coach satu kode afiliasi singkat yang unik.
2. Member baru yang saat mendaftar memasukkan kode itu tercatat dibawa oleh
   Coach. Kode dimasukkan saat pendaftaran dan tidak dapat diubah kemudian
   kecuali oleh administrator SPH. Coach tidak dapat memakai kodenya untuk
   dirinya sendiri.
3. Komisi afiliasi diberikan **satu kali per member baru** (bukan komisi
   tiap sesi), sebesar **5% dari harga paket pertama yang dibayar member**
   (contoh: paket Rp800.000 → Rp40.000; besarnya sama untuk Coach dan
   Kolam Mitra). Dikreditkan setelah member menghadiri sesi pertamanya
   (ditandai Hadir) dan lewat masa 3 hari laporan, supaya pendaftaran palsu
   tidak menghasilkan uang. Paket trial juga dihitung sebagai "paket pertama" (keputusan Hadi 29 Sep):
   komisinya 5% dari harga paket pertama apa pun, reguler atau trial.
4. Program tidak dibatasi waktu selama perjanjian berlaku; Coach dapat
   membawa member kapan saja. SPH dapat mengubah ketentuan afiliasi melalui
   pembaruan perjanjian atau Syarat & Ketentuan, berlaku untuk member yang
   mendaftar setelah perubahan; komisi yang sudah dikreditkan tidak ditarik
   kembali.
5. Komisi afiliasi dibayar SPH dari bagian SPH, bukan dari Member dan bukan
   dari bagian Coach atau Kolam Mitra lainnya. Harga yang dibayar Member
   tidak berubah karena kode.
6. Saldo afiliasi dicairkan mengikuti Pasal 5.
7. Pajak atas komisi afiliasi ditanggung SPH (keputusan Hadi 29 Sep):
   penerima menerima komisi penuh. [ISI HADI + akuntan: mekanisme — SPH
   memotong dan menyetorkan atas nama penerima, atau menambahkan sebesar
   pajak. Claude tidak dapat memastikan besar dan kewajiban pajaknya;
   akuntan wajib mengonfirmasi. Jangan menulis "bebas pajak".]
8. Pendaftaran fiktif atau kecurangan lain: komisi dibatalkan; akibat
   lainnya [ISI HADI].

## Pasal 11 — Lain-lain

Tunduk pada hukum Republik Indonesia; sengketa melalui [ISI HADI + reviewer].

| SPH | Coach |
|---|---|
| (nama, jabatan, tanda tangan, meterai) | (nama, tanda tangan, meterai) |

---

## Lampiran untuk Hadi

### Sudah diputuskan Hadi (29 Sep) dan sudah masuk pasal
- Gabung gratis (Pasal 1.3); tiket masuk coach sudah tercakup (Pasal 3.6).
- Batas 24 jam tandai hadir; admin bebas (Pasal 3.2).
- Peserta tidak datang: coach 50% dari bagian coach, kolam Rp0, sisanya SPH;
  sesi hangus tidak dibayar; member 3 hari untuk melaporkan (Pasal 4.4, 4.7).
- Murid bawaan boleh lewat kode afiliasi (Pasal 6.3); komisi afiliasi satu
  kali per member baru, kode singkat, 5% dari harga paket pertama, cair
  setelah sesi pertama Hadir + 3 hari, pajak ditanggung SPH (Pasal 10).
- Saldo boleh negatif saat koreksi, dipotong dari bagi hasil berikutnya
  (Pasal 4.6).
- SPH = penyedia platform; SPH tanggung jawab keuangan, jadwal, booking
  (Pasal 7.4).

### Masih kosong
1. Nama penyelenggara SPH (PT Perorangan, proses pendirian) dan siapa yang
   menandatangani sebelum akta terbit.
2. Syarat sertifikat tambahan (Pasal 2.4).
3. Batas jam pembatalan coach, sanksi batal berulang dan tanda Hadir palsu
   (Pasal 3).
4. Persentase coach tampil di aplikasi atau di lampiran (Pasal 4.3).
5. Batas maksimum waktu pencairan, biaya transfer, pajak penghasilan coach
   (Pasal 5).
6. Larangan transaksi luar: durasi, sanksi, murid bawaan di luar aplikasi
   (Pasal 6).
7. Insiden dan asuransi (Pasal 7).
8. Mekanisme pajak komisi afiliasi dan sanksi (Pasal 10).
9. Jangka waktu dan forum sengketa (Pasal 9 dan 11).
