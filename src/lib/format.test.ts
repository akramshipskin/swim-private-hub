import { describe, expect, it } from "vitest";
import { isValidIndonesianPhone, toProperCase } from "./format";

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

describe("isValidIndonesianPhone", () => {
  it("accepts a number with leading 0", () => {
    expect(isValidIndonesianPhone("081234567890")).toBe(true);
  });

  it("accepts a number with 62 country code", () => {
    expect(isValidIndonesianPhone("6281234567890")).toBe(true);
  });

  it("accepts a number with +62 country code", () => {
    expect(isValidIndonesianPhone("+6281234567890")).toBe(true);
  });

  it("accepts a number with spaces/dashes as separators", () => {
    expect(isValidIndonesianPhone("0812-3456-7890")).toBe(true);
  });

  it("rejects a number too short to be a real mobile number", () => {
    expect(isValidIndonesianPhone("08123")).toBe(false);
  });

  it("rejects a number without a valid Indonesian prefix", () => {
    expect(isValidIndonesianPhone("12345678900")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidIndonesianPhone("bukan-nomor-hp")).toBe(false);
  });
});
