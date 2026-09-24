import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveDateRange, formatTimeLeft, resolveExpiredDate } from "./datetime";

afterEach(() => vi.useRealTimers());

describe("resolveDateRange", () => {
  it("keeps a valid range as-is", () => {
    expect(resolveDateRange("2026-09-01", "2026-09-17", 6)).toEqual({ from: "2026-09-01", to: "2026-09-17" });
  });

  // Regression (sweep 2026-09-17): ?from=abc bikin /pool/laporan error 500.
  it("falls back to the default window when a value is not a real date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T05:00:00+07:00"));
    expect(resolveDateRange("abc", "2026-02-31", 6)).toEqual({ from: "2026-09-11", to: "2026-09-17" });
  });

  // Regression (sweep 2026-09-17): rentang kebalik diterima & hasilnya selalu kosong.
  it("swaps a reversed range", () => {
    expect(resolveDateRange("2026-09-17", "2026-09-01", 6)).toEqual({ from: "2026-09-01", to: "2026-09-17" });
  });
});

describe("formatTimeLeft", () => {
  const H = 3_600_000;

  it("says less than an hour instead of 0 jam", () => {
    expect(formatTimeLeft(10 * 60_000)).toBe("kurang dari 1 jam");
  });

  it("uses hours below one day, rounding down", () => {
    expect(formatTimeLeft(H)).toBe("1 jam");
    expect(formatTimeLeft(23.9 * H)).toBe("23 jam");
  });

  it("uses days from one day up, rounding down", () => {
    expect(formatTimeLeft(24 * H)).toBe("1 hari");
    expect(formatTimeLeft(6.9 * 24 * H)).toBe("6 hari");
  });
});

describe("resolveExpiredDate", () => {
  // Bug sweep 24 Sep: paket dibayar jam 14.32 berlaku 1 hari -> kedaluwarsa
  // besok 14.32. Admin cuma koreksi sisa sesi, simpan -> jam kedaluwarsa
  // diam-diam jadi 23.59.
  it("keeps the stored instant when the WIB date was not changed", () => {
    const stored = new Date("2026-09-25T07:32:00Z"); // 25 Sep 14.32 WIB
    expect(resolveExpiredDate("2026-09-25", stored)).toBe(stored);
  });

  // 25 Sep 17.30 UTC sudah 26 Sep
  // 00.30 WIB: tanggal yang dibandingkan harus tanggal WIB (26), bukan UTC (25).
  it("compares the WIB calendar date, not the UTC one", () => {
    const stored = new Date("2026-09-25T17:30:00Z"); // 26 Sep 00.30 WIB
    expect(resolveExpiredDate("2026-09-26", stored)).toBe(stored);
    expect(resolveExpiredDate("2026-09-25", stored)?.toISOString()).toBe("2026-09-25T16:59:59.000Z");
  });

  it("moves to 23.59.59 WIB of the new date when the date was changed", () => {
    const stored = new Date("2026-09-25T07:32:00Z");
    expect(resolveExpiredDate("2026-10-02", stored)?.toISOString()).toBe("2026-10-02T16:59:59.000Z");
  });

  it("sets 23.59.59 WIB when there was no expiry before", () => {
    expect(resolveExpiredDate("2026-10-02", null)?.toISOString()).toBe("2026-10-02T16:59:59.000Z");
    expect(resolveExpiredDate("2026-10-02", undefined)?.toISOString()).toBe("2026-10-02T16:59:59.000Z");
  });

  it("clears the expiry when the field is emptied", () => {
    expect(resolveExpiredDate("", new Date("2026-09-25T07:32:00Z"))).toBeNull();
    expect(resolveExpiredDate("", null)).toBeNull();
  });
});
