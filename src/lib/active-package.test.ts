import { describe, expect, it, vi } from "vitest";
import { activePackageWhere, isUsablePackage, packagesToShow, usablePackageConditions } from "./active-package";

describe("usablePackageConditions", () => {
  // Regression: admin/users session 2026-08-19 — filtering on status:"ACTIVE"
  // alone showed expired-but-still-ACTIVE packages as usable. This is the
  // single source of truth every booking-enforcement and display query must
  // share, so pin its shape down explicitly.
  it("requires ACTIVE status and a positive session count", () => {
    expect(usablePackageConditions().status).toBe("ACTIVE");
    expect(usablePackageConditions().sisaSesi).toEqual({ gt: 0 });
  });

  it("accepts a package with no expiry OR one that hasn't expired yet", () => {
    expect(usablePackageConditions().OR).toEqual([
      { expiredDate: null },
      { expiredDate: { gte: expect.any(Date) } },
    ]);
  });

  // Regression (sweep 2026-09-17): dulu konstanta level modul, jadi
  // "sekarang" kebeku di waktu modul di-load -- paket yang expired setelah
  // server nyala masih lolos filter. Tiap panggilan harus pake jam terbaru.
  it("evaluates 'now' on every call, not once at module load", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const first = (usablePackageConditions().OR as { expiredDate: { gte: Date } }[])[1].expiredDate.gte;
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    const later = (usablePackageConditions().OR as { expiredDate: { gte: Date } }[])[1].expiredDate.gte;
    vi.useRealTimers();
    expect(later.getTime()).toBeGreaterThan(first.getTime());
  });
});

describe("activePackageWhere", () => {
  it("scopes the usable conditions to one member", () => {
    const where = activePackageWhere("member-1");
    expect(where.memberId).toBe("member-1");
    expect(where.status).toBe("ACTIVE");
  });
});

describe("isUsablePackage", () => {
  const now = new Date("2026-09-24T12:00:00Z");
  const base = { status: "ACTIVE", sisaSesi: 3, expiredDate: new Date("2026-10-01T00:00:00Z") };

  it("accepts an active package with sessions left that has not expired", () => {
    expect(isUsablePackage(base, now)).toBe(true);
  });

  it("accepts a package with no expiry date", () => {
    expect(isUsablePackage({ ...base, expiredDate: null }, now)).toBe(true);
  });

  it.each([
    ["not ACTIVE", { status: "PENDING_PAYMENT" }],
    ["no sessions left", { sisaSesi: 0 }],
    ["already expired", { expiredDate: new Date("2026-09-24T11:59:59Z") }],
  ])("rejects a package that is %s", (_label, patch) => {
    expect(isUsablePackage({ ...base, ...patch }, now)).toBe(false);
  });

  it("treats the exact expiry instant as still usable, like the gte in the DB condition", () => {
    expect(isUsablePackage({ ...base, expiredDate: now }, now)).toBe(true);
  });
});

describe("packagesToShow", () => {
  const now = new Date("2026-09-24T12:00:00Z");
  const active = { id: "a", status: "ACTIVE", sisaSesi: 3, expiredDate: new Date("2026-10-01T00:00:00Z") };
  const activeOld = { id: "b", status: "ACTIVE", sisaSesi: 1, expiredDate: null };
  const pending = { id: "p", status: "PENDING_PAYMENT", sisaSesi: 8, expiredDate: null };
  const spent = { id: "s", status: "ACTIVE", sisaSesi: 0, expiredDate: null };

  // Regression (bug sweep 24 Sep): paket menunggu-bayar yang lebih baru
  // menutupi paket aktif -- admin tidak bisa menyunting paket aktif itu.
  it("keeps the usable package visible when a newer unpaid one exists", () => {
    expect(packagesToShow([pending, active], now).map((p) => p.id)).toEqual(["a"]);
  });

  it("shows every usable package, not just one", () => {
    expect(packagesToShow([pending, active, activeOld, spent], now).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("falls back to the newest package when none is usable", () => {
    expect(packagesToShow([pending, spent], now).map((p) => p.id)).toEqual(["p"]);
  });

  it("returns nothing for an empty list", () => {
    expect(packagesToShow([], now)).toEqual([]);
  });
});
