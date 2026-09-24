import { describe, expect, it, vi } from "vitest";
import { creditSessionRevenue, reverseSessionRevenue, ReversalBlockedError } from "./wallet";
import type { Prisma } from "@/generated/prisma/client";

// Mock minimal buat tx.pool/tx.coachProfile/tx.walletTransaction -- cuma
// method yang beneran dipanggil wallet.ts, bukan seluruh Prisma.TransactionClient.
function createMockTx(overrides?: {
  pool?: { commissionPercent: number; coachSharePercent: number };
  walletTxns?: unknown[];
  platformSums?: Record<string, number>;
  // Jumlah baris yang lolos syarat "saldo cukup" (0 = saldo sudah dicairkan).
  poolReversible?: number;
  coachReversible?: number;
}) {
  const pool = overrides?.pool ?? { commissionPercent: 15, coachSharePercent: 55 };
  return {
    pool: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(pool),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: overrides?.poolReversible ?? 1 }),
    },
    coachProfile: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: overrides?.coachReversible ?? 1 }),
    },
    walletTransaction: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      aggregate: vi.fn(async ({ where }: { where: { type: string } }) => ({
        _sum: {
          amount:
            overrides?.platformSums?.[where.type] ??
            ((overrides?.walletTxns ?? []) as { type: string; amount: number }[])
              .filter((t) => t.type === where.type)
              .reduce((n, t) => n + t.amount, 0),
        },
      })),
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
        { type: "PLATFORM_REVENUE", amount: 12555, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: 1507, bookingId: "booking-1" },
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
    // Platform = sisa setelah kolam & coach, jadi total baris = nilai sesi utuh.
    expect(total).toBe(93750);
  });

  it("tidak pernah kehilangan atau menciptakan rupiah, berapa pun harga & persennya", async () => {
    // Pembulatan tiap bagian bisa meleset 1 rupiah, tapi bagian platform =
    // sisa, jadi jumlah semua baris ledger harus persis nilai sesi.
    for (const perSessionValue of [93_750, 112_500, 100_000, 133_333, 1, 7, 999_999]) {
      for (const [commissionPercent, coachSharePercent] of [
        [15, 55],
        [10, 60],
        [0, 100],
        // Regression: komisi 0% + coach 50% -> coach & kolam sama-sama
        // dibulatkan ke atas, dulu total kredit > nilai sesi (+Rp1).
        [0, 50],
        [33, 33],
        [12, 45],
      ]) {
        const tx = createMockTx({ pool: { commissionPercent, coachSharePercent } });
        await creditSessionRevenue(tx, {
          poolId: "pool-1",
          coachProfileId: "coach-1",
          bookingId: "booking-1",
          perSessionValue,
        });
        const call = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
        const total = call.data.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);
        expect({ perSessionValue, commissionPercent, coachSharePercent, total }).toEqual({
          perSessionValue,
          commissionPercent,
          coachSharePercent,
          total: perSessionValue,
        });
      }
    }
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
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: 13393, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: 1607, bookingId: "booking-1" },
      ],
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
      platformSums: { SESSION_REVENUE: 28125, SESSION_PAYOUT: 51563, PLATFORM_REVENUE: 12555, PLATFORM_TAX: 1507 },
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.updateMany).toHaveBeenCalledWith({
      where: { id: "pool-1", walletBalance: { gte: 28125 } },
      data: { walletBalance: { decrement: 28125 } },
    });
    expect(tx.coachProfile.updateMany).toHaveBeenCalledWith({
      where: { id: "coach-1", walletBalance: { gte: 51563 } },
      data: { walletBalance: { decrement: 51563 } },
    });
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125, bookingId: "booking-1" },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: -12555, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: -1507, bookingId: "booking-1" },
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

    expect(tx.pool.updateMany).toHaveBeenCalledWith({
      where: { id: "pool-1", walletBalance: { gte: 999 } },
      data: { walletBalance: { decrement: 999 } },
    });
    expect(tx.coachProfile.updateMany).toHaveBeenCalledWith({
      where: { id: "coach-1", walletBalance: { gte: 111 } },
      data: { walletBalance: { decrement: 111 } },
    });
  });

  it("does nothing when no matching SESSION_REVENUE ledger row exists", async () => {
    const tx = createMockTx({ walletTxns: [] });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.updateMany).not.toHaveBeenCalled();
    expect(tx.coachProfile.updateMany).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  it("still reverses the pool share when the coach payout row is missing (coachAmount was 0)", async () => {
    const tx = createMockTx({
      walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000 }],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.updateMany).toHaveBeenCalledWith({
      where: { id: "pool-1", walletBalance: { gte: 85000 } },
      data: { walletBalance: { decrement: 85000 } },
    });
    expect(tx.coachProfile.updateMany).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: -85000, bookingId: "booking-1" }],
    });
  });

  it("reverses the net credited amount, not a leftover negative row, after repeated toggles", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563 },
      ],
      platformSums: { SESSION_REVENUE: 28125, SESSION_PAYOUT: 51563 },
    });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.updateMany).toHaveBeenCalledWith({
      where: { id: "pool-1", walletBalance: { gte: 28125 } },
      data: { walletBalance: { decrement: 28125 } },
    });
  });

  it("does nothing when the booking has no net credit left", async () => {
    const tx = createMockTx({ walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 0 }] });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.updateMany).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  // D3 (keputusan Hadi 24 Sep): saldo tidak boleh minus karena Hadir dibatalkan
  // setelah uangnya dicairkan.
  it("refuses (and writes no ledger rows) when the coach balance no longer covers the reversal", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563 },
      ],
      coachReversible: 0,
    });
    await expect(reverseSessionRevenue(tx, { bookingId: "booking-1" })).rejects.toBeInstanceOf(ReversalBlockedError);
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  it("refuses when the pool balance no longer covers the reversal", async () => {
    const tx = createMockTx({ walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000 }], poolReversible: 0 });
    await expect(reverseSessionRevenue(tx, { bookingId: "booking-1" })).rejects.toBeInstanceOf(ReversalBlockedError);
  });
});
