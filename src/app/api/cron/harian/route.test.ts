import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const runCoachSlotWatch = vi.fn().mockResolvedValue({ watched: 0 });
vi.mock("@/lib/coach-slot-watch", () => ({ runCoachSlotWatch: () => runCoachSlotWatch() }));
const purgeOldNotifications = vi.fn().mockResolvedValue(3);
vi.mock("@/lib/notifications", () => ({ purgeOldNotifications: () => purgeOldNotifications() }));
const releaseStalePayments = vi.fn().mockResolvedValue(2);
vi.mock("@/lib/stale-payments", () => ({ releaseStalePayments: () => releaseStalePayments() }));
const releaseDueCommissions = vi.fn().mockResolvedValue(1);
vi.mock("@/lib/affiliate", () => ({ releaseDueCommissions: () => releaseDueCommissions() }));
const sendSessionReminders = vi.fn().mockResolvedValue(4);
const sendPackageExpiryNotices = vi.fn().mockResolvedValue(2);
vi.mock("@/lib/scheduled-notices", () => ({ sendSessionReminders: (k: string) => sendSessionReminders(k), sendPackageExpiryNotices: () => sendPackageExpiryNotices() }));
const { GET } = await import("./route");
const call = (auth?: string) => GET(new Request("http://x/api/cron/harian", { headers: auth ? { authorization: auth } : {} }));

describe("GET /api/cron/harian", () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    runCoachSlotWatch.mockClear();
    purgeOldNotifications.mockClear();
    releaseStalePayments.mockClear();
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
    expect(releaseStalePayments).not.toHaveBeenCalled();
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
    expect(releaseStalePayments).toHaveBeenCalledTimes(1);
    const body = await ok.json();
    expect(body.notificationsPurged).toBe(3);
    expect(body.paymentsExpired).toBe(2);
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

  it("gagal mengedaluwarsakan pembayaran tidak menggagalkan pemeriksa jadwal", async () => {
    process.env.CRON_SECRET = "rahasia-uji";
    releaseStalePayments.mockRejectedValueOnce(new Error("db putus"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call("Bearer rahasia-uji");
    expect(res.status).toBe(200);
    expect((await res.json()).paymentsExpired).toBeNull();
    expect(runCoachSlotWatch).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("penjaga jadwal error: pekerjaan lain tetap jalan dan komisi dicairkan (TRD T2, T3)", async () => {
    process.env.CRON_SECRET = "rahasia-uji";
    runCoachSlotWatch.mockRejectedValueOnce(new Error("db putus"));
    const res = await call("Bearer rahasia-uji");
    expect(res.status).toBe(200);
    expect(purgeOldNotifications).toHaveBeenCalled();
    expect(releaseStalePayments).toHaveBeenCalled();
    expect(releaseDueCommissions).toHaveBeenCalled();
    expect(await res.json()).toMatchObject({ watch: null, commissionsReleased: 1 });
  });

  it("pagi: pengingat sesi hari ini dan pemberitahuan paket berakhir ikut dijalankan (Hadi 9 Okt)", async () => {
    process.env.CRON_SECRET = "rahasia-uji";
    const res = await call("Bearer rahasia-uji");
    expect(sendSessionReminders).toHaveBeenCalledWith("morning");
    expect(await res.json()).toMatchObject({ remindersSent: 4, expiryNotices: 2 });
  });
});
