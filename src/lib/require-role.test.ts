import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
const headers = vi.fn();
vi.mock("next/headers", () => ({ headers: () => headers() }));

const { requireRole } = await import("./require-role");

beforeEach(() => vi.clearAllMocks());

describe("requireRole", () => {
  it("ignores forged x-session-* headers and trusts only the real session", async () => {
    headers.mockReturnValue(new Headers({ "x-session-user-id": "attacker", "x-session-user-role": "ADMIN" }));
    auth.mockResolvedValue(null);
    await expect(requireRole("ADMIN")).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("rejects a session with a different role", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "MEMBER", mustChangePassword: false } });
    await expect(requireRole("ADMIN")).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("sends a user with a temporary password to /ganti-password", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: true } });
    await expect(requireRole("ADMIN")).rejects.toThrow("NEXT_REDIRECT:/ganti-password");
  });

  it("sends an admin without 2FA to /keamanan (server actions bypass proxy.ts)", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: false, needsTotpSetup: true } });
    await expect(requireRole("ADMIN")).rejects.toThrow("NEXT_REDIRECT:/keamanan");
  });

  it("returns the session user when role matches", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", name: "Hadi", email: "h@x.id", mustChangePassword: false } });
    const res = await requireRole("ADMIN");
    expect(res.user).toMatchObject({ id: "u1", role: "ADMIN", name: "Hadi" });
  });
});
