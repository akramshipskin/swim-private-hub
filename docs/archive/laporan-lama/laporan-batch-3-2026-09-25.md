# Laporan Batch 3

Tanggal: 2026-09-25. Eksekutor: OpenCode. Dokumen plan:
`docs/plans/ui-batch-3.md`.

```
LAPORAN BATCH 3
Hunk 1: dikerjakan
Hunk 2: dikerjakan
eslint: exit 0
tsc: exit 0
vitest semua: 334 lolos, 0 gagal
git status:
 M src/app/member/booking/booking-board.tsx
 M src/components/nav-bar.tsx
?? docs/plans/ui-batch-3.md
?? laporan-batch-2-dan-race-2026-09-25.md
?? ui-inconsistency-report-2026-09-20.md
git diff:
diff --git a/src/app/member/booking/booking-board.tsx b/src/app/member/booking/booking-board.tsx
index 25d2f6e..3d331c0 100644
--- a/src/app/member/booking/booking-board.tsx
+++ b/src/app/member/booking/booking-board.tsx
@@ -169,6 +169,9 @@ export default function BookingBoard({
   }, [date, poolId]);

   useEffect(() => {
+    // Sinkronisasi dengan server (fetch saat mount + polling): pola yang sah,
+    // setState terjadi setelah await, bukan sinkron di badan effect.
+    // eslint-disable-next-line react-hooks/set-state-in-effect
     loadSlots();
     const interval = setInterval(loadSlots, POLL_INTERVAL_MS);

diff --git a/src/components/nav-bar.tsx b/src/components/nav-bar.tsx
index 4b687e2..a534723 100644
--- a/src/components/nav-bar.tsx
+++ b/src/components/nav-bar.tsx
@@ -60,9 +60,9 @@ export function NavBar({

       <div className="flex w-full gap-6 px-4 lg:gap-8 lg:px-8">
         {links.length > 0 && <SidebarNav links={links} activePath={activePath} />}
-        {/* pb-28: ruang di bawah konten supaya bottom nav + tombol chat
-            mengambang tidak menutupi baris terakhir halaman di HP. */}
-        <div className="min-w-0 flex-1 pb-28 sm:pb-8">{children}</div>
+        {/* pb-28 (HP) / sm:pb-24 (desktop): ruang di bawah konten supaya bottom
+            nav + tombol chat mengambang tidak menutupi baris terakhir halaman. */}
+        <div className="min-w-0 flex-1 pb-28 sm:pb-24">{children}</div>
       </div>

       {links.length > 0 && !hasManyLinks && <MobileBottomNav links={links} activePath={activePath} />}
Ditemukan tapi tidak disentuh: tidak ada
Kendala: tidak ada
```
