import { describe, it, expect } from "vitest";
import { bookingCode, slotShortLabel, bookButtonState } from "./booking-labels";

// 2026-10-05 09:00 UTC = Senin 5 Okt 16.00 WIB
const START = "2026-10-05T09:00:00.000Z";

describe("bookingCode", () => {
  it("6 karakter terakhir id, huruf besar", () => {
    expect(bookingCode("cmg1abcd0001xyz9k2")).toBe("XYZ9K2");
  });
});

describe("slotShortLabel", () => {
  it("hari, tanggal, bulan singkat, jam WIB", () => {
    expect(slotShortLabel(START)).toBe("Senin, 5 Okt · 16.00");
  });
  it("memakai WIB walau jam UTC masih tanggal sebelumnya", () => {
    // 4 Okt 23:30 UTC = Senin 5 Okt 06.30 WIB
    expect(slotShortLabel("2026-10-04T23:30:00.000Z")).toBe("Senin, 5 Okt · 06.30");
  });
});

describe("bookButtonState", () => {
  it("belum memilih jam: nonaktif", () => {
    expect(bookButtonState({ sisaSesi: 3, selectedStart: null })).toEqual({ label: "Pilih tanggal dan jam", disabled: true });
  });
  it("jam terpilih: label dinamis dan aktif", () => {
    expect(bookButtonState({ sisaSesi: 3, selectedStart: START })).toEqual({
      label: "Booking Senin, 5 Okt · 16.00",
      disabled: false,
    });
  });
  it("sesi paket habis: nonaktif walau ada pilihan", () => {
    expect(bookButtonState({ sisaSesi: 0, selectedStart: START })).toEqual({ label: "Sesi paket habis", disabled: true });
  });
  it("tidak ada paket aktif di kolam ini: nonaktif", () => {
    expect(bookButtonState({ sisaSesi: null, selectedStart: null })).toEqual({
      label: "Belum ada paket di kolam ini",
      disabled: true,
    });
  });
});
