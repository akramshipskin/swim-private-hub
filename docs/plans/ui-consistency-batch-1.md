# Plan: UI consistency batch 1 (modal radius, heading level, thumb radius, checkbox style)

> Ditulis oleh Claude (Sonnet 5 High), 2026-09-23. Eksekutor: OpenCode
> (model gratis saat ini: Muse Spark 1.3). Semua keputusan desain di
> dokumen ini SUDAH DIPUTUSKAN oleh Claude — OpenCode TIDAK mengambil
> keputusan apa pun, hanya menjalankan hunk di bawah persis seperti
> tertulis.

## 1. Tujuan

Samakan 4 titik inkonsistensi visual kecil yang murni mekanis (bukan
keputusan rasa) supaya UI konsisten dengan pola yang sudah dominan di
codebase. Tidak ada perubahan logika, tidak ada perubahan copy/teks
selain yang eksplisit ditulis di hunk.

## 2. Aturan main WAJIB (baca sebelum mulai)

- **DILARANG** mengambil keputusan desain sendiri. Semua pilihan
  (radius mana, h2 vs h3, dst) sudah diputuskan di bawah — tinggal
  jalankan verbatim.
- **DILARANG** menyentuh file, baris, atau kelas CSS di luar yang
  disebut eksplisit di tiap hunk. Kalau nemu hal lain yang "kelihatan
  salah juga" di file yang sama — JANGAN diubah, catat saja di laporan
  akhir sebagai "ditemukan tapi tidak disentuh: <deskripsi>".
- **DILARANG** `git commit`, `git push`, ganti branch, `git reset`,
  atau perintah git destruktif apa pun. Edit file saja. Commit
  dilakukan Claude/Hadi setelah validasi.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`,
  `prisma/migrations/`.
- **DILARANG** `npm install` paket apa pun.
- **DILARANG** menyalakan/mematikan dev server (`npm run dev`,
  `npm run db:dev`) — biarkan port yang sedang dipakai tetap dipakai.
- Kalau string yang dicari di "Snippet LAMA" TIDAK ditemukan persis
  (whitespace beda, kode sudah berubah, dll) — **STOP di hunk itu**,
  jangan improvisasi/coba tebak versi terdekat. Tulis di laporan:
  "Hunk N tidak cocok, dilewati, alasan: <apa bedanya>".
- Total file yang boleh disentuh: **6 file** (daftar persis di bawah).
  Kalau ternyata ada file lain bernama sama di lokasi lain — JANGAN
  disentuh, hanya path yang disebut persis di bawah.

## 3. Scope file (HANYA 6 file ini, HANYA baris yang disebut)

1. `src/app/member/booking/booking-board.tsx` — 1 hunk (radius modal)
2. `src/app/member/paket/page.tsx` — 2 hunk (heading level + radius thumb foto)
3. `src/app/admin/pesan/reply-form.tsx` — 1 hunk (style checkbox)
4. `src/app/admin/email/reply-form.tsx` — 1 hunk (style checkbox)
5. `src/app/admin/paket/template-edit-form.tsx` — 1 hunk (style checkbox)
6. `src/app/admin/withdrawals/platform-withdraw-form.tsx` — 1 hunk (style checkbox)

---

## HUNK 1 — Modal radius (samakan ke pola modal kanonik)

**File:** `src/app/member/booking/booking-board.tsx`
**Sekitar baris:** 560

**Alasan (untuk konteks, bukan untuk dipertimbangkan ulang):** Semua
modal lain di app (`ConfirmDialog`, tombol reset password admin) pakai
`rounded-xl`. Modal ini satu-satunya yang pakai `rounded-2xl`. Lebar
(`max-w-md`) dan scroll (`max-h-[90vh] overflow-y-auto`) SENGAJA
DIPERTAHANKAN apa adanya — modal ini punya daftar poin yang lebih
panjang dari modal konfirmasi biasa, jadi butuh lebih lebar + bisa
di-scroll. HANYA radius yang diseragamkan.

**Snippet LAMA (cari persis ini):**
```
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface p-5 shadow-lg">
```

**Snippet BARU (ganti jadi ini):**
```
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-5 shadow-lg">
```

**Perubahan:** HANYA `rounded-2xl` → `rounded-xl`. Semua kelas lain
(`max-h-[90vh]`, `w-full`, `max-w-md`, `overflow-y-auto`, `bg-surface`,
`p-5`, `shadow-lg`) TETAP SAMA, jangan dihapus/diubah urutannya.

---

## HUNK 2 — Heading level nama kolam (samakan ke h2)

**File:** `src/app/member/paket/page.tsx`
**Sekitar baris:** 188

**Alasan:** File yang sama, di baris ~120, pakai `<h2>` untuk heading
nama kolam yang persis sama maksudnya (kolam tempat paket berlaku).
Baris 188 pakai `<h3>` untuk maksud yang sama. Samakan ke `<h2>` biar
konsisten dalam 1 file yang sama.

**Snippet LAMA (cari persis ini):**
```
                    <h3 className="text-lg font-semibold text-brand-700">{pool.name}</h3>
```

**Snippet BARU (ganti jadi ini):**
```
                    <h2 className="text-lg font-semibold text-brand-700">{pool.name}</h2>
```

**Perubahan:** HANYA tag `h3` → `h2` (buka DAN tutup tag). `className`
dan isi `{pool.name}` TETAP SAMA.

**PERHATIAN:** kalau string "LAMA" di atas muncul LEBIH DARI SEKALI di
file ini, STOP — jangan ganti yang mana pun, laporkan ambigu.

---

## HUNK 3 — Radius thumbnail foto kolam (samakan ke pola mayoritas)

**File:** `src/app/member/paket/page.tsx`
**Sekitar baris:** 182

**Alasan:** 2 tempat lain yang render thumbnail foto kolam ukuran sama
(`src/app/pelatih/[coachId]/page.tsx` dan
`src/app/member/booking/booking-board.tsx`) pakai `rounded-lg`. Baris
ini satu-satunya yang pakai `rounded-xl` untuk maksud yang sama.
JANGAN sentuh 2 file lain itu — sudah benar, biarkan.

**Snippet LAMA (cari persis ini):**
```
                        <img key={url + i} src={url} alt={`Foto ${pool.name}`} className="h-24 min-w-0 flex-1 rounded-xl object-cover" />
```

**Snippet BARU (ganti jadi ini):**
```
                        <img key={url + i} src={url} alt={`Foto ${pool.name}`} className="h-24 min-w-0 flex-1 rounded-lg object-cover" />
```

**Perubahan:** HANYA `rounded-xl` → `rounded-lg`. Semua atribut lain
(`key`, `src`, `alt`, sisa `className`) TETAP SAMA persis.

---

## HUNK 4 — Style checkbox "Tandai selesai" (admin Pesan)

**File:** `src/app/admin/pesan/reply-form.tsx`
**Sekitar baris:** 17

**Alasan:** Checkbox boolean tunggal (bukan set pilihan majemuk) di
app ini punya pola styling baku: `rounded border-border text-brand-600
focus:ring-brand-500` (dicontohkan di
`src/app/daftar-kolam/register-pool-form.tsx` baris ~188 — TIDAK PERLU
dibuka, hanya referensi). Checkbox ini belum pakai pola itu, masih
polos `h-4 w-4` doang.

**Snippet LAMA (cari persis ini):**
```
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4" /> Tandai selesai
```

**Snippet BARU (ganti jadi ini):**
```
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" /> Tandai selesai
```

**Perubahan:** HANYA isi `className` yang bertambah
(`rounded border-border text-brand-600 focus:ring-brand-500`
ditambahkan setelah `h-4 w-4`). Atribut lain TETAP SAMA.

---

## HUNK 5 — Style checkbox "Tandai selesai" (admin Email)

**File:** `src/app/admin/email/reply-form.tsx`
**Sekitar baris:** 17

**Alasan:** Sama persis dengan Hunk 4 — file ini adalah kembaran dari
`admin/pesan/reply-form.tsx`, punya bug/gap yang sama.

**Snippet LAMA (cari persis ini):**
```
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4" /> Tandai selesai
```

**Snippet BARU (ganti jadi ini):**
```
          <input type="checkbox" name="resolve" defaultChecked className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" /> Tandai selesai
```

**Perubahan:** Identik dengan Hunk 4, tapi di file berbeda.

**PERHATIAN:** File Hunk 4 dan Hunk 5 punya baris yang PERSIS SAMA
teksnya. Pastikan ganti di KEDUA file (masing-masing 1x), jangan
tertukar atau dilewati salah satu.

---

## HUNK 6 — Style checkbox "isActive" (admin Paket template)

**File:** `src/app/admin/paket/template-edit-form.tsx`
**Sekitar baris:** 144 (baris `className` di dalam blok checkbox
`isActive` — ada baris kosong ganjil beberapa baris sebelumnya di
sekitar situ, ABAIKAN, cari langsung baris className persis di bawah)

**Alasan:** Checkbox ini sudah punya `rounded border-border` tapi
BELUM punya warna aksen (`text-brand-600`) dan focus ring
(`focus:ring-brand-500`) seperti pola baku. `disabled:opacity-50`
SENGAJA DIPERTAHANKAN (dipakai saat form sedang submit).

**Snippet LAMA (cari persis ini):**
```
              className="h-4 w-4 rounded border-border disabled:opacity-50"
```

**Snippet BARU (ganti jadi ini):**
```
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500 disabled:opacity-50"
```

**Perubahan:** Sisipkan `text-brand-600 focus:ring-brand-500` di
ANTARA `border-border` dan `disabled:opacity-50`. Jangan ubah urutan
lainnya.

**PERHATIAN:** kalau string ini muncul lebih dari sekali di file,
STOP, laporkan ambigu (harusnya cuma 1x, ini satu-satunya checkbox di
file itu).

---

## HUNK 7 — Style checkbox "includeTax" (admin Pencairan Platform)

**File:** `src/app/admin/withdrawals/platform-withdraw-form.tsx`
**Sekitar baris:** 23

**Alasan:** Sama seperti Hunk 4/5 — checkbox boolean tunggal, belum
pakai pola styling baku.

**Snippet LAMA (cari persis ini):**
```
        <input type="checkbox" name="includeTax" className="h-4 w-4" />
```

**Snippet BARU (ganti jadi ini):**
```
        <input type="checkbox" name="includeTax" className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
```

**Perubahan:** HANYA isi `className` bertambah. Atribut lain
(`type`, `name`) TETAP SAMA.

---

## 4. Verifikasi WAJIB per file (jalankan SETELAH SEMUA hunk di file itu selesai)

Untuk SETIAP file yang diedit, jalankan berurutan DI TERMINAL (dari
root repo) dan catat hasil ASLI (bukan tebakan) di laporan:

```bash
npx tsc --noEmit
```
Harus NOL error. Kalau ada error, JANGAN lanjut ke file berikutnya —
tulis di laporan error persis apa yang muncul, biarkan file itu dalam
kondisi error (jangan di-revert sendiri, jangan coba perbaiki sendiri).

```bash
npx vitest run
```
Harus tetap **220 lulus, 0 gagal** (jumlah tes SEBELUM batch ini
mulai). Kalau angkanya beda, tulis persis angka yang keluar.

Setelah SEMUA 6 file selesai + tsc & vitest terakhir lulus:

```bash
npm run build
```
Harus sukses (tidak ada "Failed to compile"). Tulis hasil akhirnya
(sukses/gagal + pesan error kalau gagal).

## 5. Risiko + Gear

**Gear: Sonnet Medium/High setara** (murni mekanis, styling non-logic,
tanpa uang/auth/booking). Tidak ada STOP condition bisnis di batch
ini — semua hunk sudah final, tidak butuh persetujuan tambahan dari
Hadi. Satu-satunya alasan berhenti adalah kalau snippet LAMA tidak
ketemu persis (lihat aturan main).

## 6. Format laporan eksekutor (WAJIB, isi persis format ini di akhir)

```
## Laporan eksekusi — ui-consistency-batch-1

Hunk 1 (booking-board.tsx): [BERHASIL / DILEWATI, alasan: ...]
Hunk 2 (member/paket/page.tsx h2): [BERHASIL / DILEWATI, alasan: ...]
Hunk 3 (member/paket/page.tsx thumb): [BERHASIL / DILEWATI, alasan: ...]
Hunk 4 (admin/pesan/reply-form.tsx): [BERHASIL / DILEWATI, alasan: ...]
Hunk 5 (admin/email/reply-form.tsx): [BERHASIL / DILEWATI, alasan: ...]
Hunk 6 (admin/paket/template-edit-form.tsx): [BERHASIL / DILEWATI, alasan: ...]
Hunk 7 (admin/withdrawals/platform-withdraw-form.tsx): [BERHASIL / DILEWATI, alasan: ...]

tsc --noEmit: [angka error persis, harus 0]
vitest run: [angka "X passed, Y failed" persis dari output]
npm run build: [sukses / gagal + pesan error kalau gagal]

Ditemukan tapi TIDAK disentuh (di luar scope): [list, atau "tidak ada"]
Pertanyaan balik (kalau ada yang ambigu): [list, atau "tidak ada"]
```

Jangan tulis "aman"/"beres" tanpa angka di atas. Laporan tanpa angka
tsc/vitest/build TIDAK akan diterima.
