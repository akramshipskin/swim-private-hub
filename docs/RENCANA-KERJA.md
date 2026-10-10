# Rencana Kerja SPH: tahap B (logika) dan C (sweeping)

Status: dipakai sejak 11 Okt 2026 (mode tidur, Hadi minta semua rekomendasi dikerjakan lalu sweeping total). Dokumen 6 dari 6. Acuan: docs/TRD.md (temuan T1-T21, keputusan di bagian 12), docs/SKEMA-DATA.md bagian 8, docs/ALUR-APLIKASI.md, docs/KEPUTUSAN.md.

## Aturan main batch
- Uang, booking, login, hak akses, skema: dikerjakan Opus, diperiksa Opus kedua berkonteks segar, tes otomatis + tes balapan, lalu versi jadi.
- Tanpa migrasi baru = boleh dikirim dan tayang setelah lulus semua pemeriksaan.
- Dengan migrasi baru = disiapkan di jalur kerja terpisah `tahap-b-migrasi`, TIDAK dikirim. Hadi menjalankan migrasi production lebih dulu, baru kode dikirim.

## Batch B1: perbaikan tanpa migrasi (dikirim)
| Isi | Temuan/fitur |
|---|---|
| Pemeriksa harian tahan error, putaran pembayaran sampai habis | T2 |
| Komisi afiliasi dicairkan di pemeriksa harian dan sebelum penarikan SPH; saldo SPH yang bisa ditarik dikurangi komisi tertunda | T3 |
| Komentar "afiliasi 5%" | T4 |
| Cek password sementara dan perjanjian mitra di aksi yang terlewat | T9 |
| Coach dinonaktifkan admin bukan salah coach; paket member nonaktif tidak diawasi penjaga jadwal | T10, T8 (bagian nonaktif) |
| Hapus akun disetujui = paket diakhiri, sisa sesi hangus | T8 |
| Edit Paket: sisa sesi dibatasi, status divalidasi | T11, T1 (bagian status) |
| Ganti rekening wajib password + pemilik diberi tahu | T13 |
| Jadwal kolam hanya kolam sendiri untuk pemilik kolam | T14 |
| Penyaring kontak di nama akun coach, deskripsi kolam, nama sertifikat | T15 |
| Pendaftaran: batas jaringan dulu, isian waktu wajib | T16 |
| Admin mencopot coach dengan peringatan bila ada paket aktif | T17 |
| Akun buatan admin wajib ganti password | T18 |
| Perbaikan teknis kecil, rekap PPh kolom kontak | T20, T21 |
| Penarikan otomatis: tolak/proses bersamaan aman | T12 |
| Admin masuk ulang dengan 2FA tiap 14 hari | T6 |
| Notifikasi ke admin saat chat diteruskan; ke member saat Hadir/Tidak Hadir ditandai; tombol WhatsApp teks siap saat admin mengaktifkan mitra | celah F, C, B |

## Batch B2: dengan migrasi (disiapkan, tidak dikirim)
Satu migrasi tambahan (SKEMA-DATA bagian 8) + kode: Kembalikan Dana (T1, komisi VOID, ADMIN_REFUND), pengingat sesi 18.00 + 06.00, paket mau berakhir 14/3 hari, tombol Tolak pendaftar + WhatsApp, lapor coach dengan tangkapan layar, kolam nonaktif mengikuti pemilik (T19), indeks buku besar.

## Tahap C: sweeping total
Semua halaman x semua peran x HP dan desktop x terang dan gelap, di versi jadi lokal dengan akun dummy; hak akses semua halaman dan API; kiriman formulir; audit uang; tes balapan; laporan tabel cakupan di docs/reviews/. Live: hanya halaman publik (login peran hanya oleh Hadi).
