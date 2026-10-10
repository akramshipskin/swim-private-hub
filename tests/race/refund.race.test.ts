// Kembalikan Dana (Hadi 10-11 Okt, TRD T1) terhadap Postgres lokal.
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle } from "./fx";
import { checkInvariants } from "./invariants";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { releaseDueCommissions, getOrCreateAffiliateCode } from "@/lib/affiliate";
import { refundPackage } from "@/lib/package-refund";

beforeEach(reset);

const DAY = 86400e3;
const mark = (coachId: string, bookingId: string, attended: boolean) =>
  as({ id: coachId, role: "COACH" }, () => markAttendance(null, fd({ bookingId, attended: String(attended) })));
const refund = (packageId: string, over: Partial<{ cash: number; saldo: number }> = {}) =>
  refundPackage({ packageId, adminId: "admin", cash: 800000, saldo: 0, reference: "RFD-123", note: "Pembayaran ganda", ...over });

async function setup() {
  const pool = await mkPool();
  const coach = await mkUser("COACH");
  const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 800000 });
  const past = await book(m.id, (await mkSlot(coach.id, pool.id, -5)).id, pkg.id);
  const pastUnmarked = await book(m.id, (await mkSlot(coach.id, pool.id, -4)).id, pkg.id);
  const future = await book(m.id, (await mkSlot(coach.id, pool.id, 48)).id, pkg.id);
  return { pool, coach, m, pkg, past, pastUnmarked, future };
}

describe("KEMBALIKAN DANA", () => {
  it("RF1: paket diakhiri + sisa 0, booking mendatang batal, sesi yang sudah Hadir tetap dibayar, sesi lampau sebelum refund masih bisa ditandai", async () => {
    const x = await setup();
    expect(await mark(x.coach.id, x.past.id, true)).toBeNull();
    const coachBefore = (await prisma.coachProfile.findUniqueOrThrow({ where: { userId: x.coach.id } })).walletBalance;
    await refund(x.pkg.id);
    const pkg = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
    expect(pkg).toMatchObject({ status: "EXPIRED", sisaSesi: 0, refundCash: 800000, refundSaldo: 0, refundReference: "RFD-123" });
    expect(pkg.refundedAt).toBeInstanceOf(Date);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: x.future.id } })).status).toBe("CANCELLED");
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: x.coach.id } })).walletBalance).toBe(coachBefore);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } })).sisaSesi).toBe(0);
    // Sesi yang sudah berjalan sebelum refund tetap milik kolam/coach dan masih bisa ditandai.
    expect(await mark(x.coach.id, x.pastUnmarked.id, true)).toBeNull();
    // packages: false = sisa sesi sengaja hangus.
    expect(await checkInvariants({ packages: false })).toEqual([]);
  });

  it("RF6: refund gagal (paket pemberian admin) tidak membatalkan jadwal member", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: null });
    const f = await book(m.id, (await mkSlot(coach.id, pool.id, 48)).id, pkg.id);
    await expect(refund(pkg.id, { cash: 1 })).rejects.toThrow(/maksimal|pemberian admin/);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: f.id } })).status).toBe("BOOKED");
  });

  it("RF2: dua admin menekan Kembalikan Dana bersamaan -> tepat sekali; melebihi yang dibayar ditolak", async () => {
    const x = await setup();
    await expect(refund(x.pkg.id, { cash: 800001 })).rejects.toThrow(/maksimal/);
    const rs = await settle([refund(x.pkg.id), refund(x.pkg.id), refund(x.pkg.id)]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await expect(refund(x.pkg.id)).rejects.toThrow(/sudah pernah/);
  });

  it("RF3: bagian yang dibayar saldo kembali ke saldo member; paket pemberian admin ditolak", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 800000 });
    await prisma.package.update({ where: { id: pkg.id }, data: { saldoUsed: 100000 } });
    await refund(pkg.id, { cash: 700000, saldo: 100000 });
    const u = await prisma.user.findUniqueOrThrow({ where: { id: m.id } });
    expect(u.memberBalance).toBe(100000);
    expect(await prisma.memberWalletTransaction.count({ where: { memberId: m.id, type: "ADMIN_REFUND", amount: 100000 } })).toBe(1);
    const free = await mkMemberWithPackage(pool.id, coach.id, { price: null });
    await expect(refund(free.pkg.id, { cash: 0, saldo: 0 })).rejects.toThrow(/Isi nominal/);
    expect(await checkInvariants({ packages: false })).toEqual([]);
  });

  it("RF4: komisi afiliasi dari paket yang direfund: yang sudah cair ditarik dari saldo pengrujuk, statusnya batal; paket berbayar berikutnya tidak memicu komisi lagi", async () => {
    const pool = await mkPool();
    const teacher = await mkUser("COACH");
    const referrer = await mkUser("COACH");
    const code = await getOrCreateAffiliateCode({ coachProfileId: referrer.coachProfile!.id }, "Rujuk");
    const { m, pkg } = await mkMemberWithPackage(pool.id, teacher.id, { price: 800000 });
    await prisma.user.update({ where: { id: m.id }, data: { referralCode: { connect: { code } } } });
    const b = await book(m.id, (await mkSlot(teacher.id, pool.id, -5)).id, pkg.id);
    await mark(teacher.id, b.id, true);
    expect(await releaseDueCommissions(new Date(Date.now() + 4 * DAY))).toBe(1);
    const paid = (await prisma.coachProfile.findUniqueOrThrow({ where: { id: referrer.coachProfile!.id } })).walletBalance;
    expect(paid).toBeGreaterThan(0);

    await refund(pkg.id);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: referrer.coachProfile!.id } })).walletBalance).toBe(0);
    expect((await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).status).toBe("VOID");

    const next = await prisma.package.create({
      data: { memberId: m.id, dependentId: pkg.dependentId, poolId: pool.id, coachId: teacher.id, name: "P2", totalSesi: 8, sisaSesi: 8, jatahCancel: 2, poolPrice: 400000, coachPrice: 320000, serviceFee: 80000, status: "ACTIVE", startDate: new Date() },
    });
    await prisma.payment.create({ data: { packageId: next.id, midtransOrderId: "ORD-next", amount: 800000, status: "SUCCESS", paidAt: new Date() } });
    const b2 = await book(m.id, (await mkSlot(teacher.id, pool.id, -3)).id, next.id);
    await mark(teacher.id, b2.id, true);
    expect((await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).status).toBe("VOID");
    expect(await checkInvariants({ packages: false })).toEqual([]);
  });

  it("RF5: komisi yang belum cair langsung dibatalkan tanpa menyentuh saldo pengrujuk", async () => {
    const pool = await mkPool();
    const teacher = await mkUser("COACH");
    const referrer = await mkUser("COACH");
    const code = await getOrCreateAffiliateCode({ coachProfileId: referrer.coachProfile!.id }, "Rujuk");
    const { m, pkg } = await mkMemberWithPackage(pool.id, teacher.id, { price: 800000 });
    await prisma.user.update({ where: { id: m.id }, data: { referralCode: { connect: { code } } } });
    const b = await book(m.id, (await mkSlot(teacher.id, pool.id, -5)).id, pkg.id);
    await mark(teacher.id, b.id, true);
    await refund(pkg.id);
    expect((await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).status).toBe("VOID");
    expect(await releaseDueCommissions(new Date(Date.now() + 30 * DAY))).toBe(0);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: referrer.coachProfile!.id } })).walletBalance).toBe(0);
  });
});
