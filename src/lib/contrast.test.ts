import { describe, expect, it } from "vitest";
import { contrastRatio, wcagLevel } from "./contrast";

describe("contrastRatio", () => {
  it("gives 21:1 for pure black on pure white (max possible ratio)", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("gives 1:1 for a color against itself", () => {
    expect(contrastRatio("#14140F", "#14140F")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = contrastRatio("#14140F", "#F6F6EE");
    const b = contrastRatio("#F6F6EE", "#14140F");
    expect(a).toBeCloseTo(b, 10);
  });

  it("matches the app's main text on light background (~17:1, from globals.css)", () => {
    expect(contrastRatio("#14140F", "#F6F6EE")).toBeCloseTo(17.01, 1);
  });

  it("matches the app's main text on dark background (~13.97:1, from globals.css dark mode)", () => {
    expect(contrastRatio("#E8E6DC", "#191A17")).toBeCloseTo(13.97, 1);
  });
});

describe("wcagLevel", () => {
  it("returns AAA at or above 7:1", () => {
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(18.47)).toBe("AAA");
  });

  it("returns AA between 4.5:1 and 7:1", () => {
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(6.99)).toBe("AA");
  });

  it("returns AA-large between 3:1 and 4.5:1 (old kit's Rose badge: 4.28:1)", () => {
    expect(wcagLevel(3)).toBe("AA-large");
    expect(wcagLevel(4.28)).toBe("AA-large");
  });

  it("returns fail below 3:1 (old kit's textSubtle #8B8770 on white: 3.62:1 still passes, but a lower ratio should not)", () => {
    expect(wcagLevel(2.99)).toBe("fail");
    expect(wcagLevel(1)).toBe("fail");
  });
});
