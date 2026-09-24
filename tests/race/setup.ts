import { vi } from "vitest";
import { AsyncLocalStorage } from "node:async_hooks";

// Guard: harness ini WAJIB cuma nyentuh Postgres lokal, bukan Supabase.
if (!process.env.DATABASE_URL?.includes("localhost:54329")) {
  throw new Error("REFUSING TO RUN: DATABASE_URL bukan DB race lokal");
}

export type Role = "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
export type S = { user: { id: string; role: Role; name: string; email: string | null; mustChangePassword: boolean } };

declare global {
  var __als: AsyncLocalStorage<S | null>;
}

export const als = new AsyncLocalStorage<S | null>();
globalThis.__als = als;

vi.mock("@/auth", () => ({
  auth: async () => globalThis.__als.getStore() ?? null,
  unstable_update: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  handlers: {},
}));
vi.mock("@/lib/require-role", () => ({
  requireRole: async (role: string) => {
    const s = globalThis.__als.getStore();
    if (!s || s.user.role !== role) throw new Error("REDIRECT:/login");
    return s;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error("REDIRECT:" + url); },
  notFound: () => { throw new Error("NOT_FOUND"); },
}));
vi.mock("@/lib/push", () => ({
  sendPushToUser: async () => {},
  sendPushToUsers: async () => {},
  sendPushToRole: async () => {},
}));
vi.mock("@/lib/midtrans", () => ({
  platformServerKey: () => "SB-test-server-key",
  snap: { createTransaction: async () => ({ redirect_url: "https://example.test/snap", token: "t" }) },
}));
