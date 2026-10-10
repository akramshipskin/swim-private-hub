import { describe, expect, it } from "vitest";
import { splitPlatformTax } from "./policy";

describe("splitPlatformTax", () => {
  it("treats commission as tax-inclusive 11%", () => {
    expect(splitPlatformTax(11_100)).toEqual({ net: 10_000, tax: 1_100 });
    // Contoh Hadi: SPH Rp10.000 dari sesi Rp100.000 -> PPN 991, bersih 9.009.
    expect(splitPlatformTax(10_000)).toEqual({ net: 9_009, tax: 991 });
  });
  it("always sums back to the commission", () => {
    const { net, tax } = splitPlatformTax(14_062);
    expect(net + tax).toBe(14_062);
  });
});

describe("adminSessionExpired (TRD T6)", async () => {
  const { adminSessionExpired, ADMIN_SESSION_MAX_DAYS } = await import("./policy");
  const DAY = 86_400_000;
  it("tanpa waktu masuk = kedaluwarsa; 14 hari pas masih berlaku; lewat = kedaluwarsa", () => {
    const now = Date.parse("2026-10-20T00:00:00Z");
    expect(ADMIN_SESSION_MAX_DAYS).toBe(14);
    expect(adminSessionExpired(undefined, now)).toBe(true);
    expect(adminSessionExpired(now - 14 * DAY, now)).toBe(false);
    expect(adminSessionExpired(now - 14 * DAY - 1, now)).toBe(true);
  });
});

