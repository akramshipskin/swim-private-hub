# Rombak UI/UX di dalam aplikasi (rancangan, 4 Okt 2026)

Permintaan Hadi (3 Okt malam): UI di dalam aplikasi lebih modern, seamless, tidak keluar konteks, mudah dipahami semua peran, dan ringan; kadang loading lama saat membuka aplikasi. Landing sudah oke (revisi kecil menyusul). Brand tetap: src/app/brandguideline (warna lime/ink/sand, font yang sama, radius dan token yang ada). Tidak ada brand baru.

## Kondisi sekarang (dari sweeping 3 Okt malam, 474 tangkapan layar)
- Tampilan sudah rapi dan konsisten secara token, tapi dasbor tiap peran berupa kumpulan angka ("Ringkasan"): tindakan utama (member: booking sesi berikut; coach: tandai hadir / buka jadwal; kolam: jadwal hari ini) ada di bawah atau tersebar.
- Halaman panjang dengan banyak kartu bertumpuk; di HP harus menggulir jauh untuk tombol utama (contoh: Paket -> "Beli Paket Baru" di bawah daftar paket; Booking -> kebijakan pembatalan di atas pilihan).
- Navigasi ganda di HP: tombol nama + ikon menu di kepala halaman DAN bilah bawah dengan "Lainnya".
- Saat berpindah halaman: layar kosong + putaran memuat (pemilik kolam, profil, milestone, kota tanpa layar memuat sama sekali; sudah ditambah 4 Okt).
- Kartu kode afiliasi (teks panjang) menempati dasbor coach & kolam.
- Kecepatan: server di laptop 8–65 md per halaman; di situs asli kunjungan pertama setelah sepi 0,8–2,3 dtk (fungsi server "bangun"), sesudahnya 0,08–0,26 dtk. Paket JavaScript kecil (bagian terbesar ±71 KB terkompresi). Jadi rasa "lama" = server bangun tidur + layar kosong saat menunggu, bukan halaman yang berat.

## Opsi
| | A. Tindakan dulu (direkomendasikan) | B. Penyegaran visual | C. Rombak alur & navigasi total |
|---|---|---|---|
| Isi | Dasbor tiap peran = "Hari ini": 1 kartu tindakan utama di atas, ringkasan angka di bawah; kerangka memuat (skeleton) per halaman; kepala halaman seragam; afiliasi dilipat; tombol utama menempel di bawah layar HP untuk halaman panjang | Tipografi, jarak, kartu, ikon diperhalus; struktur halaman tetap | Gabung halaman (mis. Paket+Booking jadi satu alur), navigasi baru per peran, onboarding per peran |
| Dampak ke pengguna | Besar: semua peran langsung tahu langkah berikutnya | Kecil–sedang | Paling besar |
| Risiko | Rendah: tidak mengubah logika/uang, bertahap per peran | Sangat rendah | Tinggi: alur booking/bayar berubah, perlu uji ulang penuh |
| Waktu | 2–3 batch | 1 batch | 5+ batch |

Rekomendasi: A sekarang, bertahap; C dipertimbangkan setelah ada data pemakaian nyata.

## Tahap A (urutan kerja)
1. Kerangka memuat (skeleton) bentuk halaman, bukan putaran; ada di setiap bagian aplikasi. Perpindahan halaman terasa instan.
2. Dasbor member: kartu "Langkah berikutnya" di atas (punya paket + belum ada jadwal -> "Booking sesi berikutnya"; jadwal terdekat -> tampil tanggal/jam/coach/kolam; tidak punya paket -> "Beli paket"). Ringkasan angka turun.
3. Dasbor coach: kartu tindakan di atas (sesi belum ditandai -> "Tandai sekarang"; jam kosong 14 hari < 4 -> "Buka jadwal"; jadwal hari ini). Kode afiliasi dilipat di bawah.
4. Dasbor pemilik kolam: jadwal/jam ramai hari ini + saldo di atas; afiliasi dilipat.
5. Admin: sudah berpola "Perlu tindakan"; hanya kerangka memuat + kepala halaman seragam.
6. (batch berikut) Paket & Booking: tombol utama menempel di bawah layar HP, kebijakan pembatalan dipindah ke bawah/terlipat.
7. (batch berikut) Navigasi HP: satu sumber (bilah bawah + "Lainnya"), kepala halaman cukup logo + nama halaman.

## Kecepatan (tanpa mengorbankan tampilan)
- Kerangka memuat (tahap 1) — rasa instan saat menunggu server.
- Server "bangun tidur" di Vercel: cek di Vercel apakah Fluid Compute aktif (mengurangi bangun tidur). Hadi yang membuka Settings > Functions; Claude tidak punya akses.
- Dicoba dan DIBATALKAN 4 Okt: menyimpan data akun sekali per permintaan (React cache) — berisiko memutar balik ke halaman ganti password/perjanjian setelah disimpan; penghematannya hanya beberapa milidetik.
- Gerak: hanya transform/opacity 150–300 md; HP ringan; hormati "kurangi gerakan".
