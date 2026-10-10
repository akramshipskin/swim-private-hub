import { timingSafeEqual } from "node:crypto";
import { runCoachSlotWatch } from "@/lib/coach-slot-watch";
import { purgeOldNotifications } from "@/lib/notifications";
import { releaseStalePayments } from "@/lib/stale-payments";
import { releaseDueCommissions } from "@/lib/affiliate";

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
  // Penjaga jadwal paling dulu (paling penting; pekerjaan di bawahnya bisa lambat).
  // Gagal di sini tidak boleh menghentikan pekerjaan lain (TRD T2).
  const watch = await runCoachSlotWatch().catch((err: unknown) => {
    console.error(`[cron] penjaga jadwal gagal: ${(err as Error)?.message ?? "error"}`);
    return null;
  });
  // Riwayat lonceng lebih dari 90 hari dihapus (Hadi 4 Okt). Gagal hapus
  // tidak menggagalkan pekerjaan lain.
  const notificationsPurged = await purgeOldNotifications().catch((err: unknown) => {
    console.error(`[cron] gagal membersihkan notifikasi lama: ${(err as Error)?.message ?? "error"}`);
    return null;
  });
  // Pembayaran "Menunggu" yang lewat batas 24 jam dikedaluwarsakan (Hadi 6 Okt).
  const paymentsExpired = await releaseStalePayments().catch((err: unknown) => {
    console.error(`[cron] gagal mengedaluwarsakan pembayaran: ${(err as Error)?.message ?? "error"}`);
    return null;
  });
  // Komisi afiliasi yang lewat masa tunggu dicairkan tiap hari, tidak menunggu
  // halaman dibuka (TRD T3).
  const commissionsReleased = await releaseDueCommissions().catch((err: unknown) => {
    console.error(`[cron] gagal mencairkan komisi afiliasi: ${(err as Error)?.message ?? "error"}`);
    return null;
  });
  return Response.json({ ok: true, watch, notificationsPurged, paymentsExpired, commissionsReleased });
}
