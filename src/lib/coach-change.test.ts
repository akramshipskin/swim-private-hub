import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/notify", () => ({ notifyUser: vi.fn() }));
const { coachChangeAmount, repricePackage, sessionValue } = await import("./coach-change");

const pkg = { totalSesi: 8, poolPrice: 480_000, coachPrice: 800_000, serviceFee: 83_200 };

describe("hitung ulang ganti coach", () => {
  it("nilai sesi = floor(harga paket / sesi)", () => {
    expect(sessionValue(pkg)).toBe(170_400);
  });
  it("biaya layanan ikut tarif saat beli (6,5%)", () => {
    expect(repricePackage(pkg, 640_000)).toEqual({ ...pkg, coachPrice: 640_000, serviceFee: 72_800 });
    expect(repricePackage(pkg, 1_120_000).serviceFee).toBe(104_000);
  });
  it("coach lebih murah: selisih negatif (masuk saldo member)", () => {
    expect(coachChangeAmount(pkg, 640_000, 7)).toEqual({ perSession: -21_300, amount: -149_100 });
  });
  it("coach lebih mahal: member tambah bayar", () => {
    expect(coachChangeAmount(pkg, 1_120_000, 8)).toEqual({ perSession: 42_600, amount: 340_800 });
  });
  it("harga sama: tanpa selisih; tanpa sisa sesi: 0", () => {
    expect(coachChangeAmount(pkg, 800_000, 5).amount).toBe(0);
    expect(coachChangeAmount(pkg, 640_000, 0).amount).toBe(0);
  });
});
