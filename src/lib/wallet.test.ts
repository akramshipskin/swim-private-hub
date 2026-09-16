import { describe, expect, it, vi } from "vitest";
import { creditSessionRevenue, reverseSessionRevenue } from "./wallet";
import type { Prisma } from "@/generated/prisma/client";

// Mock minimal buat tx.pool/tx.coachProfile/tx.walletTransaction -- cuma
// method yang beneran dipanggil wallet.ts, bukan seluruh Prisma.TransactionClient.
function createMockTx(overrides?: {
  pool?: { commissionPercent: number; coachSharePercent: number };
  walletTxns?: unknown[];
}) {
  const pool = overrides?.pool ?? { commissionPercent: 15, coachSharePercent: 55 };
  return {
    pool: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(pool),
      update: vi.fn().mockResolvedValue({}),
    },
    coachProfile: {
      update: vi.fn().mockResolvedValue({}),
    },
    walletTransaction: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn(async ({ where }: { where: { type: string } }) =>
        (overrides?.walletTxns ?? []).find((t) => (t as { type: string }).type === where.type) ?? null
      ),
    },
  } as unknown as Prisma.TransactionClient;
}

describe("creditSessionRevenue", () => {
  // Regression: nilai ini persis kasus yang diverifikasi live 2026-09-16
  // (booking beneran, payment Rp750.000/8 sesi, kolam commission 15% +
  // coach share 55%) -- pool dapet Rp28.125, coach dapet Rp51.563.
  it("splits perSessionValue by the pool's commission and coach-share percent", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 55 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 93750,
    });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { increment: 28125 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { increment: 51563 } },
    });
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125, bookingId: "booking-1" },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563, bookingId: "booking-1" },
      ],
    });
  });

  it("rounds each share independently (may not sum exactly to perSessionValue)", async () => {
    // 93750 * 55% = 51562.5 -> rounds up to 51563; 93750 * 30% = 28125 exact.
    // Sisa platform implisit = 93750 - 51563 - 28125 = 62, bukan bug --
    // laporan Komisi ngitung ulang dari sumber yang sama, bukan nyimpen ini.
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 55 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 93750,
    });

    const call = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const total = call.data.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);
    expect(total).toBe(28125 + 51563);
  });

  it("skips crediting the coach entirely when coachSharePercent is 0", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 0 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 100000,
    });

    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000, bookingId: "booking-1" }],
    });
  });

  it("credits the pool with 100% minus commission minus coach share, not just 100% minus commission", async () => {
    // Kalo salah rumus (misal lupa kurangin coachSharePercent), pool bakal
    // kekredit lebih dari yang seharusnya -- coach share HARUS keluar dari
    // harga sesi yang sama, bukan dari sisa kolam.
    const tx = createMockTx({ pool: { commissionPercent: 20, coachSharePercent: 40 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 100000,
    });

    // pool = 100% - 20% - 40% = 40% dari 100000 = 40000 (BUKAN 80000 = 100%-20%)
    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { increment: 40000 } },
    });
  });
});

describe("reverseSessionRevenue", () => {
  it("decrements both wallets and writes negated ledger rows matching the original credit", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563 },
      ],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 28125 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 51563 } },
    });
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125, bookingId: "booking-1" },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563, bookingId: "booking-1" },
      ],
    });
  });

  it("reverses the amount that was actually credited, not a freshly recomputed one", async () => {
    // Kalo commissionPercent/coachSharePercent kolam berubah SETELAH kredit
    // awal, reversal tetep harus balikin angka LAMA (dari ledger), bukan
    // hitung ulang pake persentase yang baru -- tesnya: findFirst return
    // amount yang beda dari apa yang bakal keluar kalo dihitung ulang.
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 999 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 111 },
      ],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 999 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 111 } },
    });
  });

  it("does nothing when no matching SESSION_REVENUE ledger row exists", async () => {
    const tx = createMockTx({ walletTxns: [] });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  it("still reverses the pool share when the coach payout row is missing (coachAmount was 0)", async () => {
    const tx = createMockTx({
      walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000 }],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 85000 } },
    });
    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: -85000, bookingId: "booking-1" }],
    });
  });
});
