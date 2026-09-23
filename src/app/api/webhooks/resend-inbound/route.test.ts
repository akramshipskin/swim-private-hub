import { describe, expect, it, vi, beforeEach } from "vitest";

const verify = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    webhooks = { verify: (...a: unknown[]) => verify(...a) };
  },
}));

const fetchReceivedEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  fetchReceivedEmail: (...a: unknown[]) => fetchReceivedEmail(...a),
}));

const sendPushToRole = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/push", () => ({ sendPushToRole: (...a: unknown[]) => sendPushToRole(...a) }));

const upsert = vi.fn();
const create = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailThread: { upsert: (...a: unknown[]) => upsert(...a) },
    emailMessage: { create: (...a: unknown[]) => create(...a) },
  },
}));

const { POST } = await import("./route");

function req(body = "{}") {
  return new Request("http://x/api/webhooks/resend-inbound", {
    method: "POST",
    body,
    headers: { "svix-id": "id", "svix-timestamp": "1", "svix-signature": "sig" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
  upsert.mockResolvedValue({ id: "thread-1" });
  create.mockResolvedValue({});
});

describe("resend inbound webhook", () => {
  it("rejects a request with an invalid signature", async () => {
    verify.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("ignores event types other than email.received", async () => {
    verify.mockReturnValue({ type: "email.sent", data: {} });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });

  it("stores an inbound email under its sender's thread", async () => {
    verify.mockReturnValue({
      type: "email.received",
      data: { email_id: "em-1", from: "cust@example.com", subject: "Halo" },
    });
    fetchReceivedEmail.mockResolvedValue({ to: ["hello@swimprivatehub.biz.id"], text: "isi email", html: "<p>isi</p>" });

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { externalEmail: "cust@example.com" } })
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ threadId: "thread-1", direction: "INBOUND", resendId: "em-1" }),
      })
    );
    expect(sendPushToRole).toHaveBeenCalledWith(
      "ADMIN",
      expect.objectContaining({ title: "Email baru", body: "cust@example.com: Halo", url: "/admin/email" })
    );
  });

  it("swallows a duplicate webhook retry (unique constraint) instead of throwing", async () => {
    verify.mockReturnValue({
      type: "email.received",
      data: { email_id: "em-1", from: "cust@example.com", subject: "Halo" },
    });
    fetchReceivedEmail.mockResolvedValue({ to: ["hello@swimprivatehub.biz.id"], text: "isi email", html: null });
    create.mockRejectedValue({ code: "P2002" });

    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(sendPushToRole).not.toHaveBeenCalled();
  });

  it("still answers 200 when the admin push fails", async () => {
    verify.mockReturnValue({
      type: "email.received",
      data: { email_id: "em-2", from: "cust@example.com", subject: "" },
    });
    fetchReceivedEmail.mockResolvedValue({ to: ["hello@swimprivatehub.biz.id"], text: "x", html: null });
    sendPushToRole.mockRejectedValueOnce(new Error("push down"));

    const res = await POST(req());
    expect(res.status).toBe(200);
  });
});
