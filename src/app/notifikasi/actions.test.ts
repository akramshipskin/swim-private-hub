import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const findFirst = vi.fn();
const updateMany = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    inAppNotification: {
      findFirst: (...a: unknown[]) => findFirst(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      count: (...a: unknown[]) => count(...a),
    },
  },
}));

const { markNotificationRead, markAllNotificationsRead } = await import("./actions");
const { GET } = await import("@/app/api/notifikasi/jumlah/route");

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
  updateMany.mockResolvedValue({ count: 1 });
});

describe("markNotificationRead", () => {
  it("tanpa login ditolak, tanpa menyentuh database", async () => {
    auth.mockResolvedValue(null);
    expect(await markNotificationRead("n1")).toHaveProperty("error");
    expect(findFirst).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("akun yang wajib ganti password / setujui perjanjian ditolak", async () => {
    auth.mockResolvedValue({ user: { id: "u1", mustChangePassword: true } });
    expect(await markNotificationRead("n1")).toHaveProperty("error");
    auth.mockResolvedValue({ user: { id: "c1", needsPartnerAgreement: true } });
    expect(await markNotificationRead("n1")).toHaveProperty("error");
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("notifikasi milik orang lain ditolak (dicari dengan userId sesi)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await markNotificationRead("milik-u2")).toEqual({ error: "Notifikasi tidak ditemukan." });
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: "milik-u2", userId: "u1" });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("id bukan teks ditolak", async () => {
    expect(await markNotificationRead({ id: "x" })).toHaveProperty("error");
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("milik sendiri: ditandai dibaca, url dikembalikan", async () => {
    findFirst.mockResolvedValue({ url: "/member/booking", readAt: null });
    expect(await markNotificationRead("n1")).toEqual({ ok: true, url: "/member/booking" });
    expect(updateMany.mock.calls[0][0].where).toEqual({ id: "n1", userId: "u1", readAt: null });
  });
});

describe("markAllNotificationsRead", () => {
  it("tanpa login ditolak", async () => {
    auth.mockResolvedValue(null);
    expect(await markAllNotificationsRead()).toHaveProperty("error");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("hanya milik pengguna yang masuk", async () => {
    expect(await markAllNotificationsRead()).toEqual({ ok: true, url: null });
    expect(updateMany.mock.calls[0][0].where).toEqual({ userId: "u1", readAt: null });
  });
});

describe("GET /api/notifikasi/jumlah", () => {
  it("tanpa login: 401, tanpa query", async () => {
    auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(count).not.toHaveBeenCalled();
  });

  it("akun tertahan gerbang: 403", async () => {
    auth.mockResolvedValue({ user: { id: "a1", needsTotpSetup: true } });
    expect((await GET()).status).toBe(403);
    expect(count).not.toHaveBeenCalled();
  });

  it("jumlah belum dibaca milik pengguna, tidak di-cache", async () => {
    count.mockResolvedValue(10);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ count: 10 });
    expect(count.mock.calls[0][0].where).toEqual({ userId: "u1", readAt: null });
  });
});
