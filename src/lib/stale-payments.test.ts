import { describe, it, expect, vi, beforeEach } from "vitest";

const { tx, prismaMock, refund } = vi.hoisted(() => {
  const tx = {
    payment: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    coachChangeRequest: { updateMany: vi.fn() },
    package: { updateMany: vi.fn() },
  };
  const prismaMock = {
    payment: { findMany: vi.fn() },
    $transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  return { tx, prismaMock, refund: vi.fn() };
});
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/member-wallet", () => ({ refundMemberBalanceOnce: refund }));

import { releaseStalePayments, STALE_PAYMENT_MS } from "./stale-payments";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx));
  tx.payment.updateMany.mockResolvedValue({ count: 1 });
});

describe("releaseStalePayments", () => {
  it("mengambil semua pembayaran Menunggu yang lewat batas, tanpa syarat saldo/ganti coach, paling lama dulu (2A)", async () => {
    prismaMock.payment.findMany.mockResolvedValue([]);
    const now = new Date("2026-10-06T00:00:00Z");
    expect(await releaseStalePayments(now)).toBe(0);
    const arg = prismaMock.payment.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ status: "PENDING", createdAt: { lt: new Date(now.getTime() - STALE_PAYMENT_MS) } });
    expect(arg.select).toMatchObject({ id: true, createdAt: true });
    expect(arg.orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }]);
  });

  it("pembelian paket tanpa saldo: pembayaran dan paket kedaluwarsa, tidak ada pengembalian saldo", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1", rawWebhookPayload: null }]);
    tx.payment.findUniqueOrThrow.mockResolvedValue({ packageId: "k1", coachChangeRequestId: null, package: { memberId: "m1", saldoUsed: 0 }, coachChangeRequest: null });
    expect(await releaseStalePayments()).toBe(1);
    expect(tx.payment.updateMany).toHaveBeenCalledWith({ where: { id: "p1", status: "PENDING" }, data: { status: "EXPIRED" } });
    expect(tx.package.updateMany).toHaveBeenCalledWith({ where: { id: "k1", status: "PENDING_PAYMENT" }, data: { status: "EXPIRED" } });
    expect(refund).toHaveBeenCalledWith(tx, "m1", 0, { packageId: "k1" });
  });

  it("pembelian paket dengan saldo: saldo yang terpakai dikembalikan", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1", rawWebhookPayload: null }]);
    tx.payment.findUniqueOrThrow.mockResolvedValue({ packageId: "k1", coachChangeRequestId: null, package: { memberId: "m1", saldoUsed: 50000 }, coachChangeRequest: null });
    await releaseStalePayments();
    expect(refund).toHaveBeenCalledWith(tx, "m1", 50000, { packageId: "k1" });
  });

  it("tambahan bayar ganti coach: pengajuan kedaluwarsa, paket tidak disentuh, saldo pengajuan dikembalikan", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p2", rawWebhookPayload: null }]);
    tx.payment.findUniqueOrThrow.mockResolvedValue({ packageId: "k1", coachChangeRequestId: "c1", package: { memberId: "m1", saldoUsed: 0 }, coachChangeRequest: { saldoUsed: 20000 } });
    expect(await releaseStalePayments()).toBe(1);
    expect(tx.coachChangeRequest.updateMany).toHaveBeenCalledWith({ where: { id: "c1", status: "AWAITING_PAYMENT" }, data: { status: "EXPIRED" } });
    expect(tx.package.updateMany).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledWith(tx, "m1", 20000, { packageId: "k1", coachChangeRequestId: "c1" });
  });

  it("sudah diproses pihak lain (webhook lebih dulu): tidak diubah dan tidak dihitung", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1", rawWebhookPayload: null }]);
    tx.payment.updateMany.mockResolvedValue({ count: 0 });
    expect(await releaseStalePayments()).toBe(0);
    expect(tx.package.updateMany).not.toHaveBeenCalled();
    expect(refund).not.toHaveBeenCalled();
  });

  it("satu pembayaran gagal tidak menahan yang lain di putaran yang sama", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1", rawWebhookPayload: null }, { id: "p2", rawWebhookPayload: null }]);
    tx.payment.findUniqueOrThrow
      .mockRejectedValueOnce(new Error("db putus"))
      .mockResolvedValueOnce({ packageId: "k2", coachChangeRequestId: null, package: { memberId: "m2", saldoUsed: 0 }, coachChangeRequest: null });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await releaseStalePayments()).toBe(1);
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("sudah dikabari lunas tetapi jumlah tidak cocok (ditahan webhook untuk dicek admin): tidak dikedaluwarsakan", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1", rawWebhookPayload: { transaction_status: "settlement" } }, { id: "p2", rawWebhookPayload: { transaction_status: "pending" } }]);
    tx.payment.findUniqueOrThrow.mockResolvedValue({ packageId: "k2", coachChangeRequestId: null, package: { memberId: "m2", saldoUsed: 0 }, coachChangeRequest: null });
    expect(await releaseStalePayments()).toBe(1);
    expect(tx.payment.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.payment.updateMany).toHaveBeenCalledWith({ where: { id: "p2", status: "PENDING" }, data: { status: "EXPIRED" } });
  });

  it("lebih dari 50: diambil berputar sampai habis, yang ditahan tidak menghentikan putaran (TRD T2)", async () => {
    const at = new Date("2026-10-01T00:00:00Z");
    const held = Array.from({ length: 50 }, (_, i) => ({ id: `h${i}`, createdAt: at, rawWebhookPayload: { transaction_status: "settlement" } }));
    prismaMock.payment.findMany.mockResolvedValueOnce(held).mockResolvedValueOnce([{ id: "p9", rawWebhookPayload: null }]);
    tx.payment.findUniqueOrThrow.mockResolvedValue({ packageId: "k9", coachChangeRequestId: null, package: { memberId: "m1", saldoUsed: 0 }, coachChangeRequest: null });
    expect(await releaseStalePayments()).toBe(1);
    expect(prismaMock.payment.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.payment.findMany.mock.calls[1][0].where.OR).toEqual([{ createdAt: { gt: at } }, { createdAt: at, id: { gt: "h49" } }]);
  });
});
