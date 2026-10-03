import { describe, expect, it } from "vitest";
import { CITIES, isCity, NEARBY_CITIES } from "./cities";

describe("cities", () => {
  it("menerima hanya kota di daftar", () => {
    expect(isCity("Jakarta")).toBe(true);
    expect(isCity("jakarta")).toBe(false);
    expect(isCity("Semarang")).toBe(false);
    expect(isCity(null)).toBe(false);
    expect(isCity(1)).toBe(false);
  });

  it("saran kota terdekat selalu kota lain yang ada di daftar", () => {
    for (const c of CITIES) {
      expect(NEARBY_CITIES[c].length).toBeGreaterThan(0);
      for (const n of NEARBY_CITIES[c]) {
        expect(isCity(n)).toBe(true);
        expect(n).not.toBe(c);
      }
    }
  });
});
