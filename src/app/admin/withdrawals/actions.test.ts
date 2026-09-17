import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const findUnique = vi.fn();
const updateMany = vi.fn().mockResolvedValue({ count: 1 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    withdrawalRequest: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

const markWithdrawalPaid = vi.fn().mockResolvedValue(true);
const markWithdrawalFailed = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/withdrawal", () => ({
  markWithdrawalPaid: (...args: unknown[]) => markWithdrawalPaid(...args),
  markWithdrawalFailed: (...args: unknown[]) => markWithdrawalFailed(...args),
}));

const isIrisConfigured = vi.fn();
const disburseViaIris = vi.fn();
vi.mock("@/lib/disbursement", () => ({
  isIrisConfigured: () => isIrisConfigured(),
  disburseViaIris: (...args: unknown[]) => disburseViaIris(...args),
}));

const { processWithdrawal, markPaidManually, rejectWithdrawal } = await import("./actions");

function formData(withdrawalId: string) {
  const fd = new FormData();
  fd.set("withdrawalId", withdrawalId);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processWithdrawal", () => {
  it("refuses when the request is missing", async () => {
    findUnique.mockResolvedValue(null);
    const result = await processWithdrawal(null, formData("gone"));
    expect(result?.error).toBeTruthy();
  });

  it("refuses when the request isn't PENDING anymore (already processed)", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PAID" });
    const result = await processWithdrawal(null, formData("wd-1"));
    expect(result?.error).toBeTruthy();
    expect(isIrisConfigured).not.toHaveBeenCalled();
  });

  // Iris belum aktif di produksi -- gagal dengan pesan yang nyuruh admin
  // transfer manual, BUKAN diem-diem nge-skip atau nge-crash.
  it("tells the admin to transfer manually when Iris isn't configured yet", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING" });
    isIrisConfigured.mockReturnValue(false);
    const result = await processWithdrawal(null, formData("wd-1"));
    expect(result?.error).toContain("transfer manual");
    expect(disburseViaIris).not.toHaveBeenCalled();
    expect(markWithdrawalPaid).not.toHaveBeenCalled();
  });

  it("marks paid when Iris disbursement succeeds", async () => {
    findUnique.mockResolvedValue({
      id: "wd-1",
      status: "PENDING",
      amount: 100_000,
      bankName: "BCA",
      bankAccountNumber: "1",
      bankAccountName: "Budi",
    });
    isIrisConfigured.mockReturnValue(true);
    disburseViaIris.mockResolvedValue({ success: true, midtransReferenceId: "REF-1" });

    await processWithdrawal(null, formData("wd-1"));

    expect(markWithdrawalPaid).toHaveBeenCalledWith("wd-1", "REF-1");
    expect(markWithdrawalFailed).not.toHaveBeenCalled();
  });

  it("marks failed with the reason when Iris disbursement is rejected", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING", amount: 100_000, bankName: "BCA", bankAccountNumber: "1", bankAccountName: "Budi" });
    isIrisConfigured.mockReturnValue(true);
    disburseViaIris.mockResolvedValue({ success: false, reason: "Rekening tidak valid" });

    await processWithdrawal(null, formData("wd-1"));

    expect(markWithdrawalFailed).toHaveBeenCalledWith("wd-1", "Rekening tidak valid");
    expect(markWithdrawalPaid).not.toHaveBeenCalled();
  });
});

describe("markPaidManually", () => {
  it("allows marking paid from either PENDING or PROCESSING", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PROCESSING" });
    const result = await markPaidManually(null, formData("wd-1"));
    expect(result).toBeNull();
    expect(markWithdrawalPaid).toHaveBeenCalledWith("wd-1");
  });

  it("refuses when already PAID (no double-processing)", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PAID" });
    const result = await markPaidManually(null, formData("wd-1"));
    expect(result?.error).toBeTruthy();
    expect(markWithdrawalPaid).not.toHaveBeenCalled();
  });
});

describe("rejectWithdrawal", () => {
  it("marks failed with a fixed admin-rejection reason", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING" });
    const result = await rejectWithdrawal(null, formData("wd-1"));
    expect(result).toBeNull();
    expect(markWithdrawalFailed).toHaveBeenCalledWith("wd-1", "Ditolak admin");
  });

  it("refuses when the request is already FAILED", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "FAILED" });
    const result = await rejectWithdrawal(null, formData("wd-1"));
    expect(result?.error).toBeTruthy();
    expect(markWithdrawalFailed).not.toHaveBeenCalled();
  });
});

// Regression (tes race lokal 2026-09-17): "Tandai Dibayar" & "Tolak" diklik
// barengan -- yang kalah klaim CAS harus dapet error, bukan diem-diem sukses.
describe("lost CAS claim", () => {
  it("markPaidManually returns an error when the request was resolved in between", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING" });
    markWithdrawalPaid.mockResolvedValueOnce(false);
    const result = await markPaidManually(null, formData("wd-1"));
    expect(result?.error).toContain("barusan udah diproses");
  });

  it("rejectWithdrawal returns an error when the request was resolved in between", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING" });
    markWithdrawalFailed.mockResolvedValueOnce(false);
    const result = await rejectWithdrawal(null, formData("wd-1"));
    expect(result?.error).toContain("barusan udah diproses");
  });

  it("processWithdrawal refuses when another click already moved it out of PENDING", async () => {
    findUnique.mockResolvedValue({ id: "wd-1", status: "PENDING" });
    isIrisConfigured.mockReturnValue(true);
    updateMany.mockResolvedValueOnce({ count: 0 });
    const result = await processWithdrawal(null, formData("wd-1"));
    expect(result?.error).toBeTruthy();
    expect(disburseViaIris).not.toHaveBeenCalled();
  });
});
