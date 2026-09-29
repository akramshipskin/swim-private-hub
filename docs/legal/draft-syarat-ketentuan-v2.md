# DRAFT Syarat & Ketentuan Swim Private Hub — v2

> **Status: DRAFT, BELUM BERLAKU.** Ditulis Claude (Opus) 29 Sep 2026 dari
> keputusan office hours (`docs/designs/validasi-permintaan-dan-kejujuran-landing.md`).
> Claude bukan penasihat hukum. Wajib direview orang hukum sebelum
> dipasang ke `src/app/syarat-ketentuan/page.tsx`. Mengganti S&K berarti
> mengubah `TERMS_UPDATED_AT` di `src/lib/legal.ts`, sehingga versi
> persetujuan pengguna ikut berubah.
>
> Tanda `[ISI HADI: ...]` = keputusan bisnis yang belum diambil. Jangan
> dipasang selama masih ada tanda ini.

## A. Kenapa S&K perlu diubah (ringkasan untuk reviewer)

1. **Posisi SPH berubah.** S&K live (versi 10 Sep 2026) menyebut aplikasi
   hanya "sarana bantu administrasi pemesanan dan pembayaran". Kenyataan
   sistem: pembayaran member masuk ke akun Midtrans milik penyelenggara SPH,
   disimpan, lalu dibagikan ke kolam dan coach setiap sesi ditandai Hadir.
   SPH juga mencari dan memilih kolam serta coach mitra. Hadi memutuskan
   (29 Sep): SPH = marketplace penuh, memegang dana dan hubungan dengan
   pelanggan.
2. **Satu kalimat live bertentangan dengan sistem.** Pasal 3 live: "hanya sesi
   berstatus Hadir yang dihitung sebagai terpakai". Sistem sebenarnya: jatah
   sesi dipotong saat booking dan hanya kembali bila booking dibatalkan
   (oleh member sesuai ketentuan, oleh coach, atau oleh admin). Peserta yang
   tidak datang tanpa membatalkan tetap terpotong sesinya. FAQ landing sudah
   menulis yang benar; S&K yang salah.
3. **Les privat 1:1** belum tertulis di S&K.

## B. Ringkasan perubahan per pasal

| Pasal | Live | Draft v2 |
|---|---|---|
| Pembuka | "aplikasi pemesanan dan manajemen" | Menjelaskan SPH sebagai penyelenggara platform yang menghubungkan member, coach, kolam, dan menerima pembayaran |
| 1 Akun | tetap | + satu akun satu orang/wali, larangan berbagi akun |
| 2 Paket | tetap | + les privat 1 coach : 1 peserta; + masa berlaku paket; + sisa sesi saat paket berakhir |
| 3 Pemesanan & Pembatalan | kalimat "hanya Hadir dihitung terpakai" (salah) | Diganti dengan aturan yang sesuai sistem (batas 2 jam, jatah batal, tidak hadir = terpakai, coach batal = sesi kembali) |
| 4 Pembayaran | Midtrans + link refund | + pembayaran diterima penyelenggara SPH, dibagikan ke mitra per sesi Hadir |
| 5 Kewajiban | tetap | + larangan transaksi di luar aplikasi dengan coach/kolam yang dikenal lewat aplikasi |
| 6 Tanggung jawab | "sarana bantu administrasi", semua ke penyelenggara les | Dipisah per pihak; batas tanggung jawab SPH; keselamatan di kolam — **[ISI HADI + reviewer]** |
| 7-9 | tetap | tetap (7 ditambah pemberitahuan perubahan) |
| Baru 10 | — | Data pribadi (merujuk Kebijakan Privasi) |

## C. Teks draft

**Syarat & Ketentuan Swim Private Hub**
Terakhir diperbarui: [ISI TANGGAL SAAT DIPASANG]

Swim Private Hub ("SPH", "kami") diselenggarakan oleh [ISI HADI: nama
penyelenggara — perorangan atas nama siapa, atau badan usaha (CV/PT) dengan
nama lengkap] yang beralamat di [alamat sesuai `BUSINESS_ADDRESS`]. Dengan
mendaftar dan menggunakan aplikasi Swim Private Hub ("Aplikasi"), Pengguna
menyatakan telah membaca dan menyetujui Syarat & Ketentuan ini.

**Definisi.** "Member" adalah pengguna yang membeli paket les untuk dirinya
dan/atau peserta yang didaftarkannya. "Peserta" adalah orang yang mengikuti
les (member sendiri atau anak/tanggungannya). "Coach" adalah pelatih renang
mitra SPH. "Kolam Mitra" adalah pengelola kolam renang yang bekerja sama
dengan SPH. "Sesi" adalah satu pertemuan les pada jadwal yang dipesan.

**Peran SPH.** SPH menyelenggarakan platform yang mempertemukan Member dengan
Coach dan Kolam Mitra, menerima pembayaran paket dari Member, dan membagikan
bagian Coach dan Kolam Mitra setelah sesi terlaksana. Pengajaran renang
dilakukan oleh Coach di fasilitas Kolam Mitra. [CATATAN REVIEWER: tentukan
kualifikasi hukum peran SPH atas dana — agen penerima pembayaran atas nama
mitra, atau penjual jasa yang mensubkontrakkan — karena memengaruhi pajak,
tanggung jawab, dan kewajiban perizinan.]

**1. Akun**
1. Pengguna wajib mengisi data pendaftaran (nama, nomor telepon, kata sandi)
   dengan benar.
2. Satu akun Member dapat memiliki beberapa Peserta (diri sendiri dan/atau
   anak). Member yang mendaftarkan anak menyatakan dirinya orang tua/wali
   yang berwenang.
3. Pengguna bertanggung jawab atas kerahasiaan kata sandi dan tidak boleh
   meminjamkan akunnya kepada orang lain.

**2. Paket dan Sesi**
1. Les di SPH adalah les privat: setiap Sesi adalah satu Coach untuk satu
   Peserta, bukan kelas gabungan.
2. Paket terdiri atas sejumlah Sesi dan berlaku di kolam tempat paket dibeli,
   selama masa berlaku yang tertera saat pembelian.
3. Member yang masih memiliki paket aktif dapat membeli paket 1 Sesi di Kolam
   Mitra lain dengan harga per sesi termahal kolam tersebut ditambah 20%, berlaku
   14 hari sejak pembayaran berhasil.
4. Paket aktif otomatis setelah pembayaran berhasil dikonfirmasi sistem.
5. Sisa Sesi dan jatah pembatalan berlaku per Peserta dan tidak dapat
   dipindahkan ke Peserta lain kecuali melalui administrator.
6. Durasi satu Sesi: [ISI HADI: misalnya 60 menit, atau "sesuai ketentuan
   Kolam Mitra yang tertera di aplikasi"].
7. Sisa Sesi yang tidak dipakai sampai masa berlaku paket berakhir:
   [ISI HADI: hangus tanpa pengembalian dana / dapat diperpanjang dengan
   syarat tertentu]. [CATATAN: saat ini sistem tidak memindahkan uang sesi
   yang hangus ke Coach atau Kolam Mitra; uang tersebut tetap di SPH.]
8. Harga paket sudah/belum termasuk tiket masuk kolam untuk Peserta:
   [ISI HADI].

**3. Pemesanan dan Pembatalan**
1. Pemesanan tunduk pada ketersediaan jadwal Coach di kolam yang dipilih.
   Satu jadwal hanya dapat dipesan oleh satu Peserta.
2. Setiap pemesanan mengurangi satu Sesi dari paket.
3. Member dapat membatalkan sendiri paling lambat 2 (dua) jam sebelum jadwal
   selama jatah pembatalan paket masih tersedia; Sesi kembali ke paket dan
   jatah pembatalan berkurang satu. Di luar ketentuan itu, pembatalan hanya
   melalui administrator.
4. Peserta yang tidak hadir tanpa membatalkan sesuai butir 3: Sesi tetap
   dihitung terpakai.
5. Apabila Coach atau administrator membatalkan jadwal, Sesi kembali ke paket
   tanpa mengurangi jatah pembatalan Member.
6. Kehadiran ditandai oleh Coach atau administrator setelah Sesi selesai.

**4. Pembayaran**
1. Pembayaran diproses melalui Midtrans (virtual account, QRIS, dompet
   digital, kartu debit/kredit) dan diterima oleh penyelenggara SPH.
2. Bagian Coach dan Kolam Mitra dibayarkan oleh SPH berdasarkan perjanjian
   kemitraan masing-masing, setelah Sesi ditandai Hadir. Member tidak
   melakukan pembayaran langsung kepada Coach atau Kolam Mitra untuk Sesi
   yang dipesan melalui Aplikasi.
3. Pengembalian dana diatur dalam Kebijakan Pengembalian.

**5. Kewajiban Pengguna**
1. Menggunakan Aplikasi hanya untuk pemesanan les renang yang sah.
2. Tidak menyalahgunakan sistem, termasuk pemesanan ganda dengan itikad tidak
   baik atau manipulasi data.
3. Data Peserta wajib akurat; kesalahan data menjadi tanggung jawab Member
   yang mendaftarkan.
4. Tidak melakukan pemesanan atau pembayaran les secara langsung (di luar
   Aplikasi) dengan Coach yang dikenal melalui Aplikasi untuk les di Kolam
   Mitra. [ISI HADI: berlaku selama berapa lama setelah Sesi terakhir, dan
   akibatnya — misalnya penonaktifan akun. CATATAN REVIEWER: kewajiban utama
   anti-transaksi-luar sebaiknya diletakkan pada Coach dan Kolam Mitra lewat
   perjanjian, bukan pada konsumen; nilai keberlakuan klausul ini terhadap
   Member perlu dikaji.]

**6. Tanggung Jawab**
1. Coach bertanggung jawab atas pelaksanaan dan kualitas pengajaran.
2. Kolam Mitra bertanggung jawab atas kelayakan, kebersihan, dan keselamatan
   fasilitas kolam, termasuk [ISI HADI + reviewer: petugas penyelamat/lifeguard,
   P3K].
3. Member/orang tua/wali bertanggung jawab atas pengawasan Peserta anak di
   luar waktu Sesi dan atas kondisi kesehatan Peserta yang diketahuinya.
4. SPH bertanggung jawab atas pemesanan, pencatatan, penerimaan pembayaran,
   dan pembagian dana sesuai Syarat & Ketentuan ini. Tanggung jawab SPH
   atas kerugian yang timbul dari penggunaan Aplikasi dibatasi sampai
   [ISI HADI + reviewer: misalnya nilai paket yang dibayarkan].
5. Penanganan insiden/kecelakaan di kolam dan asuransi: [ISI HADI + reviewer].

**7. Perubahan Layanan**
Fitur, harga paket, dan ketentuan ini dapat berubah. Perubahan ketentuan
diberitahukan melalui Aplikasi dan berlaku setelah Pengguna menyetujui
versi baru. Perubahan harga tidak berlaku surut terhadap paket yang telah
dibeli.

**8. Hukum yang Berlaku**
Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia.
[ISI HADI + reviewer: forum penyelesaian sengketa.]

**9. Kontak**
WhatsApp +62 821-1717-3124 atau email hello@swimprivatehub.biz.id.
Alamat: [BUSINESS_ADDRESS].

**10. Data Pribadi**
Pengolahan data pribadi, termasuk data anak, diatur dalam Kebijakan Privasi.
Coach dan Kolam Mitra hanya menerima data Peserta yang diperlukan untuk
melaksanakan Sesi. [ISI HADI: apakah Kolam Mitra melihat nama Peserta —
backlog item 2.4.]

## D. Daftar keputusan yang masih kosong (untuk Hadi)

1. Nama penyelenggara (perorangan/CV/PT).
2. Durasi satu Sesi.
3. Nasib sisa Sesi saat paket berakhir (dan uangnya).
4. Tiket masuk kolam untuk Peserta: termasuk harga paket atau tidak.
5. Larangan transaksi di luar Aplikasi untuk Member: jangka waktu & akibat.
6. Tanggung jawab keselamatan, lifeguard, insiden, asuransi.
7. Batas tanggung jawab SPH.
8. Forum sengketa.
9. Kolam Mitra boleh melihat nama Peserta atau tidak.

## E. Untuk reviewer hukum (pertanyaan terbuka)

1. Kualifikasi hukum SPH yang menerima dan menahan dana sebelum dibagikan:
   apakah memerlukan izin tertentu (misalnya terkait penyelenggaraan sistem
   pembayaran/penampungan dana) atau cukup sebagai penjual jasa.
2. Perlakuan PPN atas komisi platform (sistem menghitung PPN 12% di dalam
   komisi platform) dan status PKP penyelenggara.
3. Kesesuaian dengan UU Perlindungan Konsumen (klausula baku, batas tanggung
   jawab) dan UU Pelindungan Data Pribadi (data anak).
4. Keberlakuan klausul anti-transaksi-luar terhadap konsumen.
