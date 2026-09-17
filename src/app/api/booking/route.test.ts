import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER" } }) }));
vi.mock("@/lib/push", () => ({ sendPushToUser: vi.fn().mockResolvedValue(undefined) }));

const availabilityFindUnique = vi.fn();
const packageUpdateMany = vi.fn();
const availabilityUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const bookingCreate = vi.fn().mockResolvedValue({
  availability: { coach: { name: "Coach" }, coachId: "c1", date: new Date(), startTime: new Date() },
  package: { dependent: { name: "Anak" } },
});
const tx = {
  availability: { findUnique: availabilityFindUnique, updateMany: availabilityUpdateMany },
  package: { updateMany: packageUpdateMany },
  booking: { create: bookingCreate },
};
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

const { POST } = await import("./route");

function req() {
  return new Request("http://x/api/booking", {
    method: "POST",
    body: JSON.stringify({ availabilityId: "slot-1", packageId: "pkg-1" }),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/booking pool lock", () => {
  it("only claims the package when it belongs to the slot's pool", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B" });
    packageUpdateMany.mockResolvedValue({ count: 1 });
    const res = await POST(req());
    expect(res.status).toBe(201);
    expect(packageUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "pkg-1", poolId: "pool-B" }) })
    );
  });

  it("rejects without touching the slot when the package is for another pool", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B" });
    packageUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/kolam lain/);
    expect(availabilityUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the slot doesn't exist", async () => {
    availabilityFindUnique.mockResolvedValue(null);
    const res = await POST(req());
    expect(res.status).toBe(404);
    expect(packageUpdateMany).not.toHaveBeenCalled();
  });
});
