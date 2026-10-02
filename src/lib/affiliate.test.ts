import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { commissionAmount, codeCandidate, normalizeAffiliateCode, onSessionAttended, onSessionUnattended } from "./affiliate";
import { AFFILIATE_COMMISSION_PERCENT, AFFILIATE_HOLD_DAYS, AFFILIATE_SERVICE_FEE_SHARE_PERCENT, AFFILIATE_V2_START } from "./policy";

const BEFORE_V2 = new Date("2026-09-30T05:00:00Z");
const AFTER_V2 = new Date(AFFILIATE_V2_START.getTime() + 60_000);

describe("normalizeAffiliateCode", () => {
  it("uppercases and strips everything except A-Z and 0-9", () => {
    expect(normalizeAffiliateCode(" nadia-27 ")).toBe("NADIA27");
    expect(normalizeAffiliateCode("melati 49!")).toBe("MELATI49");
    expect(normalizeAffiliateCode("")).toBe("");
  });
});

describe("commissionAmount", () => {
  it("paket lama (dibayar sebelum aturan baru): 5% dari jumlah dibayar, dibulatkan ke bawah", () => {
    expect(AFFILIATE_COMMISSION_PERCENT).toBe(5);
    const old = (amount: number) => commissionAmount({ amount, paidAt: BEFORE_V2, serviceFee: null });
    expect(old(750_000)).toBe(37_500);
    expect(old(135_000)).toBe(6_750);
    // 5% dari 10.019 = 500,95 -> 500 (tidak dibulatkan ke atas)
    expect(old(10_019)).toBe(500);
    expect(old(19)).toBe(0);
    // Paket harga-dari-coach yang dibayar SEBELUM aturan baru tetap 5% (Hadi 2A).
    expect(commissionAmount({ amount: 1_363_200, paidAt: BEFORE_V2, serviceFee: 83_200 })).toBe(68_160);
  });
  it("sejak aturan baru: 50% dari biaya layanan bersih setelah PPN 11%", () => {
    expect(AFFILIATE_SERVICE_FEE_SHARE_PERCENT).toBe(50);
    // Paket 8: biaya layanan 83.200 = bersih 74.955 + PPN 8.245 -> komisi 37.477.
    expect(commissionAmount({ amount: 1_363_200, paidAt: AFTER_V2, serviceFee: 83_200 })).toBe(37_477);
    // Tidak bergantung jumlah yang dibayar lewat Midtrans (sebagian bisa dari saldo member).
    expect(commissionAmount({ amount: 500_000, paidAt: AFTER_V2, serviceFee: 83_200 })).toBe(37_477);
    // Tepat di batas tanggal = aturan baru.
    expect(commissionAmount({ amount: 1_363_200, paidAt: AFFILIATE_V2_START, serviceFee: 83_200 })).toBe(37_477);
    expect(commissionAmount({ amount: 1_000, paidAt: AFTER_V2, serviceFee: 0 })).toBe(0);
  });
  it("pembayaran tanpa biaya layanan tersimpan (paket model lama) tetap 5% walau setelah tanggal", () => {
    expect(commissionAmount({ amount: 750_000, paidAt: AFTER_V2, serviceFee: null })).toBe(37_500);
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
  booking?: { memberId: string; availability: { endTime: Date }; package?: { isTrial: boolean } } | null;
  commission?: { status: string } | null;
  member?: { referralCode: { coachProfileId: string | null; poolId: string | null } | null } | null;
  firstPayment?: { id: string; amount: number; paidAt?: Date | null; package?: { serviceFee: number | null; coachChangeRequests?: { oldServiceFee: number | null }[] } } | null;
  otherAttended?: { id: string; availability: { endTime: Date } } | null;
  resetCount?: number;
}) {
  return {
    booking: {
      findUnique: vi.fn().mockResolvedValue(state.booking ? { package: { isTrial: false }, ...state.booking } : null),
      findFirst: vi.fn().mockResolvedValue(state.otherAttended ?? null),
    },
    affiliateCommission: {
      findUnique: vi.fn().mockResolvedValue(state.commission ?? null),
      updateMany: vi.fn().mockResolvedValue({ count: state.resetCount ?? 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findUnique: vi.fn().mockResolvedValue(state.member ?? null) },
    payment: {
      findFirst: vi.fn().mockResolvedValue(
        state.firstPayment
          ? { paidAt: BEFORE_V2, createdAt: BEFORE_V2, ...state.firstPayment, package: { serviceFee: null, coachChangeRequests: [], ...state.firstPayment.package } }
          : null,
      ),
    },
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

  it("hanya paket pertama BERBAYAR: query mengecualikan sesi coba dan pembayaran ganti coach", async () => {
    const tx = fakeTx({ booking, member: { referralCode: { coachProfileId: "cp1", poolId: null } }, firstPayment: null });
    await onSessionAttended(tx as unknown as Tx, "b1");
    expect(tx.payment.findFirst.mock.calls[0][0].where).toEqual({
      status: "SUCCESS",
      coachChangeRequestId: null,
      package: { memberId: "m1", isTrial: false },
    });
    expect(tx.affiliateCommission.createMany).not.toHaveBeenCalled();
  });

  it("paket dibayar sejak aturan baru: komisi 50% biaya layanan bersih", async () => {
    const tx = fakeTx({
      booking,
      member: { referralCode: { coachProfileId: null, poolId: "p1" } },
      firstPayment: { id: "pay2", amount: 1_363_200, paidAt: AFTER_V2, package: { serviceFee: 83_200 } },
    });
    await onSessionAttended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.createMany.mock.calls[0][0].data[0]).toMatchObject({ poolId: "p1", paymentId: "pay2", amount: 37_477 });
  });

  it("sudah ganti coach: komisi memakai biaya layanan saat paket dibeli, bukan biaya layanan setelah ganti coach", async () => {
    const tx = fakeTx({
      booking,
      member: { referralCode: { coachProfileId: "cp1", poolId: null } },
      firstPayment: { id: "pay4", amount: 1_363_200, paidAt: AFTER_V2, package: { serviceFee: 104_000, coachChangeRequests: [{ oldServiceFee: 83_200 }] } },
    });
    await onSessionAttended(tx as unknown as Tx, "b1");
    expect(tx.affiliateCommission.createMany.mock.calls[0][0].data[0]).toMatchObject({ amount: 37_477 });
  });

  it("sesi coba yang ditandai Hadir tidak memicu komisi (walau paket berbayar sudah dibeli)", async () => {
    const tx = fakeTx({
      booking: { ...booking, package: { isTrial: true } },
      member: { referralCode: { coachProfileId: "cp1", poolId: null } },
      firstPayment: { id: "pay5", amount: 1_363_200, paidAt: AFTER_V2, package: { serviceFee: 83_200 } },
    });
    await onSessionAttended(tx as unknown as Tx, "bTrial");
    expect(tx.affiliateCommission.findUnique).not.toHaveBeenCalled();
    expect(tx.affiliateCommission.createMany).not.toHaveBeenCalled();
  });

  it("paidAt kosong: memakai createdAt pembayaran", async () => {
    const tx = fakeTx({
      booking,
      member: { referralCode: { coachProfileId: "cp1", poolId: null } },
      firstPayment: { id: "pay3", amount: 1_363_200, paidAt: null, package: { serviceFee: 83_200 } },
    });
    await onSessionAttended(tx as unknown as Tx, "b1");
    // createdAt default di fakeTx = sebelum aturan baru -> 5% dari jumlah dibayar.
    expect(tx.affiliateCommission.createMany.mock.calls[0][0].data[0]).toMatchObject({ amount: 68_160 });
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
    // Sesi Hadir pengganti hanya dari paket berbayar (bukan sesi coba).
    expect(tx.booking.findFirst.mock.calls[0][0].where).toMatchObject({ package: { isTrial: false } });
  });
});
