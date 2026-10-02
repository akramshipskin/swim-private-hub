import { describe, expect, it } from "vitest";
import { hasPoolHours, poolHoursLabel, withinPoolHours } from "./pool-hours";

const at = (hhmm: string) => new Date(`2026-10-10T${hhmm}:00+07:00`);
const pool = { openTime: "06:00", closeTime: "20:00" };

describe("withinPoolHours", () => {
  it("menerima sesi di dalam jam buka, termasuk tepat di batas", () => {
    expect(withinPoolHours(pool, at("06:00"), at("07:00"))).toBe(true);
    expect(withinPoolHours(pool, at("19:00"), at("20:00"))).toBe(true);
  });
  it("menolak sesi yang mulai sebelum buka atau selesai setelah tutup", () => {
    expect(withinPoolHours(pool, at("05:00"), at("06:00"))).toBe(false);
    expect(withinPoolHours(pool, at("19:30"), at("20:30"))).toBe(false);
    expect(withinPoolHours(pool, at("20:00"), at("21:00"))).toBe(false);
  });
  it("kolam tanpa jam buka tidak membatasi (slot lama tetap bisa dibooking)", () => {
    expect(withinPoolHours({ openTime: null, closeTime: null }, at("03:00"), at("04:00"))).toBe(true);
    expect(hasPoolHours({ openTime: "06:00", closeTime: null })).toBe(false);
    expect(hasPoolHours({ openTime: "20:00", closeTime: "06:00" })).toBe(false);
  });
  it("label jam untuk pesan", () => {
    expect(poolHoursLabel(pool)).toBe("06.00–20.00");
    expect(poolHoursLabel({ openTime: null, closeTime: null })).toBe("belum diisi");
  });
});
