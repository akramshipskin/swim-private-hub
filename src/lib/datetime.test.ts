import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveDateRange } from "./datetime";

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
