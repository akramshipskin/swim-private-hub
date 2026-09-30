import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn().mockResolvedValue({});
let session: { user: { id: string } } | null = { user: { id: "u1" } };
vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/prisma", () => ({ prisma: { pushSubscription: { upsert: (...a: unknown[]) => upsert(...a) } } }));

const { POST } = await import("./route");
const req = (body: unknown) => new Request("http://x/api/push/subscribe", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
const good = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "k1", auth: "k2" } };

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: "u1" } };
});

describe("POST /api/push/subscribe", () => {
  it("tanpa login -> 401", async () => {
    session = null;
    expect((await POST(req(good))).status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });
  it("langganan valid disimpan", async () => {
    expect((await POST(req(good))).status).toBe(200);
    expect(upsert).toHaveBeenCalledOnce();
  });
  it("alamat bukan layanan push (mis. alamat internal) -> 400, tidak disimpan", async () => {
    expect((await POST(req({ ...good, endpoint: "https://169.254.169.254/x" }))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
  it("body rusak / kunci hilang / tipe salah -> 400 (bukan 500)", async () => {
    expect((await POST(req("bukan json"))).status).toBe(400);
    expect((await POST(req({ endpoint: good.endpoint }))).status).toBe(400);
    expect((await POST(req({ ...good, keys: { p256dh: 1, auth: "x" } }))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
