import { describe, expect, it } from "vitest";
import { splitPlatformTax } from "./policy";

describe("splitPlatformTax", () => {
  it("treats commission as tax-inclusive 12%", () => {
    expect(splitPlatformTax(11_200)).toEqual({ net: 10_000, tax: 1_200 });
  });
  it("always sums back to the commission", () => {
    const { net, tax } = splitPlatformTax(14_062);
    expect(net + tax).toBe(14_062);
  });
});
