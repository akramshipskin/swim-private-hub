import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const ownershipCount = vi.fn();
const poolUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolOwnership: { count: (...a: unknown[]) => ownershipCount(...a) },
    pool: { updateMany: (...a: unknown[]) => poolUpdateMany(...a) },
  },
}));

const { updatePoolInfo } = await import("./pool-info-actions");

function fd(entries: [string, string][]) {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

beforeEach(() => vi.clearAllMocks());

describe("updatePoolInfo", () => {
  it("refuses a pool owner who doesn't own that pool", async () => {
    auth.mockResolvedValue({ user: { id: "o1", role: "POOL_OWNER" } });
    ownershipCount.mockResolvedValue(0);
    const res = await updatePoolInfo(null, fd([["poolId", "p2"]]));
    expect(res?.error).toBeTruthy();
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses members and coaches", async () => {
    auth.mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
    expect((await updatePoolInfo(null, fd([["poolId", "p1"]])))?.error).toBeTruthy();
  });

  it("lets admin save known + extra facilities, dropping unknown checkbox values", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const res = await updatePoolInfo(
      null,
      fd([
        ["poolId", "p1"],
        ["facilities", "Mushola"],
        ["facilities", "Helipad"],
        ["extraFacilities", "Gazebo, Mushola"],
        ["openTime", "06:00"],
      ])
    );
    expect(res).toEqual({ ok: true });
    expect(poolUpdateMany).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({ facilities: ["Mushola", "Gazebo"], openTime: "06:00" }),
    });
  });

  it("rejects an invalid time", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["openTime", "25:00"]])))?.error).toMatch(/JJ:MM/);
  });
});
