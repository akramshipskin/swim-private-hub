import { describe, expect, it, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const update = vi.fn().mockResolvedValue({});
const updateMany = vi.fn().mockResolvedValue({ count: 1 });
const count = vi.fn().mockResolvedValue(0);
const create = vi.fn().mockResolvedValue({});
// $executeRaw = kunci baris (SELECT ... FOR UPDATE); perilakunya diuji di tes race K5.
const $executeRaw = vi.fn().mockResolvedValue(1);
const db = { packageTemplate: { findUnique, update, updateMany, count, create }, $executeRaw };
vi.mock("@/lib/prisma", () => ({ prisma: { ...db, $transaction: (fn: (t: typeof db) => unknown) => fn(db) } }));
vi.mock("@/lib/dedupe-lock", () => ({ withDedupeLock: (_k: string, fn: (t: typeof db) => unknown) => fn(db) }));

const { proposeNewTemplate, proposeTemplateUpdate, reviewTemplateChange } = await import("./package-template");

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const fields = { name: "Paket A", totalSesi: "8", price: "800000", durationDays: "60", jatahCancel: "2" };

beforeEach(() => vi.clearAllMocks());

describe("pool owner proposals", () => {
  it("a new template is created unsold (isActive false) with the proposal stored", async () => {
    expect(await proposeNewTemplate("p1", fd(fields))).toBeNull();
    const data = create.mock.calls[0][0].data;
    expect(data.isActive).toBe(false);
    expect(data.pendingChanges).toMatchObject({ isNew: true, isActive: true, price: 800000 });
  });

  it("an edit leaves live values untouched and only stores the proposal", async () => {
    findUnique.mockResolvedValue({ pendingChanges: null });
    await proposeTemplateUpdate("t1", fd({ ...fields, price: "900000", isActive: "on" }));
    const data = update.mock.calls[0][0].data;
    expect(Object.keys(data)).toEqual(["pendingChanges"]);
    expect(data.pendingChanges).toMatchObject({ isNew: false, price: 900000 });
  });
});

describe("admin review", () => {
  it("approving applies the proposed fields", async () => {
    findUnique.mockResolvedValue({ pendingChanges: { name: "Paket A", price: 900000, totalSesi: 8, durationDays: 60, jatahCancel: 2, isActive: true, isNew: false, submittedAt: "x" } });
    expect(await reviewTemplateChange("t1", true)).toBe(true);
    expect(updateMany.mock.calls[0][0].data).toMatchObject({ price: 900000, isActive: true });
  });

  it("rejecting a new template keeps it unsold and does not apply the price", async () => {
    findUnique.mockResolvedValue({ pendingChanges: { name: "Baru", price: 1, totalSesi: 1, durationDays: 1, jatahCancel: 0, isActive: true, isNew: true, submittedAt: "x" } });
    await reviewTemplateChange("t2", false);
    const data = updateMany.mock.calls[0][0].data;
    expect(data.isActive).toBe(false);
    expect(data.price).toBeUndefined();
  });

  it("returns false when there is nothing pending", async () => {
    findUnique.mockResolvedValue({ pendingChanges: null });
    expect(await reviewTemplateChange("t3", true)).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe("price validation", () => {
  // Regression: harga 0 dulu lolos -> checkout Rp0 / paket gratis.
  it("rejects a Rp0 or fractional price", async () => {
    for (const price of ["0", "-5", "150000.5"]) {
      const res = await proposeNewTemplate("p1", fd({ ...fields, price }));
      expect(res).toMatchObject({ error: expect.stringContaining("harga minimal Rp1") });
    }
    expect(create).not.toHaveBeenCalled();
  });
});
