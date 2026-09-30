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
