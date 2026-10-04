import { describe, expect, it, vi, beforeEach } from "vitest";

const count = vi.fn();
const findMany = vi.fn();
const findFirst = vi.fn();
const updateMany = vi.fn();
const deleteMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    inAppNotification: {
      count: (...a: unknown[]) => count(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
    },
  },
}));

const n = await import("./notifications");

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 1 });
});

describe("notificationGate", () => {
  it("tanpa sesi = ke halaman masuk", () => {
    expect(n.notificationGate(null)).toEqual({ redirectTo: "/login" });
    expect(n.notificationGate({ user: {} })).toEqual({ redirectTo: "/login" });
  });
  it("menghormati gerbang akun", () => {
    expect(n.notificationGate({ user: { id: "u", mustChangePassword: true } })).toEqual({ redirectTo: "/ganti-password" });
    expect(n.notificationGate({ user: { id: "u", needsTotpSetup: true } })).toEqual({ redirectTo: "/keamanan" });
    expect(n.notificationGate({ user: { id: "u", needsPartnerAgreement: true } })).toEqual({ redirectTo: "/perjanjian" });
  });
  it("akun biasa boleh", () => {
    expect(n.notificationGate({ user: { id: "u1" } })).toEqual({ userId: "u1" });
  });
});

describe("countUnread", () => {
  it("hanya milik pengguna, belum dibaca, dibatasi 10 (lencana 9+)", async () => {
    count.mockResolvedValue(4);
    expect(await n.countUnread("u1")).toBe(4);
    expect(count).toHaveBeenCalledWith({ where: { userId: "u1", readAt: null }, take: 10 });
  });
});

describe("listNotifications", () => {
  it("50 terbaru milik pengguna", async () => {
    findMany.mockResolvedValue([]);
    await n.listNotifications("u1");
    expect(findMany.mock.calls[0][0]).toMatchObject({ where: { userId: "u1" }, orderBy: { createdAt: "desc" }, take: 50 });
  });
});

describe("markRead", () => {
  it("milik orang lain / tidak ada: ditolak, tidak mengubah apa pun", async () => {
    findFirst.mockResolvedValue(null);
    expect(await n.markRead("u1", "notif-orang-lain")).toEqual({ found: false });
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "notif-orang-lain", userId: "u1" }, select: { url: true, readAt: true } });
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("milik sendiri: ditandai dibaca (userId ikut di WHERE) dan url dikembalikan", async () => {
    findFirst.mockResolvedValue({ url: "/member/dashboard", readAt: null });
    expect(await n.markRead("u1", "n1")).toEqual({ found: true, url: "/member/dashboard" });
    expect(updateMany.mock.calls[0][0].where).toEqual({ id: "n1", userId: "u1", readAt: null });
  });
  it("sudah dibaca: tidak ditulis ulang", async () => {
    findFirst.mockResolvedValue({ url: null, readAt: new Date() });
    expect(await n.markRead("u1", "n1")).toEqual({ found: true, url: null });
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("url ke situs lain dibuang", async () => {
    findFirst.mockResolvedValue({ url: "https://jahat.example", readAt: null });
    expect(await n.markRead("u1", "n1")).toEqual({ found: true, url: null });
  });
});

describe("markAllRead", () => {
  it("hanya milik pengguna yang belum dibaca", async () => {
    updateMany.mockResolvedValue({ count: 3 });
    expect(await n.markAllRead("u1")).toBe(3);
    expect(updateMany.mock.calls[0][0].where).toEqual({ userId: "u1", readAt: null });
  });
});

describe("purgeOldNotifications", () => {
  it("menghapus yang lebih dari 90 hari", async () => {
    deleteMany.mockResolvedValue({ count: 7 });
    const now = new Date("2026-10-04T00:00:00Z");
    expect(await n.purgeOldNotifications(now)).toBe(7);
    expect(deleteMany).toHaveBeenCalledWith({ where: { createdAt: { lt: new Date("2026-07-06T00:00:00Z") } } });
  });
});

describe("safeInternalUrl", () => {
  it("hanya alamat di dalam aplikasi", () => {
    expect(n.safeInternalUrl("/coach/jadwal")).toBe("/coach/jadwal");
    expect(n.safeInternalUrl("//jahat.example")).toBeNull();
    expect(n.safeInternalUrl("/\\jahat.example")).toBeNull();
    expect(n.safeInternalUrl("https://jahat.example")).toBeNull();
    expect(n.safeInternalUrl(null)).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-04T10:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  it("bahasa Indonesia baku", () => {
    expect(n.formatRelativeTime(ago(20_000), now)).toBe("Baru saja");
    expect(n.formatRelativeTime(ago(5 * 60_000), now)).toBe("5 menit yang lalu");
    expect(n.formatRelativeTime(ago(3 * 3_600_000), now)).toBe("3 jam yang lalu");
    expect(n.formatRelativeTime(ago(2 * 86_400_000), now)).toBe("2 hari yang lalu");
  });
  it("lewat 7 hari: tanggal WIB", () => {
    // 26 Sep 2026 20.00 UTC = 27 Sep 03.00 WIB
    expect(n.formatRelativeTime(new Date("2026-09-26T20:00:00Z"), now)).toBe("27 September 2026");
  });
  it("waktu lengkap selalu WIB", () => {
    expect(n.formatFullTimeWib(new Date("2026-09-26T20:00:00Z"))).toBe("Minggu, 27 September 2026 pukul 03.00 WIB");
  });
});
