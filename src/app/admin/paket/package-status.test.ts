import { describe, expect, it } from "vitest";
import { packageStatusLabel } from "./package-status";

const NOW = new Date("2026-10-06T00:00:00Z");
const base = { status: "ACTIVE" as const, sisaSesi: 3, expiredDate: new Date("2026-12-01T00:00:00Z") };

describe("packageStatusLabel", () => {
  it("aktif hanya bila masih ada sesi dan belum lewat tanggal", () => {
    expect(packageStatusLabel(base, NOW)).toEqual({ label: "Aktif", tone: "success" });
    expect(packageStatusLabel({ ...base, expiredDate: null }, NOW).label).toBe("Aktif");
  });
  it("status ACTIVE tapi tanggal sudah lewat -> Berakhir", () => {
    expect(packageStatusLabel({ ...base, expiredDate: new Date("2026-09-25T00:00:00Z") }, NOW).label).toBe("Berakhir");
  });
  it("status ACTIVE tapi sesi habis -> Sesi habis", () => {
    expect(packageStatusLabel({ ...base, sisaSesi: 0 }, NOW).label).toBe("Sesi habis");
  });
  it("status lain mengikuti database", () => {
    expect(packageStatusLabel({ ...base, status: "PENDING_PAYMENT" }, NOW).label).toBe("Menunggu Pembayaran");
    expect(packageStatusLabel({ ...base, status: "EXPIRED" }, NOW).label).toBe("Berakhir");
  });
});
