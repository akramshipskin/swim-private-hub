# Animasi landing page (tahap 2) — 1 Okt 2026

## Yang diubah
- Bug ditemukan dan diperbaiki: dengan "kurangi gerakan" menyala (termasuk "hapus animasi" di Android), 17 dari 17 elemen efek-muncul di landing tetap tersembunyi karena HTML server membawa status tersembunyi dan browser mengira sudah terlihat. Sekarang sembunyi/tampil diatur CSS di dalam media `prefers-reduced-motion: no-preference` dan `scripting: enabled`; JavaScript hanya menandai `data-visible`. Dicek: kurangi gerakan = 0 elemen tersembunyi.
- Pembuka (hero) memakai animasi CSS murni (`.hero-rise`), tidak menunggu JavaScript. Dulu teks pembuka tersembunyi sampai hydration selesai, jadi di HP lambat elemen terbesar baru tampil ±2,4 detik.
- HP: geser 1 rem, 0,45 dtik, tanpa jeda bergiliran, tanpa hover, tanpa loop.
- Desktop (≥768 px): geser 1,5 rem, 0,7 dtik, bergiliran (delay per kartu); kartu kolam terangkat saat hover; layar HP di hero masuk dari bawah lalu melayang pelan (hanya ≥1024 px, bisa hover, gerak tidak dikurangi).
- Efek muncul ditambah ke: bilah fakta, pilih peran, dulu-sekarang, orang tua, coach, kolam, cara kerja, testimoni, FAQ, CTA penutup. (Sebelumnya hanya: kartu kolam, kartu coach, sel coach.)
- Judul hero disamakan dengan tagline resmi (3 baris), keputusan Hadi 1 Okt malam.
- Video latar hero: kode siap (`HeroVideo`, hanya desktop, berhenti saat kurangi gerakan / hemat data / jaringan lambat / keluar layar), tempat pasang `HERO_VIDEO` masih kosong menunggu izin unduh dari Hadi.

## Pengukuran (skrip `scripts/ukur-halaman.mjs`, Chrome tanpa layar, 5 ulangan, nilai tengah, cache dikosongkan tiap ulangan)
HP = layar 375, prosesor diperlambat 4×, jaringan ±1,6 Mbps / 150 ms. Desktop = layar 1280, jaringan 10 Mbps / 40 ms.

| Lingkungan | Halaman | Elemen terbesar (LCP) | Teks pertama (FCP) | Berat | CLS | TBT |
|---|---|---|---|---|---|---|
| Laptop, versi jadi, SEBELUM | HP | 2360 ms (paragraf) | 852 ms | 415 KB | 0 | 0 |
| Laptop, versi jadi, SESUDAH | HP | 1044–1176 ms (3 set ukur) | 856 ms | 416 KB | 0 | 0 |
| Laptop, versi jadi, SEBELUM | Desktop | 388 ms (gambar) | 280 ms | 484 KB | 0 | 0 |
| Laptop, versi jadi, SESUDAH | Desktop | 372 ms | 284 ms | 485 KB | 0 | 0 |
| Situs asli, SEBELUM push | HP | 2368 ms | 924 ms | 393 KB | 0 | 0 |
| Situs asli, SEBELUM push | Desktop | 344 ms | 344 ms | 461 KB | 0 | 0 |
| Situs asli, SESUDAH push (6493c3b) | HP | 1540 ms (ulangan: 1688, 1124, 2472, 1540, 1288) | 1048 ms | 394 KB | 0 | 1 |
| Situs asli, SESUDAH push (6493c3b) | Desktop | 332 ms | 332 ms | 462 KB | 0 | 0 |
| Situs asli, sesudah semua perbaikan (fe5de3a) | HP | 1320 ms (ulangan: 1596, 3464, 1116, 1320, 1108) | 908 ms | 395 KB | 0 | - |
| Situs asli, sesudah semua perbaikan (fe5de3a) | Desktop | 376 ms | 376 ms | 463 KB | 0 | - |

Catatan jujur: di situs asli internetnya sungguhan sehingga lebih berisik (satu ulangan HP sesudah = 2472 ms, menyentuh rentang sebelum = 2308–3216 ms); nilai tengah tetap lebih cepat, tapi perbedaannya tidak sejelas di laptop. FCP HP situs asli 924 -> 1048 ms: dalam rentang variasi internet, belum dipastikan sebagai perlambatan atau bukan. pengukuran pertama sesudah build sempat menunjukkan FCP HP 924 ms; dua pengukuran ulang 856 ms (server baru dihidupkan). Angka hanya sebanding dengan angka dari skrip dan laptop yang sama. Bukan Lighthouse, dan bukan HP asli.

## Kandidat video (BELUM diunduh; menunggu izin Hadi)
Lisensi Pexels: gratis dipakai termasuk komersial. Deskripsi "wajah tidak terlihat" dibaca dari halaman Pexels, BELUM dilihat langsung: lihat sendiri sebelum pilih.
1. https://www.pexels.com/video/a-person-swimming-in-the-pool-6012384/ — Tima Miroshnichenko, 20 dtik, 16:9, asli 2560×1440 (25,2 MB; versi 1080p 13,8 MB). Perenang dewasa dari bawah/pinggir kolam, wajah tak terlihat di bidikan utama. Rencana: dipadatkan ke 720p, target ≤2 MB (usulan).
2. https://www.pexels.com/video/slow-motion-video-of-water-ripples-of-the-swimming-pool-6167679/ — Poolside Creative, 59 dtik, 1920×1080, permukaan air tanpa orang. Paling aman dari soal wajah dan kesan coach/kolam asli. Ukuran file belum dicek.
3. https://www.pexels.com/video/a-man-swimming-in-the-pool-6011936/ — bidikan atas perenang, wajah tak terlihat, tapi vertikal 9:16 (40 MB), kurang cocok untuk latar lebar.

## v2 (2 Okt, Opus): interaktif bertema air + video
- Pembuka: judul muncul per baris dari balik "permukaan"; gelombang di bawah "pilih jamnya" (mengalir di desktop); riak air mengikuti kursor (desktop) dan saat diketuk (HP juga); layar HP miring mengikuti kursor; tombol Daftar magnetis.
- Video: Pexels #6012384 (pilihan B Hadi), dipotong 2,2-19 dtk (detik 0-1,5 menampilkan wajah jelas, dibuang; dicek per 2 detik), 720p tanpa suara, WebM 1,40 MB / MP4 1,65 MB, hanya desktop, mulai 800 ms setelah halaman selesai dimuat.
- Header: tali lintasan + perenang kecil maju seiring scroll. Isi: coretan "cara lama" + sapuan lime mengikuti scroll, parallax foto kolam, sorotan kursor di kartu coach, gelombang sebelum footer.
- Sempat mundur lalu diperbaiki: paragraf pembuka dengan efek pudar + jeda membuat elemen terbesar HP 2,38 dtk dan video yang mulai terlalu awal membuat desktop 0,55 dtk. Perbaikan: paragraf hanya bergeser (tanpa pudar), video menunggu halaman selesai.

| Lingkungan | Halaman | Sebelum v2 | Sesudah v2 |
|---|---|---|---|
| Laptop, versi jadi | HP | LCP 1160 ms, FCP 908 | LCP 896-960 ms, FCP 896-960 |
| Laptop, versi jadi | Desktop | LCP 400 ms | LCP 364-384 ms (video ikut dimuat setelahnya, berat 2,0 MB) |
| Situs asli (a6d8f22) | HP | (fe5de3a) LCP 1320 | LCP 932 ms (ulangan 912-1376) |
| Situs asli (a6d8f22) | Desktop | (fe5de3a) LCP 376 | LCP 460 ms (ulangan 324-704, berisik) |

