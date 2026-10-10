import { describe, it, expect, vi, beforeEach } from "vitest";

const { tx, prismaMock } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    user: { update: vi.fn() },
    dependent: { updateMany: vi.fn() },
    milestoneNote: { updateMany: vi.fn() },
    pushSubscription: { deleteMany: vi.fn() },
    inAppNotification: { deleteMany: vi.fn() },
    payment: { updateMany: vi.fn(), count: vi.fn() },
  };
  const prismaMock = {
    // Callback = transaksi anonimisasi; array = akhiri paket + batalkan pengajuan (T8).
    $transaction: vi.fn(async (arg: unknown) => (typeof arg === "function" ? (arg as (t: typeof tx) => unknown)(tx) : Promise.all(arg as unknown[]))),
    booking: { findMany: vi.fn() },
    inAppNotification: { deleteMany: vi.fn() },
    package: { updateMany: vi.fn(async () => ({ count: 1 })) },
    coachChangeRequest: { updateMany: vi.fn(async () => ({ count: 0 })) },
  };
  return { tx, prismaMock };
});
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "dead-hash") } }));
vi.mock("@/lib/cancel-booking", () => ({ cancelBooking: vi.fn(), CancelError: class extends Error {} }));

import { STALE_PAYMENT_MS } from "./stale-payments";
import { anonymizeMember, AccountDeletionError, PENDING_PAYMENT_DELETION_ERROR } from "./account-deletion";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.booking.findMany.mockResolvedValue([]);
  tx.payment.count.mockResolvedValue(0);
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => (typeof arg === "function" ? (arg as (t: typeof tx) => unknown)(tx) : Promise.all(arg as unknown[])));
});

describe("anonymizeMember", () => {
  it("paket aktif diakhiri dan sisa sesi hangus, pengajuan ganti coach dibatalkan (Hadi 10 Okt, T8)", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: new Date(), anonymizedAt: null }]);
    await anonymizeMember("u1");
    expect(prismaMock.package.updateMany).toHaveBeenCalledWith({ where: { memberId: "u1", status: "ACTIVE" }, data: { status: "EXPIRED", sisaSesi: 0 } });
    expect(prismaMock.coachChangeRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { memberId: "u1", status: { in: ["PENDING", "AWAITING_PAYMENT"] } } }));
  });

  it("menghapus langganan push dan riwayat lonceng milik akun yang dianonimkan", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: new Date(), anonymizedAt: null }]);
    await anonymizeMember("u1");
    expect(tx.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(tx.inAppNotification.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("menghapus lagi riwayat lonceng setelah pembatalan booking mendatang (kabar pembatalan ikut tercatat)", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: new Date(), anonymizedAt: null }]);
    prismaMock.booking.findMany.mockResolvedValue([{ id: "b1" }]);
    await anonymizeMember("u1");
    expect(prismaMock.inAppNotification.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("menolak akun yang tidak mengajukan penghapusan dan tidak menghapus apa pun", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: null, anonymizedAt: null }]);
    await expect(anonymizeMember("u1")).rejects.toBeInstanceOf(AccountDeletionError);
    expect(tx.inAppNotification.deleteMany).not.toHaveBeenCalled();
  });

  it("menolak saat masih ada pembayaran yang menunggu dibayar dan tidak mengubah apa pun (1A)", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: new Date(), anonymizedAt: null }]);
    tx.payment.count.mockResolvedValue(1);
    await expect(anonymizeMember("u1")).rejects.toThrow(PENDING_PAYMENT_DELETION_ERROR);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.dependent.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.booking.findMany).not.toHaveBeenCalled();
  });

  it("hanya menghitung pembayaran PENDING milik member itu yang belum lewat batas bayar", async () => {
    tx.$queryRaw.mockResolvedValue([{ role: "MEMBER", deletionRequestedAt: new Date(), anonymizedAt: null }]);
    await anonymizeMember("u1");
    const where = tx.payment.count.mock.calls[0][0].where;
    expect(where.status).toBe("PENDING");
    expect(where.package).toEqual({ memberId: "u1" });
    const cutoff = (where.createdAt.gte as Date).getTime();
    expect(Math.abs(Date.now() - STALE_PAYMENT_MS - cutoff)).toBeLessThan(5000);
  });
});
