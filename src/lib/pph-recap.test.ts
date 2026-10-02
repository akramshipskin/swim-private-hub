import { describe, expect, it } from "vitest";
import { buildPphRecap, monthRangeWib, pphKey } from "./pph-recap";

const r = (type: string, amount: number, owner: { poolId?: string; coachProfileId?: string }, bookingId: string | null = "b1") => ({
  type,
  amount,
  poolId: owner.poolId ?? null,
  coachProfileId: owner.coachProfileId ?? null,
  bookingId,
});

describe("buildPphRecap", () => {
  it("menjumlah bruto dan PPh per kolam/coach; pembalikan mengurangi keduanya", () => {
    const rows = [
      r("SESSION_REVENUE", 60_000, { poolId: "p1" }),
      r("PPH_WITHHELD", -300, { poolId: "p1" }),
      r("SESSION_PAYOUT", 100_000, { coachProfileId: "c1" }),
      r("PPH_WITHHELD", -500, { coachProfileId: "c1" }),
      r("SESSION_REVENUE", 60_000, { poolId: "p1" }, "b2"),
      r("PPH_WITHHELD", -300, { poolId: "p1" }, "b2"),
      // Sesi b2 dikoreksi jadi tidak Hadir di bulan yang sama.
      r("SESSION_REVENUE", -60_000, { poolId: "p1" }, "b2"),
      r("PPH_WITHHELD", 300, { poolId: "p1" }, "b2"),
    ];
    expect(buildPphRecap(rows, new Set([pphKey("b1", "p1"), pphKey("b1", "c1"), pphKey("b2", "p1")]))).toEqual([
      { kind: "Kolam", ownerId: "p1", gross: 60_000, pph: 300 },
      { kind: "Coach", ownerId: "c1", gross: 100_000, pph: 500 },
    ]);
  });
  it("sesi tanpa PPh (paket lama / bebas potongan) dan baris platform tidak masuk rekap", () => {
    const rows = [
      r("SESSION_REVENUE", 50_000, { poolId: "p9" }, "old"),
      r("PLATFORM_REVENUE", 9_000, {}, "b1"),
    ];
    expect(buildPphRecap(rows, new Set([pphKey("b1", "p1")]))).toEqual([]);
  });
  it("kolam bebas potongan di sesi yang coach-nya dipotong: kolam tidak masuk rekap", () => {
    const rows = [
      r("SESSION_REVENUE", 60_000, { poolId: "pBebas" }),
      r("SESSION_PAYOUT", 100_000, { coachProfileId: "c1" }),
      r("PPH_WITHHELD", -500, { coachProfileId: "c1" }),
    ];
    expect(buildPphRecap(rows, new Set([pphKey("b1", "c1")]))).toEqual([{ kind: "Coach", ownerId: "c1", gross: 100_000, pph: 500 }]);
  });
});

describe("monthRangeWib", () => {
  it("1 bulan penuh menurut WIB", () => {
    expect(monthRangeWib("2026-10")).toEqual({ start: new Date("2026-09-30T17:00:00Z"), end: new Date("2026-10-31T17:00:00Z") });
    expect(monthRangeWib("2026-12")!.end).toEqual(new Date("2026-12-31T17:00:00Z"));
  });
  it("format salah = null", () => {
    expect(monthRangeWib("2026-13")).toBeNull();
    expect(monthRangeWib("10-2026")).toBeNull();
    expect(monthRangeWib("")).toBeNull();
  });
});
