import { describe, it, expect, vi, beforeEach } from "vitest";

const store = { created: [] as string[], counted: [] as string[], deleted: [] as unknown[] };
const tx = {
  rateLimitHit: {
    count: vi.fn(async ({ where }: { where: { key: string } }) => (store.counted.push(where.key), 0)),
    create: vi.fn(async ({ data }: { data: { key: string } }) => (store.created.push(data.key), { id: "hit1" })),
  },
};
vi.mock("@/lib/dedupe-lock", () => ({ withDedupeLock: (_k: string, fn: (t: typeof tx) => unknown) => fn(tx) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { rateLimitHit: { deleteMany: vi.fn(async (a: unknown) => (store.deleted.push(a), { count: 0 })), findMany: vi.fn(async () => []) } },
}));

const { storedKey, takeAttempt, forgetAttempts, lockRemainingSeconds, MAX_KEY } = await import("./rate-limit");
const { prisma } = await import("@/lib/prisma");

beforeEach(() => {
  store.created = []; store.counted = []; store.deleted = [];
  vi.spyOn(Math, "random").mockReturnValue(0.9); // jangan picu bersih-bersih acak
});

describe("storedKey", () => {
  it("kunci pendek tidak berubah (perilaku lama tetap)", () => {
    expect(storedKey("login:081234567890")).toBe("login:081234567890");
    expect(storedKey("x".repeat(MAX_KEY))).toBe("x".repeat(MAX_KEY));
    expect(storedKey("x".repeat(MAX_KEY + 1))).not.toBe("x".repeat(MAX_KEY + 1));
  });
  it("kunci panjang dipotong + sidik jari: panjang terbatas, tetap unik, tetap konsisten", () => {
    const a = "login:" + "A".repeat(5000);
    const b = "login:" + "A".repeat(4999) + "B";
    expect(storedKey(a).length).toBeLessThanOrEqual(MAX_KEY);
    expect(storedKey(a)).not.toBe(storedKey(b));
    expect(storedKey(a)).toBe(storedKey(a));
  });
});

describe("takeAttempt / forgetAttempts memakai kunci ringkas", () => {
  it("yang dihitung dan disimpan adalah kunci ringkas, bukan teks mentah", async () => {
    const raw = "login:" + "A".repeat(5000);
    await expect(takeAttempt(raw, 3, 60_000)).resolves.toBe("hit1");
    expect(store.counted).toEqual([storedKey(raw)]);
    expect(store.created).toEqual([storedKey(raw)]);
    expect(store.created[0].length).toBeLessThanOrEqual(MAX_KEY);
  });
  it("menghapus berdasarkan kunci memakai kunci ringkas yang sama", async () => {
    const raw = "login:" + "A".repeat(5000);
    await forgetAttempts({ key: raw });
    expect(store.deleted).toEqual([{ where: { key: storedKey(raw) } }]);
  });
});

describe("lockRemainingSeconds memakai kunci ringkas", () => {
  it("mencari percobaan dengan kunci ringkas yang sama dengan saat dicatat", async () => {
    const raw = "login:" + "A".repeat(5000);
    await lockRemainingSeconds(raw, 3, 60_000);
    const call = (prisma.rateLimitHit.findMany as unknown as { mock: { calls: [{ where: { key: string } }][] } }).mock.calls.at(-1)![0];
    expect(call.where.key).toBe(storedKey(raw));
  });
});

