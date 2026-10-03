// Syarat coach tampil sebelum dibeli (Hadi 3 Okt): minimal 4 jam kosong yang
// bisa dibooking di kolam itu dalam 14 hari ke depan. Kartu coach menampilkan
// "Jadwal terdekat". Dicek ulang di server saat checkout dan ganti coach tanpa
// biaya (tampilan bisa basi).
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withinPoolHours } from "@/lib/pool-hours";

export const MIN_OPEN_SLOTS = 4;
export const OPEN_SLOT_WINDOW_DAYS = 14;

type Db = Prisma.TransactionClient | typeof prisma;
export type OpenSlotStat = { count: number; nearest: Date | null };

export const pairKey = (coachId: string, poolId: string) => `${coachId}:${poolId}`;

// Jam kosong (AVAILABLE, belum lewat, di dalam jam buka kolam) per pasangan
// coach-kolam dalam 14 hari ke depan.
export async function openSlotStats(pairs: { coachId: string; poolId: string }[], now = new Date(), db: Db = prisma) {
  const stats = new Map<string, OpenSlotStat>();
  if (pairs.length === 0) return stats;
  const until = new Date(now.getTime() + OPEN_SLOT_WINDOW_DAYS * 86_400_000);
  const slots = await db.availability.findMany({
    where: {
      status: "AVAILABLE",
      startTime: { gt: now, lte: until },
      coachId: { in: [...new Set(pairs.map((p) => p.coachId))] },
      poolId: { in: [...new Set(pairs.map((p) => p.poolId))] },
    },
    orderBy: { startTime: "asc" },
    select: { coachId: true, poolId: true, startTime: true, endTime: true, pool: { select: { openTime: true, closeTime: true } } },
  });
  for (const s of slots) {
    if (!withinPoolHours(s.pool, s.startTime, s.endTime)) continue;
    const key = pairKey(s.coachId, s.poolId);
    const cur = stats.get(key) ?? { count: 0, nearest: null };
    stats.set(key, { count: cur.count + 1, nearest: cur.nearest ?? s.startTime });
  }
  return stats;
}

export function meetsOpenSlotRule(stat: OpenSlotStat | undefined) {
  return (stat?.count ?? 0) >= MIN_OPEN_SLOTS;
}

export async function coachMeetsOpenSlotRule(coachId: string, poolId: string, now = new Date(), db: Db = prisma) {
  return meetsOpenSlotRule((await openSlotStats([{ coachId, poolId }], now, db)).get(pairKey(coachId, poolId)));
}
