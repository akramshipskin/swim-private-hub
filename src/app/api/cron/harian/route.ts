import { timingSafeEqual } from "node:crypto";
import { runCoachSlotWatch } from "@/lib/coach-slot-watch";
import { purgeOldNotifications } from "@/lib/notifications";

// Pemeriksa harian (Vercel Cron, 06.00 WIB, lihat vercel.json). Vercel mengirim
// "Authorization: Bearer <CRON_SECRET>". Tanpa CRON_SECRET di Vercel = semua
// panggilan ditolak (gagal tertutup), jadi pemeriksa tidak jalan sampai diisi.
function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Riwayat lonceng lebih dari 90 hari dihapus (Hadi 4 Okt). Gagal hapus
  // tidak menggagalkan pemeriksa jadwal di bawah, dan sebaliknya.
  const notificationsPurged = await purgeOldNotifications().catch((err: unknown) => {
    console.error(`[cron] gagal membersihkan notifikasi lama: ${(err as Error)?.message ?? "error"}`);
    return null;
  });
  const watch = await runCoachSlotWatch();
  return Response.json({ ok: true, watch, notificationsPurged });
}
