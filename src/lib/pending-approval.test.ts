import { describe, expect, it } from "vitest";
import { isPendingApproval } from "./pending-approval";

const base = { role: "COACH", isActive: false, approvedAt: null, anonymizedAt: null };

describe("isPendingApproval", () => {
  it("is true for a self-registered coach or pool owner never approved", () => {
    expect(isPendingApproval(base)).toBe(true);
    expect(isPendingApproval({ ...base, role: "POOL_OWNER" })).toBe(true);
  });
  it("is false for an account that was approved and later deactivated", () => {
    expect(isPendingApproval({ ...base, approvedAt: new Date() })).toBe(false);
  });
  it("is false for active, deleted, member, or admin accounts", () => {
    expect(isPendingApproval({ ...base, isActive: true })).toBe(false);
    expect(isPendingApproval({ ...base, anonymizedAt: new Date() })).toBe(false);
    expect(isPendingApproval({ ...base, role: "MEMBER" })).toBe(false);
    expect(isPendingApproval({ ...base, role: "ADMIN" })).toBe(false);
  });
});
