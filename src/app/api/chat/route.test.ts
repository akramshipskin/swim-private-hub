import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER", name: "Dedi" } }) }));
vi.mock("@/lib/chat-ai", () => ({
  askAi: vi.fn().mockResolvedValue(null),
  buildSystemPrompt: vi.fn(),
  normalizeTurns: vi.fn((t: unknown) => t),
  stripEscalateToken: vi.fn((s: string) => s),
  ESCALATE_TOKEN: "[[ESC]]",
  MAX_CHAT_LENGTH: 1000,
}));

const lockKeys: string[] = [];
const txCount = vi.fn();
const txCreate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/dedupe-lock", () => ({
  withDedupeLock: (key: string, fn: (tx: unknown) => unknown) => {
    lockKeys.push(key);
    return fn({ chatMessage: { count: (...a: unknown[]) => txCount(...a), create: (...a: unknown[]) => txCreate(...a) } });
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatThread: { upsert: vi.fn().mockResolvedValue({ id: "t1" }), findUnique: vi.fn().mockResolvedValue({ messages: [] }), update: vi.fn() },
    chatMessage: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

const { POST } = await import("./route");

const send = (content: string) =>
  POST(new Request("http://x/api/chat", { method: "POST", body: JSON.stringify({ content }) }));

beforeEach(() => {
  vi.clearAllMocks();
  lockKeys.length = 0;
});

describe("POST /api/chat rate limit", () => {
  it("counts and stores the message inside a per-user lock", async () => {
    txCount.mockResolvedValue(3);
    const res = await send("halo");
    expect(res.status).toBe(200);
    expect(lockKeys).toEqual(["chat:m1"]);
    expect(txCreate).toHaveBeenCalledWith({ data: { threadId: "t1", sender: "USER", content: "halo" } });
  });

  it("refuses the 21st message within an hour without storing it", async () => {
    txCount.mockResolvedValue(20);
    const res = await send("halo lagi");
    expect(res.status).toBe(429);
    expect(txCreate).not.toHaveBeenCalled();
  });
});
