import { describe, it, expect } from "vitest";
import { formatCountdown, isLockedCode, lockSecondsFromCode } from "./login-lock";

describe("lockSecondsFromCode", () => {
  it("membaca sisa detik dari kode locked_<detik>", () => {
    expect(lockSecondsFromCode("locked_742")).toBe(742);
    expect(lockSecondsFromCode("locked_1")).toBe(1);
  });
  it("kode lain (locked polos, otp, kosong, angka rusak) -> null", () => {
    expect(lockSecondsFromCode("locked")).toBeNull();
    expect(lockSecondsFromCode("otp_invalid")).toBeNull();
    expect(lockSecondsFromCode(undefined)).toBeNull();
    expect(lockSecondsFromCode("locked_abc")).toBeNull();
    expect(lockSecondsFromCode("locked_12x")).toBeNull();
  });
});

describe("isLockedCode", () => {
  it("true untuk locked dan locked_<detik>, false untuk yang lain", () => {
    expect(isLockedCode("locked")).toBe(true);
    expect(isLockedCode("locked_900")).toBe(true);
    expect(isLockedCode("otp_required")).toBe(false);
    expect(isLockedCode(undefined)).toBe(false);
  });
});

describe("formatCountdown", () => {
  it("format menit:detik dengan nol di depan", () => {
    expect(formatCountdown(900)).toBe("15:00");
    expect(formatCountdown(742)).toBe("12:22");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(9)).toBe("0:09");
  });
  it("pembulatan ke atas dan tidak pernah negatif", () => {
    expect(formatCountdown(59.2)).toBe("1:00");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5)).toBe("0:00");
  });
});
