import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "owner-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const ownershipCount = vi.fn();
const poolUpdate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolOwnership: { count: (...a: unknown[]) => ownershipCount(...a) },
    pool: { update: (...a: unknown[]) => poolUpdate(...a), findUnique: vi.fn().mockResolvedValue({ pricePack4: null, pricePack8: null }) },
  },
}));

const { updatePoolPrices } = await import("./actions");
const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

beforeEach(() => vi.clearAllMocks());

describe("harga paket kolam", () => {
  it("menolak kolam milik orang lain", async () => {
    ownershipCount.mockResolvedValue(0);
    expect((await updatePoolPrices(null, fd({ poolId: "other", pricePack4: "200000" })))?.error).toBeTruthy();
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("menolak harga tidak valid", async () => {
    ownershipCount.mockResolvedValue(1);
    expect((await updatePoolPrices(null, fd({ poolId: "mine", pricePack4: "0", pricePack8: "" })))?.error).toBeTruthy();
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("menyimpan langsung untuk kolam sendiri; kosong = tidak dijual", async () => {
    ownershipCount.mockResolvedValue(1);
    expect(await updatePoolPrices(null, fd({ poolId: "mine", pricePack4: "260000", pricePack8: "" }))).toEqual({ ok: true });
    expect(poolUpdate).toHaveBeenCalledWith({ where: { id: "mine" }, data: { pricePack4: 260_000, pricePack8: null } });
  });
});
