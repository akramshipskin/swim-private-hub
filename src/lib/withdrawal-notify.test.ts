import { describe, expect, it, vi, beforeEach } from "vitest";
import { formatRupiah } from "@/lib/format";

const sendPushToUser = vi.fn().mockResolvedValue(undefined);
const sendPushToRole = vi.fn().mockResolvedValue(undefined);
const sendPushToUsers = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/push", () => ({
  sendPushToUser: (...a: unknown[]) => sendPushToUser(...a),
  sendPushToRole: (...a: unknown[]) => sendPushToRole(...a),
  sendPushToUsers: (...a: unknown[]) => sendPushToUsers(...a),
}));

const findUnique = vi.fn();
const coachFindUnique = vi.fn();
const ownershipFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    withdrawalRequest: { findUnique: (...a: unknown[]) => findUnique(...a) },
    coachProfile: { findUnique: (...a: unknown[]) => coachFindUnique(...a) },
    poolOwnership: { findMany: (...a: unknown[]) => ownershipFindMany(...a) },
  },
}));

const { notifyAdminsWithdrawalRequested, notifyWithdrawalOutcome, notifyWalletAdjustment } = await import("./withdrawal-notify");

beforeEach(() => vi.clearAllMocks());

describe("notifyAdminsWithdrawalRequested", () => {
  it("pushes to every admin with the requester and amount", async () => {
    await notifyAdminsWithdrawalRequested("Dewi", 50000);
    expect(sendPushToRole).toHaveBeenCalledWith(
      "ADMIN",
      expect.objectContaining({ title: "Pengajuan pencairan baru", url: "/admin/withdrawals" })
    );
    expect(sendPushToRole.mock.calls[0][1].body).toContain("Dewi");
  });

  it("does not throw when the push fails", async () => {
    sendPushToRole.mockRejectedValueOnce(new Error("down"));
    await expect(notifyAdminsWithdrawalRequested("Dewi", 50000)).resolves.toBeUndefined();
  });
});

describe("notifyWithdrawalOutcome", () => {
  it("tells a coach their payout was paid", async () => {
    findUnique.mockResolvedValue({ amount: 50000, coachProfile: { userId: "coach-1" }, pool: null });
    await notifyWithdrawalOutcome("w1", "PAID");
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith(
      "coach-1",
      expect.objectContaining({ title: "Pencairan dibayar", url: "/coach/saldo" })
    );
  });

  it("tells every owner of a pool that the payout was returned to the balance", async () => {
    findUnique.mockResolvedValue({
      amount: 75000,
      coachProfile: null,
      pool: { ownerships: [{ ownerId: "o1" }, { ownerId: "o2" }] },
    });
    await notifyWithdrawalOutcome("w2", "FAILED");
    expect(sendPushToUser).toHaveBeenCalledTimes(2);
    expect(sendPushToUser).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ title: "Pencairan tidak diproses", url: "/pool/saldo" })
    );
  });

  it("does nothing when the request no longer exists", async () => {
    findUnique.mockResolvedValue(null);
    await notifyWithdrawalOutcome("gone", "PAID");
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("swallows lookup errors", async () => {
    findUnique.mockRejectedValue(new Error("db down"));
    await expect(notifyWithdrawalOutcome("w3", "PAID")).resolves.toBeUndefined();
  });
});

describe("notifyWalletAdjustment", () => {
  it("tells the coach, with signed amount + reason, linking to their saldo page", async () => {
    coachFindUnique.mockResolvedValue({ userId: "coach-1" });
    await notifyWalletAdjustment({ coachProfileId: "cp1" }, -80000, "Sesi 12 Sep salah tercatat Hadir");
    expect(sendPushToUsers).toHaveBeenCalledWith(["coach-1"], {
      title: "Saldo kamu dikurangi admin",
      body: `−${formatRupiah(80000)} · Sesi 12 Sep salah tercatat Hadir`,
      url: "/coach/saldo",
    });
  });

  it("tells every owner of the pool", async () => {
    ownershipFindMany.mockResolvedValue([{ ownerId: "o1" }, { ownerId: "o2" }]);
    await notifyWalletAdjustment({ poolId: "p1" }, 125000, "Bagian kolam belum tercatat");
    expect(sendPushToUsers).toHaveBeenCalledWith(["o1", "o2"], expect.objectContaining({ title: "Saldo kamu ditambah admin", url: "/pool/saldo" }));
  });

  it("shortens a long reason", async () => {
    coachFindUnique.mockResolvedValue({ userId: "coach-1" });
    await notifyWalletAdjustment({ coachProfileId: "cp1" }, 1000, "x".repeat(300));
    expect(sendPushToUsers.mock.calls[0][1].body.length).toBeLessThan(130);
  });

  it("never throws (the correction is already saved)", async () => {
    coachFindUnique.mockRejectedValue(new Error("db down"));
    await expect(notifyWalletAdjustment({ coachProfileId: "cp1" }, 1000, "alasan")).resolves.toBeUndefined();
  });
});
