import { describe, it, expect } from "vitest";
import { dropInPrice, dropInEligibilityWhere } from "./drop-in";

describe("dropInPrice", () => {
  it("returns null when the pool has no templates", () => {
    expect(dropInPrice([])).toBeNull();
  });

  it("uses the most expensive per-session price plus 20% markup, rounded up to thousands", () => {
    // 200000/8 = 25000, 100000/2 = 50000 -> 50000 * 1.2 = 60000
    expect(dropInPrice([{ price: 200_000, totalSesi: 8 }, { price: 100_000, totalSesi: 2 }])).toBe(60_000);
  });

  it("rounds up, never down", () => {
    // 101000/3 = 33666.67 * 1.2 = 40400 -> 41000
    expect(dropInPrice([{ price: 101_000, totalSesi: 3 }])).toBe(41_000);
  });

  it("ignores templates with zero sessions", () => {
    expect(dropInPrice([{ price: 50_000, totalSesi: 0 }])).toBeNull();
  });
});

describe("dropInEligibilityWhere", () => {
  it("only counts usable non-single-session packages of that member", () => {
    const where = dropInEligibilityWhere("m1");
    expect(where).toMatchObject({ memberId: "m1", status: "ACTIVE", sisaSesi: { gt: 0 }, isSingleSession: false });
  });
});
