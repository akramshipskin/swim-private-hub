---
paths:
  - "src/lib/{wallet,wallet-adjustment,platform-wallet,policy,midtrans,disbursement,withdrawal,withdrawal-notify,affiliate,trial,drop-in,cancel-booking,cancel-eligibility,active-package,payment-finish-status,milestone-hold}.ts"
  - "src/lib/{wallet,wallet-adjustment,platform-wallet,policy,disbursement,withdrawal,affiliate,trial,drop-in,cancel-booking,cancel-eligibility,active-package,milestone-hold}.test.ts"
  - "src/app/api/payment/**"
  - "src/app/api/webhooks/**"
  - "src/app/admin/koreksi-saldo/**"
  - "src/app/admin/withdrawals/**"
  - "src/app/admin/booking-overview/**"
  - "src/app/admin/komisi/**"
  - "src/app/admin/afiliasi/**"
  - "src/app/coach/saldo/**"
  - "src/app/pool/saldo/**"
  - "src/app/coach/riwayat-sesi/**"
---

# Kerjaan uang (file yang sedang dibuka menyentuh uang)

- Mengubah logika, angka, atau aturan uang = Opus. Model aktif bukan Opus? Jangan mengubah logikanya. Urutan: skill sph-berisiko, lalu minta izin Hadi ganti model, lalu asisten Opus dengan brief lengkap, lalu berhenti dan tulis "perlu Opus". (Mengubah teks notifikasi atau tampilan saja boleh di Sonnet.)
- Sumber kebenaran saldo = buku besar (WalletTransaction). Jangan mengubah angka yang tampil tanpa paham ledger-nya.
- PPN komisi platform 11% (PLATFORM_TAX_PERCENT di src/lib/policy.ts), dihitung inklusif dari komisi. Baris lama yang tercatat 12% tidak diubah; pembalikan pendapatan membaca angka yang sudah tercatat, bukan menghitung ulang.
- Aturan bisnis yang belum tertulis di repo (refund, pembatalan, pembagian, pencairan, harga) = tanya Hadi, jangan ditebak.
- Wajib tes untuk cabang berhasil dan gagal. Bagian yang bisa diakses bersamaan juga dites lewat `npm run db:race` lalu `npm run test:race`.
- Sebelum menekan tombol bayar di Midtrans, pastikan key yang aktif adalah sandbox. Ragu = jangan.
- Migrasi ke production dijalankan Hadi, bukan Claude.
