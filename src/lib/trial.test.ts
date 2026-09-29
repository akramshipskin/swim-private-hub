import { describe, it, expect } from "vitest";
import { trialBlockingPackageWhere, TRIAL_PENDING_WINDOW_MS } from "./trial";

// Bug sweep 30 Sep: webhook Midtrans menandai paket EXPIRED juga saat pembayaran
// gagal/dibatalkan/kedaluwarsa (paket TIDAK PERNAH dibayar). Dulu paket seperti
// itu ikut menghalangi trial, jadi peserta yang gagal bayar trial sekali tidak
// pernah bisa membeli trial lagi.
describe("trialBlockingPackageWhere", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const clauses = () => (trialBlockingPackageWhere(now).OR ?? []) as Record<string, unknown>[];

  it("blocks packages that were ever activated", () => {
    expect(clauses()).toContainEqual({ status: "ACTIVE" });
  });

  it("blocks EXPIRED only when the package had been activated (has startDate)", () => {
    expect(clauses()).toContainEqual({ status: "EXPIRED", startDate: { not: null } });
    // Tidak boleh ada klausa EXPIRED polos: itu paket gagal bayar.
    expect(clauses()).not.toContainEqual({ status: { in: ["ACTIVE", "EXPIRED"] } });
    expect(clauses()).not.toContainEqual({ status: "EXPIRED" });
  });

  it("blocks a recent unpaid trial checkout (double-click guard) but not an old one", () => {
    const pending = clauses().find((c) => c.status === "PENDING_PAYMENT") as { isTrial: boolean; createdAt: { gte: Date } };
    expect(pending.isTrial).toBe(true);
    expect(pending.createdAt.gte.getTime()).toBe(now.getTime() - TRIAL_PENDING_WINDOW_MS);
  });
});
