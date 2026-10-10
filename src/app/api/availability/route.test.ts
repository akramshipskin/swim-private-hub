import { describe, expect, it, vi } from "vitest";

const auth = vi.fn().mockResolvedValue({ user: { id: "m1", role: "MEMBER" } });
vi.mock("@/auth", () => ({ auth: () => auth() }));
const findMany = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/prisma", () => ({ prisma: { availability: { findMany: (...a: unknown[]) => findMany(...a) } } }));

const { GET } = await import("./route");

describe("GET /api/availability", () => {
  it("pemilik kolam dan coach ditolak, tanpa membaca database (Hadi 11 Okt, T14)", async () => {
    for (const role of ["POOL_OWNER", "COACH"]) {
      auth.mockResolvedValueOnce({ user: { id: "x", role } });
      expect((await GET(new Request("http://x/api/availability?date=2099-01-05"))).status).toBe(403);
    }
    expect(findMany).not.toHaveBeenCalled();
  });

  // Regression: ?date=xyz dulu jadi Invalid Date di query -> 500.
  it("returns 400 for a malformed date without querying the DB", async () => {
    for (const d of ["xyz", "2026-13-45", "2026-9-1"]) {
      const res = await GET(new Request(`http://x/api/availability?date=${d}`));
      expect(res.status).toBe(400);
    }
    expect(findMany).not.toHaveBeenCalled();
  });

  it("accepts a well-formed date", async () => {
    const res = await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"));
    expect(res.status).toBe(200);
  });

  // Regression: slot di kolam nonaktif dulu ikut tampil (booking-nya ditolak
  // di /api/booking, tapi member tetap melihat slot yang tidak bisa dipakai).
  it("only queries slots in active pools, with or without a poolId filter", async () => {
    for (const url of ["http://x/api/availability?date=2099-01-05&poolId=p1", "http://x/api/availability?date=2099-01-05"]) {
      findMany.mockClear();
      await GET(new Request(url));
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findMany.mock.calls[0][0].where.pool).toEqual({ isActive: true });
    }
  });

  it("menyembunyikan slot kosong di luar jam buka atau di tanggal kolam yang sudah penuh; slot milik sendiri tetap tampil", async () => {
    const date = new Date("2099-01-05T00:00:00Z");
    const slot = (id: string, hour: number, cap: number | null, booked = false) => ({
      id, poolId: "p1", date, status: booked ? "BOOKED" : "AVAILABLE",
      startTime: new Date(`2099-01-05T${String(hour).padStart(2, "0")}:00:00+07:00`),
      endTime: new Date(`2099-01-05T${String(hour + 1).padStart(2, "0")}:00:00+07:00`),
      pool: { openTime: "06:00", closeTime: "18:00", dailyCapacity: cap },
      coach: { id: "c1", name: "C", coachProfile: null },
      bookings: booked ? [{ id: "b1", memberId: "m2", packageId: "k1", status: "BOOKED", package: { dependent: { name: "A", isSelf: false } } }] : [],
    });
    // Kapasitas 1: sudah ada 1 booking hari itu -> slot kosong lain disembunyikan.
    findMany.mockResolvedValueOnce([slot("full", 8, 1), slot("late", 19, null), slot("other", 9, 1, true)]);
    findMany.mockResolvedValueOnce([{ poolId: "p1", date }]);
    const res = await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"));
    const ids = (await res.json()).availabilities.map((a: { id: string }) => a.id);
    expect(ids).toEqual(["other"]);
    findMany.mockResolvedValueOnce([slot("open", 8, 2)]);
    findMany.mockResolvedValueOnce([{ poolId: "p1", date }]);
    expect((await (await GET(new Request("http://x/api/availability?date=2099-01-05&poolId=p1"))).json()).availabilities.map((a: { id: string }) => a.id)).toEqual(["open"]);
  });
});
