import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sendPushToUser = vi.fn();
vi.mock("@/lib/push", () => ({ sendPushToUser: (...a: unknown[]) => sendPushToUser(...a) }));

const threadFindUnique = vi.fn();
const threadUpdate = vi.fn();
const messageCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatThread: {
      findUnique: (...a: unknown[]) => threadFindUnique(...a),
      update: (...a: unknown[]) => threadUpdate(...a),
    },
    chatMessage: { create: (...a: unknown[]) => messageCreate(...a) },
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

const { replyToThread } = await import("./actions");

function form(over: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({ threadId: "t1", content: "Halo, sudah kami cek.", ...over })) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  threadFindUnique.mockResolvedValue({ id: "t1", userId: "user-9" });
  sendPushToUser.mockResolvedValue(undefined);
});

describe("replyToThread notification", () => {
  // Bug sweep 24 Sep: admin membalas chat, pengguna tidak dapat notifikasi apa pun.
  it("pushes the reply to the owner of the chat thread", async () => {
    const res = await replyToThread(null, form());
    expect(res).toBeNull();
    expect(sendPushToUser).toHaveBeenCalledTimes(1);
    expect(sendPushToUser).toHaveBeenCalledWith("user-9", {
      title: "Balasan dari admin",
      body: "Halo, sudah kami cek.",
      url: "/",
    });
  });

  it("shortens a long reply to 100 characters ending in an ellipsis", async () => {
    await replyToThread(null, form({ content: "x".repeat(150) }));
    const body = sendPushToUser.mock.calls[0][1].body as string;
    expect(body).toHaveLength(100);
    expect(body.endsWith("...")).toBe(true);
  });

  it("keeps a reply of exactly 100 characters untouched", async () => {
    await replyToThread(null, form({ content: "y".repeat(100) }));
    expect(sendPushToUser.mock.calls[0][1].body).toBe("y".repeat(100));
  });

  it("still saves the reply and returns no error when the push fails", async () => {
    sendPushToUser.mockRejectedValue(new Error("push down"));
    const res = await replyToThread(null, form());
    expect(res).toBeNull();
    expect(messageCreate).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for an empty reply", async () => {
    const res = await replyToThread(null, form({ content: "   " }));
    expect(res?.error).toBeTruthy();
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("sends nothing when the thread does not exist", async () => {
    threadFindUnique.mockResolvedValue(null);
    const res = await replyToThread(null, form());
    expect(res?.error).toBe("Percakapan tidak ditemukan.");
    expect(sendPushToUser).not.toHaveBeenCalled();
    expect(messageCreate).not.toHaveBeenCalled();
  });
});
