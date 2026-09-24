# Plan: Putaran berulang tes race condition (10 ronde) + laporan

> Ditulis oleh Claude (Sonnet 5 High), 2026-09-24. Eksekutor: OpenCode.
> Tugas ini **HANYA MENJALANKAN dan MELAPORKAN**. OpenCode TIDAK menulis,
> TIDAK mengubah, dan TIDAK "memperbaiki" kode apa pun.

## 0. Kenapa dijalankan berulang (baca dulu, ini penting)

Race condition itu **peluang**, bukan kepastian. Dua aksi yang "barengan"
kadang urutannya A-lalu-B, kadang B-lalu-A, dan bug hanya muncul di salah
satu urutan (kadang cuma 4 dari 100 kali). Satu kali lolos TIDAK membuktikan
aman. Karena itu suite ini dijalankan 10 ronde, dan yang dicari:

1. **Tes yang kadang gagal, kadang lolos** ("flaky") = kemungkinan ada bug
   balapan yang jarang muncul. Ini temuan paling berharga.
2. **Sebaran hasil** tiap tes (baris berawalan `E1 sebaran {...}`): kalau
   dari 10 ronde sebaran selalu cuma 1 jenis hasil, tes itu belum benar-benar
   menguji balapan dan Claude harus menyetelnya.

Semua tes ini sudah ditulis dan diperiksa Claude (termasuk uji mutasi: kode
sengaja dirusak dan tes terbukti gagal). Jangan menilai benar/salah sendiri.

## 1. Aturan main WAJIB

- **DILARANG** mengubah, membuat, atau menghapus file apa pun di repo
  (`src/`, `tests/`, `docs/`, `prisma/`, `scripts/`, `package.json`, dst).
  Satu-satunya tempat menulis: folder `/tmp` (untuk file log).
- **DILARANG** "memperbaiki" tes yang gagal, menambah `.skip`, mengubah angka
  putaran/jeda, atau mengubah `it.fails`. Tes gagal = LAPORKAN saja.
- **DILARANG** menyalakan/mematikan database atau server: `npm run db:race`,
  `npm run db:dev`, `npm run dev`. Claude yang menyalakan DB. Kalau DB mati,
  **STOP** dan lapor (lihat langkah 1).
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`.
- **DILARANG** `git commit/add/reset/checkout/stash/push`. Boleh hanya
  `git status` dan `git diff`.
- **DILARANG** `npm install`, `npx prisma ...`, `npm run build`.
- **DILARANG** menjalankan tes lain (`npx vitest run` tanpa `-c
  vitest.race.config.ts`) — itu tes unit, bukan tugasmu.
- Tes race MENGOSONGKAN tabel di database race lokal (`localhost:54329`).
  Itu normal dan aman (bukan database produksi/dev). Tes menolak jalan kalau
  alamat database bukan itu, jadi tidak ada risiko ke produksi.
- Jangan menjalankan 2 ronde bersamaan. Satu per satu, berurutan.

## 2. Langkah

### Langkah 1 — Pemeriksaan awal (jalankan, tempel hasilnya di laporan)

```
nc -z localhost 54329 && echo "DB race HIDUP" || echo "DB race MATI"
git status --short
```

Kalau hasilnya `DB race MATI`: **STOP**. Jangan mencoba menyalakannya.
Laporkan "DB race mati, tidak bisa lanjut".

Catat isi `git status --short` (daftar file yang sudah berubah/baru SEBELUM
kamu mulai). Di akhir, daftar ini HARUS sama persis (kamu tidak mengubah apa pun).

### Langkah 2 — 10 ronde (satu perintah, tunggu sampai selesai)

Perintah ini butuh sekitar 12 menit. Jalankan persis:

```
for i in $(seq 1 10); do npx vitest run -c vitest.race.config.ts --reporter=verbose > /tmp/race-round-$i.log 2>&1; echo "ronde $i selesai, exit code $?"; done
```

Jangan hentikan di tengah jalan. Kalau sebuah ronde gagal (exit code bukan 0),
itu BUKAN alasan berhenti: lanjutkan ronde berikutnya. Yang penting semua 10
ronde punya file log.

> Catatan exit code: tes "bug yang masih ada" (`it.fails`) dihitung lolos
> oleh vitest. Exit code 0 = semua sesuai harapan. Exit code 1 = ada tes yang
> menyimpang dari harapan (lihat langkah 3).

### Langkah 3 — Kumpulkan hasil (jalankan persis, tempel keluarannya)

Ringkasan tiap ronde:
```
for i in $(seq 1 10); do echo "== ronde $i"; grep -E "Test Files|Tests " /tmp/race-round-$i.log; done
```
Harapan: setiap ronde menulis `Tests  54 passed | 10 expected fail (64)`.
Angka lain = ada penyimpangan (lihat langkah 4).

Tes yang gagal (jika ada), dihitung per nama:
```
grep -hE "^\s*×" /tmp/race-round-*.log | sed 's/ [0-9]*ms$//' | sort | uniq -c | sort -rn
```
Harapan: **tidak ada keluaran sama sekali**.

Sebaran hasil (semua ronde digabung):
```
grep -h " sebaran " /tmp/race-round-*.log | sort | uniq -c | sort -rn
```

Peringatan "tes belum tentu menguji balapan", dihitung per tes:
```
grep -h "PERINGATAN" /tmp/race-round-*.log | sed 's/: hanya.*//' | sort | uniq -c
```

### Langkah 4 — Bila ada tes gagal: kumpulkan bukti (JANGAN diperbaiki)

Untuk SETIAP nama tes yang muncul di keluaran "Tes yang gagal", tempel:
1. Nama tes, dan di ronde berapa saja ia gagal (`grep -l "nama tes" /tmp/race-round-*.log`).
2. Pesan kegagalannya: 15 baris di sekitar kata `AssertionError` pada log ronde
   pertama tempat ia gagal (`grep -n -B2 -A12 "AssertionError" /tmp/race-round-N.log`).
3. Berapa dari 10 ronde ia gagal (misal "gagal 3 dari 10").

### Langkah 5 — Cek alasan 10 tes "bug yang masih ada" (sekali saja)

Tes ini sengaja ditulis untuk gagal sampai Claude memperbaiki bugnya. Pastikan
mereka gagal karena ALASAN YANG BENAR (bukan error lain). Jalankan sekali:

```
RACE_KNOWN_BUGS=run npx vitest run -c vitest.race.config.ts known-bugs --reporter=verbose > /tmp/known.log 2>&1; grep -E "^AssertionError|^Error" /tmp/known.log
```

Bandingkan dengan tabel ini. Tulis di laporan "cocok" atau "TIDAK cocok"
untuk tiap baris (urutan keluaran mengikuti urutan tes):

| Tes | Pesan yang diharapkan (mengandung) |
|---|---|
| K1 | `expected 201 to be 409` |
| K2a | `expected 201 to be 409` |
| K2b | `expected 'BOOKED' to be 'CANCELLED'` |
| K3a | `expected undefined to be truthy` |
| K4a | `expected 201 to be 409` |
| K4b | `expected '+62 812-3456-7891' to be '081234567891'` |
| K4c | `expected 201 to be 409` |
| K4d | `expected 'Budi.Santoso@Example.COM' to be 'budi.santoso@example.com'` |
| K4e | `expected 4 to be 1` |
| K5 | `expected N to be +0` (N = angka 1 atau lebih) |

Jangan menjalankan perintah ini lebih dari sekali.

### Langkah 6 — Pemeriksaan akhir

```
git status --short
```
Harus SAMA PERSIS dengan hasil di langkah 1. Kalau beda, lapor (dan JANGAN
mengembalikannya sendiri).

## 3. Yang dites (daftar, hanya untuk konteks; jangan diubah)

**Sudah ada sebelumnya (32 tes):** rebutan slot, batal ganda, absensi ganda,
pencairan ganda, webhook Midtrans ganda, daftar akun ganda (kode R*, W*, P*, A*).

**Baru (sweep 24 Sep):**

| Kode | Skenario |
|---|---|
| N1 | Admin menonaktifkan kolam saat 8 member booking |
| N7 | 6 admin menarik saldo platform barengan (kunci) |
| E1 | Admin mencopot coach dari kolam saat member booking slotnya |
| E2 | Admin membatalkan booking saat coach menghapus slotnya |
| E3a/E3b | Admin menyetujui/menolak usulan paket barengan |
| E4 | Penarikan saldo platform saat sesi Hadir menambah saldo |
| E5 | Admin menolak pencairan lama saat coach mengajukan yang baru |
| E6 | "Tandai Dibayar" diklik 6x barengan |
| E7a/E7b | Ganti/reset password barengan (versi sesi) |
| E8 | Setujui vs tolak sertifikat coach barengan |
| E9 | "Tambah Slot" 4x barengan |
| E10 | Daftar notifikasi push barengan, perangkat dipakai bergantian |
| E11 | 25 pesan chat barengan (batas 20 per jam) |
| E12 | Admin menandai paket EXPIRED saat member booking |
| E13 | Admin buat akun pemilik kolam 4x barengan |
| K1–K5 | "Bug yang masih ada": aturan yang benar setelah perbaikan (sengaja `it.fails`) |

## 4. Format laporan (wajib, isi semua bagian)

```
LAPORAN RACE 10 RONDE
Langkah 1: DB race <HIDUP/MATI>; git status awal: <tempel>
Ronde 1..10: <Tests ... per ronde, satu baris tiap ronde>
Tes yang gagal (per nama, berapa dari 10 ronde): <daftar, atau "tidak ada">
Bukti kegagalan: <tempel per tes, atau "tidak ada">
Sebaran hasil (digabung): <tempel>
Peringatan (per tes): <tempel>
Langkah 5 (10 tes bug): K1 cocok/TIDAK cocok; K2a ...; ... K5
Git status akhir: <tempel> — sama dengan awal: ya/tidak
Kendala: <daftar, atau "tidak ada">
```

Jangan menulis "semua aman" atau "selesai" tanpa menempelkan hasil perintah
di atas. Jangan menyimpulkan sendiri apa artinya sebuah kegagalan; cukup
tempel buktinya. Claude yang menganalisis.
