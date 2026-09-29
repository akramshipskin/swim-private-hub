import { describe, it, expect } from "vitest";
import { isDemoAccountEmail, rankLandingCoaches } from "./landing-rank";

const c = (id: string, email: string | null) => ({ id, name: id, email });

describe("rankLandingCoaches", () => {
  it("mengenali email demo (huruf besar/kecil), bukan email lain", () => {
    expect(isDemoAccountEmail("dewi.coach@example.com")).toBe(true);
    expect(isDemoAccountEmail("X@EXAMPLE.COM")).toBe(true);
    expect(isDemoAccountEmail("a@example.com.evil.id")).toBe(false);
    expect(isDemoAccountEmail(null)).toBe(false);
  });
  it("coach asli tanpa sesi tetap menggeser demo yang banyak sesi; demo mengisi sisa slot", () => {
    const demo = ["d1", "d2", "d3", "d4", "d5"].map((id) => c(id, `${id}@example.com`));
    const real = c("asli", "coach@gmail.com");
    const attended = new Map(demo.map((d) => [d.id, 9]));
    const top = rankLandingCoaches([...demo, real], attended);
    expect(top.map((x) => x.id)).toEqual(["asli", "d1", "d2", "d3", "d4"]);
  });
  it("tanpa email (null) dihitung asli", () => {
    expect(rankLandingCoaches([c("demo", "a@example.com"), c("tanpa", null)], new Map()).map((x) => x.id)).toEqual(["tanpa", "demo"]);
  });
});
