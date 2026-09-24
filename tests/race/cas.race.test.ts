import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle } from "./fx";
import { adminCancelBooking } from "@/app/admin/booking-overview/actions";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
beforeEach(reset);
describe("CAS batal vs absen", () => {
  it("R13b: ADMIN batal vs COACH tandai Hadir barengan, 20x -> gak pernah CANCELLED + saldo kekredit", async () => {
    const tally: Record<string, number> = {}; let bad = 0;
    for (let i = 0; i < 20; i++) {
      await reset();
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slot = await mkSlot(coach.id, pool.id, -3);
      const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
      const b = await book(m.id, slot.id, pkg.id);
      const calls = [
        () => as({ id: admin.id, role: "ADMIN" }, () => adminCancelBooking(null, fd({ bookingId: b.id }))),
        () => as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" }))),
      ];
      await settle((i % 2 ? calls.reverse() : calls).map((c) => c()));
      const bb = await prisma.booking.findUniqueOrThrow({ where: { id: b.id } });
      const cp = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } });
      const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
      if (bb.status === "CANCELLED" && cp.walletBalance > 0) bad++;
      if (bb.status === "CANCELLED" && p.sisaSesi !== 8) bad++;
      if (bb.status === "BOOKED" && (p.sisaSesi !== 7 || (bb.attended && cp.walletBalance !== 55000))) bad++;
      const k = `${bb.status}/attended=${bb.attended}/coach=${cp.walletBalance}/sisa=${p.sisaSesi}`; tally[k] = (tally[k] ?? 0) + 1;
    }
    console.log("R13b", tally);
    expect(bad).toBe(0);
  });
});
