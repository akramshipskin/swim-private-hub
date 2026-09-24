import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER", name: "Ortu" } }) }));
vi.mock("@/lib/dependents", () => ({ assertDependentOwnedByMember: vi.fn().mockResolvedValue(undefined) }));
const createTransaction = vi.fn().mockResolvedValue({ redirect_url: "https://pay" });
vi.mock("@/lib/midtrans", () => ({ snap: { createTransaction: (...a: unknown[]) => createTransaction(...a) } }));

const packageCount = vi.fn();
const packageFindFirst = vi.fn().mockResolvedValue(null);
const packageCreate = vi.fn().mockResolvedValue({ id: "pkg-new" });
const poolFindFirst = vi.fn();
const templateFindFirst = vi.fn();
const paymentCreate = vi.fn().mockResolvedValue({});
const paymentDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
const paymentUpdate = vi.fn().mockResolvedValue({});
const packageDelete = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    package: { count: packageCount, findFirst: packageFindFirst, create: packageCreate, delete: (...a: unknown[]) => packageDelete(...a) },
    pool: { findFirst: poolFindFirst },
    packageTemplate: { findFirst: templateFindFirst },
    payment: { create: paymentCreate, deleteMany: (...a: unknown[]) => paymentDeleteMany(...a), update: (...a: unknown[]) => paymentUpdate(...a) },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

vi.mock("@/lib/dedupe-lock", async () => {
  const { prisma } = await import("@/lib/prisma");
  return { withDedupeLock: (_key: string, fn: (tx: unknown) => unknown) => fn(prisma) };
});

const { POST } = await import("./route");

function req(body: object) {
  return new Request("http://x/api/payment/checkout", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  packageFindFirst.mockResolvedValue(null);
});

describe("checkout 1 sesi", () => {
  it("refuses when the member has no active regular package", async () => {
    packageCount.mockResolvedValue(0);
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(403);
    expect(packageCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ memberId: "m1", isSingleSession: false }),
    });
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("charges the server-computed price and creates a 1-session package at that pool", async () => {
    packageCount.mockResolvedValue(1);
    poolFindFirst.mockResolvedValue({
      id: "pool-B",
      name: "Kolam B",
      packageTemplates: [{ price: 200_000, totalSesi: 4 }],
    });
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B", templateId: "ignored" }));
    expect(res.status).toBe(200);
    expect(packageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ poolId: "pool-B", totalSesi: 1, sisaSesi: 1, isSingleSession: true, templateId: null }),
    });
    // 200000/4 = 50000 * 1.2 = 60000
    expect(paymentCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 60_000 }) });
    expect(templateFindFirst).not.toHaveBeenCalled();
  });

  it("records the Payment before opening the Midtrans transaction", async () => {
    packageCount.mockResolvedValue(1);
    poolFindFirst.mockResolvedValue({ id: "pool-B", name: "Kolam B", packageTemplates: [{ price: 200_000, totalSesi: 4 }] });
    await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(paymentCreate.mock.invocationCallOrder[0]).toBeLessThan(createTransaction.mock.invocationCallOrder[0]);
  });

  // Tombol "Lanjut bayar" (member menutup halaman Midtrans sebelum selesai).
  it("stores the Midtrans payment link on the Payment, and still succeeds if that save fails", async () => {
    packageCount.mockResolvedValue(1);
    poolFindFirst.mockResolvedValue({ id: "pool-B", name: "Kolam B", packageTemplates: [{ price: 200_000, totalSesi: 4 }] });
    let res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(200);
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { midtransOrderId: expect.stringMatching(/^PKG-pkg-new-/) },
      data: { snapRedirectUrl: "https://pay" },
    });

    paymentUpdate.mockRejectedValueOnce(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: "https://pay" });
    errSpy.mockRestore();
  });

  it("cleans up package+payment and hides Midtrans details when Snap fails", async () => {
    packageCount.mockResolvedValue(1);
    poolFindFirst.mockResolvedValue({ id: "pool-B", name: "Kolam B", packageTemplates: [{ price: 200_000, totalSesi: 4 }] });
    createTransaction.mockRejectedValueOnce(new Error("ServerKey invalid: SB-Mid-xxx"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toMatch(/ServerKey/);
    expect(paymentDeleteMany).toHaveBeenCalledWith({ where: { packageId: "pkg-new" } });
    expect(packageDelete).toHaveBeenCalledWith({ where: { id: "pkg-new" } });
  });

  it("refuses a catalog package that is priced Rp0 (legacy data)", async () => {
    templateFindFirst.mockResolvedValue({ id: "t0", poolId: "pool-A", name: "Gratis", totalSesi: 4, jatahCancel: 1, price: 0 });
    const res = await POST(req({ dependentId: "d1", templateId: "t0" }));
    expect(res.status).toBe(400);
    expect(packageCreate).not.toHaveBeenCalled();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it("blocks an account that still has a temporary password", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "m1", role: "MEMBER", mustChangePassword: true } } as never);
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(403);
    expect(packageCreate).not.toHaveBeenCalled();
  });

  it("refuses a pool with no catalog", async () => {
    packageCount.mockResolvedValue(1);
    poolFindFirst.mockResolvedValue({ id: "pool-B", name: "Kolam B", packageTemplates: [] });
    const res = await POST(req({ dependentId: "d1", singleSessionPoolId: "pool-B" }));
    expect(res.status).toBe(400);
  });
});

describe("checkout double submit", () => {
  it("refuses a second purchase of the same item for the same child within a minute", async () => {
    templateFindFirst.mockResolvedValue({ id: "t1", poolId: "pool-A", name: "Paket", totalSesi: 4, jatahCancel: 2, price: 200_000 });
    packageFindFirst.mockResolvedValue({ id: "pkg-old" });
    const res = await POST(req({ dependentId: "d1", templateId: "t1" }));
    expect(res.status).toBe(409);
    expect(packageCreate).not.toHaveBeenCalled();
  });
});
