# Plan: mekanis batch 6 (teks harga "beli 1 sesi" disamakan dengan sistem)

> Ditulis oleh Claude (Opus 5.5), 2026-09-29. Eksekutor: OpenCode. Semua
> keputusan SUDAH DIPUTUSKAN oleh Claude. OpenCode hanya menjalankan hunk
> di bawah persis seperti tertulis.
>
> **Sudah dicoba dulu oleh Claude**: kedua hunk diterapkan dari dokumen ini
> ke repo, hasilnya `tsc` 0 error, `vitest` 455 lulus / 57 file, `eslint`
> bersih, `git diff --stat` = 2 files changed, 2 insertions(+), 2
> deletions(-). Lalu dikembalikan. Kalau hasil Anda berbeda, laporkan,
> jangan diperbaiki sendiri.

## 1. Tujuan

Teks bantuan menyebut harga beli 1 sesi di kolam lain = "harga per sesi
kolam itu + 20%". Sistem sebenarnya memakai harga per sesi **termahal** di
kolam itu (`src/lib/drop-in.ts` baris 13: `Math.max(...perSession)`). Kolam
bisa punya beberapa paket dengan harga per sesi berbeda, jadi teks lama bisa
membuat member mengira harganya lebih murah dari tagihan. Teks disamakan
dengan sistem. Tidak ada perubahan logika.

## 2. Aturan main WAJIB

- **DILARANG** mengambil keputusan sendiri atau mengubah kata lain selain
  yang tertulis di hunk.
- **DILARANG** menyentuh file/baris di luar hunk. Temuan lain dicatat di
  laporan, tidak diubah.
- **DILARANG** `git commit`, `git push`, `git stash`, `git checkout`,
  `git restore`, `git reset`, `git clean`, ganti branch. Yang boleh hanya
  `git status`, `git diff`, `git diff --stat`, `git log`.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`, `prisma/`,
  `src/generated/`, `docs/legal/`.
- **DILARANG** `npm install`, menyalakan/mematikan server (`npm run dev`,
  `npm run db:dev`, `next start`, `pkill`), atau menyentuh database.
- **DILARANG** menjalankan `npm run build` di batch ini (tidak perlu; hanya
  teks, dan build menimpa server lokal yang sedang dipakai Claude).
- Kalau "Snippet LAMA" tidak ditemukan persis, atau ditemukan lebih dari
  sekali di file itu: **STOP di hunk itu**, laporkan, jangan improvisasi.
- Snippet LAMA/BARU di bawah adalah **potongan di dalam satu baris
  panjang**. Ganti HANYA potongan itu; sisa baris (sebelum dan sesudahnya)
  tidak diubah. `${DROP_IN_MARKUP_PERCENT}` dan `${DROP_IN_DURATION_DAYS}`
  adalah kode, salin persis termasuk `${` dan `}`.
- File untracked lain di repo (`laporan-*.md`, `.qa-otp.mts`, dll): abaikan.
- Total file yang boleh diedit: **2 file**.

## 3. Scope file

1. `src/app/landing-view.tsx` — Hunk 1
2. `src/app/panduan/panduan-view.tsx` — Hunk 2

## 4. Langkah kerja

**Langkah 0 — cek awal** (dari root repo):
```bash
git status --short
npx vitest run
```
Diharapkan: `git status --short` hanya baris `??` (tidak ada ` M`);
vitest **455 passed, 0 failed, 57 test files**. Kalau beda: STOP, laporkan.

**Langkah 1 — kerjakan Hunk 1 dan Hunk 2.**

**Langkah 2 — verifikasi:**
```bash
npx tsc --noEmit
npx vitest run
npm run lint
git diff --stat
```
Diharapkan: tsc 0 error; vitest **455 passed, 0 failed, 57 test files**;
lint bersih; `git diff --stat` = **2 files changed, 2 insertions(+), 2
deletions(-)**. Kalau gagal: jangan diperbaiki, jangan di-revert, salin
error persis ke laporan.

---

## HUNK 1 — FAQ landing

**File:** `src/app/landing-view.tsx`
**Sekitar baris:** 91 (FAQ "Paket bisa dipakai di kolam mana saja?")

**Snippet LAMA (potongan di dalam baris, cari persis):**
```
(harga per sesi kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Snippet BARU:**
```
(harga per sesi termahal di kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Perubahan:** sisipkan kata `termahal di ` (dengan spasi sesudahnya) di
antara `per sesi ` dan `kolam itu`. Hanya itu.

---

## HUNK 2 — Panduan pemakaian

**File:** `src/app/panduan/panduan-view.tsx`
**Sekitar baris:** 79

**Snippet LAMA (potongan di dalam baris, cari persis):**
```
(harga per sesi kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Snippet BARU:**
```
(harga per sesi termahal di kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Perubahan:** sama persis dengan Hunk 1, di file ini.

---

## 5. Risiko + Gear

Gear setara Sonnet Medium. Hanya teks, tanpa logika/uang/auth.

## 6. Format laporan (WAJIB)

```
## Laporan eksekusi — mekanis-batch-6

Langkah 0: git status = [bersih / ada file modified: ...]; vitest awal = [angka persis]
Hunk 1 (landing-view.tsx): [BERHASIL / DILEWATI, alasan: ...]
Hunk 2 (panduan-view.tsx): [BERHASIL / DILEWATI, alasan: ...]
tsc --noEmit: [jumlah error persis]
vitest run: [angka "X passed, Y failed, Z test files" persis]
npm run lint: [bersih / temuan persis]
git diff --stat: [baris ringkasan terakhir persis]
Ditemukan tapi TIDAK disentuh: [list / "tidak ada"]
Pertanyaan balik: [list / "tidak ada"]
```

Tanpa angka persis = dianggap belum diverifikasi.
