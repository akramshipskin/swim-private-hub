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
// $queryRaw = kunci baris coach (FOR SHARE) + status aktifnya.
const coachLock = vi.fn().mockResolvedValue([{ isActive: true }]);
const packageFindUnique = vi.fn().mockResolvedValue(null);
const tx = {
  availability: { findUnique: availabilityFindUnique, updateMany: availabilityUpdateMany },
  package: { updateMany: packageUpdateMany, findUnique: packageFindUnique },
  booking: { create: bookingCreate },
  $queryRaw: (...a: unknown[]) => coachLock(...a),
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

beforeEach(() => {
  vi.clearAllMocks();
  coachLock.mockResolvedValue([{ isActive: true }]);
  packageFindUnique.mockResolvedValue(null);
});

describe("POST /api/booking pool lock", () => {
  it("only claims the package when it belongs to the slot's pool", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", pool: { isActive: true } });
    packageUpdateMany.mockResolvedValue({ count: 1 });
    const res = await POST(req());
    expect(res.status).toBe(201);
    const where = packageUpdateMany.mock.calls[0][0].where;
    expect(where.AND).toContainEqual({ id: "pkg-1", poolId: "pool-B" });
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

describe("POST /api/booking coach & masa berlaku paket", () => {
  const SLOT_START = new Date("2026-10-20T01:00:00Z");

  // Keputusan Hadi D2: slot coach yang dinonaktifkan tidak bisa dibooking.
  it("rejects a slot whose coach was deactivated, without claiming the package", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", coachId: "c1", startTime: SLOT_START, pool: { isActive: true } });
    coachLock.mockResolvedValue([{ isActive: false }]);
    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/tidak aktif/);
    expect(packageUpdateMany).not.toHaveBeenCalled();
  });

  // Keputusan Hadi D1: paket harus masih berlaku saat sesinya.
  it("only claims a package still valid at the session start", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", coachId: "c1", startTime: SLOT_START, pool: { isActive: true } });
    packageUpdateMany.mockResolvedValue({ count: 1 });
    await POST(req());
    const where = packageUpdateMany.mock.calls[0][0].where;
    expect(where.AND).toContainEqual({ OR: [{ expiredDate: null }, { expiredDate: { gt: SLOT_START } }] });
  });

  it("explains that the package ends before the session when that is why the claim failed", async () => {
    availabilityFindUnique.mockResolvedValue({ poolId: "pool-B", coachId: "c1", startTime: SLOT_START, pool: { isActive: true } });
    packageUpdateMany.mockResolvedValue({ count: 0 });
    packageFindUnique.mockResolvedValue({ memberId: "m1", expiredDate: new Date(Date.now() + 86_400_000) });
    const res = await POST(req());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/berlaku sampai/);
  });
});
