# Plan: landing batch 10 (cabut 13 FAQ tambahan batch 9)

> Ditulis oleh Claude (Opus 5.5), 2026-09-29. Eksekutor: OpenCode. Semua
> keputusan SUDAH DIPUTUSKAN oleh Claude dan Hadi. OpenCode hanya menjalankan
> hunk di bawah persis seperti tertulis.
>
> **Sudah dicoba dulu oleh Claude**: semua hunk diterapkan dari dokumen ini
> ke repo, hasilnya `tsc` 0 error, `vitest` 519 lulus / 66 file, `eslint`
> bersih, `git diff --stat` = 1 file changed, 4 insertions(+), 48 deletions(-).
> Lalu dikembalikan. Kalau hasil Anda berbeda, laporkan, jangan diperbaiki sendiri.

## 1. Tujuan

Batch 9 menambah 13 FAQ baru di landing. Itu salah paham: isinya seharusnya
jadi section jualan baru (dikerjakan di batch berikutnya), bukan FAQ. Batch ini
mencabut 13 FAQ itu. Dua aturan yang wajib tertulis tetap ada dalam versi
pendek: sisa sesi hangus (orang tua) dan catatan milestone (coach).

Yang TIDAK diubah: hunk 1–3 batch 9 (langkah coach "sertifikat boleh lebih dari
satu", "isi catatan perkembangan", FAQ "satu atau beberapa sertifikat"). Biarkan.

## 2. Aturan main WAJIB

- **DILARANG** mengambil keputusan sendiri atau mengubah kata/baris lain
  selain yang tertulis di hunk.
- **DILARANG** menyentuh file/baris di luar hunk. Temuan lain dicatat di
  laporan, tidak diubah.
- **DILARANG** `git commit`, `git push`, `git stash`, `git checkout`,
  `git restore`, `git reset`, `git clean`, ganti branch. Yang boleh hanya
  `git status`, `git diff`, `git diff --stat`, `git log`.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`, `prisma/`,
  `src/generated/`, `docs/legal/`.
- **DILARANG** `npm install`, menyalakan/mematikan server, atau menyentuh
  database.
- **DILARANG** menjalankan `npm run build` di batch ini.
- Kalau "Snippet LAMA" tidak ditemukan persis, atau ditemukan lebih dari
  sekali di file itu: **STOP di hunk itu**, laporkan, jangan improvisasi.
- Snippet LAMA berupa beberapa baris utuh; ganti SELURUH blok LAMA dengan
  blok BARU. Snippet BARU lebih pendek dari LAMA (item FAQ dihapus), itu memang
  maksudnya.
- Spasi/indentasi/baris kosong di blok harus persis sama.
- File untracked lain di repo (`laporan-*.md`, `.qa-otp.mts`, dll): abaikan.
- Total file yang boleh diedit: **1 file**.

## 3. Scope file

1. `src/app/landing-view.tsx` — Hunk 1 sampai 3

## 4. Langkah kerja

**Langkah 0 — cek awal** (dari root repo):
```bash
git status --short
npx vitest run
```
Diharapkan: `git status --short` hanya baris `??` (tidak ada ` M`);
vitest **519 passed, 0 failed, 66 test files**. Kalau beda: STOP, laporkan.

**Langkah 1 — kerjakan Hunk 1 sampai 3.**

**Langkah 2 — verifikasi:**
```bash
npx tsc --noEmit
npx vitest run
npm run lint
git diff --stat
grep -c 'q: "' src/app/landing-view.tsx
```
Diharapkan: tsc 0 error; vitest **519 passed, 0 failed, 66 test files**;
lint bersih; `git diff --stat` = **1 file changed, 4 insertions(+), 48 deletions(-)**;
grep = **26**. Kalau gagal: jangan memperbaiki sendiri, laporkan outputnya.

## 5. Hunk

### Hunk 1 — FAQ orang tua: cabut 5 FAQ tambahan batch 9, sisakan 1 aturan pendek (sisa sesi hangus)

**Snippet LAMA** (harus ditemukan tepat 1 kali di `src/app/landing-view.tsx`):

```tsx
        a: "Tergantung coach dan kolamnya. Di profil setiap coach ada keahliannya, misalnya renang bayi & balita, anak usia dini, atau persiapan kompetisi.",
      },
      {
        q: "Tiket masuk kolam sudah termasuk?",
        a: "Ya. Harga paket sudah termasuk tiket masuk kolam untuk peserta. Pendamping yang tidak berenang (1 orang pada satu waktu, boleh bergantian) tidak dikenakan tiket.",
      },
      {
        q: "Bagaimana perkembangan anak dicatat?",
        a: "Setelah sesi, coach mencatat butir kemampuan yang sudah dikuasai peserta (milestone), dan kamu bisa melihatnya di menu Peserta. Catatan melekat pada peserta, jadi tetap berlanjut kalau ganti coach. Saat satu level selesai, aplikasi menerbitkan sertifikat level bertanda tangan coach. Sertifikat itu catatan perkembangan belajar di SPH, bukan sertifikasi resmi lembaga renang.",
      },
      {
        q: "Ada paket trial untuk coba dulu?",
        a: "Kolam bisa menyediakan paket trial: 1 sesi dengan harga khusus yang ditetapkan SPH, hanya untuk peserta yang belum pernah punya paket, satu kali per peserta. Kalau kolam pilihanmu punya paket trial, paketnya tampil di katalog untuk peserta yang memenuhi syarat.",
      },
      {
        q: "Bagaimana kalau sisa sesi belum habis saat masa berlaku paket berakhir?",
        a: "Sisa sesi yang tidak dipakai sampai masa berlaku paket berakhir dinyatakan hangus dan tidak dikembalikan dalam bentuk uang. Masa berlaku tertera saat pembelian, jadi atur jadwal sebelum masa berlaku habis.",
      },
      {
        q: "Bagaimana soal keselamatan di kolam?",
        a: "Pengajaran dilakukan coach di fasilitas kolam mitra. Kolam mitra bertanggung jawab atas kelayakan dan keselamatan fasilitas: petugas penyelamat selama jam operasional, perlengkapan dan petugas P3K, rambu kedalaman air, kebersihan air, serta keamanan lantai dan area kolam. Coach bertanggung jawab atas pelaksanaan dan kualitas pengajaran. Orang tua mengawasi anak di luar waktu sesi. SPH adalah penyedia platform dan tidak menyediakan asuransi, jadi disarankan punya asuransi kesehatan atau kecelakaan sendiri.",
      },
```

**Snippet BARU** (ganti LAMA dengan ini persis):

```tsx
        a: "Tergantung coach dan kolamnya. Di profil setiap coach ada keahliannya, misalnya renang bayi & balita, anak usia dini, atau persiapan kompetisi.",
      },
      {
        q: "Sisa sesi hangus kalau masa berlaku habis?",
        a: "Ya. Sisa sesi yang belum dipakai sampai masa berlaku paket berakhir hangus dan tidak dikembalikan dalam bentuk uang. Masa berlaku tertera saat pembelian.",
      },
```

### Hunk 2 — FAQ coach: cabut 4 FAQ tambahan batch 9, sisakan 1 aturan pendek (catatan milestone)

**Snippet LAMA** (harus ditemukan tepat 1 kali di `src/app/landing-view.tsx`):

```tsx
        a: "Jadwal, absensi, dan pembayaran diurus sistem. Kamu tinggal membuka jam kosong, mengajar, dan menandai kehadiran.",
      },
      {
        q: "Apa yang saya dapat dari komisi platform?",
        a: "Jadwal, absensi, dan pembayaran diurus sistem. Kamu juga mendapat catatan perkembangan peserta (milestone) dan sertifikat level bertanda tanganmu untuk peserta yang menyelesaikan level, serta kode afiliasi untuk murid yang kamu bawa sendiri. Kalau peserta sudah booking tapi tidak datang, kamu tetap dapat 50% dari bagianmu.",
      },
      {
        q: "Bagaimana kalau saya membawa murid sendiri?",
        a: "Setiap coach punya kode afiliasi di dashboard. Murid yang mendaftar memakai kodemu tercatat sebagai rujukanmu, dan setelah sesi pertamanya ditandai Hadir kamu mendapat komisi afiliasi dari bagian SPH, bukan dipotong dari harga yang dibayar member. Ketentuannya diatur di perjanjian kemitraan. SPH tidak menjanjikan jumlah murid dari platform.",
      },
      {
        q: "Ada biaya masuk kolam untuk coach?",
        a: "Tidak. Tiket masuk kolam untuk mengajar tidak ditagihkan ke coach.",
      },
      {
        q: "Apa aturan catatan milestone dan pencairan?",
        a: "Mulai 1 Oktober 2026, coach wajib mengisi catatan perkembangan (milestone) untuk peserta setelah setiap 2 sesi Hadir. Kalau catatannya belum diisi, pengajuan pencairan saldo yang baru ditahan sampai catatan dilengkapi. Pengajuan yang sudah masuk sebelumnya tetap diproses.",
      },
```

**Snippet BARU** (ganti LAMA dengan ini persis):

```tsx
        a: "Jadwal, absensi, dan pembayaran diurus sistem. Kamu tinggal membuka jam kosong, mengajar, dan menandai kehadiran.",
      },
      {
        q: "Wajib isi catatan perkembangan peserta?",
        a: "Ya. Mulai 1 Oktober 2026, isi catatan perkembangan (milestone) setiap 2 sesi Hadir per peserta. Selama ada catatan yang belum diisi, pengajuan pencairan saldo yang baru ditahan.",
      },
```

### Hunk 3 — FAQ pemilik kolam: cabut 4 FAQ tambahan batch 9

**Snippet LAMA** (harus ditemukan tepat 1 kali di `src/app/landing-view.tsx`):

```tsx
Halaman ini menampilkan kolam-kolam paling aktif, jadi kemunculannya di sini mengikuti aktivitas kolammu.",
      },
      {
        q: "Bagaimana dengan tiket masuk peserta?",
        a: "Tiket masuk peserta tercakup di bagian kolam dari harga paket, jadi member tidak ditagih tiket terpisah di loket. Pendamping yang tidak berenang tidak dikenakan tiket.",
      },
      {
        q: "Siapa yang bertanggung jawab atas keselamatan?",
        a: "Kolam mitra bertanggung jawab atas kelayakan dan keselamatan fasilitas: petugas penyelamat selama jam operasional, perlengkapan dan petugas P3K, rambu kedalaman air, kebersihan air, serta keamanan lantai dan area kolam. Coach bertanggung jawab atas pengajaran. SPH adalah penyedia platform dan tidak mengelola fasilitas kolam.",
      },
      {
        q: "Apakah kolam punya kode afiliasi?",
        a: "Ya. Member yang mendaftar memakai kode kolammu tercatat sebagai rujukan kolam, dan kolam mendapat komisi afiliasi dari bagian SPH setelah sesi pertama member itu ditandai Hadir. Ketentuannya diatur di perjanjian kemitraan.",
      },
      {
        q: "Bagaimana kalau ada paket trial?",
        a: "Paket trial (1 sesi, harga khusus) ditetapkan SPH per kolam. Pembagian hasil sesi trial dihitung dari harga trial itu, sehingga bagian kolam untuk sesi trial mengikuti harga yang lebih rendah.",
      },
```

**Snippet BARU** (ganti LAMA dengan ini persis):

```tsx
Halaman ini menampilkan kolam-kolam paling aktif, jadi kemunculannya di sini mengikuti aktivitas kolammu.",
      },
```

## 6. Format laporan

Tulis ke `laporan-mekanis-batch-10-2026-09-29.md` (file baru di root, jangan di-commit):
1. Hunk yang diterapkan (nomor + ya/tidak); untuk yang tidak: alasan persis.
2. Output 5 perintah Langkah 2 (ringkas: angka lulus/gagal, `git diff --stat` utuh, angka grep).
3. Temuan lain yang dilihat tapi TIDAK diubah.
