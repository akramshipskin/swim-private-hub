import { describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));
const findMany = vi.fn().mockResolvedValue([{ date: new Date("2026-10-05T00:00:00Z") }]);
vi.mock("@/lib/prisma", () => ({ prisma: { availability: { findMany: (...a: unknown[]) => findMany(...a) } } }));

const { GET } = await import("./route");
const req = () => new Request("http://x/api/coach/schedule-dates?year=2026&month=10");

describe("GET /api/coach/schedule-dates: gerbang perjanjian kemitraan", () => {
  it("coach yang belum menyetujui perjanjian ditolak", async () => {
    auth.mockResolvedValue({ user: { id: "c1", role: "COACH", needsPartnerAgreement: true } });
    expect((await GET(req())).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("coach yang sudah menyetujui mendapat tanggal", async () => {
    auth.mockResolvedValue({ user: { id: "c1", role: "COACH", needsPartnerAgreement: false } });
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dates: ["2026-10-05"] });
  });
});
