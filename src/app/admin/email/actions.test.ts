import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sendReplyEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  INBOX_FROM_ADDRESS: "hello@swimprivatehub.biz.id",
  sendReplyEmail: (...a: unknown[]) => sendReplyEmail(...a),
}));

const findUnique = vi.fn();
const messageCreate = vi.fn().mockResolvedValue({});
const threadUpdate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailThread: { findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => threadUpdate(...a) },
    emailMessage: { create: (...a: unknown[]) => messageCreate(...a) },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { replyToEmailThread } = await import("./actions");

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue({
    id: "thread-1",
    externalEmail: "cust@example.com",
    subject: "Tanya paket",
    messages: [{ resendId: "em-old" }],
  });
  sendReplyEmail.mockResolvedValue({ id: "em-new" });
});

describe("replyToEmailThread", () => {
  it("rejects an empty reply", async () => {
    const res = await replyToEmailThread(null, formData({ threadId: "thread-1", content: "" }));
    expect(res?.error).toBeTruthy();
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  it("sends via Resend, threading off the last message id, and marks the thread resolved", async () => {
    const res = await replyToEmailThread(null, formData({ threadId: "thread-1", content: "Halo, ini balasan.", resolve: "on" }));
    expect(res).toBeNull();
    expect(sendReplyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "cust@example.com", subject: "Re: Tanya paket", inReplyToMessageId: "em-old" })
    );
    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ direction: "OUTBOUND", resendId: "em-new" }) })
    );
    expect(threadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { needsAdmin: false } })
    );
  });

  it("keeps needsAdmin true when the admin does not check resolve", async () => {
    await replyToEmailThread(null, formData({ threadId: "thread-1", content: "Balasan lagi." }));
    expect(threadUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { needsAdmin: true } }));
  });

  it("surfaces a Resend send failure without writing to the DB", async () => {
    sendReplyEmail.mockRejectedValue(new Error("Resend down"));
    const res = await replyToEmailThread(null, formData({ threadId: "thread-1", content: "Halo" }));
    expect(res?.error).toBe("Resend down");
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the thread does not exist", async () => {
    findUnique.mockResolvedValue(null);
    const res = await replyToEmailThread(null, formData({ threadId: "missing", content: "Halo" }));
    expect(res?.error).toBeTruthy();
  });
});
