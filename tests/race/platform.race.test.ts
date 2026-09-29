// Saldo platform setelah pembalikan Hadir (Q-e, keputusan Hadi 29 Sep):
// boleh minus, penarikan tertahan sampai tertutup sesi berikutnya.
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle } from "./fx";
import { checkInvariants } from "./invariants";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { getPlatformBalance, withdrawPlatformBalance } from "@/lib/platform-wallet";

const mark = (coach: { id: string }, bookingId: string, attended: boolean) =>
  as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId, attended: String(attended) })));
// Lewati masa tahan H+3 tanpa menunggu: mundurkan waktu baris platform.
const matureAll = () =>
  prisma.walletTransaction.updateMany({ where: { type: { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] } }, data: { createdAt: new Date(Date.now() - 10 * 86400e3) } });

beforeEach(reset);

describe("PLATFORM: pembalikan setelah saldo ditarik", () => {
  it("P1: Tidak Datang (bagian platform besar) -> platform tarik semua -> dikoreksi Hadir (laporan member) -> saldo minus, penarikan ditolak; sesi Hadir berikutnya menutup minus", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const admin = await mkUser("ADMIN");
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
    const b1 = await book(m.id, (await mkSlot(coach.id, pool.id, -5)).id, pkg.id);
    const b2 = await book(m.id, (await mkSlot(coach.id, pool.id, -4)).id, pkg.id);

    await mark(coach, b1.id, false);
    await matureAll();
    const before = await getPlatformBalance();
    expect(before.availableRevenue).toBeGreaterThan(0);
    await withdrawPlatformBalance({ adminId: admin.id, revenueAmount: before.availableRevenue, includeTax: true, note: null, transferReference: "TRF-1" });

    // Koreksi setelah uang ditarik: TIDAK ditolak, saldo platform jadi minus.
    const res = await mark(coach, b1.id, true);
    expect(res).not.toMatchObject({ error: expect.anything() });
    const minus = await getPlatformBalance();
    expect(minus.revenue).toBeLessThan(0);
    await expect(
      withdrawPlatformBalance({ adminId: admin.id, revenueAmount: 1, includeTax: false, note: null, transferReference: "TRF-2" }),
    ).rejects.toThrow(/melebihi saldo/);
    expect(await checkInvariants()).toEqual([]);

    // Sesi berikutnya Hadir -> pendapatan baru menutup minus.
    await mark(coach, b2.id, true);
    expect((await getPlatformBalance()).revenue).toBeGreaterThan(minus.revenue);
    expect(await checkInvariants()).toEqual([]);
  });

  it("P2: 2 admin menarik saldo platform barengan (10 putaran) -> total tarikan tidak pernah melebihi saldo", async () => {
    for (let i = 0; i < 10; i++) {
      await reset();
      const pool = await mkPool();
      const coach = await mkUser("COACH");
      const [a1, a2] = [await mkUser("ADMIN"), await mkUser("ADMIN")];
      const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
      await mark(coach, (await book(m.id, (await mkSlot(coach.id, pool.id, -5)).id, pkg.id)).id, true);
      await matureAll();
      const all = (await getPlatformBalance()).availableRevenue;
      await settle([a1, a2].map((a, k) => withdrawPlatformBalance({ adminId: a.id, revenueAmount: all, includeTax: false, note: null, transferReference: `TRF-${k}` })));
      expect(await prisma.platformWithdrawal.count()).toBe(1);
      expect(await checkInvariants()).toEqual([]);
    }
  });
});
