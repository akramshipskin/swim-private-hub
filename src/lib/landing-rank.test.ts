import { describe, it, expect } from "vitest";
import { isDemoAccountEmail, isDemoPool, rankLandingCoaches, rankLandingPools } from "./landing-rank";

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

const p = (name: string, ownerEmails: (string | null)[] = []) => ({ id: name, name, ownerEmails });

describe("isDemoPool", () => {
  it("nama kolam contoh dikenali walau tanpa pemilik", () => {
    expect(isDemoPool(p("Kolam Renang Melati"))).toBe(true);
    expect(isDemoPool(p("Kolam Renang Tirta Asri"))).toBe(true);
  });
  it("semua pemilik akun demo -> demo; satu saja pemilik asli -> asli; tanpa pemilik & bukan nama contoh -> asli", () => {
    expect(isDemoPool(p("Kolam Baru", ["x@example.com"]))).toBe(true);
    expect(isDemoPool(p("Kolam Baru", ["x@example.com", "asli@gmail.com"]))).toBe(false);
    expect(isDemoPool(p("Kolam Baru", [null]))).toBe(false);
    expect(isDemoPool(p("Kolam Cianjur"))).toBe(false);
  });
});

describe("rankLandingPools", () => {
  const demos = ["Kolam Renang Melati", "Kolam Renang Tirta Asri", "Kolam Renang Bahari", "Kolam Renang Cempaka", "Kolam Renang Samudra"].map((n) => p(n));
  it("tanpa kolam asli -> 5 demo mengisi semua slot", () => {
    expect(rankLandingPools(demos, new Map())).toHaveLength(5);
  });
  it("tiap kolam asli menggeser satu demo, walau demo lebih laris; total tetap maksimal 5", () => {
    const sold = new Map(demos.map((d) => [d.id, 50]));
    const top = rankLandingPools([...demos, p("Asli A"), p("Asli B")], sold).map((x) => x.id);
    expect(top).toHaveLength(5);
    expect(top.slice(0, 2).sort()).toEqual(["Asli A", "Asli B"]);
    expect(top.filter((n) => n.startsWith("Kolam Renang"))).toHaveLength(3);
  });
  it("6 kolam asli -> tidak ada demo, yang paling laris dulu, yang ke-6 terpotong", () => {
    const real = ["A", "B", "C", "D", "E", "F"].map((n) => p(n));
    const sold = new Map([["F", 9], ["E", 8], ["D", 7], ["C", 6], ["B", 5], ["A", 4]]);
    expect(rankLandingPools([...demos, ...real], sold).map((x) => x.id)).toEqual(["F", "E", "D", "C", "B"]);
  });
  it("imbang penjualan -> urut nama", () => {
    expect(rankLandingPools([p("Z"), p("A")], new Map()).map((x) => x.id)).toEqual(["A", "Z"]);
  });
});
