import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER" } }) }));
const findMany = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/prisma", () => ({ prisma: { availability: { findMany: (...a: unknown[]) => findMany(...a) } } }));

const { GET } = await import("./route");

describe("GET /api/availability", () => {
  // Regression: ?date=xyz dulu jadi Invalid Date di query -> 500.
  it("returns 400 for a malformed date without querying the DB", async () => {
    for (const d of ["xyz", "2026-13-45", "2026-9-1"]) {
      const res = await GET(new Request(`http://x/api/availability?date=${d}`));
      expect(res.status).toBe(400);
    }
    expect(findMany).not.toHaveBeenCalled();
  });

  it("accepts a well-formed date", async () => {
    const res = await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"));
    expect(res.status).toBe(200);
  });

  // Regression: slot di kolam nonaktif dulu ikut tampil (booking-nya ditolak
  // di /api/booking, tapi member tetap melihat slot yang tidak bisa dipakai).
  it("only queries slots in active pools, with or without a poolId filter", async () => {
    for (const url of ["http://x/api/availability?date=2099-01-05&poolId=p1", "http://x/api/availability?date=2099-01-05"]) {
      findMany.mockClear();
      await GET(new Request(url));
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findMany.mock.calls[0][0].where.pool).toEqual({ isActive: true });
    }
  });
});
