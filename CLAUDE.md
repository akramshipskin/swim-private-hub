@AGENTS.md

# Swim Private Hub (SPH): aturan khusus project

Aturan umum (jujur, mode jaga/tidur, format jawaban, sweeping, catatan) ada di ~/.claude/CLAUDE.md. File ini hanya untuk SPH, dan bila bertentangan dengan memori otomatis, file ini yang berlaku. Kondisi terkini ada di docs/STATUS.md (dimuat otomatis di awal sesi; bila tidak muncul, baca sendiri sebelum kerja). Daftar kerjaan sisa: docs/backlog/sph-backlog-gabungan-2026-09-29.md, bagian paling bawah (status terbaru); buka dulu sebelum menjawab soal landing atau kerjaan sisa.

## Urutan acuan aturan bisnis (Hadi 2 Okt malam, #2)
Bila sumber saling bertentangan, yang berlaku: (1) kode, (2) docs/aturan-bisnis-saat-ini.md, (3) docs/KEPUTUSAN.md, (4) brand-kit/MESSAGING.md, (5) dokumen lama di docs/designs/ dan README. Dokumen lama (marketplace-pivot, simulasi-pendapatan-kolam) tidak boleh jadi acuan. Kode yang menyimpang dari keputusan Hadi tetap dilaporkan, bukan diikuti diam-diam.

## Produk dan pembagian peran
- Marketplace les renang privat: member (orang tua), coach, pemilik kolam, admin. Penyelenggara: PT Makna Krabat Indonesia (fakta ini hanya di dokumen hukum dan memori SPH; jangan dipakai di materi Chivas atau agency).
- Hadi memutuskan APA (produk, bisnis, tampilan). Claude memutuskan BAGAIMANA dan memilih cara teknis yang aman.
- Aplikasi masih dalam pengembangan dan semua akun dummy/sandbox, termasuk di production. Tes fitur apa pun tanpa tanya, dalam batas keras di aturan umum (tidak ada uang sungguhan, tidak ada password ke situs production).

## Hadi sering berpikir sambil bicara
"Kepikiran…", "menurut lu…", "gimana kalau…" = eksplorasi, bukan perintah coding. Pahami ide, periksa sistem yang ada, tantang secara konstruktif, sebut konsekuensi, pisahkan fakta / implikasi / trade-off / keputusan. Jangan setuju otomatis dan jangan mengarang masalah. Bila ada desain yang lebih sederhana untuk tujuan yang sama, sebutkan. Cek blind spot hanya pada sisi yang relevan (produk, bisnis, booking, uang, izin, data, UX).

## Berhenti dan tanya Hadi (keputusan bisnis)
Jangan menebak aturan tentang: harga, janji ke pelanggan, syarat kelayakan, pembatalan, refund, status pembayaran, pengakuan pendapatan, bagi hasil coach/kolam/SPH, komisi, perilaku saldo, pencairan, pemilik booking, hak akses, isolasi antar kolam/tenant, data historis, migrasi yang menghapus data. Bila repo sudah menetapkan aturannya, ikuti repo kecuali Hadi minta diubah. Bila repo ambigu atau saling bertentangan, tampilkan ke Hadi.

## Risiko tinggi
- Nilai risiko dari akibatnya, bukan besar kodenya: 10 baris di dompet bisa lebih berbahaya daripada 500 baris UI.
- **Uang:** pahami dulu sumber kebenarannya (buku besar / ledger), apa yang memicu pengakuan pendapatan, dan nasibnya saat batal, refund, pencairan. Jangan "memperbaiki" saldo yang tampil tanpa paham ledger. Tidak ada jalan pintas demi kode lebih sederhana.
- **Booking, slot, saldo:** server yang menjaga aturan, bukan tampilan. Pikirkan dua permintaan yang masuk bersamaan.
- **Login dan hak akses:** anggap API bisa dipanggil langsung tanpa lewat tampilan.

## Model (khusus SPH)
- **Opus wajib** untuk mengubah logika, angka, atau aturan di: uang (pembayaran, refund, saldo, bagi hasil, komisi, pencairan), booking/slot/ketersediaan, login/hak akses/credential, skema database, data production, dan aturan dengan pembeli/klien/mitra. Tenaga Medium; naik hanya untuk insiden atau audit uang.
- **Sonnet** untuk selain itu: teks, gaya, UI, debug biasa, fitur beberapa file, sweeping UI (Sonnet High), menantang ide dan blind spot. Naikkan tenaga hanya bila penyelidikan menemukan risiko nyata, bukan karena repo besar atau karena sebelumnya memakai Opus.
- **Sweeping sistem:** bagian uang, login, dan logika sensitif dikerjakan di Opus; bagian tampilan di Sonnet High.
- **Model aktif bukan Opus untuk kerjaan Opus?** Urutan: (1) pakai skill sph-berisiko; (2) minta Hadi memilih Opus lewat menu model (Claude tidak boleh mengganti modelnya sendiri: alat ganti model menolak sesi sendiri); (3) delegasikan ke asisten Opus dengan brief lengkap: aturan bisnis sudah dijawab Hadi, asisten dilarang menebak ("tidak jelas" = lapor), hasilnya diperiksa Opus kedua berkonteks segar ditambah tes; (4) bila semuanya tidak bisa, berhenti dan tulis "perlu Opus". Pemeriksa penilaian tidak boleh Sonnet.
- Perubahan teks notifikasi atau tampilan pada file uang tidak perlu Opus.

## Cara kerja dan verifikasi
- Urutan: paham → periksa → nilai risiko → kerjakan → uji → verifikasi → jelaskan. Jangan lewati paham karena perubahannya tampak jelas.
- Perubahan logika: `npx tsc --noEmit` (cek exit code langsung, jangan lewat pipe), `npx vitest run`, `npm run build`. Perubahan tampilan: verifikasi di browser. Detail aturan teknis ada di AGENTS.md.
- Selesai = hasil sesuai maksud Hadi, tes lulus, tidak ada regresi, cakupan pas. Kerjakan perubahan terkecil yang aman; masalah yang berkaitan langsung disebutkan, refactor lain jangan.
- Jelaskan risiko dengan bahasa bisnis, contoh: "ini menyentuh catatan uang asli; kalau salah, saldo coach atau kolam ikut salah".

## Desain dan animasi
- Brand guideline: src/app/brandguideline/ (data.ts adalah sumber isinya). Ada versi lebih baru di cabang brand-guideline-v2; cek sebelum mengubah. Pakai skill prinsip-desain-hadi dan copy-indonesia.
- Landing dipakai jualan dan trafiknya dari iklan Meta, mayoritas lewat HP: kecepatan dan kejelasan diutamakan. Kekhawatiran calon pembeli dijawab lewat section jualan, bukan daftar FAQ panjang.
- Animasi: HP ringan (kartu dan section muncul saat masuk layar, tanpa hover, tanpa video di header). Desktop lebih kaya (hover, muncul bertahap, video perenang di header). Hormati reduced-motion dan ukur kecepatan sebelum dan sesudah.
- Video header: stok gratis berlisensi komersial (Pexels, Pixabay, Unsplash). Cek lisensinya dan minta izin Hadi sebelum mengunduh (sebut nama file, sumber, ukuran).

## Deploy
- Ada file baru di prisma/migrations/ sejak origin/main? Berhenti. Hadi menjalankan migrasi ke database production LEBIH DULU, baru push (Claude tidak punya akses database production): `set -a; source .env.prod; set +a; DATABASE_URL=$PROD_DIRECT_URL DIRECT_URL=$PROD_DIRECT_URL npx prisma migrate deploy`. Kode yang memakai kolom baru sebelum migrasi = semua login rusak. `npm run build` tidak menjalankan migrasi.
- Commit dan push/deploy BOLEH selama masih development (izin Hadi 1 Okt 2026), dengan syarat: tsc, vitest, dan build lulus (perubahan dokumen saja tidak perlu build) dan tidak ada migrasi baru. Kumpulkan push di akhir satu batch kerja. Setelah Hadi bilang iklan SPH sudah jalan: konfirmasi dulu sebelum push. Bila sistem keamanan menolak push, laporkan; jangan dipaksa.

## OpenCode
Tugas mekanis (teks, nama, tampilan tanpa logika) ditulis Claude ke docs/plans/<nama>.md dengan potongan LAMA/BARU persis (contoh format: docs/plans/ui-consistency-batch-1.md): cakupan file, aturan main, verifikasi, format laporan. Semua keputusan desain sudah diambil Claude; OpenCode hanya mengeksekusi. Sesudah OpenCode melapor, Claude memvalidasi sendiri (diff per potongan, tsc, vitest, build, browser) sebelum commit; laporan OpenCode bukan bukti. Claude tidak bekerja paralel dengan OpenCode. Sesi Cloud tidak dipakai lagi.
