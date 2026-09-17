import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "owner-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const ownershipCount = vi.fn();
const templateFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolOwnership: { count: (...a: unknown[]) => ownershipCount(...a) },
    packageTemplate: { findUnique: (...a: unknown[]) => templateFindUnique(...a) },
  },
}));
const createTemplateRecord = vi.fn().mockResolvedValue(null);
const updateTemplateRecord = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/package-template", () => ({
  proposeNewTemplate: (...a: unknown[]) => createTemplateRecord(...a),
  proposeTemplateUpdate: (...a: unknown[]) => updateTemplateRecord(...a),
}));

const { createPoolTemplate, updatePoolTemplate } = await import("./actions");
const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

beforeEach(() => vi.clearAllMocks());

describe("pool owner package templates", () => {
  it("refuses creating a template for a pool the owner doesn't own", async () => {
    ownershipCount.mockResolvedValue(0);
    expect((await createPoolTemplate(null, fd({ poolId: "other" })))?.error).toBeTruthy();
    expect(createTemplateRecord).not.toHaveBeenCalled();
  });

  it("creates for an owned pool", async () => {
    ownershipCount.mockResolvedValue(1);
    expect(await createPoolTemplate(null, fd({ poolId: "mine" }))).toBeNull();
    expect(createTemplateRecord).toHaveBeenCalled();
  });

  it("refuses editing a template of another pool", async () => {
    templateFindUnique.mockResolvedValue({ poolId: "other" });
    ownershipCount.mockResolvedValue(0);
    expect((await updatePoolTemplate(null, fd({ templateId: "t1" })))?.error).toBeTruthy();
    expect(updateTemplateRecord).not.toHaveBeenCalled();
  });
});
