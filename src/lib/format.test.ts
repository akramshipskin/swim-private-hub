import { describe, expect, it } from "vitest";
import { toProperCase } from "./format";

describe("toProperCase", () => {
  it("capitalizes the first letter of an all-lowercase name", () => {
    expect(toProperCase("hanief akram")).toBe("Hanief Akram");
  });

  it("leaves the rest of each word untouched (does not force-lowercase)", () => {
    expect(toProperCase("TTT architect")).toBe("TTT Architect");
  });

  it("handles a package name starting with a digit", () => {
    expect(toProperCase("8x renang")).toBe("8x Renang");
  });

  it("collapses no whitespace and leaves single words alone", () => {
    expect(toProperCase("bayu")).toBe("Bayu");
  });
});
