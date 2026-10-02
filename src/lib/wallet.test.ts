import { describe, expect, it, vi } from "vitest";

const onSessionAttended = vi.fn();
const onSessionUnattended = vi.fn();
vi.mock("@/lib/affiliate", () => ({
  onSessionAttended: (...a: unknown[]) => onSessionAttended(...a),
  onSessionUnattended: (...a: unknown[]) => onSessionUnattended(...a),
}));

const { creditSessionRevenue, reverseSessionRevenue } = await import("./wallet");
import type { Prisma } from "@/generated/prisma/client";

// Mock minimal buat tx.pool/tx.coachProfile/tx.walletTransaction -- cuma
// method yang beneran dipanggil wallet.ts, bukan seluruh Prisma.TransactionClient.
function createMockTx(overrides?: {
  walletTxns?: unknown[];
  platformSums?: Record<string, number>;
  // Jumlah baris yang lolos syarat "saldo cukup" (0 = saldo sudah dicairkan).
  poolReversible?: number;
  coachReversible?: number;
}) {
  return {
    pool: {
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
        { type: "PLATFORM_REVENUE", amount: -12555, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: -1507, bookingId: "booking-1" },
      ],
    });
  });

  it("reverses the amount that was actually credited, not a freshly recomputed one", async () => {
    // Harga (atau persen model lama) bisa berubah SETELAH kredit awal;
    // reversal tetep harus balikin angka LAMA (dari ledger), bukan hitung
    // ulang -- tesnya: ledger berisi angka yang beda dari hitungan ulang.
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

  it("reverses the net credited amount, not a leftover negative row, after repeated toggles", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563 },
      ],
      platformSums: { SESSION_REVENUE: 28125, SESSION_PAYOUT: 51563 },
    });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 28125 } },
    });
  });

  it("does nothing when the booking has no net credit left", async () => {
    const tx = createMockTx({ walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 0 }] });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  // Keputusan Hadi 29 Sep (menggantikan D3): pembalikan tidak ditolak walau
  // uangnya sudah dicairkan -- saldo boleh minus. Pengurangan tanpa syarat
  // saldo (update biasa, bukan updateMany dengan walletBalance >= nominal).
  it("reverses even when the balance was already withdrawn (balance may go negative)", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563 },
      ],
    });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.updateMany).not.toHaveBeenCalled();
    expect(tx.coachProfile.updateMany).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 51563 } },
    });
  });
});

// Model harga-dari-coach (Hadi 2 Okt): bagian tetap per sesi + PPh 0,5%.
function fixedTx({ poolExempt = false, coachExempt = false, rows = [] as { type: string; amount: number; poolId?: string; coachProfileId?: string }[] } = {}) {
  const match = (r: (typeof rows)[number], where: Record<string, unknown>) =>
    r.type === where.type &&
    (!("poolId" in where) || (typeof where.poolId === "string" ? r.poolId === where.poolId : !!r.poolId)) &&
    (!("coachProfileId" in where) || (typeof where.coachProfileId === "string" ? r.coachProfileId === where.coachProfileId : !!r.coachProfileId));
  return {
    pool: { findUniqueOrThrow: vi.fn().mockResolvedValue({ pphExempt: poolExempt }), update: vi.fn() },
    coachProfile: { findUniqueOrThrow: vi.fn().mockResolvedValue({ pphExempt: coachExempt }), update: vi.fn() },
    walletTransaction: {
      createMany: vi.fn(),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => rows.find((r) => match(r, where)) ?? null),
      aggregate: vi.fn(async ({ where }: { where: Record<string, unknown> }) => ({
        _sum: { amount: rows.filter((r) => match(r, where)).reduce((n, r) => n + r.amount, 0) },
      })),
    },
  } as unknown as Prisma.TransactionClient;
}
const pricing = { paid: 1_363_200, totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000 };

describe("creditSessionRevenue model harga-dari-coach", () => {
  it("hadir: kolam 60.000, coach 100.000, masing-masing dipotong PPh 0,5%; SPH 10.400", async () => {
    onSessionAttended.mockClear();
    const tx = fixedTx();
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b", pricing });
    expect(tx.pool.update).toHaveBeenCalledWith({ where: { id: "p" }, data: { walletBalance: { increment: 59_700 } } });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({ where: { id: "c" }, data: { walletBalance: { increment: 99_500 } } });
    const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data).toEqual([
      { type: "SESSION_REVENUE", poolId: "p", amount: 60_000, bookingId: "b" },
      { type: "PPH_WITHHELD", poolId: "p", amount: -300, bookingId: "b" },
      { type: "SESSION_PAYOUT", coachProfileId: "c", amount: 100_000, bookingId: "b" },
      { type: "PPH_WITHHELD", coachProfileId: "c", amount: -500, bookingId: "b" },
      { type: "PLATFORM_REVENUE", amount: 9_369, bookingId: "b" },
      { type: "PLATFORM_TAX", amount: 1_031, bookingId: "b" },
    ]);
    // Uang tidak tercipta/hilang: kolam + coach + SPH = nilai sesi.
    expect(data.filter((r: { type: string }) => r.type !== "PPH_WITHHELD").reduce((n: number, r: { amount: number }) => n + r.amount, 0)).toBe(170_400);
    expect(onSessionAttended).toHaveBeenCalledOnce();
  });

  it("bebas potongan: tidak ada baris PPh", async () => {
    const tx = fixedTx({ poolExempt: true, coachExempt: true });
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b", pricing });
    const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data.some((r: { type: string }) => r.type === "PPH_WITHHELD")).toBe(false);
    expect(tx.pool.update).toHaveBeenCalledWith({ where: { id: "p" }, data: { walletBalance: { increment: 60_000 } } });
  });

  it("tidak hadir: kolam tidak disentuh, coach 50.000 - PPh 250, sisanya SPH", async () => {
    onSessionAttended.mockClear();
    const tx = fixedTx();
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b", attended: false, pricing });
    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).toHaveBeenCalledWith({ where: { id: "c" }, data: { walletBalance: { increment: 49_750 } } });
    const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data).toEqual([
      { type: "SESSION_PAYOUT", coachProfileId: "c", amount: 50_000, bookingId: "b" },
      { type: "PPH_WITHHELD", coachProfileId: "c", amount: -250, bookingId: "b" },
      { type: "PLATFORM_REVENUE", amount: 108_468, bookingId: "b" },
      { type: "PLATFORM_TAX", amount: 11_932, bookingId: "b" },
    ]);
    expect(onSessionAttended).not.toHaveBeenCalled();
  });
});

describe("hook afiliasi", () => {
  it("sesi Hadir memicu hitungan komisi; Tidak Hadir tidak", async () => {
    onSessionAttended.mockClear();
    const tx = fixedTx();
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b1", pricing });
    expect(onSessionAttended).toHaveBeenCalledWith(tx, "b1");
    onSessionAttended.mockClear();
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b2", attended: false, pricing });
    expect(onSessionAttended).not.toHaveBeenCalled();
  });

  it("pembalikan sesi memberi tahu afiliasi", async () => {
    onSessionUnattended.mockClear();
    const tx = createMockTx();
    await reverseSessionRevenue(tx, { bookingId: "b1" });
    expect(onSessionUnattended).toHaveBeenCalledWith(tx, "b1");
  });
});

describe("creditSessionRevenue: uang tidak tercipta/hilang", () => {
  it("kolam + coach + SPH = nilai sesi, tanpa baris negatif selain PPh, di berbagai harga", async () => {
    for (const p of [
      { paid: 596_400, totalSesi: 4, poolPrice: 260_000, coachPrice: 300_000 },
      { paid: 1_363_200, totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000 },
      { paid: 7, totalSesi: 4, poolPrice: 3, coachPrice: 3 },
      { paid: 999_999, totalSesi: 8, poolPrice: 333_333, coachPrice: 600_001 },
    ]) {
      for (const attended of [true, false]) {
        const tx = fixedTx();
        await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b", attended, pricing: p });
        const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data as { type: string; amount: number }[];
        const nonPph = data.filter((r) => r.type !== "PPH_WITHHELD");
        expect({ p, attended, sum: nonPph.reduce((n, r) => n + r.amount, 0), negative: nonPph.some((r) => r.amount < 0) }).toEqual({
          p,
          attended,
          sum: Math.floor(p.paid / p.totalSesi),
          negative: false,
        });
      }
    }
  });
});

describe("reverseSessionRevenue model harga-dari-coach", () => {
  it("mengembalikan potongan PPh ke dompet yang dipotong", async () => {
    const tx = fixedTx({
      rows: [
        { type: "SESSION_REVENUE", amount: 60_000, poolId: "p" },
        { type: "PPH_WITHHELD", amount: -300, poolId: "p" },
        { type: "SESSION_PAYOUT", amount: 100_000, coachProfileId: "c" },
        { type: "PPH_WITHHELD", amount: -500, coachProfileId: "c" },
        { type: "PLATFORM_REVENUE", amount: 9_369 },
        { type: "PLATFORM_TAX", amount: 1_031 },
      ],
    });
    (tx.pool as unknown as { update: ReturnType<typeof vi.fn> }).update.mockResolvedValue({});
    await reverseSessionRevenue(tx, { bookingId: "b" });
    const poolCalls = (tx.pool.update as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].data.walletBalance);
    const coachCalls = (tx.coachProfile.update as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].data.walletBalance);
    // Bersih: kolam -60.000 + 300 = -59.700; coach -100.000 + 500 = -99.500.
    const net = (calls: { increment?: number; decrement?: number }[]) => calls.reduce((n, c) => n + (c.increment ?? 0) - (c.decrement ?? 0), 0);
    expect(net(poolCalls)).toBe(-59_700);
    expect(net(coachCalls)).toBe(-99_500);
    const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data).toEqual(
      expect.arrayContaining([
        { type: "PPH_WITHHELD", poolId: "p", amount: 300, bookingId: "b" },
        { type: "PPH_WITHHELD", coachProfileId: "c", amount: 500, bookingId: "b" },
        { type: "PLATFORM_REVENUE", amount: -9_369, bookingId: "b" },
      ])
    );
  });
});
