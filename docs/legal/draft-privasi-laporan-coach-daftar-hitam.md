# Draf tambahan Kebijakan Privasi: laporan tentang coach dan pemberitahuan daftar hitam

Status: DRAF untuk orang hukum (Hadi 11 Okt 2026 malam, 1A). BELUM dipasang. Teks aktif: `src/app/kebijakan-privasi/page.tsx` (Privasi 11 Oktober 2026). Celah ini ditemukan saat memasang Perjanjian Coach rev.4 pasal 6 dan Privasi 11 Okt.

## Fakta yang menjadi dasar (dicek dari kode 11 Okt 2026)

| Fakta | Sumber di kode |
|---|---|
| Member bisa melaporkan coach yang pernah melatih pesertanya (contoh: menawarkan les atau kontak di luar Aplikasi). Disimpan: akun pelapor, coach, booking terakhir antara keduanya, isi laporan (10-1000 karakter), tangkapan layar opsional, status, hasil pemeriksaan admin, admin pemeriksa, waktu. | model `CoachReport`; `src/lib/coach-report.ts` |
| Tangkapan layar disimpan di penyimpanan privat (bucket sertifikat, folder `reports/`), dibuka admin lewat tautan sementara. | `src/lib/coach-report.ts`, `src/app/admin/laporan-coach/` |
| Yang melihat laporan: hanya administrator. Coach yang dilaporkan tidak melihat laporan maupun nama pelapor di Aplikasi. | tidak ada halaman coach yang membaca `CoachReport` |
| Saat akun member dihapus, nama, nomor HP, dan email pelapor dikosongkan (akun dianonimkan), tetapi isi laporan (yang bisa menyebut nama orang) dan tangkapan layarnya TIDAK ikut dihapus. | `src/lib/account-deletion.ts` |
| Daftar hitam belum berupa catatan khusus di Aplikasi: admin menonaktifkan akun coach dan menulis hasil pemeriksaan di laporan (manual). | `src/app/admin/laporan-coach/` |
| Perjanjian Coach rev.4 pasal 6 butir 4: SPH berhak memberitahukan pelanggaran dan daftar hitam kepada Kolam Mitra dan mitra SPH di kota mana pun. Aplikasi belum punya fitur untuk ini; pemberitahuan dilakukan di luar Aplikasi (manual). | `src/app/perjanjian-coach/page.tsx` |

## Usulan teks

### Tambahan butir pada bagian 1 (Data yang Dikumpulkan)

> - Laporan tentang coach: bila member melaporkan coach (misalnya coach menawarkan les atau kontak di luar Aplikasi), kami menyimpan akun pelapor, coach yang dilaporkan, sesi terkait, isi laporan, tangkapan layar yang dilampirkan (bila ada), serta hasil pemeriksaan administrator. Laporan hanya dapat dilihat administrator; coach yang dilaporkan tidak dapat melihat laporan maupun identitas pelapor melalui Aplikasi.

### Tambahan butir pada bagian 3 (Tujuan Penggunaan Data)

> - Memeriksa laporan tentang coach dan menegakkan Perjanjian Kemitraan Coach, termasuk menonaktifkan akun dan memasukkan coach ke daftar hitam.

### Tambahan butir pada bagian 4 (Pembagian Data kepada Pihak Ketiga)

> - **Kolam Mitra dan mitra SPH** — bila coach terbukti melanggar larangan transaksi di luar Aplikasi dan dimasukkan ke daftar hitam, kami dapat memberitahukan nama coach, kota, dan jenis pelanggarannya kepada Kolam Mitra dan mitra SPH, sesuai Perjanjian Kemitraan Coach. Identitas member pelapor dan isi laporan tidak ikut dibagikan.

### Tambahan pada bagian 5 (Masa Penyimpanan)

> Laporan tentang coach beserta lampirannya kami simpan selama diperlukan untuk menegakkan Perjanjian Kemitraan Coach, termasuk selama coach tersebut tercatat di daftar hitam, dan tidak ikut terhapus saat akun pelapor dihapus.

## Hal yang perlu dinilai orang hukum
1. **Identitas pelapor tidak dibagikan:** kalimat di bagian 4 berjanji begitu. Saat ini tidak ada fitur yang membagikannya, jadi janji itu benar; admin harus mematuhinya saat memberitahu mitra secara manual.
2. **Masa simpan tanpa batas tahun:** laporan disimpan selama daftar hitam berlaku (tidak ada batas tanggal). Bila orang hukum minta batas (misalnya 5 tahun), perlu fitur hapus otomatis.
3. **Laporan tetap ada saat akun pelapor dihapus:** nama/HP/email pelapor sudah dikosongkan, tetapi isi laporan dan tangkapan layar tetap. Alternatif: ikut hapus tangkapan layar dan isi laporan saat akun dihapus (butuh perubahan kode).
4. **Bagian 4 menyebut "pihak ketiga":** Kolam Mitra dan mitra SPH termasuk penerima data coach; dasar hukumnya persetujuan coach atas Perjanjian rev.4 (sekarang semua coach diminta mencentang ulang).
