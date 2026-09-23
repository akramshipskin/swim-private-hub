import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "coach-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// actions.ts import @/lib/push buat notif addAvailability -- modul itu
// manggil webpush.setVapidDetails() pas di-import (efek samping level
// modul), yang meledak di test env karena env var VAPID gak keisi.
vi.mock("@/lib/push", () => ({ sendPushToUser: vi.fn() }));

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

const affiliationFindUnique = vi.fn().mockResolvedValue({ poolId: "pool-1" });
const availabilityCreateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    poolAffiliation: { findUnique: (...a: unknown[]) => affiliationFindUnique(...a) },
    availability: { createMany: (...a: unknown[]) => availabilityCreateMany(...a), findMany: vi.fn().mockResolvedValue([]) },
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
    for (const bad of [{ date: "xyz" }, { startTime: "abc" }, { endTime: "9" }]) {
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
