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
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", pool: { isActive: true } });
    packageUpdateMany.mockResolvedValue({ count: 1 });
    const res = await POST(req());
    expect(res.status).toBe(201);
    expect(packageUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "pkg-1", poolId: "pool-B" }) })
    );
  });

  it("rejects without touching the slot when the package is for another pool", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", pool: { isActive: true } });
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

describe("POST /api/booking guards", () => {
  it("rejects a new booking at a deactivated pool without claiming the package", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", pool: { isActive: false } });
    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/tidak aktif/);
    expect(packageUpdateMany).not.toHaveBeenCalled();
  });

  it("blocks an account that still has a temporary password", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "m1", role: "MEMBER", mustChangePassword: true } } as never);
    const res = await POST(req());
    expect(res.status).toBe(403);
    expect(availabilityFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 on a malformed body instead of throwing", async () => {
    const res = await POST(new Request("http://x/api/booking", { method: "POST", body: "{not json" }));
    expect(res.status).toBe(400);
  });

  it("reports a non-constraint DB failure as 500, not as a taken slot", async () => {
    availabilityFindUnique.mockRejectedValueOnce(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req());
    expect(res.status).toBe(500);
  });
});
