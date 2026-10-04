import { prisma } from "@/lib/prisma";

// Lonceng notifikasi dalam aplikasi (Hadi 4 Okt). Baris diisi oleh schedule()
// di src/lib/push.ts; berkas ini hanya membaca, menandai dibaca, dan membersihkan.
// Semua query memakai userId dari sesi di WHERE -- pengguna tidak pernah bisa
// membaca atau menandai notifikasi milik orang lain, walau id-nya ditebak.

export const NOTIFICATION_LIST_LIMIT = 50;
export const NOTIFICATION_RETENTION_DAYS = 90;
// Lencana menampilkan "9+" di atas 9, jadi cukup menghitung sampai 10.
export const UNREAD_BADGE_CAP = 10;

type SessionLike = {
  user?: {
    id?: string;
    mustChangePassword?: boolean;
    needsTotpSetup?: boolean;
    needsPartnerAgreement?: boolean;
  };
} | null;

// Gerbang akun yang sama dengan proxy.ts/requireRole, untuk semua peran.
// Hasil: userId bila boleh, atau ke mana pengguna harus diarahkan.
export function notificationGate(session: SessionLike): { userId: string } | { redirectTo: string } {
  const user = session?.user;
  if (!user?.id) return { redirectTo: "/login" };
  if (user.mustChangePassword) return { redirectTo: "/ganti-password" };
  if (user.needsTotpSetup) return { redirectTo: "/keamanan" };
  if (user.needsPartnerAgreement) return { redirectTo: "/perjanjian" };
  return { userId: user.id };
}

export function countUnread(userId: string) {
  return prisma.inAppNotification.count({ where: { userId, readAt: null }, take: UNREAD_BADGE_CAP });
}

export function listNotifications(userId: string) {
  return prisma.inAppNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATION_LIST_LIMIT,
    select: { id: true, title: true, body: true, url: true, readAt: true, createdAt: true },
  });
}

// Mengembalikan url tujuan bila notifikasi itu milik userId, null bila bukan
// (atau tidak ada). Yang sudah dibaca tetap boleh dibuka lagi.
export async function markRead(userId: string, id: string): Promise<{ found: false } | { found: true; url: string | null }> {
  const row = await prisma.inAppNotification.findFirst({ where: { id, userId }, select: { url: true, readAt: true } });
  if (!row) return { found: false };
  if (!row.readAt) {
    await prisma.inAppNotification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }
  return { found: true, url: safeInternalUrl(row.url) };
}

export async function markAllRead(userId: string) {
  const { count } = await prisma.inAppNotification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  return count;
}

export async function purgeOldNotifications(now = new Date()) {
  const cutoff = new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * 86_400_000);
  const { count } = await prisma.inAppNotification.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}

// Hanya alamat di dalam aplikasi ("/member/..."), bukan situs lain ("//x.com", "https://...").
export function safeInternalUrl(url: string | null | undefined) {
  return url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : null;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Waktu relatif bahasa Indonesia baku. Lewat 7 hari: tanggal kalender WIB.
export function formatRelativeTime(d: Date, now = new Date()) {
  const diff = now.getTime() - d.getTime();
  if (diff < MINUTE) return "Baru saja";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} menit yang lalu`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} jam yang lalu`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} hari yang lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

// Waktu lengkap untuk keterangan (title / dateTime), selalu WIB.
export function formatFullTimeWib(d: Date) {
  const date = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  return `${date} pukul ${time} WIB`;
}
