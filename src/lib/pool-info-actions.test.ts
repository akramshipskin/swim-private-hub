import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const ownershipCount = vi.fn();
const poolUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const bookingFindMany = vi.fn().mockResolvedValue([]);
const notifyAdmins = vi.fn();
vi.mock("@/lib/notify", () => ({ notifyAdmins: (...a: unknown[]) => notifyAdmins(...a) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolOwnership: { count: (...a: unknown[]) => ownershipCount(...a) },
    pool: { updateMany: (...a: unknown[]) => poolUpdateMany(...a), findUnique: vi.fn().mockResolvedValue({ name: "Kolam Melati" }) },
    booking: { findMany: (...a: unknown[]) => bookingFindMany(...a) },
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
        ["closeTime", "21:00"],
      ])
    );
    expect(res).toEqual({ ok: true, warning: undefined });
    expect(poolUpdateMany).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({ facilities: ["Mushola", "Gazebo"], openTime: "06:00" }),
    });
  });

  it("rejects an invalid time", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["openTime", "25:00"]])))?.error).toMatch(/JJ:MM/);
  });

  it("rejects an address over 300 chars and a phone over 20 chars (before touching the DB)", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["address", "a".repeat(301)]])))?.error).toBe("Alamat maksimal 300 karakter.");
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["contactPhone", "1".repeat(21)]])))?.error).toBe("No. telepon maksimal 20 karakter.");
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });

  it("menolak jam tutup yang tidak setelah jam buka, atau hanya salah satu diisi", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["openTime", "20:00"], ["closeTime", "06:00"]])))?.error).toMatch(/jam tutup harus setelah/);
    expect((await updatePoolInfo(null, fd([["poolId", "p1"], ["openTime", "06:00"]])))?.error).toMatch(/jam tutup harus setelah/);
    expect(poolUpdateMany).not.toHaveBeenCalled();
  });

  it("ganti jam buka saat ada booking di luar jam baru: tetap tersimpan, kolam diberi tahu, admin dikabari", async () => {
    auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const at = (h: string) => new Date(`2099-01-05T${h}:00+07:00`);
    bookingFindMany.mockResolvedValueOnce([
      { availability: { startTime: at("06:00"), endTime: at("07:00") } },
      { availability: { startTime: at("09:00"), endTime: at("10:00") } },
    ]);
    const res = await updatePoolInfo(null, fd([["poolId", "p1"], ["openTime", "08:00"], ["closeTime", "20:00"]]));
    expect(res?.ok).toBe(true);
    expect(res?.warning).toContain("Ada 1 booking mendatang di luar jam buka baru (08.00–20.00)");
    expect(notifyAdmins).toHaveBeenCalledWith("Booking di luar jam buka baru", expect.stringContaining("Kolam Melati: 1 booking"), "/admin/booking-overview");
  });
});
