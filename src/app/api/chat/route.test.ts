import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER", name: "Dedi" } }) }));
vi.mock("@/lib/chat-ai", () => ({
  askAi: vi.fn().mockResolvedValue(null),
  buildSystemPrompt: vi.fn(),
  normalizeTurns: vi.fn((t: unknown) => t),
  stripEscalateToken: vi.fn((s: string) => s),
  ESCALATE_TOKEN: "[[ESC]]",
  MAX_CHAT_LENGTH: 1000,
  chatVisibleSince: () => new Date("2026-06-27T00:00:00Z"),
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
const notifyAdmins = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notify", () => ({ notifyAdmins: (...a: unknown[]) => notifyAdmins(...a) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatThread: { upsert: vi.fn().mockResolvedValue({ id: "t1" }), findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "t1" }), findUnique: vi.fn().mockResolvedValue({ messages: [] }), update: vi.fn() },
    chatMessage: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

const { POST, GET } = await import("./route");
const { prisma } = await import("@/lib/prisma");

const send = (content: string) =>
  POST(new Request("http://x/api/chat", { method: "POST", body: JSON.stringify({ content }) }));

beforeEach(() => {
  vi.clearAllMocks();
  lockKeys.length = 0;
});

describe("POST /api/chat rate limit", () => {
  it("diteruskan ke admin: admin diberi tahu sekali, tidak lagi bila percakapan masih menunggu (Hadi 10 Okt)", async () => {
    txCount.mockResolvedValue(0);
    await send("tolong bantu");
    expect(notifyAdmins).toHaveBeenCalledTimes(1);
    expect(notifyAdmins.mock.calls[0][1]).toContain("Dedi");
    notifyAdmins.mockClear();
    const { prisma: p } = await import("@/lib/prisma");
    (p.chatThread.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "t1", needsAdmin: true });
    await send("halo lagi");
    expect(notifyAdmins).not.toHaveBeenCalled();
  });

  it("isi bukan teks: 400, bukan error 500 (TRD T20)", async () => {
    const res = await POST(new Request("http://x/api/chat", { method: "POST", body: JSON.stringify({ content: { a: 1 } }) }));
    expect(res.status).toBe(400);
  });

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

describe("POST /api/chat first message from a user without a thread", () => {
  // Bug sweep 24 Sep (tes race E11): pesan pertama terkirim 2x hampir bersamaan,
  // upsert bentrok (P2002) dan endpoint melempar error 500.
  it("recovers when the thread was created by a simultaneous request (P2002)", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.chatThread.upsert).mockRejectedValueOnce({ code: "P2002" });
    txCount.mockResolvedValue(0);
    const res = await send("halo");
    expect(res.status).toBe(200);
    expect(prisma.chatThread.findUniqueOrThrow).toHaveBeenCalledWith({ where: { userId: "m1" } });
    expect(txCreate).toHaveBeenCalledWith({ data: { threadId: "t1", sender: "USER", content: "halo" } });
  });

  it("still surfaces any other database error", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.chatThread.upsert).mockRejectedValueOnce(new Error("db down"));
    await expect(send("halo")).rejects.toThrow("db down");
    expect(prisma.chatThread.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

// Keputusan Hadi 25 Sep: pengguna melihat 90 hari terakhir; arsip tetap ada.
describe("GET /api/chat riwayat", () => {
  it("returns only the visible window, newest 100, in chronological order", async () => {
    vi.mocked(prisma.chatThread.findUnique).mockResolvedValueOnce({
      messages: [
        { id: "m3", sender: "AI", content: "c", createdAt: new Date("2026-09-25T03:00:00Z") },
        { id: "m2", sender: "USER", content: "b", createdAt: new Date("2026-09-25T02:00:00Z") },
      ],
    } as never);
    const res = await GET();
    expect((await res.json()).messages.map((m: { id: string }) => m.id)).toEqual(["m2", "m3"]);
    const arg = vi.mocked(prisma.chatThread.findUnique).mock.calls[0][0] as { select: { messages: Record<string, unknown> } };
    expect(arg.select.messages).toMatchObject({
      where: { createdAt: { gte: new Date("2026-06-27T00:00:00Z") } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });
});
