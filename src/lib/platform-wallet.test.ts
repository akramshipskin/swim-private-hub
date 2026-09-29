import { describe, expect, it, vi, beforeEach } from "vitest";

const groupBy = vi.fn();
const aggregate = vi.fn();
const create = vi.fn().mockResolvedValue({ id: "pw-1" });
const tx = {
  $executeRaw: vi.fn(),
  walletTransaction: { groupBy },
  platformWithdrawal: { aggregate, create },
};
vi.mock("@/lib/prisma", () => ({ prisma: { ...tx, $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } }));

const { getPlatformBalance, withdrawPlatformBalance } = await import("./platform-wallet");

// groupBy dipanggil 2x: [0] semua baris, [1] hanya yang sudah matang
// (lewat masa tahan) atau negatif.
function ledger(all: [number, number], matured: [number, number]) {
  groupBy
    .mockResolvedValueOnce([
      { type: "PLATFORM_REVENUE", _sum: { amount: all[0] } },
      { type: "PLATFORM_TAX", _sum: { amount: all[1] } },
    ])
    .mockResolvedValueOnce([
      { type: "PLATFORM_REVENUE", _sum: { amount: matured[0] } },
      { type: "PLATFORM_TAX", _sum: { amount: matured[1] } },
    ]);
}

const base = { adminId: "a1", note: null, transferReference: "REF123" };

beforeEach(() => {
  vi.clearAllMocks();
  groupBy.mockReset();
  ledger([100_000, 12_000], [100_000, 12_000]);
  aggregate.mockResolvedValue({ _sum: { revenueAmount: 30_000, taxAmount: 2_000 } });
});

describe("platform wallet", () => {
  it("balance = ledger credits minus withdrawals, per bucket, total dan yang boleh ditarik", async () => {
    groupBy.mockReset();
    ledger([100_000, 12_000], [60_000, 7_000]);
    expect(await getPlatformBalance()).toEqual({ revenue: 70_000, tax: 10_000, availableRevenue: 30_000, availableTax: 5_000 });
  });

  it("filter 'matang' = baris negatif ATAU lebih tua dari 3 hari", async () => {
    const now = new Date("2026-10-10T00:00:00Z");
    await getPlatformBalance(undefined, now);
    const where = groupBy.mock.calls[1][0].where;
    expect(where.OR).toEqual([{ amount: { lt: 0 } }, { createdAt: { lte: new Date("2026-10-07T00:00:00Z") } }]);
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
    ledger([100_000, 12_000], [60_000, 12_000]); // tersedia 30.000, total 70.000
    await expect(withdrawPlatformBalance({ ...base, revenueAmount: 30_001, includeTax: false })).rejects.toThrow("ditahan 3 hari");
    expect(create).not.toHaveBeenCalled();
  });

  it("wajib bukti transfer", async () => {
    await expect(withdrawPlatformBalance({ ...base, transferReference: "  ", revenueAmount: 1_000, includeTax: false })).rejects.toThrow("bukti transfer");
    expect(create).not.toHaveBeenCalled();
  });
});
