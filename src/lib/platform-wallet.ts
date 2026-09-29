import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { PLATFORM_HOLD_DAYS } from "@/lib/policy";

type Db = Prisma.TransactionClient | typeof prisma;

// Saldo platform dihitung dari ledger (tidak ada kolom cache):
// kredit PLATFORM_* per sesi dikurangi penarikan admin.
//
// revenue/tax = saldo total. availableRevenue/availableTax = yang BOLEH
// ditarik (keputusan Hadi 29 Sep): kredit baru ditahan PLATFORM_HOLD_DAYS
// hari (sama dengan jendela laporan member), sedangkan pengurangan (baris
// negatif: pembalikan, koreksi) langsung dihitung -- jadi angka "boleh
// ditarik" tidak pernah lebih besar dari yang sudah aman.
export async function getPlatformBalance(db: Db = prisma, now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - PLATFORM_HOLD_DAYS * 24 * 60 * 60 * 1000);
  const types = { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] as ("PLATFORM_REVENUE" | "PLATFORM_TAX")[] };
  const [ledger, matured, withdrawn] = await Promise.all([
    db.walletTransaction.groupBy({ by: ["type"], where: { type: types }, _sum: { amount: true } }),
    db.walletTransaction.groupBy({
      by: ["type"],
      where: { type: types, OR: [{ amount: { lt: 0 } }, { createdAt: { lte: cutoff } }] },
      _sum: { amount: true },
    }),
    db.platformWithdrawal.aggregate({ _sum: { revenueAmount: true, taxAmount: true } }),
  ]);
  const sum = (rows: typeof ledger, t: string) => rows.find((l) => l.type === t)?._sum.amount ?? 0;
  const wRevenue = withdrawn._sum.revenueAmount ?? 0;
  const wTax = withdrawn._sum.taxAmount ?? 0;
  return {
    revenue: sum(ledger, "PLATFORM_REVENUE") - wRevenue,
    tax: sum(ledger, "PLATFORM_TAX") - wTax,
    availableRevenue: sum(matured, "PLATFORM_REVENUE") - wRevenue,
    availableTax: sum(matured, "PLATFORM_TAX") - wTax,
  };
}

export class PlatformWithdrawalError extends Error {}

// Tarik saldo pendapatan platform; PPN opsional ikut ditarik seluruhnya (untuk
// disetor ke negara). Hanya dari saldo yang sudah lewat masa tahan. Bukti
// transfer wajib (keputusan Hadi 29 Sep). Advisory lock biar 2 admin yang
// menarik bersamaan tidak melebihi saldo.
export async function withdrawPlatformBalance({
  adminId,
  revenueAmount,
  includeTax,
  note,
  transferReference,
}: {
  adminId: string;
  revenueAmount: number;
  includeTax: boolean;
  note: string | null;
  transferReference: string;
}) {
  if (!Number.isInteger(revenueAmount) || revenueAmount < 0) {
    throw new PlatformWithdrawalError("Nominal tidak valid.");
  }
  const reference = transferReference.trim();
  if (reference.length < 3) {
    throw new PlatformWithdrawalError("Isi nomor referensi / bukti transfer.");
  }
  if (reference.length > 100) {
    throw new PlatformWithdrawalError("Nomor referensi maksimal 100 karakter.");
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('platform-withdrawal'))`;
    const balance = await getPlatformBalance(tx);
    if (revenueAmount > balance.availableRevenue) {
      throw new PlatformWithdrawalError(
        `Nominal melebihi saldo pendapatan yang sudah boleh ditarik (dana sesi ditahan ${PLATFORM_HOLD_DAYS} hari).`
      );
    }
    const taxAmount = includeTax ? Math.max(0, balance.availableTax) : 0;
    if (revenueAmount === 0 && taxAmount === 0) {
      throw new PlatformWithdrawalError("Tidak ada saldo yang ditarik.");
    }
    return tx.platformWithdrawal.create({
      data: { revenueAmount, taxAmount, note, transferReference: reference, createdById: adminId },
    });
  });
}
