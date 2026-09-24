import { describe, expect, it } from "vitest";
import { BANKS, BANK_LABELS, bankCode, matchBankLabel, validateBankName } from "./banks";

describe("BANKS", () => {
  it("label dan kode unik, kode huruf kecil (syarat Midtrans Payouts)", () => {
    expect(new Set(BANKS.map((b) => b.label)).size).toBe(BANKS.length);
    expect(new Set(BANKS.map((b) => b.code)).size).toBe(BANKS.length);
    expect(BANKS.every((b) => b.code === b.code.toLowerCase())).toBe(true);
  });
  it("bankCode mengembalikan kode dari label, undefined kalau tidak dikenal", () => {
    expect(bankCode("Mandiri")).toBe("mandiri");
    expect(bankCode("Bank Antah Berantah")).toBeUndefined();
  });
});

describe("validateBankName", () => {
  it("menerima label di daftar, menolak yang lain (termasuk ketikan bebas)", () => {
    expect(validateBankName("BCA")).toBeNull();
    expect(validateBankName("bca")).toBe("Pilih nama bank dari daftar.");
    expect(validateBankName("")).toBe("Pilih nama bank dari daftar.");
    expect(BANK_LABELS).toContain("BRI");
  });
});

describe("matchBankLabel (rekening lama diketik bebas)", () => {
  it("memetakan variasi penulisan yang jelas", () => {
    expect(matchBankLabel("bca")).toBe("BCA");
    expect(matchBankLabel("Bank BCA")).toBe("BCA");
    expect(matchBankLabel("BANK MANDIRI")).toBe("Mandiri");
    expect(matchBankLabel("bsi")).toBe("BSI (Bank Syariah Indonesia)");
    expect(matchBankLabel("Bank DKI")).toBe("Bank DKI");
  });
  it("TIDAK menebak: yang mirip tapi beda bank tidak dipetakan", () => {
    expect(matchBankLabel("BCA Syar")).toBeNull();
    expect(matchBankLabel("bank bca digital")).toBeNull();
    expect(matchBankLabel("BRI Syariah")).toBeNull();
  });
  it("kosong -> null", () => {
    expect(matchBankLabel(null)).toBeNull();
    expect(matchBankLabel("")).toBeNull();
    expect(matchBankLabel("  ")).toBeNull();
  });
});
