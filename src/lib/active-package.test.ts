import { describe, expect, it } from "vitest";
import { activePackageWhere, activePackageWhereForDependent, usablePackageConditions } from "./active-package";

describe("usablePackageConditions", () => {
  // Regression: admin/users session 2026-08-19 — filtering on status:"ACTIVE"
  // alone showed expired-but-still-ACTIVE packages as usable. This is the
  // single source of truth every booking-enforcement and display query must
  // share, so pin its shape down explicitly.
  it("requires ACTIVE status and a positive session count", () => {
    expect(usablePackageConditions.status).toBe("ACTIVE");
    expect(usablePackageConditions.sisaSesi).toEqual({ gt: 0 });
  });

  it("accepts a package with no expiry OR one that hasn't expired yet", () => {
    expect(usablePackageConditions.OR).toEqual([
      { expiredDate: null },
      { expiredDate: { gte: expect.any(Date) } },
    ]);
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
