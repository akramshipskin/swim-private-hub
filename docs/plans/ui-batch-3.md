# Plan: Batch 3 — 2 perbaikan kecil (ruang bawah halaman di desktop, error lint lama)

> Ditulis oleh Claude (Sonnet 5 High), 2026-09-25. Eksekutor: OpenCode.
> Semua keputusan di dokumen ini SUDAH DIPUTUSKAN oleh Claude. OpenCode
> TIDAK mengambil keputusan apa pun, hanya menjalankan hunk di bawah
> persis seperti tertulis. Kedua hunk sudah diuji Claude: ditempel ke kode
> asli, `eslint`, `tsc`, dan seluruh tes lolos (334), lalu dikembalikan.

## 1. Tujuan

1. Di desktop, tombol chat mengambang ("Butuh bantuan?") menutupi baris
   terakhir halaman saat di-scroll mentok ke bawah. Ruang kosong di bawah
   konten di desktop cuma 32px, padahal tombol itu menempati 24px sampai 72px
   dari dasar layar. Naikkan jadi 96px (`pb-24`).
2. Satu error lint lama di `booking-board.tsx` (aturan
   `react-hooks/set-state-in-effect`). Kodenya sah (ambil data dari server saat
   halaman dibuka, lalu polling), jadi aturan itu dimatikan HANYA untuk baris
   itu, dengan alasan tertulis. Perilaku tidak berubah.

## 2. Aturan main WAJIB (baca sebelum mulai)

- **DILARANG** mengambil keputusan sendiri. Semua pilihan sudah diputuskan.
- **DILARANG** menyentuh file atau baris di luar yang disebut di tiap hunk.
  Kalau menemukan hal lain yang "kelihatan salah" di file yang sama, JANGAN
  diubah; catat di laporan sebagai "ditemukan tapi tidak disentuh: ...".
- **DILARANG** `git commit`, `git push`, `git add`, ganti branch, `git reset`,
  `git checkout`, `git stash`, atau perintah git yang mengubah apa pun.
  Boleh HANYA: `git status`, `git diff`. Commit dilakukan Claude.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`, `prisma/`,
  `src/generated/`, `src/lib/`, `src/app/api/`, `tests/`.
- **DILARANG** `npm install`. **DILARANG** menyalakan/mematikan server
  (`npm run dev`, `npm run db:dev`, `npm run db:race`).
- Kalau teks di "Snippet LAMA" TIDAK ditemukan persis (spasi beda, kode sudah
  berubah), atau muncul LEBIH DARI SATU KALI di file itu: **STOP di hunk
  itu**, jangan improvisasi, jangan cari versi terdekat. Tulis di laporan:
  "Hunk N dilewati, alasan: <apa bedanya>".
- Jangan merapikan/memformat kode di sekitar hunk. Jangan mengubah indentasi
  baris lain. Jangan menambah komentar selain yang tertulis di hunk.
- Salin snippet BARU apa adanya, termasuk spasi di awal baris (indentasi).

## 3. Scope file (HANYA 2 file)

1. `src/components/nav-bar.tsx` — Hunk 1
2. `src/app/member/booking/booking-board.tsx` — Hunk 2

---

## HUNK 1 — Ruang bawah konten di desktop

**File:** `src/components/nav-bar.tsx`

**Snippet LAMA (cari persis ini, 3 baris):**
```
        {/* pb-28: ruang di bawah konten supaya bottom nav + tombol chat
            mengambang tidak menutupi baris terakhir halaman di HP. */}
        <div className="min-w-0 flex-1 pb-28 sm:pb-8">{children}</div>
```

**Snippet BARU (ganti jadi ini, 3 baris):**
```
        {/* pb-28 (HP) / sm:pb-24 (desktop): ruang di bawah konten supaya bottom
            nav + tombol chat mengambang tidak menutupi baris terakhir halaman. */}
        <div className="min-w-0 flex-1 pb-28 sm:pb-24">{children}</div>
```

**Perubahan:** komentar diperbarui dan `sm:pb-8` menjadi `sm:pb-24`. `pb-28`
(HP) JANGAN diubah.

---

## HUNK 2 — Matikan aturan lint untuk satu baris yang sah

**File:** `src/app/member/booking/booking-board.tsx`

**Snippet LAMA (cari persis ini, 3 baris):**
```
  useEffect(() => {
    loadSlots();
    const interval = setInterval(loadSlots, POLL_INTERVAL_MS);
```

**Snippet BARU (ganti jadi ini, 6 baris):**
```
  useEffect(() => {
    // Sinkronisasi dengan server (fetch saat mount + polling): pola yang sah,
    // setState terjadi setelah await, bukan sinkron di badan effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
    const interval = setInterval(loadSlots, POLL_INTERVAL_MS);
```

**Perubahan:** HANYA menyisipkan 3 baris komentar di atas `loadSlots();`.
Baris `loadSlots();` dan sesudahnya JANGAN diubah.

**PERHATIAN:** teks LAMA harus tepat 1 kali muncul di file. Kalau lebih, STOP.

---

## 4. Verifikasi (WAJIB dijalankan, tempel hasilnya di laporan)

Jalankan berurutan dari root repo. Jangan lewat pipe (`| tail`); cek kode
keluarnya langsung.

1. `npx eslint src/app/member/booking/booking-board.tsx src/components/nav-bar.tsx`
   lalu `echo "exit $?"` — harus `exit 0` (tanpa satu pun pesan error).
2. `npx tsc --noEmit` lalu `echo "exit $?"` — harus `exit 0`.
3. `npx vitest run` — SEMUA harus lolos. Tulis angka "Tests N passed"
   (harapan: 334).
4. `git status --short` — file yang berubah HARUS persis: 2 file berstatus `M`
   (`src/components/nav-bar.tsx`, `src/app/member/booking/booking-board.tsx`),
   ditambah file `??` yang SUDAH ada sebelum kamu mulai (jangan disentuh,
   jangan dilaporkan sebagai milikmu).
5. Tempel hasil `git diff` untuk kedua file.

**JANGAN** menjalankan `npm run build`. **JANGAN** membuka browser.

## 5. Format laporan (wajib)

```
LAPORAN BATCH 3
Hunk 1: dikerjakan / dilewati (alasan)
Hunk 2: dikerjakan / dilewati (alasan)
eslint: exit <angka>
tsc: exit <angka>
vitest semua: <N> lolos, <M> gagal
git status: <tempel>
git diff: <tempel>
Ditemukan tapi tidak disentuh: <daftar, atau "tidak ada">
Kendala: <daftar, atau "tidak ada">
```

Jangan menulis "selesai" atau "aman" tanpa menempel hasil perintah di atas.
Claude memeriksa ulang setiap hunk sebelum commit; laporan bukan bukti.
