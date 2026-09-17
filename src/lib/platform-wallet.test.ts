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

beforeEach(() => {
  vi.clearAllMocks();
  groupBy.mockResolvedValue([
    { type: "PLATFORM_REVENUE", _sum: { amount: 100_000 } },
    { type: "PLATFORM_TAX", _sum: { amount: 12_000 } },
  ]);
  aggregate.mockResolvedValue({ _sum: { revenueAmount: 30_000, taxAmount: 2_000 } });
});

describe("platform wallet", () => {
  it("balance = ledger credits minus withdrawals, per bucket", async () => {
    expect(await getPlatformBalance()).toEqual({ revenue: 70_000, tax: 10_000 });
  });

  it("withdraws revenue only when tax is not included", async () => {
    await withdrawPlatformBalance({ adminId: "a1", revenueAmount: 50_000, includeTax: false, note: null });
    expect(create).toHaveBeenCalledWith({ data: { revenueAmount: 50_000, taxAmount: 0, note: null, createdById: "a1" } });
  });

  it("adds the whole tax balance when included", async () => {
    await withdrawPlatformBalance({ adminId: "a1", revenueAmount: 0, includeTax: true, note: "setor PPN" });
    expect(create).toHaveBeenCalledWith({ data: { revenueAmount: 0, taxAmount: 10_000, note: "setor PPN", createdById: "a1" } });
  });

  it("refuses more than the revenue balance", async () => {
    await expect(withdrawPlatformBalance({ adminId: "a1", revenueAmount: 70_001, includeTax: false, note: null })).rejects.toThrow("melebihi");
    expect(create).not.toHaveBeenCalled();
  });
});
