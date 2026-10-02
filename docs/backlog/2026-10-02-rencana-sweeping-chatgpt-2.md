# Rencana kerja dari sweeping ChatGPT ke-2 (2 Okt 2026 malam)

Semua butir sudah diputuskan Hadi (rincian bertanggal di docs/KEPUTUSAN.md, "2 Okt malam"). BELUM dikerjakan; menunggu aba-aba Hadi.

## OPUS (uang, booking, login, skema, data production)
| # | Pekerjaan | Asal |
|---|---|---|
| P1 | Hapus model lama total: cabang bagi hasil persen, template/katalog paket, eceran, usulan paket kolam, impor Excel member, komisi afiliasi 5% + tanggal 3 Okt. Paket lama aktif di production ditandai berakhir (skrip, Hadi jalankan). Buku besar lama tetap. Admin beri paket manual pakai model baru (peserta+kolam+coach+4/8, harga saat itu, tanpa bagi hasil). Kolom database lama TIDAK di-drop dulu. | #9 |
| P2 | Batas waktu bayar 24 jam di semua tempat (layar Paket, Riwayat Bayar, halaman gagal bayar, pembersih saldo 48 -> 24 jam) + tes lunas menit terakhir | #1 |
| P3 | Jam buka kolam: tolak slot baru di luar jam buka (coach & admin), tolak booking slot di luar jam buka; kolam tanpa jam buka tidak bisa buka slot baru (slot lama tetap bisa dibooking) + pemberitahuan ke kolam; kolam ganti jam buka -> booking lama tetap, kolam diberi tahu ada booking di luar jam baru | #6, #7 |
| P4 | Harga paket coach & kolam wajib kelipatan Rp1.000 (harga lama tidak diubah) | #8 |
| P5 | Verifikasi sertifikat database penuh (CA Supabase), uji di pratinjau Vercel dulu | #12 |
| P6 | Uji alur penuh lewat browser di pemeriksaan GitHub (member: daftar -> bayar tiruan -> booking -> batal; coach: tandai hadir -> cek saldo) | #13 |
| P7 | Skrip uji pulih backup (dijalankan Hadi sekarang lalu tiap bulan) | #14 |
| P8 | Reset password mandiri lewat email terkonfirmasi (email opsional, Profil mengajak isi + konfirmasi) — SETELAH email production terbukti terkirim | #10 |
| P9 | Pemeriksa Opus kedua untuk P1-P5 + tes balapan, lalu push | aturan SPH |

## SONNET (tampilan, teks, dokumen)
| # | Pekerjaan | Asal |
|---|---|---|
| S1 | README + komentar lintas-kolam diperbarui + peringatan; urutan acuan permanen ditulis di aturan project | #2 |
| S2 | Kartu kolam: "N member punya paket di sini" | #3 |
| S3 | FAQ: arti "sertifikat diperiksa" (admin melihat isi file & nama, bukan konfirmasi ke lembaga) | #4 |
| S4 | "Secepatnya, paling lambat 7 hari kerja" di landing (2), Panduan coach & kolam, halaman Saldo | #5 |
| S5 | Halaman Booking: "Paket berlaku sampai X" + tanggal setelahnya abu-abu; coach paket di atas, coach lain dilipat | #7, #29 |
| S6 | Dokumen aturan bisnis: 3 sumber pembulatan + contoh | #8 |
| S7 | Kunci versi next-auth persis + catatan pantau rilis stabil | #11 |
| S8 | Kartu kolam: "N jam kosong 7 hari ke depan" (tampil bila >= 5, semua kolam) | #17, #18a |
| S9 | Kartu "Booking hari ini" di HP member untuk loket | #18b |
| S10 | Kartu "Satu syarat pencairan" (milestone) di bagian coach | #19 |
| S11 | 5 langkah jadi mitra di halaman daftar coach & kolam | #22 |
| S12 | Hapus tab Admin di Panduan publik + bersihkan penjelasan kerja internal admin di halaman publik lain | #23 |
| S13 | Halaman masuk & daftar dirapikan setara landing | #24 |
| S14 | HP: landing tanpa baris lompat + tombol daftar menempel; aplikasi bilah menu bawah 4 ikon + Lainnya (semua peran) | #25 |
| S15 | Kartu coach di layar sentuh: uji & perbaiki | #27 |
| S16 | Tab landing bisa digeser tombol panah | #28 |
| S17 | "Siap mulai les renang?" | #30 |
| S18 | Blok "alasan percaya" dekat tombol daftar penutup | #31 |
| S19 | Menu admin 4 kelompok + bilah bawah HP | #32 |

## Tidak dikerjakan (keputusan Hadi)
Patokan harga di layar pertama (#15), ganti "Daftar gratis" (#16), contoh komisi afiliasi di landing (#20), kewajiban kolam di landing (#21), pangkas teks landing (#26), SOP admin tertulis (#23), hitungan untung bersih setelah Midtrans (dilewati).

## Urutan usulan
1. Opus P1 dulu (paling besar, mengubah banyak file yang juga disentuh butir lain), lalu P2-P5, P9 pemeriksa + push.
2. Sonnet S1-S19 satu batch (S5, S12, S19 sesudah P1 karena menyentuh paket/admin).
3. Opus P6 (uji alur penuh) sesudah tampilan stabil; P7 kapan saja; P8 setelah email production terbukti.
