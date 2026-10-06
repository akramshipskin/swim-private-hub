# Draf tambahan Kebijakan Privasi: kota, daftar tunggu kota, riwayat lonceng

Status: DRAF untuk orang hukum (Hadi 6 Okt 2026, jawaban 11A). BELUM dipasang di aplikasi. Teks aktif: `src/app/kebijakan-privasi/page.tsx` (PRIVACY_UPDATED_AT = 2 Oktober 2026). Bila disetujui, teks di bawah dimasukkan ke bagian yang disebut, tanggal pembaruan dan `LEGAL_CONSENT_VERSION` (`src/lib/legal.ts`) dinaikkan, lalu semua pengguna diminta setuju ulang seperti pada rev.3.

Semua fakta di bawah dicek dari kode pada 6 Okt 2026 (bukan dari ingatan). Sumber tiap fakta ada di kolom kanan.

## Fakta yang menjadi dasar

| Fakta | Sumber di kode |
|---|---|
| Kota domisili disimpan sebagai teks pada akun (member, coach, pemilik kolam) dan pada kolam, dipilih dari 10 kota tetap. | `User.city`, `Pool.city` (prisma/schema.prisma); `src/lib/cities.ts` |
| Daftar tunggu kota: saat member memilih kota yang belum punya pasangan kolam + coach, member menekan "Kabari saya"; tersimpan akun, kota, waktu daftar, waktu dikabari. Member dikabari lewat notifikasi HP saat ada pasangan. | model `CityWaitlist`; `src/lib/coach-pools.ts` (`notifyCityWaitlist`) |
| Riwayat lonceng: judul, isi, tautan, dan waktu baca notifikasi dalam aplikasi, per akun. | model `InAppNotification` |
| Riwayat lonceng dihapus otomatis setelah 90 hari oleh pemeriksa harian, dan dihapus seketika saat akun member dianonimkan. | `src/app/api/cron/harian/route.ts` (`purgeOldNotifications`); `src/lib/account-deletion.ts` |
| Isi lonceng dapat memuat nama peserta, nama coach/kolam, jadwal, dan nominal rupiah pada sesi. | `src/lib/push.ts` (satu pintu), `src/lib/notifications.ts` |
| Catatan pelanggaran coach (tidak membuka jam kosong) disimpan dan dilihat admin. | model `CoachViolation` |

## Usulan teks

### Tambahan butir pada bagian 1 (Data yang Dikumpulkan)

> - Kota domisili yang dipilih Pengguna saat mendaftar atau saat diminta melengkapi, serta kota lokasi untuk kolam. Kota dipilih dari daftar kota layanan yang tersedia di Aplikasi.
> - Daftar tunggu kota: bila member memilih kota yang belum memiliki pasangan kolam dan coach yang sesuai dan menekan "Kabari saya", kami menyimpan kaitan antara akun member, kota tersebut, waktu pendaftaran daftar tunggu, dan waktu member dikabari.
> - Riwayat notifikasi dalam Aplikasi (lonceng): judul, isi, tautan, dan status sudah/belum dibaca dari notifikasi terkait pemesanan, pembayaran, dan layanan. Isi notifikasi dapat memuat nama peserta, nama coach atau kolam, jadwal sesi, dan nominal rupiah.

### Tambahan butir pada bagian 3 (Tujuan Penggunaan Data)

> - Menampilkan coach dan kolam yang berada di kota Pengguna, memberi peringatan bila Pengguna memilih kolam di luar kota domisilinya, dan mengabari member yang menunggu di daftar tunggu kota ketika layanan di kotanya tersedia.
> - Menyimpan dan menampilkan riwayat notifikasi dalam Aplikasi agar Pengguna dapat membacanya kembali.

### Tambahan pada bagian 5 (Masa Penyimpanan), setelah paragraf chat

> Riwayat notifikasi dalam Aplikasi (lonceng) kami simpan paling lama 90 hari sejak notifikasi dibuat, kemudian dihapus otomatis; riwayat ini juga dihapus saat akun dihapus. Data daftar tunggu kota disimpan sampai member dikabari dan, selama akun masih aktif, sampai member tidak lagi memerlukannya.

(Kalimat terakhir mengandung janji "tidak lagi memerlukannya" yang BELUM ada fiturnya: member belum bisa keluar dari daftar tunggu sendiri. Lihat pertanyaan 2 di bawah; orang hukum boleh memotong kalimat itu.)

## Yang perlu diputuskan sebelum dipasang (diteruskan ke Hadi)

1. **Kota dan daftar tunggu setelah akun dihapus.** Saat ini penghapusan akun member (`anonymizeMember`) TIDAK menghapus `User.city` maupun baris `CityWaitlist`. Kota hanya data kasar, tetapi kaitannya ke akun yang dianonimkan tetap ada. Pilihan: (A) hapus baris daftar tunggu dan kosongkan kota saat dianonimkan (perubahan kecil di logika hapus akun, perlu Opus + pemeriksa kedua); (B) biarkan dan tulis di Kebijakan Privasi bahwa data kota kasar tetap tersimpan tanpa identitas.
2. **Keluar dari daftar tunggu.** Belum ada tombolnya. Pilihan: (A) tambah tombol "Batalkan daftar tunggu" (perubahan kecil, Sonnet); (B) tidak ada, dan kalimat terakhir di atas dibuang.
3. **Catatan pelanggaran coach** sudah disebut di perjanjian coach rev.3 (dicek di `docs/legal/draft-rev3-kota-coach-kolam.md`, butir b dan c), tetapi belum di Kebijakan Privasi. Pilihan: (A) tambah satu butir di bagian 1 ("catatan pelanggaran coach, dilihat admin"); (B) cukup di perjanjian coach.
