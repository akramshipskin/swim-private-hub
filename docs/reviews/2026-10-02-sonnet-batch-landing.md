# Batch Sonnet 2 Okt 2026 (S1-S16): landing, dokumen, kecepatan

Model: Sonnet 5.5. Dikerjakan setelah jawaban Hadi 1-8 (docs/KEPUTUSAN.md, 2 Okt sore). Tes uang tidak disentuh (O5 ditunda ke setelah semua kerjaan).

## Yang dikerjakan
| # | Hasil |
|---|---|
| S1 | "Member terdaftar" hanya akun aktif; kartu kolam "N member pernah les di sini"; jumlah coach per kolam = hanya coach aktif (sama dengan daftar coach). "Sesi terlaksana" dan jumlah kolam dicek: sudah sesuai arti (booking Hadir; kolam aktif). |
| S2 | Kartu kolam: "Harga paket — 4 sesi mulai Rp …" (hitungan paket termurah dipindah ke src/lib/pricing.ts + 2 tes). |
| S3 | Langkah pemilik kolam: "Bagian kolam (setelah PPh final 0,5%) masuk ke saldo…". Panduan pemilik kolam ikut disamakan. |
| S4 | Baris di bawah tombol hero: "Coach atau punya kolam? Gabung sebagai mitra: Daftar jadi coach · Daftarkan kolam" (area ketuk 44px, tanpa prefetch supaya HP tidak memuat dua halaman tambahan). |
| S5 | Hero: "di kolam mitra Swim Private Hub". |
| S6 | Contoh angka pemilik kolam: bagian kolam Rp60.000 masuk saldo Rp59.700 setelah PPh Rp300 (berlabel ilustrasi). |
| S7 | "Pembayaran diproses lewat Midtrans". |
| S8 | Teks bagian coach: jadwal, fasilitas kolam, dan file sertifikat terbuka setelah mendaftar. |
| S9 | Subheadline = kalimat landing sekarang; dokumen pesan merek, panduan, halaman brand guideline, deskripsi mesin pencari, dan manifest disamakan (jawaban 5A). |
| S10 | DILEWATI: kalimat sudah memuat "50% dari bagianmu"; label tambahan opsional dan berisiko salah baca. |
| S11 | Tab landing: id, aria-controls, aria-labelledby (dicek di browser: tiap panel menunjuk tab yang ada). |
| S12 | Perjanjian coach dan MOU kolam keluar dari peta situs + tanda noindex (dicek di versi jadi). |
| S13 | Dokumen baru docs/aturan-bisnis-saat-ini.md; penanda basi di dua dokumen lama; status rancangan harga-dari-coach jadi LIVE; sapu istilah model lama di teks pengguna: tidak ada sisa di landing/panduan. Sisa di layar ADMIN (laporan uang) = lihat "Ditunda ke Opus". |
| S14 | Pesan error pendaftaran coach/kolam menyebut Perjanjian Kemitraan Coach / MOU Kolam Mitra (+1 cek di tes). |
| S15 | Sebagian (jawaban 6A): tabel label dan baca 4 sudut pandang di bawah. |
| S16 | Kecepatan di bawah. |

## S15a. Tabel angka/label landing ke sumber database
| Tampil | Sumber | Catatan |
|---|---|---|
| Kolam mitra (strip statistik) | jumlah kolam aktif | termasuk kolam contoh/demo |
| Coach aktif (strip) | coach dan profil aktif | termasuk akun demo (@example.com) |
| Member terdaftar (strip) | member aktif (diubah dari semua member) | strip hanya tampil bila member >= 20 |
| Sesi terlaksana (strip) | booking dengan kehadiran = Hadir | sesi coba ikut terhitung |
| N member pernah les di sini | member unik yang pernah punya paket mulai di kolam itu | tampil bila >= 15 |
| Coach N (kartu kolam) | coach aktif yang terafiliasi (diubah dari semua afiliasi) | sama dengan daftar coach |
| Harga paket N sesi mulai Rp | paket termurah dari semua coach berharga di kolam itu | otomatis ikut harga baru |
| Kartu coach (umur, keahlian, badge, kolam) | profil coach + sertifikat disetujui admin | tanpa angka karangan |
Temuan terbuka: kolam, coach, dan member DEMO ikut terhitung di strip statistik (strip sembunyi sampai 20 member, tapi bila sudah lewat dan akun demo masih ada, angkanya ikut naik). Dicek dari kode, belum dicek di production.

## S15b. Baca landing sebagai 4 orang (teks dari halaman yang dijalankan di laptop)
- Orang tua: harga, tiket, coba 1 sesi, ganti coach, batal, hangus semua terjawab di halaman. Tidak ada sisa istilah eceran/kartu kredit.
- Coach: jalur daftar sekarang terlihat dari hero; FAQ menjelaskan tarif, PPh, kewajiban milestone, pencairan manual. Komisi afiliasi masih tertulis "dari bagian SPH" (tetap benar setelah O1).
- Pemilik kolam: istilah "bagian kolam" sekarang konsisten di langkah, contoh angka, dan panduan. Kartu kolam contoh memperlihatkan "Segera diinformasikan" untuk alamat/jam: data contoh, bukan salah kode.
- Pembelajar dewasa: hero dan FAQ menyebut "anak atau kamu", tetapi banyak kalimat jualan memakai "anakmu"/"anak" (mis. "Benar-benar privat: 1 coach, 1 anak"). Sesuai keputusan terdahulu tidak dibersihkan massal; hanya dicatat.

## S16. Kecepatan (scripts/ukur-halaman.mjs, versi jadi di laptop, 5 ulangan, nilai tengah, cache dikosongkan)
| Halaman | Sebelum batch | Sesudah batch |
|---|---|---|
| HP, elemen terbesar | 976 ms (972-980) | 948 ms (944-976) |
| HP, berat / permintaan | 429 KB / 49 | 430 KB / 49 |
| Desktop, elemen terbesar | 532 ms (520-552) | 556 ms (524-560) |
| Desktop, berat / permintaan | 2067 KB / 53 | 2067 KB / 53 |
Kesimpulan jujur: selisih ada di dalam derau antar-ulangan, tidak ada kemunduran yang terukur. Satu temuan di tengah jalan: dua tautan mitra di hero pertama kali menambah 7 permintaan dan 31 KB di HP (halaman tujuan ikut dimuat otomatis); diperbaiki dengan mematikan pemuatan otomatis, lalu diukur ulang (angka di atas). Situs asli belum diukur (belum di-push).

## Ditunda ke Opus (menyentuh uang)
- Layar admin Komisi dan Kolam masih berlabel model lama untuk data riwayat ("Paket kolam ini (lama)", "Beli 1 sesi", "Paket kolam lain (sebelum 17 Sep)", "Komisi kolam (%)"). Itu laporan uang; ganti label hanya bersama pemeriksaan Opus.
- Sisa konstanta masa aktif eceran (DROP_IN_DURATION_DAYS) masih dipakai webhook untuk pembayaran eceran lama yang menunggu; jangan dihapus tanpa Opus.

## Verifikasi
- Cek penulisan kode: lulus. Tes otomatis: 93 berkas, 767 tes lulus (sebelumnya 765; +2 tes paket termurah). Versi jadi: lulus.
- Browser: teks halaman, lebar 375 tanpa geser samping, area ketuk tautan hero 44px, id/label tab, peta situs dan noindex.
- Belum dicek: HP asli, Safari, situs asli.
