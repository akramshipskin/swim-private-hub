# Plan: mekanis batch 7 (ganti nama di Profil ikut mengganti nama peserta "diri sendiri")

> Ditulis oleh Claude (Opus 5.5), 2026-09-29. Eksekutor: OpenCode. Semua
> keputusan SUDAH DIPUTUSKAN oleh Claude. OpenCode hanya menjalankan hunk
> di bawah persis seperti tertulis.
>
> **Sudah dicoba dulu oleh Claude**: ketiga hunk diterapkan dari dokumen ini
> ke repo, hasilnya `tsc` 0 error, `vitest` 464 lulus / 58 file (sebelum
> perubahan: 461 lulus / 58 file), `eslint` bersih, `git diff --stat` = 2 files
> changed, 58 insertions(+), 6 deletions(-). Tes baru terbukti GAGAL kalau
> Hunk 1 tidak diterapkan (1 gagal, 7 lulus). Lalu semuanya dikembalikan.
> Kalau hasil Anda berbeda, laporkan, jangan diperbaiki sendiri.

## 1. Tujuan

Bug: saat member mengganti nama di halaman Profil, hanya `User.name` yang
berubah. Peserta "diri sendiri" (`Dependent` dengan `isSelf = true`) menyalin
nama akun saat dibuat dan tidak ikut diperbarui, sehingga dropdown booking dan
dashboard tetap menampilkan nama lama.

Perbaikan: `updateName` memperbarui `User` dan `Dependent isSelf` milik akun
yang sama dalam satu transaksi. Role selain MEMBER tidak punya `Dependent`,
jadi `updateMany` mengubah 0 baris (aman). Tidak menyentuh uang, booking,
login, atau skema database.

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
- **DILARANG** `npm install`, menyalakan/mematikan server (`npm run dev`,
  `npm run db:dev`, `next start`, `pkill`), atau menyentuh database.
- **DILARANG** menjalankan `npm run build` di batch ini (build menimpa
  server lokal yang sedang dipakai Claude).
- Kalau "Snippet LAMA" tidak ditemukan persis, atau ditemukan lebih dari
  sekali di file itu: **STOP di hunk itu**, laporkan, jangan improvisasi.
- Ganti HANYA blok LAMA dengan blok BARU. Spasi/indentasi/baris kosong di
  blok harus persis sama, termasuk tanda kutip dan titik koma.
- File untracked lain di repo (`laporan-*.md`, `.qa-otp.mts`, dll): abaikan.
- Total file yang boleh diedit: **2 file**.

## 3. Scope file

1. `src/app/profil/actions.ts` — Hunk 1
2. `src/app/profil/actions.test.ts` — Hunk 2 dan Hunk 3

## 4. Langkah kerja

**Langkah 0 — cek awal** (dari root repo):
```bash
git status --short
npx vitest run
```
Diharapkan: `git status --short` hanya baris `??` (tidak ada ` M`);
vitest **461 passed, 0 failed, 58 test files**. Kalau beda: STOP, laporkan.

**Langkah 1 — kerjakan Hunk 1, Hunk 2, Hunk 3.**

**Langkah 2 — verifikasi:**
```bash
npx tsc --noEmit
npx vitest run
npm run lint
git diff --stat
```
Diharapkan: tsc 0 error; vitest **464 passed, 0 failed, 58 test files**;
lint bersih; `git diff --stat` = **2 files changed, 58 insertions(+), 6
deletions(-)**. Kalau gagal: jangan diperbaiki, jangan di-revert, salin
error persis ke laporan.

---

## HUNK 1 — perbaikan `updateName`

**File:** `src/app/profil/actions.ts`
**Sekitar baris:** 28 (di dalam fungsi `updateName`, tepat setelah baris `const name = toProperCase(rawName);` dan satu baris kosong)

**Snippet LAMA:**
```
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  await unstable_update({ user: { name } });
```

**Snippet BARU:**
```
  // Peserta "diri sendiri" (Dependent.isSelf) menyalin nama akun saat dibuat;
  // ikut diperbarui supaya dropdown booking & dashboard tidak menampilkan
  // nama lama. Role selain MEMBER tidak punya Dependent (updateMany = 0 baris).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    }),
    prisma.dependent.updateMany({
      where: { memberId: session.user.id, isSelf: true },
      data: { name },
    }),
  ]);

  await unstable_update({ user: { name } });
```

**Catatan:** blok LAMA ini hanya muncul sekali di file (fungsi lain
`updatePasswordProfil` memakai `const updated = await prisma.user.update(`,
bukan blok yang sama). Kalau ditemukan lebih dari satu: STOP.

---

## HUNK 2 — tiruan (mock) database di file tes + impor `updateName`

**File:** `src/app/profil/actions.test.ts`
**Sekitar baris:** 8-14

**Snippet LAMA:**
```
const coachProfileUpdateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { coachProfile: { updateMany: (...a: unknown[]) => coachProfileUpdateMany(...a) } },
}));

const { updateCoachProfile } = await import("./actions");
```

**Snippet BARU:**
```
const coachProfileUpdateMany = vi.fn();
const userUpdate = vi.fn();
const dependentUpdateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coachProfile: { updateMany: (...a: unknown[]) => coachProfileUpdateMany(...a) },
    user: { update: (...a: unknown[]) => userUpdate(...a) },
    dependent: { updateMany: (...a: unknown[]) => dependentUpdateMany(...a) },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { updateCoachProfile, updateName } = await import("./actions");
```

---

## HUNK 3 — tiga tes baru di akhir file tes

**File:** `src/app/profil/actions.test.ts`
**Posisi:** paling akhir file. Tambahkan satu baris kosong, lalu blok di
bawah, SETELAH baris terakhir file yang sekarang (`});` penutup
`describe("updateCoachProfile"`). Jangan mengubah apa pun di atasnya.
Pastikan file diakhiri satu baris baru (newline) setelah `});` terakhir.

**Teks yang DITAMBAHKAN (tidak ada Snippet LAMA):**
```
describe("updateName", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
    userUpdate.mockResolvedValue({});
    dependentUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("menolak kalau belum login", async () => {
    auth.mockResolvedValue(null);
    const res = await updateName(null, fd([["name", "Budi"]]));
    expect(res?.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(dependentUpdateMany).not.toHaveBeenCalled();
  });

  it("menolak nama kosong", async () => {
    const res = await updateName(null, fd([["name", "   "]]));
    expect(res).toEqual({ error: "Nama tidak boleh kosong" });
    expect(userUpdate).not.toHaveBeenCalled();
    expect(dependentUpdateMany).not.toHaveBeenCalled();
  });

  it("mengganti nama akun DAN nama peserta diri sendiri milik akun itu saja", async () => {
    const res = await updateName(null, fd([["name", "  budi santoso "]]));
    expect(res).toEqual({ success: true });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { name: "Budi Santoso" },
    });
    expect(dependentUpdateMany).toHaveBeenCalledWith({
      where: { memberId: "m1", isSelf: true },
      data: { name: "Budi Santoso" },
    });
  });
});
```

---

## 5. Risiko + Gear

Gear setara Sonnet Medium. Menyentuh nama tampilan saja: tidak ada uang,
booking, auth, atau skema. Satu-satunya perilaku baru: nama peserta "diri
sendiri" ikut berubah bersama nama akun.

## 6. Format laporan (WAJIB)

```
## Laporan eksekusi — mekanis-batch-7

Langkah 0: git status = [bersih / ada file modified: ...]; vitest awal = [angka persis]
Hunk 1 (actions.ts): [BERHASIL / DILEWATI, alasan: ...]
Hunk 2 (actions.test.ts, mock): [BERHASIL / DILEWATI, alasan: ...]
Hunk 3 (actions.test.ts, tes baru): [BERHASIL / DILEWATI, alasan: ...]
tsc --noEmit: [jumlah error persis]
vitest run: [angka "X passed, Y failed, Z test files" persis]
npm run lint: [bersih / temuan persis]
git diff --stat: [baris ringkasan terakhir persis]
Ditemukan tapi TIDAK disentuh: [list / "tidak ada"]
Pertanyaan balik: [list / "tidak ada"]
```

Tanpa angka persis = dianggap belum diverifikasi.
