import { describe, expect, it, vi } from "vitest";
import { activePackageWhere, activePackageWhereForDependent, usablePackageConditions } from "./active-package";

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

describe("activePackageWhereForDependent", () => {
  it("further scopes to one dependent, so each child has its own active package", () => {
    const where = activePackageWhereForDependent("member-1", "dependent-1");
    expect(where.memberId).toBe("member-1");
    expect(where.dependentId).toBe("dependent-1");
  });
});
