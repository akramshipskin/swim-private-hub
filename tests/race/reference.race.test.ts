// 2 tes race REFERENSI (ditulis Claude). Tes race baru dari OpenCode meniru
// pola persis ini: siapkan data -> jalankan aksi barengan lewat settle() ->
// cek hasil akhir + checkInvariants().
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, fd, settle, jitter, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { POST as bookPOST } from "@/app/api/booking/route";
import { togglePoolActive } from "@/app/admin/kolam/actions";
import { withdrawPlatform } from "@/app/admin/withdrawals/platform-actions";
import { getPlatformBalance } from "@/lib/platform-wallet";

const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });

beforeEach(reset);

describe("REFERENSI", () => {
  it("N1: admin menonaktifkan kolam pas 8 member booking barengan (12 putaran, jeda acak) -> tidak ada error 500, hasil booking hanya 201/409, data konsisten", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slots = await Promise.all(Array.from({ length: 8 }, () => mkSlot(coach.id, pool.id, 48)));
      const members = await Promise.all(slots.map(() => mkMemberWithPackage(pool.id)));
      const rs = await settle([
        (async () => { await jitter(6); return as({ id: admin.id, role: "ADMIN" }, () => togglePoolActive(pool.id, false)); })(),
        ...members.map(({ m, pkg }, k) => as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slots[k].id, packageId: pkg.id })))),
      ]);
      const thrown = rs.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? (r as PromiseRejectedResult).reason));
      const codes = rs.flatMap((r) => (r.status === "fulfilled" && r.value instanceof Response ? [r.value.status] : []));
      expect(thrown).toEqual([]);
      expect(codes.length).toBe(8);
      expect(codes.every((c) => c === 201 || c === 409)).toBe(true);
      expect((await prisma.pool.findUniqueOrThrow({ where: { id: pool.id } })).isActive).toBe(false);
      expect(await checkInvariants()).toEqual([]);
      const ok = codes.filter((c) => c === 201).length;
      tally(sebaran, `${ok} berhasil / ${8 - ok} ditolak`);
    }
    spread("N1", sebaran);
  });

  it("N7: 6 admin menarik saldo platform Rp40.000 barengan padahal saldo Rp100.000 -> tepat 2 berhasil, saldo tidak minus", async () => {
    const admin = await mkUser("ADMIN");
    await prisma.walletTransaction.create({ data: { type: "PLATFORM_REVENUE", amount: 100000 } });
    const rs = await settle(Array.from({ length: 6 }, () => as({ id: admin.id, role: "ADMIN" }, () => withdrawPlatform(null, fd({ revenueAmount: "40000" })))));
    const results = rs.map((r) => (r.status === "fulfilled" ? r.value : { error: "THROW " + String((r as PromiseRejectedResult).reason?.message) }));
    console.log("N7", results);
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
    expect(results.filter((r) => r?.ok === true).length).toBe(2);
    const withdrawn = (await prisma.platformWithdrawal.aggregate({ _sum: { revenueAmount: true } }))._sum.revenueAmount;
    expect(withdrawn).toBe(80000);
    expect((await getPlatformBalance()).revenue).toBe(20000);
    expect(await checkInvariants()).toEqual([]);
  });
});
