import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const sendReplyEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  INBOX_FROM_ADDRESS: "hello@swimprivatehub.biz.id",
  INBOX_ADDRESSES: ["hello@swimprivatehub.biz.id"],
  sendReplyEmail: (...a: unknown[]) => sendReplyEmail(...a),
}));

const takeAttempt = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ takeAttempt: (...a: unknown[]) => takeAttempt(...a) }));

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailThread: { findUnique: (...a: unknown[]) => findUnique(...a), update: vi.fn(), upsert: vi.fn() },
    emailMessage: { create: vi.fn() },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

const { replyToEmailThread, composeEmail } = await import("./actions");

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

beforeEach(() => vi.clearAllMocks());

// Sweep keamanan 25 Sep: batas 30 email keluar per jam.
describe("batas email keluar", () => {
  it("refuses a new email once the hourly limit is reached, without sending", async () => {
    takeAttempt.mockResolvedValue(null);
    const res = await composeEmail(null, fd({ to: "a@b.co", from: "hello@swimprivatehub.biz.id", subject: "Hai", content: "Isi" }));
    expect(res?.error).toContain("Batas kirim email");
    expect(sendReplyEmail).not.toHaveBeenCalled();
    expect(takeAttempt).toHaveBeenCalledWith("email-keluar", 30, 3_600_000);
  });

  it("refuses a reply once the hourly limit is reached, without sending", async () => {
    takeAttempt.mockResolvedValue(null);
    findUnique.mockResolvedValue({ id: "t1", subject: "S", externalEmail: "a@b.co", messages: [] });
    const res = await replyToEmailThread(null, fd({ threadId: "t1", content: "Balas" }));
    expect(res?.error).toContain("Batas kirim email");
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });
});
