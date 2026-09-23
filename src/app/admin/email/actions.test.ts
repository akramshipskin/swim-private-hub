import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));

const sendReplyEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  INBOX_FROM_ADDRESS: "hello@swimprivatehub.biz.id",
  INBOX_ADDRESSES: [
    "hello@swimprivatehub.biz.id",
    "support@swimprivatehub.biz.id",
    "info@swimprivatehub.biz.id",
    "billing@swimprivatehub.biz.id",
  ],
  sendReplyEmail: (...a: unknown[]) => sendReplyEmail(...a),
}));

const findUnique = vi.fn();
const upsert = vi.fn();
const messageCreate = vi.fn().mockResolvedValue({});
const threadUpdate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailThread: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => threadUpdate(...a),
      upsert: (...a: unknown[]) => upsert(...a),
    },
    emailMessage: { create: (...a: unknown[]) => messageCreate(...a) },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { replyToEmailThread, composeEmail } = await import("./actions");

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
    messages: [{ resendId: "em-old", toAddress: "support@swimprivatehub.biz.id" }],
  });
  sendReplyEmail.mockResolvedValue({ id: "em-new" });
  upsert.mockResolvedValue({ id: "thread-new" });
});

describe("replyToEmailThread", () => {
  it("rejects an empty reply", async () => {
    const res = await replyToEmailThread(null, formData({ threadId: "thread-1", content: "" }));
    expect(res?.error).toBeTruthy();
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  it("sends via Resend from the address the member actually wrote to, threading off the last message id, and marks the thread resolved", async () => {
    const res = await replyToEmailThread(null, formData({ threadId: "thread-1", content: "Halo, ini balasan.", resolve: "on" }));
    expect(res).toBeNull();
    expect(sendReplyEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "support@swimprivatehub.biz.id",
        to: "cust@example.com",
        subject: "Re: Tanya paket",
        inReplyToMessageId: "em-old",
      })
    );
    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ direction: "OUTBOUND", resendId: "em-new", fromAddress: "support@swimprivatehub.biz.id" }),
      })
    );
    expect(threadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { needsAdmin: false } })
    );
  });

  it("falls back to the default inbox address when the thread has no inbound message on record", async () => {
    findUnique.mockResolvedValue({ id: "thread-1", externalEmail: "cust@example.com", subject: "Tanya paket", messages: [] });
    await replyToEmailThread(null, formData({ threadId: "thread-1", content: "Halo" }));
    expect(sendReplyEmail).toHaveBeenCalledWith(expect.objectContaining({ from: "hello@swimprivatehub.biz.id" }));
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

function composeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("composeEmail", () => {
  const valid = { from: "support@swimprivatehub.biz.id", to: "calon@example.com", subject: "Halo", content: "Isi email" };

  it("rejects an invalid destination address", async () => {
    const res = await composeEmail(null, composeFormData({ ...valid, to: "bukan-email" }));
    expect(res?.error).toBeTruthy();
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  it("rejects a sender address outside the known inbox list", async () => {
    const res = await composeEmail(null, composeFormData({ ...valid, from: "random@other.com" }));
    expect(res?.error).toBeTruthy();
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  it("rejects an empty subject or body", async () => {
    expect((await composeEmail(null, composeFormData({ ...valid, subject: "" })))?.error).toBeTruthy();
    expect((await composeEmail(null, composeFormData({ ...valid, content: "" })))?.error).toBeTruthy();
  });

  it("sends from the chosen address, finds-or-creates the thread, and redirects to it", async () => {
    await expect(composeEmail(null, composeFormData(valid))).rejects.toThrow("NEXT_REDIRECT:/admin/email?t=thread-new");
    expect(sendReplyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "support@swimprivatehub.biz.id", to: "calon@example.com", subject: "Halo", text: "Isi email" })
    );
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { externalEmail: "calon@example.com" } }));
    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ threadId: "thread-new", direction: "OUTBOUND", fromAddress: "support@swimprivatehub.biz.id", resendId: "em-new" }),
      })
    );
  });

  it("surfaces a Resend send failure without creating a thread", async () => {
    sendReplyEmail.mockRejectedValue(new Error("Resend down"));
    const res = await composeEmail(null, composeFormData(valid));
    expect(res?.error).toBe("Resend down");
    expect(upsert).not.toHaveBeenCalled();
  });
});
