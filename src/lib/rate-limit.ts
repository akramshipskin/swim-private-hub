import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";

// IP pengirim. Di Vercel, x-forwarded-for diisi platform (entri pertama =
// klien). Lokal/tes tanpa header -> "unknown" (semua dihitung satu ember).
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

// Catat 1 percobaan untuk `key` KALAU masih di bawah batas dalam jendela
// waktu. Hitung + catat terjadi di bawah kunci per-key, jadi 10 request
// barengan tidak bisa lolos semua karena sama-sama melihat hitungan lama.
// Mengembalikan id catatan (untuk dihapus kalau percobaan ternyata tidak perlu
// dihitung, mis. login berhasil) atau null kalau sudah mentok batas.
export async function takeAttempt(key: string, limit: number, windowMs: number): Promise<string | null> {
  const id = await withDedupeLock(`rate:${key}`, async (tx) => {
    const since = new Date(Date.now() - windowMs);
    const used = await tx.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
    if (used >= limit) return null;
    const hit = await tx.rateLimitHit.create({ data: { key }, select: { id: true } });
    return hit.id;
  });
  // ponytail: bersih-bersih catatan lama secara acak (~1 dari 50 panggilan),
  // bukan cron. Batas atas: tabel menyimpan <= 1 hari percobaan. Kalau trafik
  // besar, pindahkan ke job terjadwal.
  if (Math.random() < 0.02) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
  }
  return id;
}

export async function forgetAttempts(where: { ids?: string[]; key?: string }) {
  if (where.ids?.length) await prisma.rateLimitHit.deleteMany({ where: { id: { in: where.ids } } });
  if (where.key) await prisma.rateLimitHit.deleteMany({ where: { key: where.key } });
}

// Kebijakan (keputusan Hadi 25 Sep): 3x salah login per akun+jaringan -> tunggu 15 menit.
export const LOGIN_FAILS_PER_ACCOUNT = 3;
// Satu jaringan menebak banyak akun sekaligus (credential stuffing).
export const LOGIN_FAILS_PER_IP = 20;
export const LOGIN_WINDOW_MS = 15 * 60_000;
// Pendaftaran per jaringan per jam. Member longgar (wifi kolam saat acara
// pendaftaran bisa dipakai banyak orang tua), coach/pemilik kolam ketat.
export const REGISTER_MEMBER_PER_IP = 10;
export const REGISTER_STAFF_PER_IP = 3;
export const REGISTER_WINDOW_MS = 60 * 60_000;

export const RATE_LIMIT_REGISTER_ERROR = "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi 1 jam lagi.";
