# Plan: mekanis batch 8 (harga per sesi tidak ditampilkan ke member; yang tampil harga paket)

> Ditulis oleh Claude (Sonnet 5.5), 2026-09-29. Eksekutor: OpenCode. Semua
> keputusan SUDAH DIPUTUSKAN oleh Claude dan Hadi. OpenCode hanya menjalankan
> hunk di bawah persis seperti tertulis.
>
> **Sudah dicoba dulu oleh Claude**: semua hunk diterapkan dari dokumen ini
> ke repo, hasilnya `tsc` 0 error, `vitest` 464 lulus / 58 file (sama dengan
> sebelum perubahan), `eslint` bersih, `git diff --stat` = 6 files changed, 11 insertions(+), 22 deletions(-). Lalu
> dikembalikan. Kalau hasil Anda berbeda, laporkan, jangan diperbaiki sendiri.

## 1. Tujuan

Keputusan Hadi (29 Sep): harga **per sesi** tidak diinformasikan ke member;
yang tampil harga **per paket**. Sekarang harga per sesi masih tampil di:
kartu kolam di landing ("Rp X/sesi"), kartu paket di halaman member ("Rp X per
sesi"), konfirmasi beli 1 sesi ("harga per sesi paket ... (Rp X)"), serta
teks FAQ/panduan ("harga per sesi termahal di kolam itu + 20%").

Perubahan: landing menampilkan harga paket termurah ("Rp X/paket"); kartu
paket member tidak lagi menampilkan baris per sesi; konfirmasi beli 1 sesi
tidak lagi menyebut harga per sesi paket (harga beli 1 sesi itu sendiri tetap
tampil karena itu harga yang dibayar); teks FAQ/panduan menyebut "harga khusus
1 sesi yang tertera saat pembelian". Halaman admin dan pemilik kolam TIDAK
diubah.

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
- **DILARANG** menjalankan `npm run build` di batch ini (build menimpa server
  lokal yang sedang dipakai Claude).
- Kalau "Snippet LAMA" tidak ditemukan persis, atau ditemukan lebih dari
  sekali di file itu: **STOP di hunk itu**, laporkan, jangan improvisasi.
- Snippet LAMA/BARU bisa berupa **potongan di dalam satu baris panjang** atau
  beberapa baris utuh. Ganti HANYA potongan itu. `${DROP_IN_DURATION_DAYS}`
  adalah kode, salin persis termasuk `${` dan `}`.
- Spasi/indentasi/baris kosong di blok harus persis sama.
- File untracked lain di repo (`laporan-*.md`, `.qa-otp.mts`, dll): abaikan.
- Total file yang boleh diedit: **6 file**.

## 3. Scope file

1. `src/app/page.tsx` — Hunk 1
2. `src/app/landing-view.tsx` — Hunk 2, 3, 4, 5
3. `src/app/panduan/panduan-view.tsx` — Hunk 6, 7
4. `src/app/member/paket/page.tsx` — Hunk 8
5. `src/app/member/booking/booking-board.tsx` — Hunk 9, 10, 11
6. `src/app/member/booking/page.tsx` — Hunk 12

## 4. Langkah kerja

**Langkah 0 — cek awal** (dari root repo):
```bash
git status --short
npx vitest run
```
Diharapkan: `git status --short` hanya baris `??` (tidak ada ` M`);
vitest **464 passed, 0 failed, 58 test files**. Kalau beda: STOP, laporkan.

**Langkah 1 — kerjakan Hunk 1 sampai 12.**

**Langkah 2 — verifikasi:**
```bash
npx tsc --noEmit
npx vitest run
npm run lint
git diff --stat
```
Diharapkan: tsc 0 error; vitest **464 passed, 0 failed, 58 test files**;
lint bersih; `git diff --stat` = **6 files changed, 11 insertions(+), 22 deletions(-)**. Kalau gagal: jangan
diperbaiki, jangan di-revert, salin error persis ke laporan.

---

## HUNK 1 — landing: data harga paket termurah

**File:** `src/app/page.tsx`
**Sekitar baris:** 86-89

**Snippet LAMA:**
```
          // Harga per sesi termurah dari katalog kolam itu.
          fromPerSession: p.packageTemplates.length
            ? Math.min(...p.packageTemplates.map((t) => Math.round(t.price / t.totalSesi)))
            : null,
```

**Snippet BARU:**
```
          // Harga paket termurah dari katalog kolam itu (harga per sesi tidak ditampilkan ke publik).
          fromPackagePrice: p.packageTemplates.length
            ? Math.min(...p.packageTemplates.map((t) => t.price))
            : null,
```

---

## HUNK 2 — landing: nama field di tipe

**File:** `src/app/landing-view.tsx`
**Sekitar baris:** 29

**Snippet LAMA:**
```
  fromPerSession: number | null;
```

**Snippet BARU:**
```
  fromPackagePrice: number | null;
```

---

## HUNK 3 — landing: tampilan "Harga mulai"

**File:** `src/app/landing-view.tsx`
**Sekitar baris:** 339

**Snippet LAMA (potongan di dalam baris):**
```
{p.fromPerSession ? `${formatRupiah(p.fromPerSession)}/sesi` : "Segera hadir"}
```

**Snippet BARU:**
```
{p.fromPackagePrice ? `${formatRupiah(p.fromPackagePrice)}/paket` : "Segera hadir"}
```

---

## HUNK 4 — landing: teks FAQ beli 1 sesi

**File:** `src/app/landing-view.tsx`
**Sekitar baris:** 91

**Snippet LAMA (potongan di dalam baris):**
```
(harga per sesi termahal di kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Snippet BARU:**
```
(harga khusus 1 sesi yang tertera saat pembelian, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

---

## HUNK 5 — landing: impor yang tidak terpakai lagi

**File:** `src/app/landing-view.tsx`
**Sekitar baris:** 7

**Snippet LAMA:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT, MIN_WITHDRAWAL } from "@/lib/policy";
```

**Snippet BARU:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, MIN_WITHDRAWAL } from "@/lib/policy";
```

---

## HUNK 6 — panduan: impor yang tidak terpakai lagi

**File:** `src/app/panduan/panduan-view.tsx`
**Sekitar baris:** 8

**Snippet LAMA:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT, MIN_WITHDRAWAL } from "@/lib/policy";
```

**Snippet BARU:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, MIN_WITHDRAWAL } from "@/lib/policy";
```

---

## HUNK 7 — panduan: teks beli 1 sesi

**File:** `src/app/panduan/panduan-view.tsx`
**Sekitar baris:** 79

**Snippet LAMA (potongan di dalam baris):**
```
(harga per sesi termahal di kolam itu + ${DROP_IN_MARKUP_PERCENT}%, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

**Snippet BARU:**
```
(harga khusus 1 sesi yang tertera saat pembelian, berlaku ${DROP_IN_DURATION_DAYS} hari)
```

---

## HUNK 8 — halaman paket member: hapus baris "per sesi"

**File:** `src/app/member/paket/page.tsx`
**Sekitar baris:** 238-239 (di dalam kartu paket)

**Snippet LAMA:**
```
                          <p className="text-2xl font-bold leading-tight text-text">{formatRupiah(t.price)}</p>
                          <p className="text-sm text-text-muted">{formatRupiah(Math.round(t.price / t.totalSesi))} per sesi</p>
```

**Snippet BARU:**
```
                          <p className="text-2xl font-bold leading-tight text-text">{formatRupiah(t.price)}</p>
```

---

## HUNK 9 — papan booking: impor yang tidak terpakai lagi

**File:** `src/app/member/booking/booking-board.tsx`
**Sekitar baris:** 7

**Snippet LAMA:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS, DROP_IN_MARKUP_PERCENT } from "@/lib/policy";
```

**Snippet BARU:**
```
import { CANCEL_WINDOW_HOURS, DROP_IN_DURATION_DAYS } from "@/lib/policy";
```

---

## HUNK 10 — papan booking: hapus field di tipe

**File:** `src/app/member/booking/booking-board.tsx`
**Sekitar baris:** 39-40

**Snippet LAMA:**
```
  singleSessionPrice: number | null;
  packagePerSession: number | null;
```

**Snippet BARU:**
```
  singleSessionPrice: number | null;
```

---

## HUNK 11 — papan booking: konfirmasi beli 1 sesi tanpa harga per sesi

**File:** `src/app/member/booking/booking-board.tsx`
**Sekitar baris:** 588-593

**Snippet LAMA:**
```
              {selectedPool.packagePerSession != null && (
                <li>
                  Lebih mahal {DROP_IN_MARKUP_PERCENT}% dari harga per sesi paket di kolam ini ({formatRupiah(selectedPool.packagePerSession)}). Kalau
                  sering ke sini, beli paket lebih hemat.
                </li>
              )}
```

**Snippet BARU:**
```
              <li>Kalau sering ke sini, beli paket lebih hemat.</li>
```

---

## HUNK 12 — halaman booking: hapus perhitungan yang tidak dipakai

**File:** `src/app/member/booking/page.tsx`
**Sekitar baris:** 69-74

**Snippet LAMA:**
```
    singleSessionPrice: dropInPrice(p.packageTemplates),
    // Harga per sesi termahal tanpa markup, buat pembanding di konfirmasi.
    packagePerSession: p.packageTemplates.length
      ? Math.max(...p.packageTemplates.map((t) => Math.round(t.price / t.totalSesi)))
      : null,
```

**Snippet BARU:**
```
    singleSessionPrice: dropInPrice(p.packageTemplates),
```

---

## 5. Risiko + Gear

Gear setara Sonnet Medium. Hanya tampilan/teks; tidak ada uang, booking,
login, atau skema. Harga beli 1 sesi (yang dibayar member) tidak berubah.

## 6. Format laporan (WAJIB)

```
## Laporan eksekusi — mekanis-batch-8

Langkah 0: git status = [bersih / ada file modified: ...]; vitest awal = [angka persis]
Hunk 1-12: [tiap hunk BERHASIL / DILEWATI, alasan: ...]
tsc --noEmit: [jumlah error persis]
vitest run: [angka "X passed, Y failed, Z test files" persis]
npm run lint: [bersih / temuan persis]
git diff --stat: [baris ringkasan terakhir persis]
Ditemukan tapi TIDAK disentuh: [list / "tidak ada"]
Pertanyaan balik: [list / "tidak ada"]
```

Tanpa angka persis = dianggap belum diverifikasi.
