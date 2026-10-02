import { describe, it, expect, vi, beforeEach } from "vitest";

const takeAttempt = vi.fn(async () => "hit");
const findFirst = vi.fn(async () => null);
vi.mock("@/lib/rate-limit", async (orig) => ({ ...(await orig<typeof import("./rate-limit")>()), takeAttempt, forgetAttempts: vi.fn(), lockRemainingSeconds: vi.fn(async () => 1) }));
// next-auth tidak bisa dimuat di vitest (butuh next/server); cukup kelas galatnya.
vi.mock("next-auth", () => ({ CredentialsSignin: class extends Error {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst } } }));

const { authorizeCredentials } = await import("./authorize");
beforeEach(() => {
  takeAttempt.mockClear();
  findFirst.mockClear();
});

const req = new Request("http://localhost/api/auth", { headers: { "x-forwarded-for": "1.2.3.4" } });

describe("authorizeCredentials: identitas kepanjangan", () => {
  it("lebih dari 254 karakter: ditolak tanpa mencatat percobaan dan tanpa query akun", async () => {
    await expect(authorizeCredentials({ identifier: "a".repeat(255) + "@x.id", password: "rahasia123" }, req)).resolves.toBeNull();
    expect(takeAttempt).not.toHaveBeenCalled();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("tepat di batas: 254 karakter masih diproses, 255 ditolak", async () => {
    await authorizeCredentials({ identifier: "a".repeat(254), password: "rahasia123" }, req);
    expect(takeAttempt).toHaveBeenCalled();
    takeAttempt.mockClear();
    await authorizeCredentials({ identifier: "a".repeat(255), password: "rahasia123" }, req);
    expect(takeAttempt).not.toHaveBeenCalled();
  });

  it("identitas wajar tetap lewat jalur biasa (percobaan dicatat, akun dicari)", async () => {
    await expect(authorizeCredentials({ identifier: "081234567890", password: "rahasia123" }, req)).resolves.toBeNull();
    // jaringan (20x), akun+jaringan (3x), akun dari semua jaringan (10x)
    expect(takeAttempt).toHaveBeenCalledTimes(3);
    expect((takeAttempt.mock.calls as unknown as [string, number][]).map(([k, n]) => [k, n])).toEqual([
      ["login-ip:1.2.3.4", 20],
      ["login-net:1.2.3.4:081234567890", 3],
      ["login:081234567890", 10],
    ]);
    expect(findFirst).toHaveBeenCalledOnce();
  });
});
