import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "coach-1", name: "Coach Rina" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// actions.ts import @/lib/push buat notif addAvailability -- modul itu
// manggil webpush.setVapidDetails() pas di-import (efek samping level
// modul), yang meledak di test env karena env var VAPID gak keisi.
const sendPushToUsers = vi.fn();
vi.mock("@/lib/push", () => ({ sendPushToUsers: (...a: unknown[]) => sendPushToUsers(...a) }));
const notifyUser = vi.fn();
vi.mock("@/lib/notify", () => ({ notifyUser: (...a: unknown[]) => notifyUser(...a) }));
vi.mock("@/lib/coach-pools", () => ({ notifyWaitlistForPool: vi.fn().mockResolvedValue(0) }));
const takeAttempt = vi.fn().mockResolvedValue("hit-1");
vi.mock("@/lib/rate-limit", () => ({ takeAttempt: (...a: unknown[]) => takeAttempt(...a) }));
const ownershipFindMany = vi.fn().mockResolvedValue([{ ownerId: "owner-1" }]);

const cancelBooking = vi.fn();
class MockCancelError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
vi.mock("@/lib/cancel-booking", () => ({
  cancelBooking: (...args: unknown[]) => cancelBooking(...args),
  CancelError: MockCancelError,
}));

const affiliationFindUnique = vi.fn();
const availabilityCreateMany = vi.fn();
const availabilityFindMany = vi.fn();
const availabilityUpdateMany = vi.fn();
const userFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolAffiliation: { findUnique: (...a: unknown[]) => affiliationFindUnique(...a) },
    availability: { createMany: (...a: unknown[]) => availabilityCreateMany(...a), findMany: (...a: unknown[]) => availabilityFindMany(...a), updateMany: (...a: unknown[]) => availabilityUpdateMany(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
    poolOwnership: { findMany: (...a: unknown[]) => ownershipFindMany(...a) },
  },
}));

const { cancelBookingAsCoach, addAvailability } = await import("./actions");

function formData(bookingId: string) {
  const fd = new FormData();
  fd.set("bookingId", bookingId);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  affiliationFindUnique.mockResolvedValue({ pool: { name: "Kolam Melati", openTime: "06:00", closeTime: "21:00", isActive: true } });
  availabilityFindMany.mockResolvedValue([]);
  availabilityCreateMany.mockResolvedValue({ count: 2 });
  userFindMany.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
  sendPushToUsers.mockResolvedValue(undefined);
});

describe("cancelBookingAsCoach", () => {
  it("requires a bookingId", async () => {
    const result = await cancelBookingAsCoach(null, new FormData());
    expect(result?.error).toBeTruthy();
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it("delegates to cancelBooking with a COACH actor scoped to the signed-in coach", async () => {
    cancelBooking.mockResolvedValue(undefined);
    const result = await cancelBookingAsCoach(null, formData("booking-1"));
    expect(result).toBeNull();
    expect(cancelBooking).toHaveBeenCalledWith({
      bookingId: "booking-1",
      actor: { role: "COACH", coachId: "coach-1" },
    });
  });

  it("surfaces a CancelError message instead of throwing (e.g. not this coach's session)", async () => {
    cancelBooking.mockRejectedValue(new MockCancelError("Bukan sesi kamu", 403));
    const result = await cancelBookingAsCoach(null, formData("booking-1"));
    expect(result).toEqual({ error: "Bukan sesi kamu" });
  });

  it("rethrows a non-CancelError instead of swallowing it", async () => {
    cancelBooking.mockRejectedValue(new Error("unexpected DB error"));
    await expect(cancelBookingAsCoach(null, formData("booking-1"))).rejects.toThrow("unexpected DB error");
  });
});

function slotForm(o: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ date: "2099-01-05", startTime: "08:00", endTime: "10:00", poolId: "pool-1", ...o })) fd.set(k, v);
  return fd;
}

describe("addAvailability input validation", () => {
  // Regression: tanggal/jam ngaco dulu jadi Invalid Date -> 0 slot kebuat
  // tapi dianggap sukses.
  it("rejects a malformed date or time instead of reporting a fake success", async () => {
    for (const bad of [{ date: "xyz" }, { startTime: "abc" }, { endTime: "9" }] as Record<string, string>[]) {
      const res = await addAvailability(null, slotForm(bad));
      expect(res).toMatchObject({ error: expect.stringContaining("tidak valid") });
    }
    expect(availabilityCreateMany).not.toHaveBeenCalled();
  });

  it("tells the coach when the range only covers the lunch break", async () => {
    const res = await addAvailability(null, slotForm({ startTime: "12:00", endTime: "13:00" }));
    expect(res).toMatchObject({ error: expect.stringContaining("istirahat") });
    expect(availabilityCreateMany).not.toHaveBeenCalled();
  });
});

describe("addAvailability new-slot notification", () => {
  // Bug sweep 24 Sep: dulu dikirim ke SEMUA member di semua kolam, lewat
  // promise yang gak ditunggu (bisa terputus di Vercel).
  it("targets only members with a usable package in THIS pool", async () => {
    await addAvailability(null, slotForm({}));
    const where = userFindMany.mock.calls[0][0].where;
    expect(where.role).toBe("MEMBER");
    expect(where.isActive).toBe(true);
    expect(where.packages.some.poolId).toBe("pool-1");
    expect(where.packages.some.status).toBe("ACTIVE");
    expect(where.packages.some.sisaSesi).toEqual({ gt: 0 });
  });

  it("awaits one batched push with the pool name and time range", async () => {
    await addAvailability(null, slotForm({}));
    expect(sendPushToUsers).toHaveBeenCalledTimes(1);
    const [ids, payload] = sendPushToUsers.mock.calls[0];
    expect(ids).toEqual(["m1", "m2"]);
    expect(payload.body).toContain("Coach Rina");
    expect(payload.body).toContain("Kolam Melati");
    expect(payload.body).toContain("08.00–10.00");
    expect(payload.url).toBe("/member/booking");
  });

  it("still saves the slots and returns no error when the push fails", async () => {
    sendPushToUsers.mockRejectedValue(new Error("push down"));
    await expect(addAvailability(null, slotForm({}))).resolves.toBeNull();
    expect(availabilityCreateMany).toHaveBeenCalledTimes(1);
  });

  it("still saves the slots when looking up recipients fails", async () => {
    userFindMany.mockRejectedValue(new Error("db hiccup"));
    await expect(addAvailability(null, slotForm({}))).resolves.toBeNull();
    expect(availabilityCreateMany).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when every requested hour already exists", async () => {
    availabilityFindMany.mockResolvedValue([
      { startTime: new Date("2099-01-05T01:00:00Z"), endTime: new Date("2099-01-05T02:00:00Z") },
      { startTime: new Date("2099-01-05T02:00:00Z"), endTime: new Date("2099-01-05T03:00:00Z") },
    ]);
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toContain("sudah pernah dibuka");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
    expect(sendPushToUsers).not.toHaveBeenCalled();
  });

  // Slot yang dulu "dihapus" tapi ditutup (punya riwayat booking) tidak kelihatan
  // di daftar coach -- pesannya tidak boleh menyuruh "hapus slot lamanya".
  const closed = (h: number, poolId: string, poolName: string, id = `s${h}`) => ({
    id, status: "CLOSED", poolId, pool: { name: poolName },
    startTime: new Date(`2099-01-05T0${h}:00:00Z`), endTime: new Date(`2099-01-05T0${h + 1}:00:00Z`),
  });

  it("names the other pool when every hour is closed there, without telling the coach to delete anything", async () => {
    availabilityFindMany.mockResolvedValue([closed(1, "pool-2", "Kolam Mawar"), closed(2, "pool-2", "Kolam Mawar")]);
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toContain("Kolam Mawar");
    expect(res?.error).toContain("tidak bisa dipindah");
    expect(res?.error).not.toContain("hapus slot lamanya");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
    expect(availabilityUpdateMany).not.toHaveBeenCalled();
  });

  it("reopens hours closed in the SAME pool instead of treating them as conflicts", async () => {
    availabilityFindMany.mockResolvedValue([closed(1, "pool-1", "Kolam Melati", "old-1")]);
    const res = await addAvailability(null, slotForm({}));
    expect(res).toBeNull();
    expect(availabilityUpdateMany).toHaveBeenCalledWith({ where: { id: { in: ["old-1"] }, status: "CLOSED" }, data: { status: "AVAILABLE" } });
    expect(availabilityCreateMany).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ startTime: new Date("2099-01-05T02:00:00Z") })] }));
  });

  it("warns (not errors) when only some hours are blocked by a slot closed in another pool", async () => {
    availabilityFindMany.mockResolvedValue([closed(1, "pool-2", "Kolam Mawar")]);
    const res = await addAvailability(null, slotForm({}));
    expect(res).toEqual({ warning: expect.stringContaining("Kolam Mawar") });
    expect(availabilityCreateMany).toHaveBeenCalledTimes(1);
  });

  // Jam buka kolam (Hadi 2 Okt malam, #6).
  it("menolak jam di luar jam buka kolam tanpa membuat slot apa pun", async () => {
    affiliationFindUnique.mockResolvedValue({ pool: { name: "Kolam Melati", openTime: "08:00", closeTime: "10:00", isActive: true } });
    const res = await addAvailability(null, slotForm({ startTime: "08:00", endTime: "11:00" }));
    expect(res?.error).toContain("di luar jam buka Kolam Melati (08.00–10.00)");
    expect(res?.error).toContain("10.00–11.00");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
  });

  it("kolam tanpa jam buka: slot baru ditolak, pemilik kolam diberi tahu (dibatasi sekali sehari)", async () => {
    affiliationFindUnique.mockResolvedValue({ pool: { name: "Kolam Melati", openTime: null, closeTime: null, isActive: true } });
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toContain("Jam buka Kolam Melati belum diisi");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
    expect(notifyUser).toHaveBeenCalledWith("owner-1", "Isi jam buka kolam", expect.stringContaining("Kolam Melati"), "/pool/info");
    notifyUser.mockClear();
    takeAttempt.mockResolvedValueOnce(null);
    await addAvailability(null, slotForm({}));
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("kolam nonaktif: slot baru ditolak", async () => {
    affiliationFindUnique.mockResolvedValue({ pool: { name: "Kolam Melati", openTime: "06:00", closeTime: "21:00", isActive: false } });
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toContain("Kolam Melati sedang tidak aktif");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
  });

  it("refuses a pool the coach is not affiliated with, without notifying anyone", async () => {
    affiliationFindUnique.mockResolvedValue(null);
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toBe("Kamu belum memilih kolam ini. Pilih dulu di menu Kolam Saya.");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
    expect(sendPushToUsers).not.toHaveBeenCalled();
  });
});
