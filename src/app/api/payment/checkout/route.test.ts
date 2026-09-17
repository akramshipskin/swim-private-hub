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
vi.mock("@/lib/prisma", () => ({
  prisma: {
    package: { count: packageCount, findFirst: packageFindFirst, create: packageCreate, delete: vi.fn() },
    pool: { findFirst: poolFindFirst },
    packageTemplate: { findFirst: templateFindFirst },
    payment: { create: paymentCreate },
  },
}));

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
