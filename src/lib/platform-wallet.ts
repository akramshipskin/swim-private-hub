import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

// Saldo platform dihitung dari ledger (tidak ada kolom cache):
// kredit PLATFORM_* per sesi Hadir dikurangi penarikan admin.
export async function getPlatformBalance(db: Db = prisma) {
  const [ledger, withdrawn] = await Promise.all([
    db.walletTransaction.groupBy({
      by: ["type"],
      where: { type: { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] } },
      _sum: { amount: true },
    }),
    db.platformWithdrawal.aggregate({ _sum: { revenueAmount: true, taxAmount: true } }),
  ]);
  const sum = (t: string) => ledger.find((l) => l.type === t)?._sum.amount ?? 0;
  return {
    revenue: sum("PLATFORM_REVENUE") - (withdrawn._sum.revenueAmount ?? 0),
    tax: sum("PLATFORM_TAX") - (withdrawn._sum.taxAmount ?? 0),
  };
}

export class PlatformWithdrawalError extends Error {}

// Tarik saldo pendapatan platform; pajak opsional ikut ditarik seluruhnya.
// Advisory lock biar 2 admin yang menarik bersamaan tidak melebihi saldo.
export async function withdrawPlatformBalance({
  adminId,
  revenueAmount,
  includeTax,
  note,
}: {
  adminId: string;
  revenueAmount: number;
  includeTax: boolean;
  note: string | null;
}) {
  if (!Number.isInteger(revenueAmount) || revenueAmount < 0) {
    throw new PlatformWithdrawalError("Nominal tidak valid.");
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('platform-withdrawal'))`;
    const balance = await getPlatformBalance(tx);
    if (revenueAmount > balance.revenue) {
      throw new PlatformWithdrawalError("Nominal melebihi saldo pendapatan platform.");
    }
    const taxAmount = includeTax ? Math.max(0, balance.tax) : 0;
    if (revenueAmount === 0 && taxAmount === 0) {
      throw new PlatformWithdrawalError("Tidak ada saldo yang ditarik.");
    }
    return tx.platformWithdrawal.create({ data: { revenueAmount, taxAmount, note, createdById: adminId } });
  });
}
