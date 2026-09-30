---
paths:
  - "src/lib/{availability,dedupe-lock,order-id,cancel-booking,cancel-eligibility,active-package,pool-occupancy}.ts"
  - "src/lib/{availability,cancel-booking,cancel-eligibility,active-package}.test.ts"
  - "src/app/api/booking/**"
  - "src/app/api/availability/**"
  - "src/app/coach/jadwal/**"
---

# Kerjaan booking dan ketersediaan

- Mengubah logika booking, slot, atau ketersediaan = Opus. Model aktif bukan Opus? Jangan mengubah logikanya. Urutan: skill sph-berisiko, lalu minta izin Hadi ganti model, lalu asisten Opus dengan brief lengkap, lalu berhenti dan tulis "perlu Opus".
- Server yang menjaga aturan, bukan tampilan. Dua orang yang mengambil slot yang sama secara bersamaan harus ditangani di server.
- Aturan pembatalan, penjadwalan ulang, dan status booking yang belum tertulis di repo = tanya Hadi. Riwayat booking lama tidak boleh berubah karena aturan baru.
- Bagian yang bisa diakses bersamaan wajib dites lewat `npm run db:race` lalu `npm run test:race`.
