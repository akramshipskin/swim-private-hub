import { describe, expect, it } from "vitest";
import { businessDaysSince, isWithdrawalOverdue } from "./withdrawal-deadline";

// Kamis 1 Okt 2026, 10:00 WIB.
const thu = new Date("2026-10-01T03:00:00Z");
const at = (iso: string) => new Date(iso);

describe("businessDaysSince", () => {
  it("menghitung Senin-Jumat setelah tanggal pengajuan (tanggal WIB), Sabtu-Minggu dilewati", () => {
    expect(businessDaysSince(thu, thu)).toBe(0);
    expect(businessDaysSince(thu, at("2026-10-02T03:00:00Z"))).toBe(1); // Jumat
    expect(businessDaysSince(thu, at("2026-10-04T03:00:00Z"))).toBe(1); // Minggu
    expect(businessDaysSince(thu, at("2026-10-05T03:00:00Z"))).toBe(2); // Senin
    expect(businessDaysSince(thu, at("2026-10-12T03:00:00Z"))).toBe(7); // Senin pekan depannya
  });
  it("pakai tanggal WIB: pengajuan 23:30 WIB Kamis tetap dihitung hari Kamis", () => {
    expect(businessDaysSince(at("2026-10-01T16:30:00Z"), at("2026-10-02T01:00:00Z"))).toBe(1);
  });
});

describe("isWithdrawalOverdue", () => {
  it("tepat 7 hari kerja belum lewat; hari kerja ke-8 = lewat", () => {
    expect(isWithdrawalOverdue({ status: "PENDING", requestedAt: thu }, at("2026-10-12T10:00:00Z"))).toBe(false);
    expect(isWithdrawalOverdue({ status: "PENDING", requestedAt: thu }, at("2026-10-13T01:00:00Z"))).toBe(true);
    expect(isWithdrawalOverdue({ status: "PROCESSING", requestedAt: thu }, at("2026-10-13T01:00:00Z"))).toBe(true);
  });
  it("yang sudah dibayar atau ditolak tidak pernah ditandai", () => {
    expect(isWithdrawalOverdue({ status: "PAID", requestedAt: thu }, at("2026-11-30T01:00:00Z"))).toBe(false);
    expect(isWithdrawalOverdue({ status: "FAILED", requestedAt: thu }, at("2026-11-30T01:00:00Z"))).toBe(false);
  });
});
