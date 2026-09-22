import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const poolUpdate = vi.fn().mockResolvedValue({});
const affiliationUpsert = vi.fn().mockResolvedValue({});
const affiliationDelete = vi.fn().mockResolvedValue({ count: 1 });
const affiliationFindUnique = vi.fn();
const availabilityDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pool: { update: (...args: unknown[]) => poolUpdate(...args) },
    poolAffiliation: {
      upsert: (...args: unknown[]) => affiliationUpsert(...args),
      deleteMany: (...args: unknown[]) => affiliationDelete(...args),
      findUnique: (...args: unknown[]) => affiliationFindUnique(...args),
    },
    availability: { deleteMany: (...args: unknown[]) => availabilityDeleteMany(...args) },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { updatePoolShares, affiliateCoach, removeAffiliation, togglePoolActive } = await import("./actions");

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  poolUpdate.mockClear();
  affiliationUpsert.mockClear();
  affiliationDelete.mockClear();
});

describe("updatePoolShares", () => {
  it("saves when commission + coach share is under 100%", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "15", coachSharePercent: "55" }));
    expect(result).toBeNull();
    expect(poolUpdate).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { commissionPercent: 15, coachSharePercent: 55 },
    });
  });

  it("allows commission + coach share to sum to exactly 100%", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "50", coachSharePercent: "50" }));
    expect(result).toBeNull();
    expect(poolUpdate).toHaveBeenCalled();
  });

  // Kalo lolos, kolam gak dapet bagian sama sekali dari harga sesi -- itu
  // jelas input yang salah, bukan konfigurasi valid.
  it("rejects when commission + coach share exceeds 100%, leaving nothing for the pool", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "60", coachSharePercent: "50" }));
    expect(result).toEqual({ error: "Total komisi platform + komisi coach tidak boleh lebih dari 100%." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("rejects a negative percent", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "-5", coachSharePercent: "50" }));
    expect(result).toEqual({ error: "Persentase harus angka 0-100." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("rejects a percent over 100", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "15", coachSharePercent: "101" }));
    expect(result).toEqual({ error: "Persentase harus angka 0-100." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-integer percent", async () => {
    const result = await updatePoolShares(null, formData({ poolId: "pool-1", commissionPercent: "15.5", coachSharePercent: "50" }));
    expect(result).toEqual({ error: "Persentase harus angka 0-100." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });
});

describe("affiliateCoach", () => {
  it("requires both poolId and coachId", async () => {
    const result = await affiliateCoach(null, formData({ poolId: "pool-1", coachId: "" }));
    expect(result).toEqual({ error: "Pilih coach dulu." });
    expect(affiliationUpsert).not.toHaveBeenCalled();
  });

  // upsert (bukan create) -- affiliasi yang udah ada sebelumnya gak boleh
  // gagal (unique constraint) kalo admin gak sengaja nambahin coach yang sama.
  it("upserts so re-affiliating the same coach to the same pool is a no-op, not an error", async () => {
    const result = await affiliateCoach(null, formData({ poolId: "pool-1", coachId: "coach-1" }));
    expect(result).toBeNull();
    expect(affiliationUpsert).toHaveBeenCalledWith({
      where: { poolId_coachId: { poolId: "pool-1", coachId: "coach-1" } },
      update: {},
      create: { poolId: "pool-1", coachId: "coach-1" },
    });
  });
});

describe("togglePoolActive", () => {
  // Kolam yang daftar sendiri mulai isActive:false (nunggu approve) --
  // ini tombol satu-satunya yang bisa nge-flip itu.
  it("approves a pending pool by setting isActive true", async () => {
    await togglePoolActive("pool-1", true);
    expect(poolUpdate).toHaveBeenCalledWith({ where: { id: "pool-1" }, data: { isActive: true } });
  });

  it("deactivates an active pool", async () => {
    await togglePoolActive("pool-1", false);
    expect(poolUpdate).toHaveBeenCalledWith({ where: { id: "pool-1" }, data: { isActive: false } });
  });
});

describe("removeAffiliation", () => {
  it("does nothing when the affiliation is already gone (double-click safe)", async () => {
    affiliationFindUnique.mockResolvedValueOnce(null);
    await expect(removeAffiliation(formData({ affiliationId: "aff-1" }))).resolves.toBeUndefined();
    expect(availabilityDeleteMany).not.toHaveBeenCalled();
  });

  it("closes only the coach's future open slots at that pool", async () => {
    affiliationFindUnique.mockResolvedValueOnce({ id: "aff-1", coachId: "c1", poolId: "p1" });
    await removeAffiliation(formData({ affiliationId: "aff-1" }));
    expect(affiliationDelete).toHaveBeenCalledWith({ where: { id: "aff-1" } });
    expect(availabilityDeleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ coachId: "c1", poolId: "p1", status: "AVAILABLE", startTime: { gt: expect.any(Date) } }),
    });
  });
});
