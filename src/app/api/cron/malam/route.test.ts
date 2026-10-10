import { afterEach, describe, expect, it, vi } from "vitest";

const sendSessionReminders = vi.fn().mockResolvedValue(3);
vi.mock("@/lib/scheduled-notices", () => ({ sendSessionReminders: (k: string) => sendSessionReminders(k) }));
const { GET } = await import("./route");
const call = (auth?: string) => GET(new Request("http://x/api/cron/malam", { headers: auth ? { authorization: auth } : {} }));

describe("GET /api/cron/malam", () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    process.env.CRON_SECRET = original;
  });

  it("tanpa kunci atau kunci salah ditolak; kunci benar mengirim pengingat sesi besok", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer ")).status).toBe(401);
    process.env.CRON_SECRET = "rahasia-uji";
    expect((await call("Bearer salah")).status).toBe(401);
    expect(sendSessionReminders).not.toHaveBeenCalled();
    const ok = await call("Bearer rahasia-uji");
    expect(ok.status).toBe(200);
    expect(sendSessionReminders).toHaveBeenCalledWith("evening");
    expect(await ok.json()).toEqual({ ok: true, remindersSent: 3 });
  });
});
