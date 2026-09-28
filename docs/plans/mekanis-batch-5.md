# Plan: mekanis batch 5 (CI build, slot kolam nonaktif, aturan tampil coach)

> Ditulis oleh Claude (Sonnet 5.5 Medium), 2026-09-29. Eksekutor: OpenCode.
> Semua keputusan di dokumen ini SUDAH DIPUTUSKAN oleh Claude. OpenCode
> TIDAK mengambil keputusan apa pun, hanya menjalankan hunk di bawah
> persis seperti tertulis.
>
> **Sudah dicoba dulu oleh Claude di salinan repo bersih (git worktree
> tanpa `.env`)**: keempat hunk di bawah diterapkan verbatim, hasilnya
> `tsc` 0 error, `vitest` 448 lulus / 56 file, `eslint` bersih, `npm run
> build` sukses. Tes baru di Hunk 3 terbukti GAGAL kalau perbaikan di Hunk 2
> dicabut. Jadi kalau hasil Anda berbeda dari angka di bagian 4, ada yang
> tidak persis — laporkan, jangan diperbaiki sendiri.

## 1. Tujuan

Tiga perbaikan kecil yang murni mekanis, sumbernya backlog
`docs/backlog/sph-backlog-gabungan-2026-09-29.md`:

| Backlog | Isi | Hunk |
|---|---|---|
| 5.2 | CI (GitHub Actions) belum pernah menjalankan `npm run build` | 1 |
| 4.2 | `/api/availability` masih menampilkan slot di kolam nonaktif (booking-nya ditolak di `/api/booking`, tapi member tetap melihat slot yang tidak bisa dipakai) | 2 + 3 (tes) |
| 4.1 | `/pelatih/[coachId]` tidak mengecek profil coach aktif, padahal landing dan Cari Coach mengecek | 4 |

Tidak ada perubahan skema database, tidak ada migrasi, tidak ada perubahan
teks/tampilan selain yang tertulis di hunk.

## 2. Aturan main WAJIB (baca sebelum mulai)

- **DILARANG** mengambil keputusan desain sendiri. Semua sudah diputuskan.
- **DILARANG** menyentuh file atau baris di luar yang disebut di hunk. Kalau
  menemukan hal lain yang "kelihatan salah juga" — JANGAN diubah, catat di
  laporan akhir pada bagian "Ditemukan tapi TIDAK disentuh".
- **DILARANG** `git commit`, `git push`, `git stash`, `git checkout`, `git
  restore`, `git reset`, `git clean`, ganti branch, atau perintah git yang
  mengubah apa pun. Perintah git yang BOLEH hanya baca: `git status`, `git
  diff`, `git diff --stat`, `git log`. Commit dilakukan Claude/Hadi setelah
  validasi.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`, `prisma/`,
  `src/generated/`.
- **DILARANG** `npm install` / menambah paket apa pun.
- **DILARANG** menyalakan atau mematikan server (`npm run dev`, `npm run
  db:dev`, `next start`, `pkill`). Ada server lokal di port 3101 yang
  sedang jalan dari build lama: BIARKAN. (`npm run build` di bagian 4 akan
  menimpa folder `.next`; server 3101 mungkin jadi tidak konsisten. Itu
  bukan masalah Anda, jangan dinyalakan ulang, Claude yang urus.)
- **DILARANG** menjalankan `prisma migrate`, `prisma db push`, atau apa pun
  yang menyentuh database.
- **DILARANG** klik/buka halaman checkout atau memanggil Midtrans. (Tidak
  ada langkah browser di dokumen ini; kalau Anda merasa perlu membuka
  browser, itu tanda ada yang salah — berhenti dan tanyakan.)
- Kalau string di "Snippet LAMA" TIDAK ditemukan persis (spasi/indentasi
  beda, kode sudah berubah) ATAU ditemukan LEBIH DARI SEKALI — **STOP di
  hunk itu**, jangan improvisasi, jangan coba versi terdekat. Tulis di
  laporan: "Hunk N tidak cocok, dilewati, alasan: <apa bedanya>".
- Indentasi di snippet adalah **spasi**, bukan tab. Salin persis, termasuk
  jumlah spasi di awal baris.
- Path `src/app/pelatih/[coachId]/page.tsx` mengandung tanda kurung siku
  yang LITERAL (nama folder memang `[coachId]`). Di terminal (zsh) path itu
  HARUS diberi tanda kutip: `"src/app/pelatih/[coachId]/page.tsx"`. Tanpa
  kutip, zsh menganggapnya pola dan perintah gagal.
- Di repo ada banyak file **untracked** yang bukan milik batch ini
  (`laporan-*.md`, `ui-inconsistency-report-*.md`, `.qa-otp.mts`,
  `docs/plans/sweep-total-*.md`). ABAIKAN semuanya. Jangan dibuka, diubah,
  atau dihapus.
- Total file yang boleh diedit: **4 file** (daftar di bagian 3).

## 3. Scope file (HANYA 4 file ini, HANYA baris yang disebut)

1. `.github/workflows/test.yml` — Hunk 1
2. `src/app/api/availability/route.ts` — Hunk 2
3. `src/app/api/availability/route.test.ts` — Hunk 3
4. `src/app/pelatih/[coachId]/page.tsx` — Hunk 4

## 4. Langkah kerja (urut, jangan diacak)

**Langkah 0 — cek kondisi awal SEBELUM mengedit apa pun.** Dari root repo:

```bash
git status --short
npx vitest run
```

Yang diharapkan:
- `git status --short` hanya berisi baris berawalan `??` (file untracked).
  Tidak boleh ada baris ` M` (modified). Kalau ada file modified: STOP, tulis
  di laporan file apa saja, jangan lanjut.
- `vitest`: **447 passed, 0 failed, 56 test files**. Kalau angkanya beda:
  STOP, tulis angka persis yang keluar, jangan lanjut.

**Langkah 1 — kerjakan Hunk 1, 2, 3, 4 sesuai urutan.** Aturan urutan:
Hunk 3 (tes) HANYA dikerjakan kalau Hunk 2 BERHASIL. Kalau Hunk 2 dilewati,
lewati Hunk 3 juga dan tulis alasannya. Hunk 1 dan Hunk 4 berdiri sendiri.

**Langkah 2 — verifikasi**, dari root repo, berurutan, catat output ASLI:

```bash
npx tsc --noEmit
npx vitest run
npm run lint
npm run build
git diff --stat
```

Angka yang diharapkan kalau SEMUA hunk berhasil:
- `tsc --noEmit`: tidak ada output error, exit code 0.
- `vitest run`: **448 passed, 0 failed, 56 test files** (447 lama + 1 tes
  baru dari Hunk 3).
- `npm run lint`: tidak ada temuan (hanya dua baris `> swim-private-hub@...`
  dan `> eslint`).
- `npm run build`: selesai tanpa kata "Failed to compile" / "Build error".
- `git diff --stat`: tepat **4 files changed, 17 insertions(+), 3
  deletions(-)**, dengan 4 nama file dari bagian 3. Kalau angkanya atau
  daftar filenya beda, tulis persis apa yang keluar.

Kalau hanya sebagian hunk yang berhasil, angka di atas otomatis berbeda
(misal tanpa Hunk 3 → 447 lulus). Itu boleh, asalkan Anda menuliskan hunk
mana yang dilewati dan angka persis yang keluar.

Kalau `tsc` atau `vitest` gagal: JANGAN diperbaiki sendiri, JANGAN
di-revert. Biarkan kondisi apa adanya, salin pesan error persis ke laporan,
berhenti.

---

## HUNK 1 — CI ikut menjalankan build

**File:** `.github/workflows/test.yml`
**Sekitar baris:** 20 (baris terakhir file)

**Alasan (konteks, bukan untuk dipertimbangkan ulang):** CI sekarang hanya
lint + type check + unit test. Error yang lolos ketiganya (import rusak,
halaman gagal dirender saat build) baru ketahuan setelah deploy. Claude
sudah menguji `npm run build` di salinan repo TANPA file `.env` (kondisi
persis GitHub Actions): sukses, jadi tidak perlu variabel environment
tambahan di workflow.

**Snippet LAMA (cari persis ini, 1 baris, indentasi 6 spasi):**
```
      - run: npm test
```

**Snippet BARU (ganti baris itu jadi 3 baris ini, indentasi tiap baris 6 spasi):**
```
      - run: npm test
      # Build production: menangkap error yang lolos tsc/lint (import rusak, halaman gagal render).
      - run: npm run build
```

**Perubahan:** Setelah baris `- run: npm test`, tambahkan dua baris baru
(satu baris komentar YAML berawalan `#`, satu baris `- run: npm run
build`). Baris `- run: npm test` itu sendiri TETAP ADA dan tidak berubah.
Jangan tambah `env:`, jangan ubah step lain, jangan ubah urutan step yang
sudah ada.

**PERHATIAN:** kalau `- run: npm test` muncul lebih dari sekali di file,
STOP dan laporkan ambigu (harusnya hanya 1x). Pastikan file diakhiri satu
baris baru (newline) seperti semula.

---

## HUNK 2 — Slot di kolam nonaktif tidak ditampilkan

**File:** `src/app/api/availability/route.ts`
**Sekitar baris:** 27–28

**Alasan:** `/api/booking` sudah menolak booking di kolam nonaktif
(`pool.isActive`), tapi query jadwal ini tidak memfilternya, sehingga
member melihat slot yang pasti ditolak. Filter yang sama diterapkan di
query jadwal, TANPA syarat (berlaku dengan maupun tanpa parameter
`poolId`).

**Snippet LAMA (cari persis ini, 2 baris berurutan, indentasi 4 spasi):**
```
    // Slot coach yang dinonaktifkan admin tidak ditampilkan (tidak bisa dibooking).
    where: { date: dateLabel(date), coach: { isActive: true }, ...NOT_CLOSED, ...(poolId ? { poolId } : {}) },
```

**Snippet BARU (ganti jadi ini, 2 baris, indentasi 4 spasi):**
```
    // Slot coach yang dinonaktifkan admin atau di kolam nonaktif tidak ditampilkan (tidak bisa dibooking).
    where: { date: dateLabel(date), coach: { isActive: true }, pool: { isActive: true }, ...NOT_CLOSED, ...(poolId ? { poolId } : {}) },
```

**Perubahan:** (a) di baris komentar: kata "admin" diikuti " atau di
kolam nonaktif" (lihat teks BARU). (b) di baris `where`: sisipkan
`pool: { isActive: true },` TEPAT di antara `coach: { isActive: true },`
dan `...NOT_CLOSED,`. Semua bagian lain baris itu TETAP SAMA.

**PERHATIAN:** kalau 2 baris LAMA tidak ditemukan berurutan persis seperti
di atas, STOP dan laporkan.

---

## HUNK 3 — Tes regresi untuk Hunk 2

**Kerjakan HANYA kalau Hunk 2 BERHASIL.**

**File:** `src/app/api/availability/route.test.ts`
**Sekitar baris:** 19–22

**Alasan:** setiap perbaikan bug wajib punya tes regresi (aturan
`AGENTS.md`). Tes ini memanggil endpoint dua kali (dengan dan tanpa
`poolId`) dan memastikan filter kolam aktif ikut terkirim ke query.
Claude sudah membuktikan tes ini GAGAL tanpa Hunk 2 dan LULUS dengan
Hunk 2.

**Snippet LAMA (cari persis ini, 4 baris berurutan, indentasi 2 spasi untuk `it(`/`});`, 4 spasi untuk isi):**
```
  it("accepts a well-formed date", async () => {
    const res = await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"));
    expect(res.status).toBe(200);
  });
```

**Snippet BARU (ganti jadi ini; blok LAMA tetap utuh di atas, blok baru ditambahkan di bawahnya dengan SATU baris kosong di antaranya):**
```
  it("accepts a well-formed date", async () => {
    const res = await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"));
    expect(res.status).toBe(200);
  });

  // Regression: slot di kolam nonaktif dulu ikut tampil (booking-nya ditolak
  // di /api/booking, tapi member tetap melihat slot yang tidak bisa dipakai).
  it("only queries slots in active pools, with or without a poolId filter", async () => {
    for (const url of ["http://x/api/availability?date=2099-01-05&poolId=p1", "http://x/api/availability?date=2099-01-05"]) {
      findMany.mockClear();
      await GET(new Request(url));
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findMany.mock.calls[0][0].where.pool).toEqual({ isActive: true });
    }
  });
```

**Perubahan:** tambahkan blok tes baru (komentar 2 baris + satu `it(...)`)
SETELAH blok `it("accepts a well-formed date"...)`, di DALAM `describe`
yang sama (sebelum `});` penutup describe di akhir file). Tes lain di file
TIDAK diubah dan TIDAK dihapus. Jangan ganti `findMany` mock di bagian atas
file. Jangan menambah `import` baru.

**PERHATIAN:** kalau blok LAMA muncul lebih dari sekali, atau tidak persis
sama, STOP dan laporkan.

---

## HUNK 4 — `/pelatih/[coachId]` ikut aturan "akun aktif DAN profil aktif"

**File:** `src/app/pelatih/[coachId]/page.tsx` (INGAT: beri tanda kutip di terminal)
**Sekitar baris:** 37–38

**Alasan:** landing dan halaman Cari Coach hanya menampilkan coach yang
akun DAN profilnya aktif. Halaman detail coach hanya mengecek akun.
Aturannya disamakan. (Dampak praktis saat ini nol karena kolom profil aktif
belum pernah diubah ke `false` di aplikasi; ini menyamakan aturan supaya
tidak jadi celah nanti.)

**Snippet LAMA (cari persis ini, 2 baris berurutan, indentasi 4 spasi):**
```
    // Coach nonaktif (belum disetujui / dinonaktifkan admin) tidak dipublikasikan.
    where: { id: coachId, role: "COACH", isActive: true },
```

**Snippet BARU (ganti jadi ini, 3 baris, indentasi 4 spasi):**
```
    // Coach nonaktif (belum disetujui / dinonaktifkan admin) tidak dipublikasikan.
    // Aturan sama dengan landing & Cari Coach: akun aktif DAN profil coach aktif.
    where: { id: coachId, role: "COACH", isActive: true, coachProfile: { isActive: true } },
```

**Perubahan:** (a) tambahkan SATU baris komentar baru di antara baris
komentar lama dan baris `where`. (b) di baris `where`: tambahkan
`, coachProfile: { isActive: true }` setelah `isActive: true` (sebelum
`}` penutup). Baris komentar lama TETAP ADA. Sisa file TIDAK disentuh.

**PERHATIAN:** kalau 2 baris LAMA tidak ditemukan persis, STOP dan laporkan.

---

## 5. Yang SENGAJA tidak ada di dokumen ini (jangan dikerjakan)

Dari backlog, item ini TIDAK termasuk batch ini. Jangan disentuh walau
terlihat mudah:

- Semua yang menyentuh uang, wallet, penarikan, enkripsi, 2FA, skema
  database, otorisasi (item 10–14, 17 di backlog): dikerjakan Claude
  langsung, bukan lewat OpenCode.
- Draft S&K dan MOU (butuh review hukum).
- Teks landing yang masih menunggu keputusan bisnis Hadi (tiket kolam,
  durasi sesi, trial, komisi, dll).
- Perapihan narasi sebelum/sesudah dan copy badge "Bersertifikat" di
  landing (butuh keputusan desain, bukan mekanis).
- Sisa sweep QA (butuh login akun uji dan database lokal).
- File `.qa-otp.mts` (masih dipakai sampai sweep selesai).

## 6. Risiko + Gear

**Gear: Sonnet Medium setara.** Tidak menyentuh uang, auth, skema,
booking, atau webhook. Perubahan runtime hanya dua kondisi filter query
(Hunk 2 dan 4) yang bersifat MEMPERSEMPIT hasil, dan satu step CI. Tidak
ada STOP condition bisnis; satu-satunya alasan berhenti adalah snippet LAMA
tidak cocok persis atau angka verifikasi di bagian 4 berbeda.

## 7. Format laporan eksekutor (WAJIB, isi persis format ini di akhir)

```
## Laporan eksekusi — mekanis-batch-5

Langkah 0 (kondisi awal): git status = [bersih dari file modified / ada file modified: ...]; vitest awal = [angka "X passed, Y failed, Z files" persis]

Hunk 1 (.github/workflows/test.yml): [BERHASIL / DILEWATI, alasan: ...]
Hunk 2 (api/availability/route.ts): [BERHASIL / DILEWATI, alasan: ...]
Hunk 3 (api/availability/route.test.ts): [BERHASIL / DILEWATI, alasan: ...]
Hunk 4 (pelatih/[coachId]/page.tsx): [BERHASIL / DILEWATI, alasan: ...]

tsc --noEmit: [jumlah error persis, harus 0]
vitest run: [angka "X passed, Y failed, Z test files" persis dari output; diharapkan 448 / 0 / 56]
npm run lint: [bersih / temuan persis]
npm run build: [sukses / gagal + pesan error persis]
git diff --stat: [salin baris ringkasan terakhir persis; diharapkan "4 files changed, 17 insertions(+), 3 deletions(-)"]

Ditemukan tapi TIDAK disentuh (di luar scope): [list, atau "tidak ada"]
Pertanyaan balik (kalau ada yang ambigu): [list, atau "tidak ada"]
```

Jangan menulis "aman"/"beres"/"selesai" tanpa angka-angka di atas.
Laporan tanpa angka persis dianggap belum diverifikasi dan akan
diulang oleh Claude dari awal.

## 8. Setelah OpenCode lapor (bagian Claude, bukan OpenCode)

Claude memvalidasi independen sebelum commit: `git diff` per hunk
dibandingkan dengan dokumen ini, `tsc`, `vitest`, `lint`, `build`, lalu
membuktikan tes Hunk 3 gagal kalau Hunk 2 dicabut. Laporan OpenCode
sendiri bukan bukti (CLAUDE.md §29 poin 5).
