# Plan: Batch 2 — 4 perbaikan kecil (label status, dashboard member, label kolam, notifikasi balasan chat)

> Ditulis oleh Claude (Sonnet 5 High), 2026-09-24. Eksekutor: OpenCode.
> Semua keputusan di dokumen ini SUDAH DIPUTUSKAN oleh Claude. OpenCode
> TIDAK mengambil keputusan apa pun, hanya menjalankan hunk di bawah
> persis seperti tertulis. Snippet di dokumen ini sudah diuji Claude:
> ditempel ke kode asli, `tsc` dan seluruh tes lolos.

## 1. Tujuan

Empat perbaikan kecil hasil sweep 24 Sep:

1. Riwayat Bayar member menampilkan status pembayaran kedaluwarsa sebagai
   teks mentah **EXPIRED**. Harus tampil **Kedaluwarsa**.
2. Dashboard member: kartu "Sesi terjadwal" mentok di angka 10 (karena daftar
   dibatasi 10 baris), dan batas "awal bulan" dihitung pakai zona waktu server
   (bukan WIB). Perbaiki keduanya.
3. Dashboard admin: label kolam nonaktif masih "(belum disetujui)". Samakan
   dengan halaman Kolam yang sudah memakai "Nonaktif".
4. Admin membalas chat bantuan: pengguna belum dapat notifikasi push. Kirim.

## 2. Aturan main WAJIB (baca sebelum mulai)

- **DILARANG** mengambil keputusan sendiri. Semua pilihan sudah diputuskan.
- **DILARANG** menyentuh file atau baris di luar yang disebut di tiap hunk.
  Kalau menemukan hal lain yang "kelihatan salah" di file yang sama, JANGAN
  diubah; catat di laporan sebagai "ditemukan tapi tidak disentuh: ...".
- **DILARANG** `git commit`, `git push`, `git add`, ganti branch, `git reset`,
  `git checkout`, `git stash`, atau perintah git yang mengubah apa pun.
  Boleh HANYA: `git status`, `git diff`. Commit dilakukan Claude.
- **DILARANG** menyentuh `.env*`, `.git/`, `node_modules/`, `prisma/`,
  `src/generated/`.
- **DILARANG** `npm install`. **DILARANG** menyalakan/mematikan server
  (`npm run dev`, `npm run db:dev`, `npm run db:race`).
- **DILARANG** menyentuh file di `src/lib/`, `src/app/api/`, `tests/`.
- Kalau teks di "Snippet LAMA" TIDAK ditemukan persis (spasi beda, kode sudah
  berubah), atau muncul LEBIH DARI SATU KALI di file itu: **STOP di hunk
  itu**, jangan improvisasi, jangan cari versi terdekat. Tulis di laporan:
  "Hunk N dilewati, alasan: <apa bedanya>".
- Jangan merapikan/memformat kode di sekitar hunk. Jangan mengubah indentasi
  baris lain. Jangan menambah komentar selain yang tertulis di hunk.

## 3. Scope file (HANYA 4 file + 1 file baru)

1. `src/app/member/pembayaran/page.tsx` — Hunk 1
2. `src/app/member/dashboard/page.tsx` — Hunk 2, 3, 4, 5
3. `src/app/admin/page.tsx` — Hunk 6
4. `src/app/admin/pesan/actions.ts` — Hunk 7, 8, 9
5. `src/app/admin/pesan/actions.test.ts` — **FILE BARU** (Hunk 10)

---

## HUNK 1 — Label status "Kedaluwarsa"

**File:** `src/app/member/pembayaran/page.tsx`

**Alasan:** peta label status tidak punya `EXPIRED`, jadi status itu jatuh ke
teks mentah. Tone-nya sudah aman (jatuh ke "neutral"), yang kurang cuma label.

**Snippet LAMA (cari persis ini):**
```
  FAILED: "Gagal / dibatalkan",
};
```

**Snippet BARU (ganti jadi ini):**
```
  FAILED: "Gagal / dibatalkan",
  EXPIRED: "Kedaluwarsa",
};
```

**Perubahan:** HANYA menambah 1 baris `EXPIRED: "Kedaluwarsa",`. Objek
`statusTone` di bawahnya JANGAN diubah.

---

## HUNK 2 — Import `wibDateTime` (dashboard member)

**File:** `src/app/member/dashboard/page.tsx`

**Snippet LAMA (cari persis ini):**
```
import { todayWibDateString, dateLabel, formatDateLabel, formatTimeLeft, formatTimeWib } from "@/lib/datetime";
```

**Snippet BARU (ganti jadi ini):**
```
import { todayWibDateString, dateLabel, formatDateLabel, formatTimeLeft, formatTimeWib, wibDateTime } from "@/lib/datetime";
```

**Perubahan:** HANYA menambah `, wibDateTime` di akhir daftar impor.

---

## HUNK 3 — Awal bulan pakai WIB

**File:** `src/app/member/dashboard/page.tsx`

**Alasan:** `new Date(now.getFullYear(), now.getMonth(), 1)` memakai zona waktu
server (UTC di Vercel), jadi "bulan ini" mulai 07.00 WIB, bukan 00.00 WIB. Pola
yang benar sudah dipakai di dashboard admin dan kolam.

**Snippet LAMA (cari persis ini):**
```
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
```

**Snippet BARU (ganti jadi ini):**
```
  const startMonth = wibDateTime(`${todayWibDateString().slice(0, 7)}-01`, "00:00");
```

**Perubahan:** HANYA 1 baris itu.

---

## HUNK 4 — Tambah hitungan sesi terjadwal yang sebenarnya

**File:** `src/app/member/dashboard/page.tsx`

**Alasan:** daftar `upcoming` dibatasi `take: 10` (untuk kartu "Jadwal
berikutnya"), tapi angkanya dipakai juga sebagai hitungan. Perlu query hitung
terpisah. Query BARU harus berada TEPAT setelah query `upcoming` (urutan di
`Promise.all` menentukan variabel mana yang menerima hasilnya).

**Snippet LAMA (cari persis ini, 1 baris):**
```
    prisma.booking.count({ where: { memberId: session.user.id, attended: true } }),
```

**Snippet BARU (ganti jadi 2 baris ini):**
```
    prisma.booking.count({ where: { memberId: session.user.id, status: "BOOKED", availability: { startTime: { gt: now } } } }),
    prisma.booking.count({ where: { memberId: session.user.id, attended: true } }),
```

**Perubahan:** HANYA menambah baris baru DI ATAS baris lama. Baris lama tetap
ada, tidak diubah.

**PERHATIAN:** baris LAMA itu harus tepat 1 kali muncul di file. Kalau lebih,
STOP dan laporkan.

---

## HUNK 5 — Terima hasil hitungan itu di destrukturisasi + pakai di kartu

Hunk 5 terdiri dari DUA penggantian di file yang sama. Lakukan keduanya.

**File:** `src/app/member/dashboard/page.tsx`

### 5a — nama variabel baru

**Snippet LAMA (cari persis ini):**
```
  const [packages, upcoming, attendedCount, attendedThisMonth, pesertaCount, spentThisMonth, favCoach] = await Promise.all([
```

**Snippet BARU (ganti jadi ini):**
```
  const [packages, upcoming, upcomingCount, attendedCount, attendedThisMonth, pesertaCount, spentThisMonth, favCoach] = await Promise.all([
```

**Perubahan:** HANYA menyisipkan `upcomingCount, ` setelah `upcoming, `.

### 5b — kartu memakai hitungan baru

**Snippet LAMA (cari persis ini):**
```
            <Stat label="Sesi terjadwal" value={upcoming.length} />
```

**Snippet BARU (ganti jadi ini):**
```
            <Stat label="Sesi terjadwal" value={upcomingCount} />
```

**Perubahan:** HANYA `upcoming.length` → `upcomingCount`. Bagian lain yang
memakai `upcoming` (kartu "Jadwal berikutnya") JANGAN diubah.

**URUTAN PENTING:** Hunk 4 dan Hunk 5a harus SELALU dikerjakan berpasangan.
Kalau salah satu dilewati, kode tetap terkompilasi tapi angkanya tertukar.
Kalau salah satu tidak bisa dikerjakan, JANGAN kerjakan yang lain — laporkan.

---

## HUNK 6 — Label kolam nonaktif (dashboard admin)

**File:** `src/app/admin/page.tsx`

**Snippet LAMA (cari persis ini):**
```
                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(belum disetujui)</span>}
```

**Snippet BARU (ganti jadi ini):**
```
                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(nonaktif)</span>}
```

**Perubahan:** HANYA teks `(belum disetujui)` → `(nonaktif)`. Baris
`<ActionRow label="Kolam belum disetujui" ...>` di file yang sama JANGAN
diubah (itu label daftar tindakan, keputusan terpisah).

---

## HUNK 7 — Impor fungsi push (balasan chat)

**File:** `src/app/admin/pesan/actions.ts`

**Snippet LAMA (cari persis ini):**
```
import { MAX_CHAT_LENGTH } from "@/lib/chat-ai";
```

**Snippet BARU (ganti jadi 2 baris ini):**
```
import { MAX_CHAT_LENGTH } from "@/lib/chat-ai";
import { sendPushToUser } from "@/lib/push";
```

**Perubahan:** HANYA menambah 1 baris impor di bawahnya.

---

## HUNK 8 — Ambil pemilik chat

**File:** `src/app/admin/pesan/actions.ts`

**Snippet LAMA (cari persis ini):**
```
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true } });
```

**Snippet BARU (ganti jadi ini):**
```
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true, userId: true } });
```

**Perubahan:** HANYA `select: { id: true }` → `select: { id: true, userId: true }`.

---

## HUNK 9 — Kirim notifikasi setelah balasan tersimpan

**File:** `src/app/admin/pesan/actions.ts`

**Alasan:** notifikasi dikirim SETELAH balasan tersimpan, dan kegagalan kirim
tidak boleh menggagalkan balasan (makanya `.catch(() => {})`). Tujuan `url: "/"`
disengaja: halaman awal otomatis mengarahkan pengguna yang sudah login ke
beranda sesuai perannya.

**Snippet LAMA (cari persis ini):**
```
  revalidatePath("/admin/pesan");
  return null;
```

**Snippet BARU (ganti jadi ini):**
```
  // Best-effort: gagal kirim notifikasi tidak boleh menggagalkan balasan yang
  // sudah tersimpan.
  await sendPushToUser(thread.userId, {
    title: "Balasan dari admin",
    body: content.length > 100 ? `${content.slice(0, 97)}...` : content,
    url: "/",
  }).catch(() => {});

  revalidatePath("/admin/pesan");
  return null;
```

**Perubahan:** HANYA menyisipkan blok di atas `revalidatePath`. `revalidatePath`
dan `return null;` tetap ada persis seperti sebelumnya.

**PERHATIAN:** teks LAMA harus tepat 1 kali muncul di file. Kalau lebih, STOP.

---

## HUNK 10 — FILE BARU: tes untuk balasan chat

**File:** `src/app/admin/pesan/actions.test.ts`

**SEBELUM MEMBUAT:** jalankan `ls src/app/admin/pesan/actions.test.ts`. Kalau
file ini SUDAH ADA — **STOP**, JANGAN menimpa. Laporkan "file sudah ada".
(Claude sudah memeriksa: seharusnya belum ada.)

**Isi file (salin persis, seluruhnya):**
```
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sendPushToUser = vi.fn();
vi.mock("@/lib/push", () => ({ sendPushToUser: (...a: unknown[]) => sendPushToUser(...a) }));

const threadFindUnique = vi.fn();
const threadUpdate = vi.fn();
const messageCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatThread: {
      findUnique: (...a: unknown[]) => threadFindUnique(...a),
      update: (...a: unknown[]) => threadUpdate(...a),
    },
    chatMessage: { create: (...a: unknown[]) => messageCreate(...a) },
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

const { replyToThread } = await import("./actions");

function form(over: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ threadId: "t1", content: "Halo, sudah kami cek.", ...over })) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  threadFindUnique.mockResolvedValue({ id: "t1", userId: "user-9" });
  sendPushToUser.mockResolvedValue(undefined);
});

describe("replyToThread notification", () => {
  // Bug sweep 24 Sep: admin membalas chat, pengguna tidak dapat notifikasi apa pun.
  it("pushes the reply to the owner of the chat thread", async () => {
    const res = await replyToThread(null, form());
    expect(res).toBeNull();
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith("user-9", {
      title: "Balasan dari admin",
      body: "Halo, sudah kami cek.",
      url: "/",
    });
  });

  it("shortens a long reply to 100 characters ending in an ellipsis", async () => {
    await replyToThread(null, form({ content: "x".repeat(150) }));
    const body = sendPushToUser.mock.calls[0][1].body as string;
    expect(body).toHaveLength(100);
    expect(body.endsWith("...")).toBe(true);
  });

  it("keeps a reply of exactly 100 characters untouched", async () => {
    await replyToThread(null, form({ content: "y".repeat(100) }));
    expect(sendPushToUser.mock.calls[0][1].body).toBe("y".repeat(100));
  });

  it("still saves the reply and returns no error when the push fails", async () => {
    sendPushToUser.mockRejectedValue(new Error("push down"));
    const res = await replyToThread(null, form());
    expect(res).toBeNull();
    expect(messageCreate).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for an empty reply", async () => {
    const res = await replyToThread(null, form({ content: "   " }));
    expect(res?.error).toBeTruthy();
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("sends nothing when the thread does not exist", async () => {
    threadFindUnique.mockResolvedValue(null);
    const res = await replyToThread(null, form());
    expect(res?.error).toBe("Percakapan tidak ditemukan.");
    expect(sendPushToUser).not.toHaveBeenCalled();
    expect(messageCreate).not.toHaveBeenCalled();
  });
});
```

---

## 4. Verifikasi (WAJIB dijalankan, tempel hasilnya di laporan)

Jalankan berurutan dari root repo. Jangan lewat pipe (`| tail`) untuk `tsc`
karena pipe menyembunyikan kegagalan; cek kode keluarnya langsung.

1. `npx tsc --noEmit` lalu `echo "exit $?"` — harus `exit 0`.
2. `npx vitest run src/app/admin/pesan/actions.test.ts` — harus 6 lolos.
3. `npx vitest run` — SEMUA harus lolos, tidak ada yang gagal. Tulis angka
   "Tests N passed" di laporan.
4. `git status --short` — file yang berubah HARUS persis: 4 file berstatus
   `M` + 1 file `??` (`actions.test.ts`), ditambah file lain yang SUDAH
   berstatus M/?? sebelum kamu mulai (jangan disentuh, jangan dilaporkan
   sebagai milikmu).
5. Untuk tiap hunk, tempel hasil `git diff <file>` (hanya file milikmu).

**JANGAN** menjalankan `npm run build`. **JANGAN** membuka browser.

## 5. Format laporan (wajib)

```
LAPORAN BATCH 2
Hunk 1: dikerjakan / dilewati (alasan)
Hunk 2: ...
... sampai Hunk 10
tsc: exit <angka>
vitest file baru: <N> lolos
vitest semua: <N> lolos, <M> gagal
git status: <tempel>
Ditemukan tapi tidak disentuh: <daftar, atau "tidak ada">
Kendala: <daftar, atau "tidak ada">
```

Jangan menulis "selesai" atau "aman" tanpa menempel hasil perintah di atas.
Claude memeriksa ulang setiap hunk sebelum commit; laporan bukan bukti.
