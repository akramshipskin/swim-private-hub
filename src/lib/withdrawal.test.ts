import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock tx yang dipake di dalem prisma.$transaction -- poolUpdateMany/
// coachUpdateMany buat CAS saldo cukup, sisanya passthrough sederhana.
const poolUpdateMany = vi.fn();
const coachUpdateMany = vi.fn();
const poolUpdate = vi.fn().mockResolvedValue({});
const coachUpdate = vi.fn().mockResolvedValue({});
const withdrawalCreate = vi.fn();
const withdrawalUpdateMany = vi.fn();
const withdrawalUpdate = vi.fn().mockResolvedValue({});
const withdrawalFindUniqueOrThrow = vi.fn();
const walletTxnCreate = vi.fn().mockResolvedValue({});
const poolFindUniqueOrThrow = vi.fn();
const coachFindUniqueOrThrow = vi.fn();

function makeTx() {
  return {
    pool: { updateMany: poolUpdateMany, update: poolUpdate, findUniqueOrThrow: poolFindUniqueOrThrow },
    coachProfile: { updateMany: coachUpdateMany, update: coachUpdate, findUniqueOrThrow: coachFindUniqueOrThrow },
    withdrawalRequest: {
      create: withdrawalCreate,
      updateMany: withdrawalUpdateMany,
      findUniqueOrThrow: withdrawalFindUniqueOrThrow,
    },
    walletTransaction: { create: walletTxnCreate },
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => fn(makeTx()),
    pool: { findUniqueOrThrow: (...args: unknown[]) => poolFindUniqueOrThrow(...args) },
    coachProfile: { findUniqueOrThrow: (...args: unknown[]) => coachFindUniqueOrThrow(...args) },
    withdrawalRequest: { updateMany: (...args: unknown[]) => withdrawalUpdate(...args) },
  },
}));

const {
  requestPoolWithdrawal,
  requestCoachWithdrawal,
  markWithdrawalFailed,
  markWithdrawalPaid,
  WithdrawalError,
} = await import("./withdrawal");

beforeEach(() => {
  vi.clearAllMocks();
  poolUpdateMany.mockResolvedValue({ count: 1 });
  coachUpdateMany.mockResolvedValue({ count: 1 });
  withdrawalCreate.mockResolvedValue({ id: "wd-1" });
});

describe("requestPoolWithdrawal", () => {
  const okPool = { walletBalance: 100_000, bankName: "BCA", bankAccountNumber: "123", bankAccountName: "Budi" };

  it("creates a withdrawal for the pool's full wallet balance", async () => {
    poolFindUniqueOrThrow.mockResolvedValue(okPool);
    await requestPoolWithdrawal("pool-1");
    expect(poolUpdateMany).toHaveBeenCalledWith({
      where: { id: "pool-1", walletBalance: { gte: 100_000 } },
      data: { walletBalance: { decrement: 100_000 } },
    });
    expect(withdrawalCreate).toHaveBeenCalledWith({
      data: { poolId: "pool-1", coachProfileId: undefined, amount: 100_000, bankName: "BCA", bankAccountNumber: "123", bankAccountName: "Budi" },
    });
  });

  it("rejects below the minimum withdrawal amount without touching the balance", async () => {
    poolFindUniqueOrThrow.mockResolvedValue({ ...okPool, walletBalance: 10_000 });
    await expect(requestPoolWithdrawal("pool-1")).rejects.toThrow(WithdrawalError);
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects when bank info is missing", async () => {
    poolFindUniqueOrThrow.mockResolvedValue({ ...okPool, bankName: null });
    await expect(requestPoolWithdrawal("pool-1")).rejects.toThrow("Isi rekening tujuan dulu");
  });

  // CAS: kalo saldo berubah (misal kekredit sesi baru) di antara baca dan
  // updateMany, klaim gagal (count 0) dan request GAK boleh kebuat --
  // nyegah pencairan lebih dari saldo yang beneran ada saat itu.
  it("aborts the whole request when the balance-sufficiency claim fails (race with a concurrent credit/debit)", async () => {
    poolFindUniqueOrThrow.mockResolvedValue(okPool);
    poolUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(requestPoolWithdrawal("pool-1")).rejects.toThrow("Saldo gak cukup");
    expect(withdrawalCreate).not.toHaveBeenCalled();
  });
});

describe("requestCoachWithdrawal", () => {
  it("creates a withdrawal against the coach's wallet, not the pool's", async () => {
    coachFindUniqueOrThrow.mockResolvedValue({ walletBalance: 60_000, bankName: "BCA", bankAccountNumber: "1", bankAccountName: "Ayu" });
    await requestCoachWithdrawal("coach-1");
    expect(coachUpdateMany).toHaveBeenCalledWith({
      where: { id: "coach-1", walletBalance: { gte: 60_000 } },
      data: { walletBalance: { decrement: 60_000 } },
    });
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });
});

describe("markWithdrawalFailed", () => {
  it("refunds the exact amount back to the pool and records a compensating ledger row", async () => {
    withdrawalUpdateMany.mockResolvedValue({ count: 1 });
    withdrawalFindUniqueOrThrow.mockResolvedValue({ id: "wd-1", poolId: "pool-1", coachProfileId: null, amount: 100_000 });

    await markWithdrawalFailed("wd-1", "Rekening tidak valid");

    expect(withdrawalUpdateMany).toHaveBeenCalledWith({
      where: { id: "wd-1", status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "FAILED", failureReason: "Rekening tidak valid", processedAt: expect.any(Date) },
    });
    expect(poolUpdate).toHaveBeenCalledWith({ where: { id: "pool-1" }, data: { walletBalance: { increment: 100_000 } } });
    expect(walletTxnCreate).toHaveBeenCalledWith({
      data: { type: "WITHDRAWAL", poolId: "pool-1", coachProfileId: null, amount: 100_000, withdrawalRequestId: "wd-1" },
    });
  });

  it("refunds the coach wallet instead when the request belongs to a coach", async () => {
    withdrawalUpdateMany.mockResolvedValue({ count: 1 });
    withdrawalFindUniqueOrThrow.mockResolvedValue({ id: "wd-2", poolId: null, coachProfileId: "coach-1", amount: 50_000 });

    await markWithdrawalFailed("wd-2", "Ditolak admin");

    expect(coachUpdate).toHaveBeenCalledWith({ where: { id: "coach-1" }, data: { walletBalance: { increment: 50_000 } } });
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  // CAS: status HARUS masih PENDING/PROCESSING -- kalo request udah PAID
  // (atau FAILED sebelumnya), double-klik "Tolak" TIDAK boleh nge-refund
  // saldo dua kali.
  it("does nothing (no refund, no ledger row) when the request is already resolved", async () => {
    withdrawalUpdateMany.mockResolvedValue({ count: 0 });

    await markWithdrawalFailed("wd-1", "reason");

    expect(poolUpdate).not.toHaveBeenCalled();
    expect(coachUpdate).not.toHaveBeenCalled();
    expect(walletTxnCreate).not.toHaveBeenCalled();
  });
});

describe("markWithdrawalPaid", () => {
  it("sets status PAID and records the Midtrans reference when given", async () => {
    withdrawalUpdate.mockResolvedValue({ count: 1 });
    expect(await markWithdrawalPaid("wd-1", "REF-123")).toBe(true);
    expect(withdrawalUpdate).toHaveBeenCalledWith({
      where: { id: "wd-1", status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "PAID", processedAt: expect.any(Date), midtransReferenceId: "REF-123" },
    });
  });

  it("works without a reference for manual (non-Iris) payouts", async () => {
    withdrawalUpdate.mockResolvedValue({ count: 1 });
    await markWithdrawalPaid("wd-1");
    expect(withdrawalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ midtransReferenceId: undefined }) })
    );
  });

  // Regression (tes race lokal 2026-09-17): request yang barusan ditolak
  // (saldo udah dibalikin) gak boleh ketiban PAID.
  it("returns false and changes nothing when the request is no longer PENDING/PROCESSING", async () => {
    withdrawalUpdate.mockResolvedValue({ count: 0 });
    expect(await markWithdrawalPaid("wd-1")).toBe(false);
  });
});
