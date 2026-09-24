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
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pushSubscription: { findMany: (...a: unknown[]) => subFindMany(...a), delete: (...a: unknown[]) => subDelete(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

const { sendPushToUser, sendPushToUsers, sendPushToRole } = await import("./push");

const sub = { id: "s1", endpoint: "https://push/1", p256dh: "p", auth: "a" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VAPID_SUBJECT = "mailto:hello@example.com";
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
  process.env.VAPID_PRIVATE_KEY = "priv";
  subFindMany.mockResolvedValue([sub]);
  sendNotification.mockResolvedValue({});
  after.mockImplementation((job: () => Promise<void>) => job());
});

describe("sendPushToUser", () => {
  it("schedules delivery with after() and sends to every subscription", async () => {
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(after).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(1));
    expect(sendNotification.mock.calls[0][0]).toEqual({ endpoint: "https://push/1", keys: { p256dh: "p", auth: "a" } });
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

  it("keeps the subscription on other errors", async () => {
    after.mockImplementation(() => {
      throw new Error("outside");
    });
    sendNotification.mockRejectedValue({ statusCode: 500 });
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(subDelete).not.toHaveBeenCalled();
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
    subFindMany.mockResolvedValue([sub, { ...sub, id: "s2", endpoint: "https://push/2" }]);
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
    subFindMany.mockResolvedValue([sub, { ...sub, id: "s2", endpoint: "https://push/2" }]);
    sendNotification.mockRejectedValueOnce({ statusCode: 500 }).mockResolvedValueOnce({});
    await sendPushToUsers(["u1", "u2"], { title: "t", body: "b" });
    await vi.waitFor(() => expect(sendNotification).toHaveBeenCalledTimes(2));
  });
});
