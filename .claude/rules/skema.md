---
paths:
  - "prisma/**"
---

# Kerjaan skema database

- Mengubah skema = Opus. Model aktif bukan Opus? Jangan mengubah apa pun. Urutan: skill sph-berisiko, lalu minta izin Hadi ganti model, lalu asisten Opus dengan brief lengkap, lalu berhenti dan tulis "perlu Opus".
- Setelah skema berubah, jalankan generate klien Prisma, lalu mulai ulang server lokal.
- Migrasi yang membuang kolom (DROP COLUMN): jalankan migrate lalu langsung sinkronkan skema.
- File baru di prisma/migrations/ = Hadi menjalankan migrasi ke production LEBIH DULU, baru push (aturan Deploy di CLAUDE.md). Claude tidak punya akses database production.
- Migrasi yang menghapus atau mengubah data historis = tanya Hadi dulu.
- Data uji lokal ada di database dev; jangan menyentuh data production.
