import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Klik ganda / 2 tab yang mengirim request persis bersamaan: jalankan fn
// satu per satu per `key` (advisory lock Postgres, lepas saat transaksi
// selesai), jadi cek "sudah ada belum" di dalam fn benar-benar melihat hasil
// request sebelumnya.
export function withDedupeLock<T>(key: string, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    return fn(tx);
  });
}
