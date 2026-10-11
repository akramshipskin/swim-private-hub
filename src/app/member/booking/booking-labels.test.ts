import { describe, it, expect } from "vitest";
import { bookingCode, slotShortLabel, bookButtonState, resolveSelection, SLOT_GONE_MESSAGE, SLOT_TAKEN_MESSAGE } from "./booking-labels";

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
    expect(bookButtonState({ sisaSesi: 3, selectedStart: null })).toEqual({ label: "Pilih Tanggal dan Jam", disabled: true });
  });
  it("jam terpilih: label dinamis dan aktif", () => {
    expect(bookButtonState({ sisaSesi: 3, selectedStart: START })).toEqual({
      label: "Booking Senin, 5 Okt · 16.00",
      disabled: false,
    });
  });
  it("sesi paket habis: nonaktif walau ada pilihan", () => {
    expect(bookButtonState({ sisaSesi: 0, selectedStart: START })).toEqual({ label: "Sesi Paket Habis", disabled: true });
  });
  it("tidak ada paket aktif di kolam ini: nonaktif", () => {
    expect(bookButtonState({ sisaSesi: null, selectedStart: null })).toEqual({
      label: "Belum ada paket di kolam ini",
      disabled: true,
    });
  });
});

describe("resolveSelection (nasib jam yang dipilih)", () => {
  type S = { id: string; status: string; bookedByMe: boolean };
  const open: S = { id: "a", status: "AVAILABLE", bookedByMe: false };
  const taken: S = { id: "a", status: "BOOKED", bookedByMe: false };
  const mine: S = { id: "a", status: "BOOKED", bookedByMe: true };
  const isSelectable = (s: S) => s.status === "AVAILABLE" && !s.bookedByMe;
  const base = { selection: { id: "a", key: "k1" }, selKey: "k1", slots: [open], booking: false, isSelectable };

  it("tidak ada pilihan -> tidak ada yang terjadi", () => {
    expect(resolveSelection({ ...base, selection: null })).toEqual({ selected: null, clear: false, message: null });
  });
  it("jam masih bisa dipilih -> pilihan dipertahankan", () => {
    expect(resolveSelection(base)).toEqual({ selected: open, clear: false, message: null });
  });
  it("kunci berubah (ganti tanggal/kolam/peserta) -> dikosongkan tanpa pesan, jam tidak dianggap terpilih", () => {
    expect(resolveSelection({ ...base, selKey: "k2" })).toEqual({ selected: null, clear: true, message: null });
  });
  it("jadwal belum dimuat (slots null) -> pilihan dipertahankan, belum ada jam terpilih", () => {
    expect(resolveSelection({ ...base, slots: null })).toEqual({ selected: null, clear: false, message: null });
  });
  it("jam hilang dari jadwal terbaru -> dikosongkan dengan pesan 'tidak tersedia'", () => {
    expect(resolveSelection({ ...base, slots: [{ ...open, id: "b" }] })).toEqual({ selected: null, clear: true, message: SLOT_GONE_MESSAGE });
  });
  it("jam diambil member lain -> dikosongkan dengan pesan 'diambil member lain'", () => {
    expect(resolveSelection({ ...base, slots: [taken] })).toEqual({ selected: taken, clear: true, message: SLOT_TAKEN_MESSAGE });
  });
  it("jam sudah dibooking sendiri -> dikosongkan tanpa pesan", () => {
    expect(resolveSelection({ ...base, slots: [mine] })).toEqual({ selected: mine, clear: true, message: null });
  });
  it("jam tidak bisa dipilih karena alasan lain (mis. paket coach itu habis) -> dikosongkan tanpa pesan", () => {
    expect(resolveSelection({ ...base, isSelectable: () => false })).toEqual({ selected: open, clear: true, message: null });
  });
  it("selama permintaan booking berjalan pilihan tidak diusik, walau jam sudah hilang atau kunci berubah", () => {
    expect(resolveSelection({ ...base, booking: true, slots: [taken] })).toEqual({ selected: taken, clear: false, message: null });
    expect(resolveSelection({ ...base, booking: true, selKey: "k2" })).toEqual({ selected: null, clear: false, message: null });
  });
});
