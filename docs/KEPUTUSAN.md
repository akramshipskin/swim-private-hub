# KEPUTUSAN SPH (log bertanggal)

Arsip keputusan Hadi dan hal sensitif. TIDAK dimuat otomatis; dibaca bila perlu. Tambahkan di paling bawah, satu atau dua baris per keputusan. Jangan menulis password, kunci, atau token asli di sini: cukup lokasi, nama, dan tanggal ganti.

## Sebelum 1 Okt 2026 (ringkasan dari memori dan docs)
- 30 Sep: aplikasi masih pengembangan; semua akun dummy/sandbox, termasuk di production; fitur boleh dites tanpa tanya.
- 30 Sep: bagi hasil final 10/40/50 (lihat src/lib/policy.ts); komisi afiliasi 5% sekali dari paket pertama (kode coach atau kolam); PPN komisi platform 11% (inklusif); pajak komisi afiliasi dan PPN sesi tidak hadir ditanggung SPH; login salah 3 kali mengunci akun 15 menit; maksimal 5 kolam di landing (kolam contoh digeser kolam asli); Kebijakan Privasi diperbarui (belum dicek hukum); S&K 2.9 sudah disetujui hukum; 40 butir milestone disetujui.
- 29 Sep: sesi tidak hadir = 50% untuk coach; batas 24 jam coach menandai Hadir; saldo aman H+3; penyelenggara di S&K: PT Makna Krabat Indonesia.

## 1 Okt 2026: rombak cara main Claude
- Model: Sonnet bawaan. Opus hanya untuk uang, booking/slot, login/credential, skema, data production, dan aturan dengan pembeli/klien/mitra. Pemeriksa kerjaan Opus bukan Sonnet (Opus kedua berkonteks segar + tes otomatis).
- Mode kerja: JAGA (bawaan) dan TIDUR. Hadi marah = ada salah di Claude: berhenti, sebut salahnya, benerin.
- Sweeping UI = semua halaman x semua peran (tampilan dan tulisan). Sweeping sistem = semua halaman, peran, fitur, tombol, hitungan uang, logika. Laporan berupa tabel cakupan.
- Commit dan push/deploy boleh selama masih development (syarat: tes lulus, tidak ada migrasi baru). Setelah iklan SPH jalan, konfirmasi dulu.
- SPH berjalan di bawah PT Makna Krabat Indonesia (PT perorangan milik agency Krabat). Fakta ini hanya di dokumen hukum dan memori SPH. Aturan lama Hadi: Krabat tidak boleh dikait-kaitkan ke Chivas atau proyek personal di dokumen mana pun selain itu.
- les-renang-cianjur = cikal bakal SPH (arsip); Cloud session dicabut, OpenCode dipertahankan sebagai tukang tugas ringan.
- Animasi: HP ringan (kartu dan section muncul), desktop lebih kaya (hover, video perenang di header), landing paling kaya; hormati reduced-motion.
- Hal sensitif (bukan SPH): ada rahasia asli di luar repo ini yang tidak boleh dipindah ke folder tersinkron atau ditulis ke chat; detailnya ada di CLAUDE.md folder Chivas Media. Cadangan konfigurasi 1 Okt ada di folder cadangan akun (izin hanya pemilik).
- Kunci dan token production SPH: hanya dicatat lokasinya (Vercel, .env.prod, password manager Hadi). SECRET_ENCRYPTION_KEY ada di Vercel production dan harus tersimpan di password manager.
- 1 Okt malam: Hadi tidak mau membuka GitHub sendiri; Claude yang cek GitHub Actions lewat gh. Pengecualian: membuat secret tetap dikerjakan Hadi.
- 1 Okt malam: file HabasyGo yang ada di folder Krabat tidak dipindah (keputusan Hadi: "gausah"). Fakta SPH di bawah PT Makna Krabat Indonesia hanya di dokumen hukum dan memori SPH; dokumen Krabat tidak menyebut SPH (disetujui).
- 1 Okt malam: cabang brand-guideline-v2 digabung ke cabang utama (disetujui); animasi dikerjakan landing page dulu, lalu dalam aplikasi.
- 1 Okt malam: Claude tidak boleh mengganti model sesinya sendiri (alat ganti model menolak sesi sendiri). Jalur otomatis: skill dengan model opus dan asisten berkonteks segar dengan model pilihan; jalur manual: Hadi memilih di menu model.

## 1 Okt 2026 (malam): arahan Hadi untuk brand v2 dan animasi landing
- Gabung brand v2: banner dan foto profil dirender ulang dengan teks tagline terbaru; Hadi melihat dan menyetujui gambarnya SEBELUM masuk cabang utama.
- Ukur kecepatan landing sebelum dan sesudah animasi di lingkungan yang sama (versi jadi di laptop), plus cek di situs asli setelah tayang. Bila Lighthouse tidak ada, sebut alat pengganti.
- Video header: hanya desktop; berhenti bila "kurangi gerakan" atau hemat data menyala; pilih yang tanpa wajah jelas (terutama anak) dan jangan terkesan coach atau kolam SPH asli; izin Hadi dulu sebelum unduh.
- Push dua kali: setelah tahap 1 (brand v2) lulus, dan setelah tahap 2 (animasi landing).
- Gaya laporan: jelaskan istilah teknis (tsc, vitest, build, Lighthouse, cabang, bentrok) dengan bahasa awam; jangan sebut nama cabang atau file kecuali Hadi minta.
