# Plan: Batch 4 — pengamanan & kerapian (O2–O12 sweep keamanan 25 Sep)

> Ditulis oleh Claude (Opus 5.5), 2026-09-25. Eksekutor: OpenCode.
> Semua keputusan di dokumen ini SUDAH DIPUTUSKAN (Hadi + Claude). OpenCode
> TIDAK mengambil keputusan apa pun, hanya menjalankan hunk persis seperti
> tertulis. SELURUH hunk + file baru sudah diuji Claude: ditempel ke kode asli
> berurutan, lalu `npm run lint` (0 error), `npx tsc --noEmit` (0),
> `npx vitest run` (384 lolos), `npm run build` (OK), header dicek lewat
> curl, halaman /kebijakan-privasi & /panduan dicek di browser. Lalu
> dikembalikan.
>
> O1 (batch 3) sudah selesai & di-commit. O9 (scan riwayat git) = langkah
> perintah saja, ada di bagian 5.

## 1. Tujuan (bahasa sederhana)

- O2: header keamanan browser (anti clickjacking dll).
- O3: pemeriksaan otomatis GitHub ditambah lint + cek tipe; lint tidak lagi
  membaca folder kode otomatis/DB lokal.
- O4: coach nonaktif tidak bisa dibuka di halaman publik /pelatih.
- O5: `.env.example` lengkap (DIRECT_URL, Supabase, AI) + catatan sslmode.
- O6: import Excel dibatasi 2MB dan 500 baris.
- O7: email keluar dari menu admin dibatasi 30 per jam.
- O8: file upload dicek isinya (bukan cuma label jenis file).
- O9: scan riwayat git mencari kunci rahasia yang pernah ter-commit (laporan saja).
- O10: daftar akun demo + password di /panduan dihapus.
- O11: tombol "Salin no. rekening" di halaman proses pencairan.
- O12: Kebijakan Privasi menyebut AI, Supabase, Resend, notifikasi, chat 90
  hari + arsip, cara hapus akun; tanggal diperbarui.

## 2. Aturan main WAJIB (baca sebelum mulai)

- **DILARANG** mengambil keputusan sendiri. Semua pilihan sudah diputuskan.
- **DILARANG** menyentuh file/baris di luar yang disebut tiap hunk. Hal lain
  yang "kelihatan salah" di file yang sama: JANGAN diubah, catat di laporan
  sebagai "ditemukan tapi tidak disentuh: ...".
- **DILARANG** `git commit/push/add/reset/checkout/stash`, ganti branch, atau
  perintah git yang mengubah apa pun. Boleh HANYA `git status`, `git diff`,
  dan perintah `git log` persis di bagian 5. Commit dilakukan Claude.
- **DILARANG** menyentuh `.env` asli (selain `.env.example`), `.git/`,
  `node_modules/`, `prisma/`, `src/generated/`, `tests/`, `src/app/api/`.
- File `src/lib/` yang BOLEH disentuh HANYA: `src/lib/storage.ts`,
  `src/lib/pool-info-actions.ts`, `src/lib/legal.ts`, dan file baru
  `src/lib/storage.test.ts` — persis sesuai hunk.
- **DILARANG** `npm install`, menyalakan/mematikan server atau database.
- Kerjakan hunk **berurutan dari atas ke bawah**. Beberapa hunk di file yang
  sama bergantung pada hunk sebelumnya (mis. nomor bagian Kebijakan Privasi).
- Kalau "Snippet LAMA" TIDAK ditemukan persis, atau muncul LEBIH DARI SATU
  KALI di file itu: **STOP di hunk itu**, jangan improvisasi. Tulis di
  laporan "Hunk N dilewati, alasan: ...". Hunk lain di file BERBEDA boleh
  lanjut; hunk berikutnya di file YANG SAMA ikut dilewati.
- Salin snippet BARU apa adanya, termasuk spasi di awal baris.
- Jangan merapikan/memformat kode lain. Jangan menambah komentar selain yang
  tertulis.
- Kalau "Snippet BARU" kosong, artinya teks LAMA dihapus seluruhnya.
- File baru: cek dulu `git ls-files <path>` DAN `ls <path>`. Kalau sudah ada:
  STOP, jangan menimpa, laporkan.

## 3. Scope file

1. `next.config.ts`
2. `.github/workflows/test.yml`
3. `eslint.config.mjs`
4. `src/app/pelatih/[coachId]/page.tsx`
5. `.env.example`
6. `src/app/admin/users/actions.ts`
7. `src/app/admin/users/actions.test.ts`
8. `src/app/admin/email/actions.ts`
9. `src/app/admin/email/actions.test.ts`
10. `src/lib/storage.ts`
11. `src/app/profil/actions.ts`
12. `src/lib/pool-info-actions.ts`
13. `src/app/panduan/panduan-view.tsx`
14. `src/app/admin/withdrawals/withdrawal-row.tsx`
15. `src/lib/legal.ts`
16. `src/app/kebijakan-privasi/page.tsx`
17. `src/app/admin/email/rate-limit.test.ts (FILE BARU)`
18. `src/lib/storage.test.ts (FILE BARU)`

---

## HUNK 1 — Header keamanan browser (O2)

**File:** `next.config.ts`

**Alasan:** Mencegah situs dipasang di dalam iframe situs lain (clickjacking), mencegah browser menebak jenis file, membatasi info rujukan, dan mematikan izin kamera/mikrofon/lokasi yang tidak dipakai. CSP sengaja BELUM dipasang: butuh daftar izin untuk skrip Midtrans & Vercel yang harus diuji terpisah.

**Snippet LAMA (cari persis ini):**
```
  experimental: {
    // Upload foto & sertifikat coach (maks 3MB per file, lihat src/lib/storage.ts)
    // lewat server action; default 1MB terlalu kecil.
    serverActions: { bodySizeLimit: "4mb" },
  },
};
```

**Snippet BARU (ganti jadi ini):**
```
  experimental: {
    // Upload foto & sertifikat coach (maks 3MB per file, lihat src/lib/storage.ts)
    // lewat server action; default 1MB terlalu kecil.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Header keamanan dasar (sweep keamanan 25 Sep). CSP belum: perlu daftar izin
  // skrip Midtrans Snap & Vercel Analytics yang diuji terpisah.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

---

## HUNK 2 — Pemeriksaan otomatis GitHub (O3)

**File:** `.github/workflows/test.yml`

**Alasan:** Sekarang CI cuma menjalankan tes. Ditambah lint dan cek tipe supaya kode rusak ketahuan sebelum deploy. Build TIDAK ditambah di sini: build butuh kunci rahasia produksi, dan Vercel sudah menjalankan build di setiap deploy (deploy gagal kalau build gagal).

**Snippet LAMA (cari persis ini):**
```
      - run: npm ci
      - run: npm test
```

**Snippet BARU (ganti jadi ini):**
```
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
```

---

## HUNK 2b — Lint tidak membaca kode otomatis & DB lokal (O3)

**File:** `eslint.config.mjs`

**Alasan:** `npm run lint` membaca src/generated (kode Prisma otomatis, sangat besar) dan .dev-db (DB lokal 345MB) sampai kehabisan memori. Di CI src/generated juga ada setelah npm ci, jadi tanpa ini langkah lint baru di CI ikut gagal.

**Snippet LAMA (cari persis ini):**
```
    "next-env.d.ts",
  ]),
```

**Snippet BARU (ganti jadi ini):**
```
    "next-env.d.ts",
    // Kode otomatis Prisma & database lokal -- bukan kode kita, dan besar.
    "src/generated/**",
    ".dev-db/**",
  ]),
```

---

## HUNK 3 — Coach nonaktif tidak tampil di halaman publik (O4)

**File:** `src/app/pelatih/[coachId]/page.tsx`

**Alasan:** Coach yang belum disetujui atau dinonaktifkan admin masih bisa dibuka lewat link /pelatih/<id>.

**Snippet LAMA (cari persis ini):**
```
    where: { id: coachId, role: "COACH" },
```

**Snippet BARU (ganti jadi ini):**
```
    // Coach nonaktif (belum disetujui / dinonaktifkan admin) tidak dipublikasikan.
    where: { id: coachId, role: "COACH", isActive: true },
```

---

## HUNK 4a — Lengkapi .env.example: database (O5)

**File:** `.env.example`

**Alasan:** DIRECT_URL dipakai migrasi tapi belum tercatat. sslmode=no-verify SENGAJA tidak diganti: sertifikat Supabase tidak lolos verifikasi penuh di driver pg tanpa file CA, jadi menggantinya membuat koneksi gagal. Risikonya ditulis sebagai catatan.

**Snippet LAMA (cari persis ini):**
```
# PostgreSQL connection string (Supabase). Untuk migrasi, pakai session
# pooler (port 5432) -- transaction pooler (port 6543) tidak support
# advisory lock yang dibutuhkan `prisma migrate`.
DATABASE_URL="postgresql://user:password@host:5432/postgres?sslmode=no-verify"
```

**Snippet BARU (ganti jadi ini):**
```
# PostgreSQL connection string (Supabase). Untuk migrasi, pakai session
# pooler (port 5432) -- transaction pooler (port 6543) tidak support
# advisory lock yang dibutuhkan `prisma migrate`.
# Catatan keamanan: sslmode=no-verify = koneksi tetap terenkripsi, tapi
# sertifikat server tidak diverifikasi. Dipakai karena rantai sertifikat
# Supabase tidak lolos verifikasi penuh di driver pg tanpa file CA. Upgrade:
# unduh CA Supabase lalu pakai sslmode=verify-full + sslrootcert.
DATABASE_URL="postgresql://user:password@host:5432/postgres?sslmode=no-verify"
# Dipakai Prisma CLI (migrate) -- session pooler 5432 / koneksi langsung.
DIRECT_URL="postgresql://user:password@host:5432/postgres?sslmode=no-verify"
```

---

## HUNK 4b — Lengkapi .env.example: Supabase Storage & AI (O5)

**File:** `.env.example`

**Alasan:** Variabel yang dipakai kode tapi belum tercatat di contoh.

**Snippet LAMA (cari persis ini):**
```
RESEND_API_KEY=""
RESEND_WEBHOOK_SECRET=""
```

**Snippet BARU (ganti jadi ini):**
```
RESEND_API_KEY=""
RESEND_WEBHOOK_SECRET=""

# Supabase Storage (foto coach/kolam, file sertifikat) -- WAJIB kalau fitur
# upload dipakai. Bucket: "coach-photos" (public), "coach-certificates"
# (private). Service role key = rahasia server, jangan pernah NEXT_PUBLIC_.
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""

# Chat bantuan AI -- OPSIONAL. Isi salah satu; kosong semua = semua pertanyaan
# langsung diteruskan ke admin. Model boleh dikosongkan (pakai bawaan kode).
GEMINI_API_KEY=""
GEMINI_MODEL=""
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL=""
```

---

## HUNK 5a — Batas import Excel: konstanta (O6)

**File:** `src/app/admin/users/actions.ts`

**Alasan:** File/baris tanpa batas bisa membuat server kehabisan memori atau waktu (tiap member baru butuh ±70 md untuk password).

**Snippet LAMA (cari persis ini):**
```
const IMPORT_DEFAULT_JATAH_CANCEL = 2;
```

**Snippet BARU (ganti jadi ini):**
```
const IMPORT_DEFAULT_JATAH_CANCEL = 2;
// Batas import (sweep keamanan 25 Sep): tiap member baru butuh hash password
// (±70 md), jadi 500 baris ≈ <1 menit -- masih di bawah batas waktu server.
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;
```

---

## HUNK 5b — Batas import Excel: ukuran file & jumlah baris dibaca (O6)

**File:** `src/app/admin/users/actions.ts`

**Alasan:** Tolak file besar SEBELUM dibaca, dan batasi baris yang dibaca parser.

**Snippet LAMA (cari persis ini):**
```
  const buffer = Buffer.from(await file.arrayBuffer());
  let rawRows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
```

**Snippet BARU (ganti jadi ini):**
```
  if (file.size > MAX_IMPORT_BYTES) {
    return { error: "File terlalu besar (maksimal 2MB). Pecah jadi beberapa file." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawRows: Record<string, unknown>[];
  try {
    // sheetRows: parser berhenti membaca setelah baris ke-(batas + judul + 1).
    const workbook = XLSX.read(buffer, { type: "buffer", sheetRows: MAX_IMPORT_ROWS + 2 });
```

---

## HUNK 5c — Batas import Excel: tolak kalau baris kebanyakan (O6)

**File:** `src/app/admin/users/actions.ts`

**Alasan:** Lanjutan 5b.

**Snippet LAMA (cari persis ini):**
```
  if (rawRows.length === 0) {
    return { error: "File kosong atau tidak ada data di sheet pertama." };
  }
```

**Snippet BARU (ganti jadi ini):**
```
  if (rawRows.length === 0) {
    return { error: "File kosong atau tidak ada data di sheet pertama." };
  }
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return { error: `Maksimal ${MAX_IMPORT_ROWS} baris per file. Pecah jadi beberapa file.` };
  }
```

---

## HUNK 5d — Batas import Excel: tes (O6)

**File:** `src/app/admin/users/actions.test.ts`

**Alasan:** Tes untuk dua batas di atas.

**Snippet LAMA (cari persis ini):**
```
  it("skips a row with no phone number instead of failing the whole import", async () => {
```

**Snippet BARU (ganti jadi ini):**
```
  // Sweep keamanan 25 Sep: batas ukuran file & jumlah baris import.
  it("refuses a file bigger than 2MB before parsing it", async () => {
    const fd = new FormData();
    fd.set("poolId", "pool-1");
    fd.set("file", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "besar.xlsx"));
    const result = await importMembersXlsx(null, fd);
    expect(result?.error).toContain("2MB");
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("refuses more than 500 rows", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({ "Nama Member": `M${i}`, "No HP": `0812${String(i).padStart(8, "0")}` }));
    const result = await importMembersXlsx(null, importFormData(rows));
    expect(result?.error).toContain("500");
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("skips a row with no phone number instead of failing the whole import", async () => {
```

---

## HUNK 6a — Batas kirim email admin: impor (O7)

**File:** `src/app/admin/email/actions.ts`

**Alasan:** Kalau akun admin dibobol, domain email kita bisa dipakai kirim spam. Batas: 30 email keluar per jam (balasan + tulis baru digabung).

**Snippet LAMA (cari persis ini):**
```
import { INBOX_ADDRESSES, INBOX_FROM_ADDRESS, sendReplyEmail } from "@/lib/email";
```

**Snippet BARU (ganti jadi ini):**
```
import { INBOX_ADDRESSES, INBOX_FROM_ADDRESS, sendReplyEmail } from "@/lib/email";
import { takeAttempt } from "@/lib/rate-limit";

// Sweep keamanan 25 Sep: batas email keluar supaya akun admin yang dibobol
// tidak bisa dipakai kirim spam dari domain kita.
const MAX_OUTBOUND_EMAILS_PER_HOUR = 30;
const EMAIL_LIMIT_ERROR = `Batas kirim email tercapai (${MAX_OUTBOUND_EMAILS_PER_HOUR} per jam). Coba lagi nanti.`;
```

---

## HUNK 6b — Batas kirim email admin: balasan (O7)

**File:** `src/app/admin/email/actions.ts`

**Alasan:** Dicek tepat sebelum email dikirim.

**Snippet LAMA (cari persis ini):**
```
  const replyFrom = thread.messages[0]?.toAddress || INBOX_FROM_ADDRESS;

```

**Snippet BARU (ganti jadi ini):**
```
  const replyFrom = thread.messages[0]?.toAddress || INBOX_FROM_ADDRESS;
  if (!(await takeAttempt("email-keluar", MAX_OUTBOUND_EMAILS_PER_HOUR, 3_600_000))) {
    return { error: EMAIL_LIMIT_ERROR };
  }

```

---

## HUNK 6c — Batas kirim email admin: tulis baru (O7)

**File:** `src/app/admin/email/actions.ts`

**Alasan:** Sama dengan 6b untuk email baru.

**Snippet LAMA (cari persis ini):**
```
    return { error: `Isi email maksimal ${MAX_EMAIL_BODY_LENGTH} karakter.` };
  }

  let sent: { id: string };
```

**Snippet BARU (ganti jadi ini):**
```
    return { error: `Isi email maksimal ${MAX_EMAIL_BODY_LENGTH} karakter.` };
  }
  if (!(await takeAttempt("email-keluar", MAX_OUTBOUND_EMAILS_PER_HOUR, 3_600_000))) {
    return { error: EMAIL_LIMIT_ERROR };
  }

  let sent: { id: string };
```

---

## HUNK 6d — Batas kirim email admin: tiruan di tes (O7)

**File:** `src/app/admin/email/actions.test.ts`

**Alasan:** Tes lama butuh tiruan fungsi batas.

**Snippet LAMA (cari persis ini):**
```
const { replyToEmailThread, composeEmail } = await import("./actions");
```

**Snippet BARU (ganti jadi ini):**
```
const takeAttempt = vi.fn().mockResolvedValue("hit-1");
vi.mock("@/lib/rate-limit", () => ({ takeAttempt: (...a: unknown[]) => takeAttempt(...a) }));

const { replyToEmailThread, composeEmail } = await import("./actions");
```

---

## HUNK 7a — Cek isi file upload: fungsi pemeriksa (O8)

**File:** `src/lib/storage.ts`

**Alasan:** Jenis file sekarang cuma dicek dari label yang dikirim browser (bisa dipalsukan). Fungsi ini membaca beberapa byte pertama file dan mencocokkan tanda tangan asli JPG/PNG/WEBP/PDF.

**Snippet LAMA (cari persis ini):**
```
export function extensionFor(file: File) {
```

**Snippet BARU (ganti jadi ini):**
```
// Label jenis file (file.type) dikirim browser dan bisa dipalsukan -- cek juga
// "tanda tangan" di byte awal isi file (sweep keamanan 25 Sep).
export async function hasMatchingSignature(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  switch (file.type) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && ascii(1, 4) === "PNG";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf":
      return ascii(0, 4) === "%PDF";
    default:
      return false;
  }
}

export const SIGNATURE_MISMATCH_ERROR = "Isi file tidak cocok dengan jenisnya. Unggah ulang foto/dokumen aslinya.";

export function extensionFor(file: File) {
```

---

## HUNK 7b — Cek isi file upload: impor di profil (O8)

**File:** `src/app/profil/actions.ts`

**Alasan:** Pakai fungsi baru.

**Snippet LAMA (cari persis ini):**
```
import { isStorageConfigured, validateUpload, extensionFor, uploadObject, publicObjectUrl, PHOTO_BUCKET, CERT_BUCKET } from "@/lib/storage";
```

**Snippet BARU (ganti jadi ini):**
```
import { isStorageConfigured, validateUpload, extensionFor, uploadObject, publicObjectUrl, PHOTO_BUCKET, CERT_BUCKET, hasMatchingSignature, SIGNATURE_MISMATCH_ERROR } from "@/lib/storage";
```

---

## HUNK 7c — Cek isi file upload: foto coach (O8)

**File:** `src/app/profil/actions.ts`

**Snippet LAMA (cari persis ini):**
```
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };

  const path = `${session.user.id}/photo.${extensionFor(file!)}`;
```

**Snippet BARU (ganti jadi ini):**
```
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const path = `${session.user.id}/photo.${extensionFor(file!)}`;
```

---

## HUNK 7d — Cek isi file upload: sertifikat coach (O8)

**File:** `src/app/profil/actions.ts`

**Snippet LAMA (cari persis ini):**
```
  const invalid = validateUpload(file, "certificate");
  if (invalid) return { error: invalid };
```

**Snippet BARU (ganti jadi ini):**
```
  const invalid = validateUpload(file, "certificate");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };
```

---

## HUNK 7e — Cek isi file upload: impor di info kolam (O8)

**File:** `src/lib/pool-info-actions.ts`

**Snippet LAMA (cari persis ini):**
```
import { PHOTO_BUCKET, extensionFor, isStorageConfigured, publicObjectUrl, uploadObject, validateUpload } from "@/lib/storage";
```

**Snippet BARU (ganti jadi ini):**
```
import { PHOTO_BUCKET, extensionFor, isStorageConfigured, publicObjectUrl, uploadObject, validateUpload, hasMatchingSignature, SIGNATURE_MISMATCH_ERROR } from "@/lib/storage";
```

---

## HUNK 7f — Cek isi file upload: foto kolam (O8)

**File:** `src/lib/pool-info-actions.ts`

**Snippet LAMA (cari persis ini):**
```
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };

  const pool = await prisma.pool.findUnique
```

**Snippet BARU (ganti jadi ini):**
```
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const pool = await prisma.pool.findUnique
```

---

## HUNK 8a — Hapus daftar akun demo di /panduan: data (O10)

**File:** `src/app/panduan/panduan-view.tsx`

**Alasan:** Halaman publik menuliskan password semua akun demo. Akun demo di produksi akan dihapus/dinonaktifkan Claude; bagian ini ikut dibuang.

**Snippet LAMA (cari persis ini):**
```
const DEMO_ACCOUNTS = [
  { name: "Dedi Kurniawan", role: "Member (orang tua)", login: "dedi.member@example.com" },
  { name: "Rina Marlina", role: "Member (orang tua)", login: "rina.member@example.com" },
  { name: "Ayu Lestari", role: "Coach", login: "ayu.coach@example.com" },
  { name: "Fajar Nugroho", role: "Coach", login: "fajar.coach@example.com" },
  { name: "Sari Wulandari", role: "Pemilik kolam (Melati)", login: "sari.melati@example.com" },
  { name: "Budi Santoso", role: "Pemilik kolam (Tirta Asri)", login: "budi.tirta@example.com" },
];


```

**Snippet BARU:** *(kosong — hapus seluruh snippet LAMA)*

---

## HUNK 8b — Hapus daftar akun demo di /panduan: tampilan (O10)

**File:** `src/app/panduan/panduan-view.tsx`

**Alasan:** Bagian 'Akun demo' dibuang seluruhnya.

**Snippet LAMA (cari persis ini):**
```
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Akun demo</h2>
            <p className="mt-2 max-w-2xl text-base text-[#5C5945]">
              Semua password sama: <b className="text-[#14140F]">qwertyuiop</b>. Masuk dengan email di bawah untuk
              mencoba tiap peran. Akun admin tidak dibagikan di sini; hubungi kami kalau perlu akses admin untuk
              evaluasi.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-[#14140F]/10 text-left text-xs uppercase tracking-wide text-[#5C5945]">
                    <th className="px-5 py-3 font-medium">Nama</th>
                    <th className="px-5 py-3 font-medium">Peran</th>
                    <th className="px-5 py-3 font-medium">Masuk pakai email</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((a) => (
                    <tr key={a.login} className="border-b border-[#14140F]/10 last:border-0">
                      <td className="px-5 py-3 font-medium">{a.name}</td>
                      <td className="px-5 py-3 text-[#5C5945]">{a.role}</td>
                      <td className="px-5 py-3 font-mono text-[#14140F]">{a.login}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
```

**Snippet BARU (ganti jadi ini):**
```
          </section>
        </div>
```

---

## HUNK 9a — Tombol salin nomor rekening: status (O11)

**File:** `src/app/admin/withdrawals/withdrawal-row.tsx`

**Alasan:** Selama pencairan masih manual, admin butuh nomor rekening lengkap di halaman proses pencairan -- ditambah tombol Salin supaya tidak salah ketik di m-banking. (Penyamaran nomor di halaman detail user dikerjakan Claude.)

**Snippet LAMA (cari persis ini):**
```
  const [confirming, setConfirming] = useState<"paid" | "reject" | null>(null);
```

**Snippet BARU (ganti jadi ini):**
```
  const [confirming, setConfirming] = useState<"paid" | "reject" | null>(null);
  const [accountCopied, setAccountCopied] = useState(false);
```

---

## HUNK 9b — Tombol salin nomor rekening: tombol (O11)

**File:** `src/app/admin/withdrawals/withdrawal-row.tsx`

**Snippet LAMA (cari persis ini):**
```
          <dd className="text-text">{w.bankName} · {w.bankAccountNumber} a.n. {w.bankAccountName}</dd>
```

**Snippet BARU (ganti jadi ini):**
```
          <dd className="text-text">
            {w.bankName} · {w.bankAccountNumber} a.n. {w.bankAccountName}{" "}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(w.bankAccountNumber).then(() => {
                  setAccountCopied(true);
                  setTimeout(() => setAccountCopied(false), 2000);
                });
              }}
              className="ml-1 rounded-md border border-border px-2 py-0.5 text-xs text-text-muted hover:bg-surface-muted"
            >
              {accountCopied ? "Disalin" : "Salin no. rekening"}
            </button>
          </dd>
```

---

## HUNK 10a — Kebijakan privasi: tanggal pembaruan (O12)

**File:** `src/lib/legal.ts`

**Alasan:** Tanggal dokumen ikut jadi versi persetujuan yang dicatat saat pendaftaran.

**Snippet LAMA (cari persis ini):**
```
export const PRIVACY_UPDATED_AT = "10 September 2026";
```

**Snippet BARU (ganti jadi ini):**
```
export const PRIVACY_UPDATED_AT = "25 September 2026";
```

---

## HUNK 10b — Kebijakan privasi: data yang dikumpulkan (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Alasan:** Menambah data yang memang dikumpulkan sistem tapi belum disebut.

**Snippet LAMA (cari persis ini):**
```
        <li>Alamat IP saat pendaftaran akun, untuk keamanan dan pencegahan pendaftaran palsu.</li>
```

**Snippet BARU (ganti jadi ini):**
```
        <li>Alamat IP saat pendaftaran akun dan saat percobaan masuk, untuk keamanan dan pencegahan penyalahgunaan.</li>
        <li>Waktu dan versi persetujuan atas Syarat &amp; Ketentuan serta Kebijakan Privasi saat mendaftar.</li>
        <li>Isi percakapan pada fitur chat bantuan (lihat bagian 4).</li>
        <li>Foto profil dan file sertifikat yang diunggah pelatih, serta foto kolam yang diunggah pemilik kolam.</li>
```

---

## HUNK 10c — Kebijakan privasi: pihak ketiga (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Alasan:** Menyebut layanan yang benar-benar dipakai: Supabase, penyedia AI, Resend, layanan notifikasi.

**Snippet LAMA (cari persis ini):**
```
        <li>
          <strong>Vercel Analytics</strong> — layanan analitik kunjungan halaman
          yang bersifat <em>cookieless</em> dan tidak melacak individu pengguna.
        </li>
      </ul>
```

**Snippet BARU (ganti jadi ini):**
```
        <li>
          <strong>Vercel Analytics</strong> — layanan analitik kunjungan halaman
          yang bersifat <em>cookieless</em> dan tidak melacak individu pengguna.
        </li>
        <li>
          <strong>Supabase</strong> — penyedia basis data dan penyimpanan file
          (foto dan sertifikat) tempat data Aplikasi disimpan.
        </li>
        <li>
          <strong>Google (Gemini) dan Anthropic (Claude)</strong> — penyedia
          kecerdasan buatan yang membantu menjawab chat bantuan. Keduanya menerima
          isi pesan chat, riwayat singkat percakapan, serta nama dan peran akun
          Pengguna, hanya untuk menyusun jawaban.
        </li>
        <li>
          <strong>Resend</strong> — layanan pengiriman dan penerimaan email untuk
          korespondensi antara Pengguna dan kami.
        </li>
        <li>
          <strong>Layanan notifikasi peramban</strong> (misalnya Google, Apple,
          Mozilla) — meneruskan isi notifikasi ke perangkat Pengguna, bila fitur
          notifikasi diaktifkan.
        </li>
      </ul>
```

---

## HUNK 10d — Kebijakan privasi: bagian chat & masa simpan, nomor bagian (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Alasan:** Bagian baru sesuai keputusan Hadi (riwayat tampil 90 hari, arsip disimpan). Nomor bagian sesudahnya bergeser +1.

**Snippet LAMA (cari persis ini):**
```
      <h2>4. Cookie dan Penyimpanan Lokal</h2>
```

**Snippet BARU (ganti jadi ini):**
```
      <h2>4. Chat Bantuan dan Masa Penyimpanan</h2>
      <p>
        Pesan pada fitur chat bantuan dijawab oleh asisten berbasis kecerdasan
        buatan dan, bila perlu, oleh administrator. Riwayat chat yang tampil bagi
        Pengguna adalah 90 hari terakhir. Arsip percakapan tetap kami simpan untuk
        keperluan penanganan keluhan dan penyelesaian masalah, dan hanya dapat
        diakses administrator. Mohon tidak mengirim kata sandi, nomor kartu, atau
        data sensitif lain melalui chat.
      </p>

      <h2>5. Cookie dan Penyimpanan Lokal</h2>
```

---

## HUNK 10e — Kebijakan privasi: keamanan (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Alasan:** Menyebut pengaman yang sekarang benar-benar ada.

**Snippet LAMA (cari persis ini):**
```
      <h2>5. Keamanan Data</h2>
      <p>
        Kata sandi disimpan dalam bentuk terenkripsi (hash), bukan sebagai teks
        biasa. Akses terhadap data dibatasi sesuai peran pengguna — member hanya
        dapat mengakses data anaknya sendiri, pelatih hanya dapat mengakses
        jadwalnya sendiri, dan seterusnya.
      </p>
```

**Snippet BARU (ganti jadi ini):**
```
      <h2>6. Keamanan Data</h2>
      <p>
        Kata sandi disimpan dalam bentuk terenkripsi (hash), bukan sebagai teks
        biasa. Percobaan masuk yang salah berulang kali akan dikunci sementara,
        dan akun administrator dilindungi verifikasi dua langkah. Akses terhadap
        data dibatasi sesuai peran pengguna — member hanya dapat mengakses data
        anaknya sendiri, pelatih hanya dapat mengakses jadwalnya sendiri, dan
        seterusnya.
      </p>
```

---

## HUNK 10f — Kebijakan privasi: hak hapus akun (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Alasan:** Cara hapus akun sesuai fitur baru (member ajukan di Profil, admin menyetujui).

**Snippet LAMA (cari persis ini):**
```
      <h2>6. Hak Pengguna atas Data Pribadi</h2>
```

**Snippet BARU (ganti jadi ini):**
```
      <h2>7. Hak Pengguna atas Data Pribadi</h2>
```

---

## HUNK 10g — Kebijakan privasi: rincian penghapusan (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Snippet LAMA (cari persis ini):**
```
        <li>Meminta penghapusan akun dan data pribadi, dengan catatan bahwa riwayat transaksi yang wajib disimpan sesuai ketentuan perundang-undangan tetap dipertahankan.</li>
```

**Snippet BARU (ganti jadi ini):**
```
        <li>
          Meminta penghapusan akun melalui menu Profil (member) atau kontak di
          bawah. Setelah disetujui administrator, nama, nomor telepon, email, dan
          nama peserta dihapus dari akun. Riwayat transaksi dan arsip percakapan
          tetap disimpan tanpa identitas tersebut, sesuai ketentuan
          perundang-undangan dan keperluan penyelesaian masalah.
        </li>
```

---

## HUNK 10h — Kebijakan privasi: nomor bagian perubahan (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Snippet LAMA (cari persis ini):**
```
      <h2>7. Perubahan Kebijakan</h2>
```

**Snippet BARU (ganti jadi ini):**
```
      <h2>8. Perubahan Kebijakan</h2>
```

---

## HUNK 10i — Kebijakan privasi: nomor bagian kontak (O12)

**File:** `src/app/kebijakan-privasi/page.tsx`

**Snippet LAMA (cari persis ini):**
```
      <h2>8. Kontak</h2>
```

**Snippet BARU (ganti jadi ini):**
```
      <h2>9. Kontak</h2>
```

---

## HUNK 6e — Batas kirim email admin: tes baru (O7)

**File BARU:** `src/app/admin/email/rate-limit.test.ts`

**Alasan:** Tes khusus batas email (file baru, terpisah supaya tidak mengubah tes lama).

**SEBELUM MEMBUAT:** `git ls-files src/app/admin/email/rate-limit.test.ts` harus kosong DAN `ls src/app/admin/email/rate-limit.test.ts` harus "No such file". Kalau ada: STOP.

**Isi file (salin persis, seluruhnya):**
```
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const sendReplyEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  INBOX_FROM_ADDRESS: "hello@swimprivatehub.biz.id",
  INBOX_ADDRESSES: ["hello@swimprivatehub.biz.id"],
  sendReplyEmail: (...a: unknown[]) => sendReplyEmail(...a),
}));

const takeAttempt = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ takeAttempt: (...a: unknown[]) => takeAttempt(...a) }));

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailThread: { findUnique: (...a: unknown[]) => findUnique(...a), update: vi.fn(), upsert: vi.fn() },
    emailMessage: { create: vi.fn() },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { replyToEmailThread, composeEmail } = await import("./actions");

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

beforeEach(() => vi.clearAllMocks());

// Sweep keamanan 25 Sep: batas 30 email keluar per jam.
describe("batas email keluar", () => {
  it("refuses a new email once the hourly limit is reached, without sending", async () => {
    takeAttempt.mockResolvedValue(null);
    const res = await composeEmail(null, fd({ to: "a@b.co", from: "hello@swimprivatehub.biz.id", subject: "Hai", content: "Isi" }));
    expect(res?.error).toContain("Batas kirim email");
    expect(sendReplyEmail).not.toHaveBeenCalled();
    expect(takeAttempt).toHaveBeenCalledWith("email-keluar", 30, 3_600_000);
  });

  it("refuses a reply once the hourly limit is reached, without sending", async () => {
    takeAttempt.mockResolvedValue(null);
    findUnique.mockResolvedValue({ id: "t1", subject: "S", externalEmail: "a@b.co", messages: [] });
    const res = await replyToEmailThread(null, fd({ threadId: "t1", content: "Balas" }));
    expect(res?.error).toContain("Batas kirim email");
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });
});
```

---

## HUNK 7g — Cek isi file upload: tes (O8)

**File BARU:** `src/lib/storage.test.ts`

**Alasan:** Tes fungsi pemeriksa (file baru).

**SEBELUM MEMBUAT:** `git ls-files src/lib/storage.test.ts` harus kosong DAN `ls src/lib/storage.test.ts` harus "No such file". Kalau ada: STOP.

**Isi file (salin persis, seluruhnya):**
```
import { describe, expect, it } from "vitest";
import { hasMatchingSignature } from "./storage";

const file = (bytes: number[], type: string) => new File([new Uint8Array(bytes)], "x", { type });
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("hasMatchingSignature", () => {
  it.each([
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]],
    ["image/png", [0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", [...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")]],
    ["application/pdf", ascii("%PDF-1.7")],
  ])("accepts a real %s", async (type, bytes) => {
    expect(await hasMatchingSignature(file(bytes as number[], type as string))).toBe(true);
  });

  it("rejects an HTML/script file labelled as an image", async () => {
    expect(await hasMatchingSignature(file(ascii("<html><script>"), "image/png"))).toBe(false);
  });

  it("rejects a PNG labelled as PDF, and an unknown type", async () => {
    expect(await hasMatchingSignature(file([0x89, ...ascii("PNG")], "application/pdf"))).toBe(false);
    expect(await hasMatchingSignature(file(ascii("%PDF"), "text/plain"))).toBe(false);
  });
});
```

---

## 5. O9 — Scan riwayat git (HANYA menjalankan & melapor)

Tujuan: memastikan kunci rahasia (Midtrans, Resend, Supabase, AI, database)
tidak pernah ter-commit di riwayat git. Perintah ini HANYA menampilkan kode
commit dan nama file, **tidak menampilkan isi kuncinya**. JANGAN mengubah
perintah supaya menampilkan isi (`-p`, `grep` isi, dll) — laporan ini dibaca
orang lain, kunci tidak boleh ikut tertulis.

Jalankan persis (satu blok):

```
for pat in 'Mid-server-[A-Za-z0-9_-]{10,}' 'SB-Mid-server-[A-Za-z0-9_-]{10,}' 're_[A-Za-z0-9]{20,}' 'whsec_[A-Za-z0-9+/=]{20,}' 'sk-ant-[A-Za-z0-9_-]{20,}' 'AIza[0-9A-Za-z_-]{30,}' 'eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}' 'postgres(ql)?://[^:@/ ]+:[^@/ ]{6,}@[a-z0-9.-]*(supabase|pooler)'; do echo "== pola: $pat"; git log --all -E -G"$pat" --pretty=format:'%h %ad %s' --date=short --name-only | head -40; echo; done
```

Tempel SELURUH keluarannya di laporan. Keluaran kosong di bawah sebuah pola =
tidak ditemukan. Jangan menyimpulkan sendiri "aman/tidak aman" — Claude yang
menilai (pola `eyJ...` bisa cocok dengan hal yang bukan rahasia).

## 6. Verifikasi (WAJIB, tempel hasilnya di laporan)

Jalankan berurutan dari root repo. Cek kode keluar langsung (jangan lewat `| tail`).

1. `npm run lint` lalu `echo "exit $?"` — harus `exit 0` (warning boleh, error tidak).
2. `npx tsc --noEmit` lalu `echo "exit $?"` — harus `exit 0`.
3. `npx vitest run` — SEMUA lolos. Tulis angka "Tests N passed" (harapan: 384).
4. `git status --short` — file berubah HARUS persis daftar di bagian 3
   (status `M`) + 2 file baru (`??`), ditambah file `??` yang SUDAH ada
   sebelum kamu mulai (jangan disentuh, jangan diklaim).
5. `git diff --stat` — tempel.

**JANGAN** menjalankan `npm run build`. **JANGAN** membuka browser.

## 7. Format laporan (wajib)

```
LAPORAN BATCH 4
Hunk 1: dikerjakan / dilewati (alasan)
... (semua hunk sampai 10i, lalu 6e dan 7g)
lint: exit <angka>
tsc: exit <angka>
vitest semua: <N> lolos, <M> gagal
O9 keluaran scan: <tempel utuh>
git status: <tempel>
git diff --stat: <tempel>
Ditemukan tapi tidak disentuh: <daftar, atau "tidak ada">
Kendala: <daftar, atau "tidak ada">
```

Jangan menulis "selesai" atau "aman" tanpa menempel hasil perintah di atas.
Claude memeriksa ulang setiap hunk sebelum commit; laporan bukan bukti.
