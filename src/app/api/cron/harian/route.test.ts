import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const runCoachSlotWatch = vi.fn().mockResolvedValue({ watched: 0 });
vi.mock("@/lib/coach-slot-watch", () => ({ runCoachSlotWatch: () => runCoachSlotWatch() }));
const purgeOldNotifications = vi.fn().mockResolvedValue(3);
vi.mock("@/lib/notifications", () => ({ purgeOldNotifications: () => purgeOldNotifications() }));
const { GET } = await import("./route");
const call = (auth?: string) => GET(new Request("http://x/api/cron/harian", { headers: auth ? { authorization: auth } : {} }));

describe("GET /api/cron/harian", () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    runCoachSlotWatch.mockClear();
    purgeOldNotifications.mockClear();
  });
  afterEach(() => {
    process.env.CRON_SECRET = original;
  });

  it("tanpa CRON_SECRET terpasang: selalu ditolak", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer ")).status).toBe(401);
    expect((await call("Bearer undefined")).status).toBe(401);
    expect(runCoachSlotWatch).not.toHaveBeenCalled();
    expect(purgeOldNotifications).not.toHaveBeenCalled();
  });

  it("kunci salah / tanpa header ditolak; kunci benar menjalankan pemeriksa", async () => {
    process.env.CRON_SECRET = "rahasia-uji";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer salah")).status).toBe(401);
    expect(runCoachSlotWatch).not.toHaveBeenCalled();
    const ok = await call("Bearer rahasia-uji");
    expect(ok.status).toBe(200);
    expect(runCoachSlotWatch).toHaveBeenCalledTimes(1);
    expect(purgeOldNotifications).toHaveBeenCalledTimes(1);
    expect((await ok.json()).notificationsPurged).toBe(3);
  });

  it("gagal membersihkan notifikasi lama tidak menggagalkan pemeriksa harian", async () => {
    process.env.CRON_SECRET = "rahasia-uji";
    purgeOldNotifications.mockRejectedValueOnce(new Error("db putus"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call("Bearer rahasia-uji");
    expect(res.status).toBe(200);
    expect((await res.json()).notificationsPurged).toBeNull();
    error.mockRestore();
  });
});
