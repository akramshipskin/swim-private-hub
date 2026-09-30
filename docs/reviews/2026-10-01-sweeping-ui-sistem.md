# Sweeping UI + sistem — 1 Okt 2026 (malam, mode TIDUR)

Semua uji memakai database lokal (salinan production yang sudah disamarkan) dan akun uji lokal. TIDAK login ke production, tidak ada uang sungguhan.
Alat (semua di `scripts/`): `sweep-halaman.mjs` (tampilan), `uji-hak-akses.mjs`, `uji-formulir.mjs`, `ukur-halaman.mjs`. Semuanya Chrome tanpa layar; hasil belum pernah dibandingkan dengan HP asli.

## 1. Cara periksa dan cakupan (jujur)
| Cara | Cakupan | Status |
|---|---|---|
| Sweeping tampilan otomatis | 528 kunjungan: 5 kelompok (publik, admin, coach, member, pemilik kolam) × halaman miliknya × lebar 375 / 768 / 1280 × tema terang / gelap. Dicek otomatis: kelebihan lebar, elemen keluar layar, gambar rusak, tautan mati, tombol/tautan tanpa nama, isian tanpa label, teks <12 px, kontras teks, target sentuh <40 px di ≤768, error konsol/jaringan | dijalankan |
| Tinjauan tulisan | teks lengkap halaman member, coach, pemilik kolam, admin (desktop, terang) dibaca satu per satu | dibaca |
| Tinjauan visual | tangkapan layar dilihat langsung: member (booking, cari coach, paket, pembayaran, peserta, riwayat, profil, milestone) di HP; admin dasbor (HP, desktop), Bagi Hasil (desktop), Kelola Kolam (HP); sisanya hanya lewat pemeriksaan otomatis | sebagian |
| Uji hak akses | 59 halaman + 17 route API × 5 kondisi (tanpa login, admin, coach, member, pemilik kolam), kode status dan arah alihan; tidak ada 5xx | dijalankan |
| Uji formulir | 32 kombinasi peran+halaman dikunjungi, 185 formulir ditemukan: 81 diuji (162 pengiriman; masing-masing dikirim dua kali dengan pemeriksaan browser dimatikan: kosong, dan 5.000 huruf + karakter khusus); 104 dilewati (hanya isian tersembunyi seperti tombol Setujui/Tolak, unggah file, atau tombol berisiko); 0 error server, 0 pengecualian browser, 0 skrip berbahaya yang jalan | dijalankan |
| Audit statis aksi server | 68 fungsi di 28 file: 60 punya penjaga yang terdeteksi pola; 8 lainnya dibaca manual, semuanya punya penjaga (currentUser, requireTeachingCoach, canEditPool) atau memang tidak perlu (keluar) | dibaca |
| Uji fitur 2FA ujung ke ujung | pasang 2FA admin lewat UI (Buat kunci → password + kode) lalu login dengan kode: berhasil | dijalankan |
| Tes otomatis | tsc, eslint, vitest 682 tes, build: lulus; GitHub Actions termasuk tes balapan (race): hijau pada 6493c3b | dijalankan |

## 2. Tabel cakupan halaman × peran
Keterangan sel: `UI 6/6` = dikunjungi di 3 lebar × 2 tema dan diperiksa; `alih→X` = sesudah login diarahkan ke X (perilaku normal); `ditolak →X/404/401` = peran itu tidak boleh membuka, cocok dengan aturan; `akses 200` = hanya kode status diuji (halaman sama dengan versi publik, tampilan tidak diperiksa ulang sebagai peran itu). Jumlah: 59 halaman × 5 = 295 sel; 87 sel diperiksa tampilannya, 208 sel diuji aksesnya; 0 sel belum diperiksa. Inventaris dari kode dicocokkan ulang: 59 halaman, 17 route API, 28 file aksi server, identik dengan dokumen cakupan.

| Halaman | publik | admin | coach | member | pool |
|---|---|---|---|---|---|
| `/` | UI 6/6 | ditolak →/admin | ditolak →/coach/das | ditolak →/member/bo | ditolak →/pool/dash |
| `/brandguideline` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/daftar-coach` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/daftar-kolam` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/ganti-password` | ditolak →/login | alih→/admin | alih→/coach/dashboa | alih→/member/bookin | alih→/pool/dashboar |
| `/keamanan` | alih→/login | alih→/admin | UI 6/6 | UI 6/6 | UI 6/6 |
| `/kebijakan-cookie` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/kebijakan-pengembalian` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/kebijakan-privasi` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/milestone/[dependentId]` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/milestone/[dependentId]/sertifikat/[completionId]` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/panduan` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/pelatih/[coachId]` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/pembayaran/gagal` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/pembayaran/sukses` | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/profil` | ditolak →/login | UI 6/6 | UI 6/6 | UI 6/6 | UI 6/6 |
| `/syarat-ketentuan` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/(auth)/login` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/(auth)/register` | UI 6/6 | akses 200 | akses 200 | akses 200 | akses 200 |
| `/admin` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/afiliasi` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/booking-overview` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/email` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/kinerja-coach` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/kolam` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/komisi` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/koreksi-saldo` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/laporan-kehadiran` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/milestone` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/milestone/butir` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/paket` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/pembayaran` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/pesan` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/testimoni` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/users` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/users/[userId]` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/admin/withdrawals` | ditolak →/login | UI 6/6 | ditolak →/ | ditolak →/ | ditolak →/ |
| `/coach` | ditolak →/login | ditolak →/ | alih→/coach/dashboa | ditolak →/ | ditolak →/ |
| `/coach/dashboard` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/jadwal` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/peserta` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/riwayat-sesi` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/coach/saldo` | ditolak →/login | ditolak →/ | UI 6/6 | ditolak →/ | ditolak →/ |
| `/member` | ditolak →/login | ditolak →/ | ditolak →/ | alih→/member/bookin | ditolak →/ |
| `/member/booking` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/cari-coach` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/dashboard` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/paket` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/pembayaran` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/peserta` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/member/riwayat` | ditolak →/login | ditolak →/ | ditolak →/ | UI 6/6 | ditolak →/ |
| `/pool` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | alih→/pool/dashboar |
| `/pool/coach` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/dashboard` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/info` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/jadwal` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/laporan` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/paket` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |
| `/pool/saldo` | ditolak →/login | ditolak →/ | ditolak →/ | ditolak →/ | UI 6/6 |

## 3. Temuan yang SUDAH DIPERBAIKI (mekanis, diuji, dibuktikan di browser)
1. **[berat] Bagian landing tetap kosong bila "kurangi gerakan" menyala** (termasuk "hapus animasi" di Android). 17 dari 17 elemen efek-muncul tersembunyi selamanya. Diperbaiki + tes regresi; terbukti 0 tersembunyi di situs asli (commit 6493c3b).
2. **[sedang] Dasbor coach dan pemilik kolam melebar ke samping di lebar tablet 768** (tautan "Selengkapnya"/"Tandai sekarang" keluar dari kotak). Kotak kini membungkus baris; terbukti tidak ada overflow lagi.
3. **[sedang] Tautan teks setinggi 20 px di HP** (Lihat paket, Sertifikat ×2, ← Kembali, Lihat sertifikat daftar dulu): kini 44 px di HP saja; terbukti hilang dari pemeriksaan 375 px.
4. **[sedang] Kontras teks**: label hari di tanggal terpilih (tema gelap) 3,8:1 → lolos; label tile tanda di halaman brand guideline (tema gelap) 2,3:1 → lolos.
5. **[sedang] Nama peserta tanpa batas panjang**: 5.071 karakter tersimpan saat uji. Kini maksimal 100 karakter di pembuat peserta (dipakai profil, admin, impor) dan ubah-nama profil + tes.
6. **[ringan] Tulisan**: "Buat peserta" (terbaca "membuat peserta") → "Untuk peserta"; "buat peserta ini" → "untuk"; "Buat Peserta 3" → "Untuk Peserta 3"; "anak" → "peserta" di peringatan booking; "sesi tetap terpotong" → "terpakai" (seragam dengan FAQ); "min. 2 jam" → "paling lambat 2 jam"; "0 bulan ini" → "0 sesi bulan ini"; "real-time", "dijadiin", "misal", "beda" di jadwal coach; "Nominal (min. …)" → "minimal"; "tidak butuh migrasi", "Assign", "manapun", "assign manual" di halaman admin dan laporan kolam.
7. **[ringan] Animasi dalam aplikasi (tahap 3)**: halaman memudar masuk saat pindah menu di 4 peran, dialog muncul dengan sedikit membesar, tombol memberi umpan balik saat ditekan; mati saat "kurangi gerakan"; terbukti jalan, berhenti, dan berulang saat pindah halaman.

## 4. Menunggu keputusan Hadi atau Opus (TIDAK diubah malam ini)
1. **[Opus, login] Kunci pembatas percobaan login menyimpan nama pengguna mentah tanpa batas**: 1 baris 5.077 karakter tersimpan saat uji. Penyerang bisa menggembungkan database dengan nama panjang unik. Usul: ringkas kunci (hash atau potong) di fungsi pembatas bersama.
2. **[Opus, login/akun] Nama akun di pendaftaran (member, coach, kolam) dan pembuatan akun oleh admin belum dibatasi panjangnya** (yang sudah dibatasi: peserta dan ubah-nama profil). Usul: pakai batas 100 yang sama.
3. **[keputusan Hadi] Kolam Renang Bahari: komisi platform 0%, coach 60%, kolam 40%**, sedangkan kolam lain 10/40/50 (data salinan production). Disengaja?
4. **[keputusan Hadi, janji ke pelanggan] Halaman pembayaran gagal**: "Belum ada saldo yang terpotong". Member tidak punya "saldo"; usul kata "dana" atau "uang". Ini janji ke pembeli, jadi tidak diubah sendiri.
5. **[ringan, desain] Tombol nonaktif "Sudah dibooking"** kontras 3,5:1 (dikecualikan aturan untuk tombol nonaktif, tapi ini informasi). Usul: gelapkan teks nonaktif satu token.
6. **[ringan] Pemilik kolam: "Jam ramai hari ini" menampilkan 15 baris "Tidak ada les"** saat kosong; usul ringkas jadi satu kalimat bila semua kosong.
7. **[ringan, hak akses] Formulir Usul Paket kosong menjawab "Kamu tidak punya akses ke kolam ini"** bila kolam tidak terpilih; usul "Pilih kolam dulu". Hanya terjadi bila formulir dipaksa kirim.

## 5. Tidak bisa dicek (dan kenapa)
- Situs production (login production dilarang): tampilan dan fungsi di sana tidak diuji; hanya halaman publik diukur kecepatannya.
- HP asli dan Safari: hanya Chrome tanpa layar (tangkapan layar lebar 375).
- Foto/sertifikat/tanda tangan: penyimpanan lokal tidak jalan, jadi semua foto coach/kolam tampil rusak di lokal (artefak lingkungan, bukan bug) dan alur unggah tidak diuji.
- Email masuk/keluar, notifikasi push, pembayaran Midtrans asli: tidak diuji (hanya logika webhook dibaca: tanda tangan diperiksa, jumlah dicek, notifikasi ganda aman).
- Aksi yang mengubah uang/status (Hadir/Tidak Hadir, cairkan, koreksi saldo, setujui/tolak, hapus, nonaktifkan): tidak diklik dalam uji ini; hanya dicek penjaganya (statis), kekosongan isian, dan hak akses. Rekonsiliasi ledger menyeluruh dan hitungan PPN/bagi hasil: di luar uji ini (perlu Opus). Yang sempat dicek: angka "Saldo mengendap" di dasbor admin = saldo kolam + coach + platform (bersih + PPN) = Rp 766.250, cocok.
- Keadaan error 500 dan loading: tidak bisa dipicu tanpa merusak data; halaman 404 dicek (normal).
- Teks sangat panjang di tampilan: hanya lewat uji formulir; tampilan akibatnya (nama 5.000 huruf) tidak ditinjau.
- Pengukuran waktu simpan milestone di production: butuh login production, tidak dikerjakan.

## 6. Catatan artefak lokal (bukan temuan)
Konsol penuh galat `_vercel/insights` (hanya ada di Vercel), gambar dari penyimpanan lokal yang tidak jalan, dan kolom jebakan spam `input#website` yang sengaja di luar layar.
