import { timingSafeEqual } from "node:crypto";

// Vercel Cron mengirim "Authorization: Bearer <CRON_SECRET>". Tanpa CRON_SECRET
// di Vercel = semua panggilan ditolak (gagal tertutup).
export function cronAuthorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
