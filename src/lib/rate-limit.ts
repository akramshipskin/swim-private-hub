import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";

// IP pengirim. Di Vercel, x-forwarded-for diisi platform (entri pertama =
// klien). Lokal/tes tanpa header -> "unknown" (semua dihitung satu ember).
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

// Kunci yang disimpan. Kunci memuat teks dari pengguna (mis. identitas login),
// jadi bisa sangat panjang: tes 1 Okt menyimpan baris 5.077 karakter. Kunci di
// atas MAX_KEY dipotong + ditambah sidik jari SHA-256 supaya tetap unik per teks
// asli tetapi panjangnya terbatas.
export const MAX_KEY = 200;
export function storedKey(key: string): string {
  if (key.length <= MAX_KEY) return key;
  return `${key.slice(0, 100)}#${createHash("sha256").update(key).digest("hex")}`;
}

// Catat 1 percobaan untuk `key` KALAU masih di bawah batas dalam jendela
// waktu. Hitung + catat terjadi di bawah kunci per-key, jadi 10 request
// barengan tidak bisa lolos semua karena sama-sama melihat hitungan lama.
// Mengembalikan id catatan (untuk dihapus kalau percobaan ternyata tidak perlu
// dihitung, mis. login berhasil) atau null kalau sudah mentok batas.
export async function takeAttempt(rawKey: string, limit: number, windowMs: number): Promise<string | null> {
  const key = storedKey(rawKey);
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

// Berapa detik lagi `key` boleh mencoba, dihitung saat takeAttempt baru saja
// menolak (hitungan sudah >= limit). Batas terbuka lagi begitu percobaan ke-
// `limit` dari yang terbaru keluar dari jendela waktu. Minimal 1 detik.
export async function lockRemainingSeconds(rawKey: string, limit: number, windowMs: number): Promise<number> {
  const key = storedKey(rawKey);
  const since = new Date(Date.now() - windowMs);
  const hits = await prisma.rateLimitHit.findMany({
    where: { key, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { createdAt: true },
  });
  const pivot = hits[limit - 1];
  if (!pivot) return 1;
  return Math.max(1, Math.ceil((pivot.createdAt.getTime() + windowMs - Date.now()) / 1000));
}

export async function forgetAttempts(where: { ids?: string[]; key?: string }) {
  if (where.ids?.length) await prisma.rateLimitHit.deleteMany({ where: { id: { in: where.ids } } });
  if (where.key) await prisma.rateLimitHit.deleteMany({ where: { key: storedKey(where.key) } });
}

// Kebijakan (Hadi 2 Okt, menggantikan "3x per akun" 30 Sep): 3x salah per AKUN
// dari JARINGAN yang sama -> jaringan itu tunggu 15 menit untuk akun itu (ada
// hitung mundur di layar login). Dari semua jaringan digabung, akun baru
// terkunci setelah 10x salah, supaya orang asing tidak mudah mengunci akun
// orang lain (termasuk admin).
export const LOGIN_FAILS_PER_ACCOUNT_NETWORK = 3;
export const LOGIN_FAILS_PER_ACCOUNT = 10;
// Konfirmasi password saat sudah masuk (pasang/lepas 2FA di /keamanan): tetap
// 3x / 15 menit. Yang bisa mencoba di sini hanya pemegang sesi akun itu.
export const PASSWORD_CONFIRM_FAILS = 3;
// Satu jaringan menebak banyak akun sekaligus (credential stuffing).
export const LOGIN_FAILS_PER_IP = 20;
export const LOGIN_WINDOW_MS = 15 * 60_000;
// Pendaftaran per jaringan per jam. Member longgar (wifi kolam saat acara
// pendaftaran bisa dipakai banyak orang tua), coach/pemilik kolam ketat.
export const REGISTER_MEMBER_PER_IP = 10;
export const REGISTER_STAFF_PER_IP = 3;
export const REGISTER_WINDOW_MS = 60 * 60_000;
// Cek "nomor/email sudah terdaftar" per jaringan (TRD T16): membatasi orang
// yang mencoba-coba nomor HP untuk tahu siapa yang terdaftar.
export const REGISTER_PROBE_PER_IP = 10;

export const RATE_LIMIT_REGISTER_ERROR = "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam 1 jam.";
