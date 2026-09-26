import { describe, expect, it, vi, beforeEach } from "vitest";

const create = vi.fn();
const poolUpdate = vi.fn();
const coachUpdate = vi.fn();
const tx = {
  walletTransaction: { create },
  pool: { update: poolUpdate },
  coachProfile: { update: coachUpdate },
};
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } }));

const { createWalletAdjustment, AdjustmentError } = await import("./wallet-adjustment");

const base = { reason: "Sesi 12 Sep salah tercatat Hadir", fromPlatform: false, adminId: "admin-1", idempotencyKey: "k1" };

beforeEach(() => {
  vi.clearAllMocks();
  create.mockResolvedValue({ id: "wt-1" });
});

describe("createWalletAdjustment", () => {
  it("credits a pool: one ledger row with reason + admin, balance incremented", async () => {
    await createWalletAdjustment({ ...base, target: { poolId: "p1" }, amount: 50_000 });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        type: "SESSION_REVENUE",
        poolId: "p1",
        amount: 50_000,
        note: "Sesi 12 Sep salah tercatat Hadir",
        createdById: "admin-1",
        idempotencyKey: "k1",
      },
    });
    expect(poolUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { walletBalance: { increment: 50_000 } } });
    expect(coachUpdate).not.toHaveBeenCalled();
  });

  it("debits a coach without any balance guard (saldo boleh minus)", async () => {
    await createWalletAdjustment({ ...base, target: { coachProfileId: "c1" }, amount: -80_000 });
    expect(create.mock.calls[0][0].data).toMatchObject({ type: "SESSION_PAYOUT", coachProfileId: "c1", amount: -80_000 });
    // update biasa (bukan updateMany dengan walletBalance >= x): tidak ada syarat saldo cukup.
    expect(coachUpdate).toHaveBeenCalledWith({ where: { id: "c1" }, data: { walletBalance: { increment: -80_000 } } });
  });

  it("mirrors the amount on platform revenue when funded by the platform", async () => {
    await createWalletAdjustment({ ...base, fromPlatform: true, target: { coachProfileId: "c1" }, amount: 25_000 });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0]).toEqual({
      data: { type: "PLATFORM_REVENUE", amount: -25_000, note: base.reason, createdById: "admin-1" },
    });
  });

  it("no platform row when it is a plain correction", async () => {
    await createWalletAdjustment({ ...base, target: { poolId: "p1" }, amount: -10_000 });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("trims the reason", async () => {
    await createWalletAdjustment({ ...base, reason: "   kompensasi hujan   ", target: { poolId: "p1" }, amount: 1 });
    expect(create.mock.calls[0][0].data.note).toBe("kompensasi hujan");
  });

  it.each([
    [0, "tidak boleh 0"],
    [1.5, "bulat"],
    [Number.NaN, "bulat"],
    [1_000_000_001, "terlalu besar"],
  ])("rejects amount %s", async (amount, msg) => {
    await expect(createWalletAdjustment({ ...base, target: { poolId: "p1" }, amount })).rejects.toThrow(msg);
    expect(create).not.toHaveBeenCalled();
  });

  it("requires a reason of at least 5 characters", async () => {
    await expect(createWalletAdjustment({ ...base, reason: " ok ", target: { poolId: "p1" }, amount: 1 })).rejects.toBeInstanceOf(AdjustmentError);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an overly long reason", async () => {
    await expect(createWalletAdjustment({ ...base, reason: "x".repeat(501), target: { poolId: "p1" }, amount: 1 })).rejects.toThrow("500");
  });

  it("a duplicate submit (same idempotency key) is a no-op, not an error", async () => {
    create.mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }));
    expect(await createWalletAdjustment({ ...base, target: { poolId: "p1" }, amount: 5_000 })).toBeNull();
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("unknown pool/coach becomes a readable error", async () => {
    poolUpdate.mockRejectedValueOnce(Object.assign(new Error("not found"), { code: "P2025" }));
    await expect(createWalletAdjustment({ ...base, target: { poolId: "nope" }, amount: 5_000 })).rejects.toThrow("tidak ditemukan");
  });
});
