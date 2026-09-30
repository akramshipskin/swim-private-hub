# Laporan Batch 2 + Race 10 Ronde

Tanggal: 2026-09-25. Eksekutor: OpenCode. Dokumen plan:
`docs/plans/ui-batch-2.md` dan `docs/plans/race-stability-batch-2.md`.

---

## LAPORAN BATCH 2

Hunk 1: dikerjakan
Hunk 2: dikerjakan
Hunk 3: dikerjakan
Hunk 4: dikerjakan
Hunk 5: dikerjakan (5a + 5b, berpasangan dengan Hunk 4)
Hunk 6: dikerjakan
Hunk 7: dikerjakan
Hunk 8: dikerjakan
Hunk 9: dikerjakan
Hunk 10: dikerjakan (file baru dibuat; `ls` sebelumnya: No such file or directory)

tsc: exit 0
vitest file baru: 6 lolos
vitest semua: 334 lolos, 0 gagal (43 file)

git status:

```
M src/app/admin/page.tsx
M src/app/admin/pesan/actions.ts
M src/app/member/dashboard/page.tsx
M src/app/member/pembayaran/page.tsx
?? src/app/admin/pesan/actions.test.ts
?? ui-inconsistency-report-2026-09-20.md
```

(`?? ui-inconsistency-report-2026-09-20.md` sudah ada sebelum mulai, bukan milik batch ini.)

git diff (hanya file milik batch ini):

```diff
diff --git a/src/app/admin/page.tsx b/src/app/admin/page.tsx
index e4900c3..c848560 100644
--- a/src/app/admin/page.tsx
+++ b/src/app/admin/page.tsx
@@ -163,7 +163,7 @@ export default async function AdminDashboardPage() {
             {pools.map((p) => (
               <li key={p.id} className="rounded-lg border border-border px-3 py-2">
                 <p className="text-sm font-semibold text-text">
-                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(belum disetujui)</span>}
+                  {p.name} {!p.isActive && <span className="text-xs font-normal text-warning-text">(nonaktif)</span>}
                 </p>
                 <p className="text-sm text-text-muted">
                   {todayItems.filter((i) => i.poolName === p.name).length} sesi hari ini ·{" "}
diff --git a/src/app/admin/pesan/actions.ts b/src/app/admin/pesan/actions.ts
index 06d0471..91c6b97 100644
--- a/src/app/admin/pesan/actions.ts
+++ b/src/app/admin/pesan/actions.ts
@@ -4,6 +4,7 @@ import { requireRole } from "@/lib/require-role";
 import { prisma } from "@/lib/prisma";
 import { revalidatePath } from "next/cache";
 import { MAX_CHAT_LENGTH } from "@/lib/chat-ai";
+import { sendPushToUser } from "@/lib/push";
 
 export type ReplyState = { error?: string } | null;
 
@@ -15,13 +16,21 @@ export async function replyToThread(_prev: ReplyState, formData: FormData): Prom
   if (!content) return { error: "Balasan tidak boleh kosong." };
   if (content.length > MAX_CHAT_LENGTH) return { error: `Balasan maksimal ${MAX_CHAT_LENGTH} karakter.` };
 
-  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true } });
+  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true, userId: true } });
   if (!thread) return { error: "Percakapan tidak ditemukan." };
 
   await prisma.$transaction([
     prisma.chatMessage.create({ data: { threadId, sender: "ADMIN", content } }),
     prisma.chatThread.update({ where: { id: threadId }, data: { needsAdmin: !resolve } }),
   ]);
+  // Best-effort: gagal kirim notifikasi tidak boleh menggagalkan balasan yang
+  // sudah tersimpan.
+  await sendPushToUser(thread.userId, {
+    title: "Balasan dari admin",
+    body: content.length > 100 ? `${content.slice(0, 97)}...` : content,
+    url: "/",
+  }).catch(() => {});
+
   revalidatePath("/admin/pesan");
   return null;
 }
diff --git a/src/app/member/dashboard/page.tsx b/src/app/member/dashboard/page.tsx
index f0b9e4e..f36a777 100644
--- a/src/app/member/dashboard/page.tsx
+++ b/src/app/member/dashboard/page.tsx
@@ -1,7 +1,7 @@
 import { requireRole } from "@/lib/require-role";
 import { prisma } from "@/lib/prisma";
 import { activePackageWhere } from "@/lib/active-package";
-import { todayWibDateString, dateLabel, formatDateLabel, formatTimeLeft, formatTimeWib } from "@/lib/datetime";
+import { todayWibDateString, dateLabel, formatDateLabel, formatTimeLeft, formatTimeWib, wibDateTime } from "@/lib/datetime";
 import { BentoCard, Stat, SessionList } from "@/components/dashboard";
 import { Badge } from "@/components/ui/badge";
 import { formatRupiah } from "@/lib/format";
@@ -11,8 +11,8 @@ export default async function MemberDashboardPage() {
   const today = dateLabel(todayWibDateString());
   const now = new Date();
 
-  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
-  const [packages, upcoming, attendedCount, attendedThisMonth, pesertaCount, spentThisMonth, favCoach] = await Promise.all([
+  const startMonth = wibDateTime(`${todayWibDateString().slice(0, 7)}-01`, "00:00");
+  const [packages, upcoming, upcomingCount, attendedCount, attendedThisMonth, pesertaCount, spentThisMonth, favCoach] = await Promise.all([
     prisma.package.findMany({
       where: activePackageWhere(session.user.id),
       orderBy: { expiredDate: "asc" },
@@ -39,6 +39,7 @@ export default async function MemberDashboardPage() {
         package: { select: { dependent: { select: { name: true } } } },
       },
     }),
+    prisma.booking.count({ where: { memberId: session.user.id, status: "BOOKED", availability: { startTime: { gt: now } } } }),
     prisma.booking.count({ where: { memberId: session.user.id, attended: true } }),
     prisma.booking.count({
       where: { memberId: session.user.id, attended: true, availability: { startTime: { gte: startMonth } } },
@@ -78,7 +79,7 @@ export default async function MemberDashboardPage() {
           <div className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-4">
             <Stat label="Paket aktif" value={packages.length} hint={`${pesertaCount} peserta terdaftar`} />
             <Stat label="Total sisa sesi" value={totalSisa} />
-            <Stat label="Sesi terjadwal" value={upcoming.length} />
+            <Stat label="Sesi terjadwal" value={upcomingCount} />
             <Stat label="Sesi dihadiri" value={attendedCount} hint={`${attendedThisMonth} bulan ini`} />
           </div>
           <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-4 xl:grid-cols-4">
diff --git a/src/app/member/pembayaran/page.tsx b/src/app/member/pembayaran/page.tsx
index 933d46b..41d3068 100644
--- a/src/app/member/pembayaran/page.tsx
+++ b/src/app/member/pembayaran/page.tsx
@@ -14,6 +14,7 @@ const statusLabel: Record<string, string> = {
   SUCCESS: "Berhasil",
   PENDING: "Menunggu pembayaran",
   FAILED: "Gagal / dibatalkan",
+  EXPIRED: "Kedaluwarsa",
 };
 
 const statusTone = { SUCCESS: "success", PENDING: "warning", FAILED: "danger" } as const;
```

Ditemukan tapi tidak disentuh: tidak ada
Kendala: tidak ada

---

## LAPORAN RACE 10 RONDE

Langkah 1: DB race HIDUP; git status awal:

```
M src/app/admin/page.tsx
M src/app/admin/pesan/actions.ts
M src/app/member/dashboard/page.tsx
M src/app/member/pembayaran/page.tsx
?? src/app/admin/pesan/actions.test.ts
?? ui-inconsistency-report-2026-09-20.md
```

Ronde 1..10 (semua exit code 0; tiap ronde: Test Files 6 passed, Tests 54 passed | 10 expected fail (64)):

```
ronde 1: Tests 54 passed | 10 expected fail (64)
ronde 2: Tests 54 passed | 10 expected fail (64)
ronde 3: Tests 54 passed | 10 expected fail (64)
ronde 4: Tests 54 passed | 10 expected fail (64)
ronde 5: Tests 54 passed | 10 expected fail (64)
ronde 6: Tests 54 passed | 10 expected fail (64)
ronde 7: Tests 54 passed | 10 expected fail (64)
ronde 8: Tests 54 passed | 10 expected fail (64)
ronde 9: Tests 54 passed | 10 expected fail (64)
ronde 10: Tests 54 passed | 10 expected fail (64)
```

Tes yang gagal (per nama, berapa dari 10 ronde): tidak ada (grep `×` kosong di 10 log)

Bukti kegagalan: tidak ada

Sebaran hasil (digabung):

```
10 E2 sebaran {"slot masih ada":15}
 7 E1 sebaran {"20 dari 20 sempat terbooking":12}
 4 E4 sebaran {"3 dari 4 penarikan berhasil":10}
 3 E8 sebaran {"APPROVED":15,"REJECTED":5}
 3 E12 sebaran {"EXPIRED, 0 booking":2,"ACTIVE, 3 booking":13}
 3 E12 sebaran {"ACTIVE, 3 booking":15}
 3 E12 sebaran {"ACTIVE, 3 booking":14,"EXPIRED, 0 booking":1}
 2 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":9,"3 berhasil / 5 ditolak":2}
 2 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":8,"3 berhasil / 5 ditolak":3}
 2 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":7,"3 berhasil / 5 ditolak":2,"4 berhasil / 4 ditolak":2}
 2 E8 sebaran {"REJECTED":4,"APPROVED":16}
 2 E8 sebaran {"APPROVED":14,"REJECTED":6}
 2 E5 sebaran {"pengajuan baru ditolak":9,"pengajuan baru berhasil":6}
 2 E4 sebaran {"3 dari 4 penarikan berhasil":9,"4 dari 4 penarikan berhasil":1}
 2 E4 sebaran {"3 dari 4 penarikan berhasil":8,"4 dari 4 penarikan berhasil":2}
 2 E3b sebaran {"harga=900000 aktif=true":12,"harga=800000 aktif=false":8}
 1 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":8,"3 berhasil / 5 ditolak":1,"4 berhasil / 4 ditolak":2}
 1 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":7,"4 berhasil / 4 ditolak":2,"2 berhasil / 6 ditolak":1,"3 berhasil / 5 ditolak":1}
 1 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":5,"3 berhasil / 5 ditolak":1,"4 berhasil / 4 ditolak":3,"5 berhasil / 3 ditolak":2}
 1 N1 sebaran {"8 berhasil / 0 ditolak":1,"0 berhasil / 8 ditolak":10,"3 berhasil / 5 ditolak":1}
 1 E8 sebaran {"REJECTED":8,"APPROVED":12}
 1 E8 sebaran {"APPROVED":18,"REJECTED":2}
 1 E8 sebaran {"APPROVED":16,"REJECTED":4}
 1 E5 sebaran {"pengajuan baru ditolak":7,"pengajuan baru berhasil":8}
 1 E5 sebaran {"pengajuan baru berhasil":10,"pengajuan baru ditolak":5}
 1 E5 sebaran {"pengajuan baru ditolak":13,"pengajuan baru berhasil":2}
 1 E5 sebaran {"pengajuan baru berhasil":7,"pengajuan baru ditolak":8}
 1 E5 sebaran {"pengajuan baru berhasil":13,"pengajuan baru ditolak":2}
 1 E5 sebaran {"pengajuan baru berhasil":12,"pengajuan baru ditolak":3}
 1 E5 sebaran {"pengajuan baru berhasil":11,"pengajuan baru ditolak":4}
 1 E5 sebaran {"pengajuan baru berhasil":10,"pengajuan baru ditolak":5}
 1 E4 sebaran {"4 dari 4 penarikan berhasil":1,"3 dari 4 penarikan berhasil":9}
 1 E4 sebaran {"3 dari 4 penarikan berhasil":6,"4 dari 4 penarikan berhasil":4}
 1 E3b sebaran {"harga=900000 aktif=true":7,"harga=800000 aktif=false":13}
 1 E3b sebaran {"harga=900000 aktif=true":15,"harga=800000 aktif=false":5}
 1 E3b sebaran {"harga=900000 aktif=true":14,"harga=800000 aktif=false":6}
 1 E3b sebaran {"harga=900000 aktif=true":13,"harga=800000 aktif=false":7}
 1 E3b sebaran {"harga=900000 aktif=true":11,"harga=800000 aktif=false":9}
 1 E3b sebaran {"harga=800000 aktif=false":8,"harga=900000 aktif=true":12}
 1 E3b sebaran {"harga=800000 aktif=false":5,"harga=900000 aktif=true":15}
 1 E3b sebaran {"harga=800000 aktif=false":11,"harga=900000 aktif=true":9}
 1 E12 sebaran {"ACTIVE, 3 booking":13,"EXPIRED, 0 booking":2}
 1 E1 sebaran {"20 dari 20 sempat terbooking":11,"19 dari 20 sempat terbooking":1}
 1 E1 sebaran {"20 dari 20 sempat terbooking":11,"18 dari 20 sempat terbooking":1}
 1 E1 sebaran {"20 dari 20 sempat terbooking":10,"19 dari 20 sempat terbooking":1,"18 dari 20 sempat terbooking":1}
```

Peringatan (per tes):

```
10 PERINGATAN E2
 7 PERINGATAN E1
 4 PERINGATAN E4
 3 PERINGATAN E12
```

Langkah 5 (10 tes bug): K1 cocok; K2a cocok; K2b cocok; K3a cocok; K4a cocok;
K4b cocok; K4c cocok; K4d cocok; K4e cocok; K5 cocok (`expected 13 to be +0`).

Pesan aktual dari `/tmp/known.log` (urut K1..K5):

```
AssertionError: expected 201 to be 409
AssertionError: expected 201 to be 409
AssertionError: expected 'BOOKED' to be 'CANCELLED'
AssertionError: expected undefined to be truthy
AssertionError: expected 201 to be 409
AssertionError: expected '+62 812-3456-7891' to be '081234567891'
AssertionError: expected 201 to be 409
AssertionError: expected 'Budi.Santoso@Example.COM' to be 'budi.santoso@example.com'
AssertionError: expected 4 to be 1
AssertionError: expected 13 to be +0
```

Git status akhir (sama dengan awal: ya):

```
M src/app/admin/page.tsx
M src/app/admin/pesan/actions.ts
M src/app/member/dashboard/page.tsx
M src/app/member/pembayaran/page.tsx
?? src/app/admin/pesan/actions.test.ts
?? ui-inconsistency-report-2026-09-20.md
```

Kendala:

- Perintah 10 ronde terputus timeout 20 menit di ronde 5 (tiap ronde ~4 menit,
  bukan ~1,2 menit seperti estimasi); ronde 6–10 dijalankan lanjutan satu per
  satu berurutan, semua exit 0. Total 10 log ronde lengkap dan utuh.
- Grep langkah 5 persis seperti tertulis (`grep -E "^AssertionError|^Error"`)
  menghasilkan KOSONG karena tiap baris diawali kode warna ANSI, bukan teks.
  Pesan di atas diambil dari `grep -n "AssertionError" /tmp/known.log`
  (10 baris, urut K1..K5, bunyi persis seperti tabel). Perintah langkah 5 itu
  sendiri hanya dijalankan sekali.
