import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { commissionAmount, codeCandidate, normalizeAffiliateCode, onSessionAttended, onSessionUnattended } from "./affiliate";
import { AFFILIATE_COMMISSION_PERCENT, AFFILIATE_HOLD_DAYS } from "./policy";

describe("normalizeAffiliateCode", () => {
  it("uppercases and strips everything except A-Z and 0-9", () => {
    expect(normalizeAffiliateCode(" nadia-27 ")).toBe("NADIA27");
    expect(normalizeAffiliateCode("melati 49!")).toBe("MELATI49");
    expect(normalizeAffiliateCode("")).toBe("");
  });
});

describe("commissionAmount", () => {
  it("is AFFILIATE_COMMISSION_PERCENT of the payment, rounded DOWN to whole rupiah", () => {
    expect(AFFILIATE_COMMISSION_PERCENT).toBe(5);
    expect(commissionAmount(750_000)).toBe(37_500);
    expect(commissionAmount(135_000)).toBe(6_750);
    // 5% dari 10.019 = 500,95 -> 500 (tidak dibulatkan ke atas)
    expect(commissionAmount(10_019)).toBe(500);
    expect(commissionAmount(19)).toBe(0);
  });
});

describe("codeCandidate", () => {
  it("uses the first word (max 5 letters, uppercase) plus a 2-digit number 10-99", () => {
    expect(codeCandidate("Nadia Putri", () => 0)).toBe("NADIA10");
    expect(codeCandidate("Nadia Putri", () => 0.999)).toBe("NADIA99");
    expect(codeCandidate("Kolam Renang Melati", () => 0.5)).toBe("KOLAM55");
  });
  it("falls back to SPH when the first word has no latin letters", () => {
    expect(codeCandidate("123 456", () => 0)).toBe("SPH10");
    expect(codeCandidate("", () => 0)).toBe("SPH10");
  });
});

// tx palsu: hanya method yang dipakai qualify/onSession*.
function fakeTx(state: {
  booking?: { memberId: string; availability: { endTime: Date } } | null;
  commission?: { status: string } | null;
  member?: { referralCode: { coachProfileId: string | null; poolId: string | null } | null } | null;
  firstPayment?: { id: string; amount: number } | null;
  otherAttended?: { id: string; availability: { endTime: Date } } | null;
  resetCount?: number;
}) {
  return {
    booking: {
      findUnique: vi.fn().mockResolvedValue(state.booking ?? null),
      findFirst: vi.fn().mockResolvedValue(state.otherAttended ?? null),
    },
    affiliateCommission: {
      findUnique: vi.fn().mockResolvedValue(state.commission ?? null),
      updateMany: vi.fn().mockResolvedValue({ count: state.resetCount ?? 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findUnique: vi.fn().mockResolvedValue(state.member ?? null) },
    payment: { findFirst: vi.fn().mockResolvedValue(state.firstPayment ?? null) },
  };
}
type Tx = Parameters<typeof onSessionAttended>[0];

const endTime = new Date("2026-09-30T02:00:00Z");
const booking = { memberId: "m1", availability: { endTime } };

describe("onSessionAttended (komisi sekali per member)", () => {
  it("creates a PENDING commission of 5% of the FIRST payment, released endTime + hold days", async () => {
    const tx = fakeTx({ booking, member: { referralCode: { coachProfileId: "cp1", poolId: null } }, firstPayment: { id: "pay1", amount: 750_000 } });
    await onSessionAttended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.createMany).toHaveBeenCalledTimes(1);
    const { data, skipDuplicates } = tx.affiliateCommission.createMany.mock.calls[0][0];
    expect(skipDuplicates).toBe(true);
    expect(data[0]).toMatchObject({ memberId: "m1", coachProfileId: "cp1", poolId: null, paymentId: "pay1", amount: 37_500, status: "PENDING", bookingId: "b1" });
    expect(data[0].releaseAt.getTime()).toBe(endTime.getTime() + AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1000);
  });

  it("does nothing when the member registered without an affiliate code", async () => {
    const tx = fakeTx({ booking, member: { referralCode: null }, firstPayment: { id: "pay1", amount: 750_000 } });
    await onSessionAttended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.createMany).not.toHaveBeenCalled();
  });

  it("does nothing when there is no successful payment or the commission would be Rp0", async () => {
    const none = fakeTx({ booking, member: { referralCode: { coachProfileId: null, poolId: "p1" } }, firstPayment: null });
    await onSessionAttended(none as unknown as Tx, "b1");
    expect(none.affiliateCommission.createMany).not.toHaveBeenCalled();
    const tiny = fakeTx({ booking, member: { referralCode: { coachProfileId: null, poolId: "p1" } }, firstPayment: { id: "pay1", amount: 10 } });
    await onSessionAttended(tiny as unknown as Tx, "b1");
    expect(tiny.affiliateCommission.createMany).not.toHaveBeenCalled();
  });

  it("does not create a second commission when the member already has one (once per member)", async () => {
    for (const status of ["PENDING", "RELEASED"]) {
      const tx = fakeTx({ booking, commission: { status }, member: { referralCode: { coachProfileId: "cp1", poolId: null } }, firstPayment: { id: "pay1", amount: 750_000 } });
      await onSessionAttended(tx as unknown as Tx, "b1");
      expect(tx.affiliateCommission.createMany).not.toHaveBeenCalled();
      expect(tx.affiliateCommission.updateMany).not.toHaveBeenCalled();
    }
  });

  it("re-arms a WAITING commission onto this session (PENDING + new releaseAt)", async () => {
    const tx = fakeTx({ booking, commission: { status: "WAITING" } });
    await onSessionAttended(tx as unknown as Tx, "b2");
    expect(tx.affiliateCommission.updateMany).toHaveBeenCalledWith({
      where: { memberId: "m1", status: "WAITING" },
      data: { status: "PENDING", bookingId: "b2", releaseAt: new Date(endTime.getTime() + AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1000) },
    });
  });

  it("ignores a booking that no longer exists", async () => {
    const tx = fakeTx({ booking: null });
    await onSessionAttended(tx as unknown as Tx, "gone");
    expect(tx.affiliateCommission.createMany).not.toHaveBeenCalled();
  });
});

describe("onSessionUnattended", () => {
  it("resets the PENDING commission triggered by this session back to WAITING", async () => {
    const tx = fakeTx({ booking, resetCount: 1, otherAttended: null });
    await onSessionUnattended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.updateMany).toHaveBeenCalledWith({
      where: { bookingId: "b1", status: "PENDING" },
      data: { status: "WAITING", bookingId: null, releaseAt: null },
    });
  });

  it("does nothing else when no commission was waiting on this session", async () => {
    const tx = fakeTx({ booking, resetCount: 0 });
    await onSessionUnattended(tx as unknown as Tx, "b1");
    expect(tx.booking.findFirst).not.toHaveBeenCalled();
  });

  it("moves the count to the member's next attended session, if any", async () => {
    const otherEnd = new Date("2026-10-01T02:00:00Z");
    const tx = fakeTx({ booking, resetCount: 1, commission: { status: "WAITING" }, otherAttended: { id: "b9", availability: { endTime: otherEnd } } });
    await onSessionUnattended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.updateMany).toHaveBeenLastCalledWith({
      where: { memberId: "m1", status: "WAITING" },
      data: { status: "PENDING", bookingId: "b9", releaseAt: new Date(otherEnd.getTime() + AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1000) },
    });
  });
});
