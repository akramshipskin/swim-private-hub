# Validasi hasil kerja vs rencana sweeping ChatGPT ke-2 (3 Okt 2026 dini hari, Opus, mode tidur)

Acuan: docs/backlog/2026-10-02-rencana-sweeping-chatgpt-2.md + keputusan Hadi di docs/KEPUTUSAN.md ("2 Okt malam", #1-#32).
Cara cek: baca ulang tiap keputusan, bandingkan dengan kode yang tayang (commit 662c5cb..aec5c68), tes otomatis 743 + tes balapan 164 + uji alur penuh di GitHub.

## Opus
| # | Keputusan | Hasil | Sesuai? |
|---|---|---|---|
| P1 (#9) | Model lama dihapus total; paket lama aktif ditandai berakhir (skrip, Hadi); buku besar lama tetap; admin beri paket manual model baru tanpa bagi hasil; usulan paket kolam dihapus; komisi 5% dihapus; kolom DB tidak di-drop | Semua kode model lama dihapus (bagi hasil persen, katalog, usulan, eceran, impor Excel, 5%). Skrip `akhiri-paket-lama` siap (dicoba di laptop: 17 paket, audit cocok). Form "Berikan paket" baru: peserta + kolam + coach + 4/8, harga saat itu, tanpa pembayaran. Tidak ada migrasi. | Ya, dengan 2 catatan di bawah |
| P1 tambahan | (tidak diminta, celah yang ditemukan) | Paket pemberian admin tidak bisa ganti coach lewat pengajuan (kalau bisa, selisih harga jadi saldo uang member dari paket gratis) | Keputusan Claude, perlu dikonfirmasi (Pertanyaan) |
| P2 (#1) | 24 jam di semua tempat + tes lunas menit terakhir | Batas Midtrans (expiry Snap 24 jam, dicek ditolak/diterima Midtrans sandbox), layar Paket & Riwayat Bayar 24 jam, pembersih saldo 48 -> 24 jam + jeda aman 15 menit (saran pemeriksa: notifikasi lunas bisa telat). Tes balapan lunas 23j59m & 24j01m bersamaan pembersih: lulus | Ya (jeda 15 menit = detail teknis, batas yang dilihat member tetap 24 jam) |
| P3 (#6, #7) | Jam buka dijaga saat buka slot & booking; kolam tanpa jam buka tidak bisa buka slot baru + diberi tahu; slot lama tetap bisa dibooking; ganti jam buka: booking tetap, kolam diberi tahu, admin menghubungi | Semua dijalankan; pemilik kolam dapat notifikasi maks 1x/hari; spanduk "jam buka belum diisi" di Info Kolam; admin dapat notifikasi saat ada booking di luar jam baru; form Tambah Slot menampilkan jam buka. "Admin membuat slot" tidak ada di aplikasi (hanya coach), jadi tidak ada jalur kedua | Ya |
| P4 (#8) | Harga kelipatan Rp1.000, harga lama tidak diubah | Harga baru dicek terhadap harga di database (bukan isian browser, temuan pemeriksa) | Ya |
| P5 (#12) | Verifikasi sertifikat DB penuh, uji di pratinjau dulu | Kode siap, aktif hanya bila variabel DATABASE_CA_CERT diisi. Belum diuji di Vercel (butuh Hadi) | Sebagian: menunggu Hadi |
| P6 (#13) | Uji alur penuh di GitHub tiap push | Member daftar -> bayar (lunas dari saldo; Midtrans tidak dipanggil di GitHub) -> booking -> batal; coach tandai Hadir -> saldo Rp99.500. Lulus di laptop dan di GitHub | Ya (bayar tiruan = lunas dari saldo, bukan notifikasi Midtrans tiruan) |
| P7 (#14) | Skrip uji pulih backup, Hadi jalankan sekarang + tiap bulan, di laptop | Dibuat sebagai tombol di GitHub (Actions > Uji Pulih Backup), otomatis tiap tanggal 1. Alasan: lu tidak perlu memasang gpg/aws/pg_restore di laptop. Belum pernah dijalankan (butuh kunci asli) | Beda cara (GitHub, bukan laptop): perlu konfirmasi |
| P8 (#10) | Reset password via email, SETELAH email production terbukti | Belum dikerjakan, sesuai rencana | Ditunda (sesuai rencana) |
| P9 | Pemeriksa Opus kedua + tes balapan, lalu push | Pemeriksa: 0 berat, 4 sedang, 5 ringan. Diperbaiki: celah Rp1.000, jeda pembersih, skrip pembayaran menunggu, uji pulih (drop skema, bandingkan tabel tetap). Belum: lihat Pertanyaan | Ya |

## Sonnet (dikerjakan Opus, izin Hadi)
| # | Keputusan | Hasil |
|---|---|---|
| S1 (#2) | README + komentar + peringatan; urutan acuan permanen | README ditulis ulang + peringatan acuan; komentar skema & kode diperbarui (tanpa perubahan struktur DB, dicek: selisih kosong); urutan acuan di CLAUDE.md |
| S2 (#3) | "N member punya paket di sini" | Ya |
| S3 (#4) | FAQ arti sertifikat diperiksa | Ya |
| S4 (#5) | "secepatnya, paling lambat 7 hari kerja" | Landing (FAQ + langkah coach + langkah kolam), Panduan coach & kolam, halaman Saldo coach & kolam |
| S5 (#7, #29) | Berlaku sampai X, tanggal setelahnya abu-abu, coach paket di atas | Ya (lembar "Jadwal coach lain" dilipat) |
| S6 (#8) | 3 sumber pembulatan + contoh | Di docs/aturan-bisnis-saat-ini.md |
| S7 (#11) | Kunci next-auth + pantau | Dikunci 5.0.0-beta.32; pantau di STATUS |
| S8 (#17, #18a) | Jam kosong 7 hari, tampil bila >= 5, semua kolam | Ya (hanya slot di dalam jam buka, coach aktif) |
| S9 (#18b) | Kartu Booking hari ini + briefing kolam | Kartu di dasbor member dengan kode booking; kode yang sama di Jadwal Kolam |
| S10 (#19) | Kartu "Satu syarat pencairan" | Ya, di bagian coach landing |
| S11 (#22) | 5 langkah jadi mitra | Ya, di halaman daftar coach & kolam |
| S12 (#23) | Hapus tab Admin di Panduan + cek halaman publik lain | Tab Admin dihapus; halaman publik lain hanya berisi janji ke pengguna ("disetujui admin", "hubungi admin"), dibiarkan |
| S13 (#24) | Halaman masuk & daftar setara landing | Kerangka merek baru untuk masuk, daftar member, daftar coach, daftar kolam |
| S14 (#25) | Landing HP tanpa baris lompat + tombol daftar menempel; bilah bawah 4 ikon + Lainnya | Ya, semua peran |
| S15 (#27) | Kartu coach layar sentuh | Ketuk untuk buka/tutup, ketuk di luar menutup, tautan tetap jalan |
| S16 (#28) | Tab bisa tombol panah | Ya (+ Home/End) |
| S17 (#30) | "Siap mulai les renang?" | Ya |
| S18 (#31) | Blok alasan percaya | 4 fakta yang dijaga sistem, dekat tombol daftar penutup |
| S19 (#32) | Menu admin 4 kelompok + bilah bawah | Operasional / Mitra & Member / Keuangan / Lainnya; bilah bawah Dashboard, Booking, Keuangan, Pesan, Menu |

## Yang belum sesuai / perlu keputusan
1. Teks Perjanjian Coach & MOU Kolam (rev.2, sudah disetujui orang hukum) masih menyebut komisi 5% untuk pembayaran sebelum 3 Okt dan pasal peralihan paket persen lama. Kode sekarang: semua komisi 50% biaya layanan; paket persen lama tidak dibagi otomatis lagi. Mengubah teks = teks hukum + versi baru (semua mitra centang ulang). Tidak diubah (ditunda).
2. Sesi paket persen lama yang sudah Hadir tidak bisa diubah tandanya (sistem menolak "harga tidak ditemukan"); koreksi lewat Koreksi Saldo. Data lama hanya dummy.
3. Member yang paket berbayar pertamanya model lama tidak akan pernah memberi komisi afiliasi (sesuai bunyi "paket pertama berbayar").
4. P7 lewat GitHub, bukan laptop.
5. Paket pemberian admin tidak bisa ganti coach lewat pengajuan.
