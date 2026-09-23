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
});
