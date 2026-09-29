import { describe, expect, it, vi, beforeEach } from "vitest";

const groupBy = vi.fn();
const queryRaw = vi.fn();
const aggregate = vi.fn();
const create = vi.fn().mockResolvedValue({ id: "pw-1" });
const tx = {
  $executeRaw: vi.fn(),
  $queryRaw: queryRaw,
  walletTransaction: { groupBy },
  platformWithdrawal: { aggregate, create },
};
vi.mock("@/lib/prisma", () => ({ prisma: { ...tx, $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } }));

const { getPlatformBalance, withdrawPlatformBalance } = await import("./platform-wallet");

// groupBy = total semua baris; $queryRaw = yang sudah boleh ditarik (matang,
// dihitung per sesi di SQL -- logika FIFO-nya diuji di tests/race/platform).
function ledger(all: [number, number], matured: [number, number]) {
  groupBy.mockResolvedValueOnce([
    { type: "PLATFORM_REVENUE", _sum: { amount: all[0] } },
    { type: "PLATFORM_TAX", _sum: { amount: all[1] } },
  ]);
  queryRaw.mockResolvedValueOnce([
    { type: "PLATFORM_REVENUE", total: matured[0] },
    { type: "PLATFORM_TAX", total: matured[1] },
  ]);
}

const base = { adminId: "a1", note: null, transferReference: "REF123" };

beforeEach(() => {
  vi.clearAllMocks();
  groupBy.mockReset();
  queryRaw.mockReset();
  ledger([100_000, 12_000], [100_000, 12_000]);
  aggregate.mockResolvedValue({ _sum: { revenueAmount: 30_000, taxAmount: 2_000 } });
});

describe("platform wallet", () => {
  it("balance = ledger credits minus withdrawals, per bucket, total dan yang boleh ditarik", async () => {
    groupBy.mockReset();
    queryRaw.mockReset();
    ledger([100_000, 12_000], [60_000, 7_000]);
    expect(await getPlatformBalance()).toEqual({ revenue: 70_000, tax: 10_000, availableRevenue: 30_000, availableTax: 5_000 });
  });

  it("batas 'matang' = sekarang dikurangi 3 hari, dikirim sebagai parameter SQL", async () => {
    const now = new Date("2026-10-10T00:00:00Z");
    await getPlatformBalance(undefined, now);
    const [, ...params] = queryRaw.mock.calls[0];
    expect(params.length).toBeGreaterThan(0);
    for (const p of params) expect(p).toEqual(new Date("2026-10-07T00:00:00Z"));
  });

  it("bucket tanpa baris matang dihitung 0, dan penarikan lama tetap mengurangi", async () => {
    groupBy.mockReset();
    queryRaw.mockReset();
    groupBy.mockResolvedValueOnce([]);
    queryRaw.mockResolvedValueOnce([]);
    expect(await getPlatformBalance()).toEqual({ revenue: -30_000, tax: -2_000, availableRevenue: -30_000, availableTax: -2_000 });
  });

  it("withdraws revenue only when tax is not included, with transfer reference", async () => {
    await withdrawPlatformBalance({ ...base, revenueAmount: 50_000, includeTax: false });
    expect(create).toHaveBeenCalledWith({
      data: { revenueAmount: 50_000, taxAmount: 0, note: null, transferReference: "REF123", createdById: "a1" },
    });
  });

  it("adds the whole available tax balance when included", async () => {
    await withdrawPlatformBalance({ ...base, revenueAmount: 0, includeTax: true, note: "setor PPN" });
    expect(create).toHaveBeenCalledWith({
      data: { revenueAmount: 0, taxAmount: 10_000, note: "setor PPN", transferReference: "REF123", createdById: "a1" },
    });
  });

  it("refuses more than the available (matured) revenue, even if the total is enough", async () => {
    groupBy.mockReset();
    queryRaw.mockReset();
    ledger([100_000, 12_000], [60_000, 12_000]); // tersedia 30.000, total 70.000
    await expect(withdrawPlatformBalance({ ...base, revenueAmount: 30_001, includeTax: false })).rejects.toThrow("ditahan 3 hari");
    expect(create).not.toHaveBeenCalled();
  });

  it("wajib bukti transfer", async () => {
    await expect(withdrawPlatformBalance({ ...base, transferReference: "  ", revenueAmount: 1_000, includeTax: false })).rejects.toThrow("bukti transfer");
    expect(create).not.toHaveBeenCalled();
  });
});
