import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "coach-1", name: "Coach Rina" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// actions.ts import @/lib/push buat notif addAvailability -- modul itu
// manggil webpush.setVapidDetails() pas di-import (efek samping level
// modul), yang meledak di test env karena env var VAPID gak keisi.
const sendPushToUsers = vi.fn();
vi.mock("@/lib/push", () => ({ sendPushToUsers: (...a: unknown[]) => sendPushToUsers(...a) }));

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
const userFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolAffiliation: { findUnique: (...a: unknown[]) => affiliationFindUnique(...a) },
    availability: { createMany: (...a: unknown[]) => availabilityCreateMany(...a), findMany: (...a: unknown[]) => availabilityFindMany(...a) },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
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
  affiliationFindUnique.mockResolvedValue({ pool: { name: "Kolam Melati" } });
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

  it("refuses a pool the coach is not affiliated with, without notifying anyone", async () => {
    affiliationFindUnique.mockResolvedValue(null);
    const res = await addAvailability(null, slotForm({}));
    expect(res?.error).toBe("Kamu tidak terafiliasi ke kolam ini.");
    expect(availabilityCreateMany).not.toHaveBeenCalled();
    expect(sendPushToUsers).not.toHaveBeenCalled();
  });
});
