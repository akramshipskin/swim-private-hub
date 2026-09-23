import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/push", () => ({ sendPushToUser: vi.fn().mockResolvedValue(undefined) }));

const findUnique = vi.fn();
const bookingUpdateMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: (...args: unknown[]) => findUnique(...args) },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        $queryRaw: vi.fn().mockResolvedValue([{ jatahCancel: 2 }]),
        booking: { count: vi.fn().mockResolvedValue(0), updateMany: (...args: unknown[]) => bookingUpdateMany(...args) },
        availability: { update: vi.fn().mockResolvedValue({}) },
        package: { update: vi.fn().mockResolvedValue({}) },
      }),
  },
}));

const { cancelBooking } = await import("./cancel-booking");

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "b-1",
    memberId: "m-1",
    packageId: "p-1",
    availabilityId: "a-1",
    status: "BOOKED",
    attended: null,
    availability: { coachId: "c-1", date: new Date("2026-09-23T00:00:00Z"), startTime: new Date(Date.now() + 48 * 3600e3) },
    package: { dependent: { name: "Bimo" } },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  bookingUpdateMany.mockResolvedValue({ count: 1 });
});

describe("cancelBooking notification date", () => {
  // Regression: notif dulu pakai startTime (UTC) buat tanggal -> sesi
  // Rabu 00.30 WIB (= Selasa 17.30 UTC) ketulis "Selasa, 00.30".
  it("labels an early-morning WIB session with its WIB calendar day", async () => {
    const { sendPushToUser } = await import("@/lib/push");
    findUnique.mockResolvedValue(
      booking({
        availability: {
          coachId: "c-1",
          date: new Date("2099-09-23T00:00:00Z"),
          startTime: new Date("2099-09-22T17:30:00Z"),
        },
      })
    );
    await cancelBooking({ bookingId: "b-1", actor: { role: "ADMIN" } });
    const body = vi.mocked(sendPushToUser).mock.calls[0][1].body;
    expect(body).toContain("23 September 2099");
    expect(body).toContain("00.30");
  });
});

describe("cancelBooking", () => {
  // Regression (tes race lokal 2026-09-17): sesi yang udah ditandai Hadir
  // dibatalin -> sisa sesi member balik, tapi kredit wallet coach/kolam gak
  // dibalik. Harus ditolak buat semua role.
  it("refuses to cancel a booking whose attendance is already marked, for every role", async () => {
    for (const actor of [{ role: "ADMIN" as const }, { role: "COACH" as const, coachId: "c-1" }]) {
      findUnique.mockResolvedValue(booking({ attended: true }));
      await expect(cancelBooking({ bookingId: "b-1", actor })).rejects.toThrow("sudah ditandai kehadirannya");
    }
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a coach cancelling a session that already started", async () => {
    findUnique.mockResolvedValue(booking({ availability: { coachId: "c-1", date: new Date("2026-09-23T00:00:00Z"), startTime: new Date(Date.now() - 3600e3) } }));
    await expect(cancelBooking({ bookingId: "b-1", actor: { role: "COACH", coachId: "c-1" } })).rejects.toThrow("sudah mulai/lewat");
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("still lets admin cancel an unmarked past session (force majeure)", async () => {
    findUnique.mockResolvedValue(booking({ availability: { coachId: "c-1", date: new Date("2026-09-23T00:00:00Z"), startTime: new Date(Date.now() - 3600e3) } }));
    await cancelBooking({ bookingId: "b-1", actor: { role: "ADMIN" } });
    expect(bookingUpdateMany).toHaveBeenCalled();
  });

  // Pasangan CAS markAttendance: klaim batal cuma lolos kalau booking masih
  // BOOKED DAN belum ditandai, dicek atomic di DB (bukan cuma dari data yang
  // dibaca di awal).
  it("claims the booking with status BOOKED and attended null in the same conditional update", async () => {
    findUnique.mockResolvedValue(booking());
    await cancelBooking({ bookingId: "b-1", actor: { role: "ADMIN" } });
    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b-1", status: "BOOKED", attended: null } })
    );
  });
});
