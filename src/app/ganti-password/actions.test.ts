import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
const unstableUpdate = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth(), unstable_update: (a: unknown) => unstableUpdate(a) }));
vi.mock("next/navigation", () => ({
  redirect: (p: string) => {
    throw new Error(`NEXT_REDIRECT:${p}`);
  },
}));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
vi.mock("@/lib/dependents", () => ({ createSelfDependent: vi.fn() }));

const userUpdate = vi.fn().mockResolvedValue({ sessionVersion: 3 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dependent: { count: vi.fn().mockResolvedValue(1) },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ user: { update: (a: unknown) => userUpdate(a) }, dependent: { createMany: vi.fn() } }),
  },
}));

const { changePassword } = await import("./actions");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => vi.clearAllMocks());

describe("changePassword (tanpa password lama)", () => {
  it("rejects an account that is not flagged mustChangePassword", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: false } });
    const res = await changePassword(null, fd({ newPassword: "abcdefgh", confirmPassword: "abcdefgh" }));
    expect(res?.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("changes the password, bumps sessionVersion, and keeps this session alive", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: true } });
    await expect(
      changePassword(null, fd({ newPassword: "abcdefgh", confirmPassword: "abcdefgh" }))
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionVersion: { increment: 1 } }) })
    );
    expect(unstableUpdate).toHaveBeenCalledWith(expect.objectContaining({ sessionVersion: 3 }));
  });
});
