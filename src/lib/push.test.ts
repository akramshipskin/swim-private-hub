import { describe, expect, it, vi, beforeEach } from "vitest";

const sendNotification = vi.fn();
const setVapidDetails = vi.fn();
vi.mock("web-push", () => ({
  default: {
    sendNotification: (...a: unknown[]) => sendNotification(...a),
    setVapidDetails: (...a: unknown[]) => setVapidDetails(...a),
  },
}));

const after = vi.fn();
vi.mock("next/server", () => ({ after: (...a: unknown[]) => after(...a) }));

const subFindMany = vi.fn();
const subDelete = vi.fn();
const userFindMany = vi.fn();
const notifCreateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    inAppNotification: { createMany: (...a: unknown[]) => notifCreateMany(...a) },
    pushSubscription: { findMany: (...a: unknown[]) => subFindMany(...a), delete: (...a: unknown[]) => subDelete(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

const { sendPushToUser, sendPushToUsers, sendPushToRole } = await import("./push");

const sub = { id: "s1", endpoint: "https://push.example/1", p256dh: "p", auth: "a" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VAPID_SUBJECT = "mailto:hello@example.com";
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
  process.env.VAPID_PRIVATE_KEY = "priv";
  subFindMany.mockResolvedValue([sub]);
  sendNotification.mockResolvedValue({});
  notifCreateMany.mockResolvedValue({ count: 1 });
  after.mockImplementation((job: () => Promise<void>) => job());
});

describe("sendPushToUser", () => {
  it("schedules delivery with after() and sends to every subscription", async () => {
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(after).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(1));
    expect(sendNotification.mock.calls[0][0]).toEqual({ endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } });
    expect(setVapidDetails).toHaveBeenCalledWith("mailto:hello@example.com", "pub", "priv");
  });

  it("runs the delivery inline when after() is unavailable (outside a request)", async () => {
    after.mockImplementation(() => {
      throw new Error("after was called outside a request scope");
    });
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it("skips silently, without throwing, when VAPID env is missing", async () => {
    vi.resetModules();
    delete process.env.VAPID_PRIVATE_KEY;
    const fresh = await import("./push");
    await expect(fresh.sendPushToUser("u1", { title: "t", body: "b" })).resolves.toBeUndefined();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("removes a subscription the push service reports as gone (410)", async () => {
    after.mockImplementation(() => {
      throw new Error("outside");
    });
    sendNotification.mockRejectedValue({ statusCode: 410 });
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(subDelete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });

  it("keeps the subscription on other errors, and logs host + status (no keys)", async () => {
    after.mockImplementation(() => {
      throw new Error("outside");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    sendNotification.mockRejectedValue({ statusCode: 403 });
    await sendPushToUser("u1", { title: "Judul", body: "b" });
    expect(subDelete).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('[push] gagal kirim "Judul" ke push.example: 403');
    error.mockRestore();
  });

  it("logs once which env is missing when VAPID is incomplete", async () => {
    vi.resetModules();
    delete process.env.VAPID_PRIVATE_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fresh = await import("./push");
    await fresh.sendPushToUser("u1", { title: "t", body: "b" });
    await fresh.sendPushToUser("u1", { title: "t", body: "b" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("[push] dilewati: env belum lengkap (VAPID_PRIVATE_KEY)");
    warn.mockRestore();
  });

  it("logs when the recipient has no subscription at all", async () => {
    after.mockImplementation(() => {
      throw new Error("outside");
    });
    subFindMany.mockResolvedValue([]);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendPushToUser("u1", { title: "Judul", body: "b" });
    expect(sendNotification).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('[push] tidak ada langganan untuk 1 penerima ("Judul")');
    info.mockRestore();
  });
});

describe("sendPushToRole", () => {
  it("looks up active users of the role and pushes to each", async () => {
    userFindMany.mockResolvedValue([{ id: "a1" }, { id: "a2" }]);
    await sendPushToRole("ADMIN", { title: "t", body: "b" });
    expect(userFindMany).toHaveBeenCalledWith({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    expect(after).toHaveBeenCalledTimes(1);
    expect(subFindMany).toHaveBeenCalledWith({ where: { userId: { in: ["a1", "a2"] } } });
  });
});

describe("sendPushToUsers", () => {
  it("delivers to everyone with ONE after() job and ONE subscription query", async () => {
    subFindMany.mockResolvedValue([sub, { ...sub, id: "s2", endpoint: "https://push.example/2" }]);
    await sendPushToUsers(["u1", "u2", "u3"], { title: "t", body: "b" });
    expect(after).toHaveBeenCalledTimes(1);
    expect(subFindMany).toHaveBeenCalledTimes(1);
    expect(subFindMany).toHaveBeenCalledWith({ where: { userId: { in: ["u1", "u2", "u3"] } } });
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(2));
  });

  it("does nothing, and queries nothing, for an empty recipient list", async () => {
    await sendPushToUsers([], { title: "t", body: "b" });
    expect(subFindMany).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("keeps sending to the rest when one subscription fails", async () => {
    subFindMany.mockResolvedValue([sub, { ...sub, id: "s2", endpoint: "https://push.example/2" }]);
    sendNotification.mockRejectedValueOnce({ statusCode: 500 }).mockResolvedValueOnce({});
    await sendPushToUsers(["u1", "u2"], { title: "t", body: "b" });
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(2));
  });
});

describe("riwayat lonceng (InAppNotification)", () => {
  it("menyimpan 1 baris untuk 1 penerima, dengan url", async () => {
    await sendPushToUser("u1", { title: "Judul", body: "Isi", url: "/member/dashboard" });
    expect(notifCreateMany).toHaveBeenCalledTimes(1);
    expect(notifCreateMany).toHaveBeenCalledWith({ data: [{ userId: "u1", title: "Judul", body: "Isi", url: "/member/dashboard" }] });
  });

  it("menyimpan semua penerima dalam SATU createMany (duplikat dibuang), url kosong = null", async () => {
    await sendPushToUsers(["u1", "u2", "u1", "u3"], { title: "t", body: "b" });
    expect(notifCreateMany).toHaveBeenCalledTimes(1);
    expect(notifCreateMany.mock.calls[0][0].data).toEqual([
      { userId: "u1", title: "t", body: "b", url: null },
      { userId: "u2", title: "t", body: "b", url: null },
      { userId: "u3", title: "t", body: "b", url: null },
    ]);
  });

  it("siaran ke role: 1 query pengguna + 1 createMany untuk semuanya", async () => {
    userFindMany.mockResolvedValue([{ id: "a1" }, { id: "a2" }, { id: "a3" }]);
    await sendPushToRole("ADMIN", { title: "t", body: "b", url: "/admin" });
    expect(userFindMany).toHaveBeenCalledTimes(1);
    expect(notifCreateMany).toHaveBeenCalledTimes(1);
    expect(notifCreateMany.mock.calls[0][0].data.map((r: { userId: string }) => r.userId)).toEqual(["a1", "a2", "a3"]);
  });

  it("tetap menyimpan riwayat saat VAPID kosong (push dilewati)", async () => {
    vi.resetModules();
    delete process.env.VAPID_PRIVATE_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fresh = await import("./push");
    await fresh.sendPushToUser("u1", { title: "t", body: "b" });
    expect(sendNotification).not.toHaveBeenCalled();
    expect(notifCreateMany).toHaveBeenCalledWith({ data: [{ userId: "u1", title: "t", body: "b", url: null }] });
    warn.mockRestore();
  });

  it("tetap menyimpan riwayat saat penerima tidak punya langganan push", async () => {
    subFindMany.mockResolvedValue([]);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(notifCreateMany).toHaveBeenCalledTimes(1);
    info.mockRestore();
  });

  it("gagal menyimpan: tidak melempar, dicatat di log, push tetap dikirim", async () => {
    notifCreateMany.mockRejectedValue(new Error("db putus"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendPushToUser("u1", { title: "Judul", body: "b" })).resolves.toBeUndefined();
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(1));
    expect(error).toHaveBeenCalledWith('[notifikasi] gagal menyimpan "Judul": db putus');
    error.mockRestore();
  });

  it("gagal menyimpan saat after() tidak tersedia (di luar request) juga tidak melempar", async () => {
    after.mockImplementation(() => {
      throw new Error("outside");
    });
    notifCreateMany.mockRejectedValue(new Error("db putus"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendPushToUser("u1", { title: "t", body: "b" })).resolves.toBeUndefined();
    expect(sendNotification).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("daftar penerima kosong: tidak menyimpan apa pun", async () => {
    await sendPushToUsers([], { title: "t", body: "b" });
    expect(notifCreateMany).not.toHaveBeenCalled();
  });
});
