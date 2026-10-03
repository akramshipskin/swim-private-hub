// Afiliasi + trial (Batch 4, 29 Sep) terhadap Postgres lokal.
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, jitter, spread, tally, mkPricedOffer } from "./fx";
import { checkInvariants } from "./invariants";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { releaseDueCommissions, getOrCreateAffiliateCode } from "@/lib/affiliate";
import { getPlatformBalance } from "@/lib/platform-wallet";
import { POST as checkout } from "@/app/api/payment/checkout/route";
import { POST as register } from "@/app/api/register/route";

const thrownOf = (rs: PromiseSettledResult<unknown>[]) =>
  rs.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? (r as PromiseRejectedResult).reason));
const DAY = 86400e3;

// Member yang mendaftar dengan kode coach "rujukan", paket 800.000 (8 sesi,
// biaya layanan 80.000 -> komisi 50% dari bersih 72.072 = 36.036), n sesi lampau
// dengan coach pengajar (belum ditandai).
const COMMISSION = 36036;
async function setup(sessions = 1) {
  const pool = await mkPool();
  const teacher = await mkUser("COACH");
  const referrer = await mkUser("COACH");
  const code = await getOrCreateAffiliateCode({ coachProfileId: referrer.coachProfile!.id }, "Rujuk");
  const { m, dep, pkg } = await mkMemberWithPackage(pool.id, teacher.id, { price: 800000 });
  await prisma.user.update({ where: { id: m.id }, data: { referralCode: { connect: { code } } } });
  const bookings = [];
  for (let i = 0; i < sessions; i++) bookings.push(await book(m.id, (await mkSlot(teacher.id, pool.id, -5 + i * 0.01)).id, pkg.id));
  return { pool, teacher, referrer, code, m, dep, pkg, bookings };
}
const mark = (coach: { id: string }, bookingId: string, attended: boolean) =>
  as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId, attended: String(attended) })));

beforeEach(reset);

describe("AFILIASI", () => {
  it("F1: sesi pertama Hadir -> komisi 50% biaya layanan bersih menunggu; belum cair sebelum 3 hari; setelah 3 hari masuk saldo pengrujuk & mengurangi pendapatan SPH", async () => {
    const { teacher, referrer, m, bookings } = await setup();
    await mark(teacher, bookings[0].id, true);
    const c = await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } });
    expect(c).toMatchObject({ status: "PENDING", amount: COMMISSION, coachProfileId: referrer.coachProfile!.id, bookingId: bookings[0].id });

    const platformBefore = (await getPlatformBalance()).revenue;
    expect(await releaseDueCommissions(new Date(Date.now() + 2 * DAY))).toBe(0);
    expect(await releaseDueCommissions(new Date(Date.now() + 4 * DAY))).toBe(1);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: referrer.coachProfile!.id } })).walletBalance).toBe(COMMISSION);
    expect((await getPlatformBalance()).revenue).toBe(platformBefore - COMMISSION);
    expect(await checkInvariants()).toEqual([]);
  });

  it("F2: sesi dikoreksi jadi Tidak Hadir sebelum cair -> komisi batal (menunggu); sesi Hadir berikutnya memulai hitungan lagi", async () => {
    const { teacher, m, bookings } = await setup(2);
    await mark(teacher, bookings[0].id, true);
    await mark(teacher, bookings[0].id, false);
    expect(await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).toMatchObject({ status: "WAITING", bookingId: null, releaseAt: null });
    expect(await releaseDueCommissions(new Date(Date.now() + 30 * DAY))).toBe(0);
    await mark(teacher, bookings[1].id, true);
    expect(await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).toMatchObject({ status: "PENDING", bookingId: bookings[1].id });
  });

  it("F3: koreksi sesi pemicu saat member punya sesi Hadir lain -> hitungan pindah ke sesi itu", async () => {
    const { teacher, m, bookings } = await setup(2);
    await mark(teacher, bookings[0].id, true);
    await mark(teacher, bookings[1].id, true);
    await mark(teacher, bookings[0].id, false);
    expect(await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } })).toMatchObject({ status: "PENDING", bookingId: bookings[1].id });
  });

  it("F4: member tanpa kode / paket gratis -> tidak ada komisi", async () => {
    const pool = await mkPool();
    const teacher = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, teacher.id);
    const b = await book(m.id, (await mkSlot(teacher.id, pool.id, -5)).id, pkg.id);
    await mark(teacher, b.id, true);
    expect(await prisma.affiliateCommission.count()).toBe(0);
  });

  it("F5: dua sesi member ditandai Hadir barengan (15 putaran) -> tepat 1 komisi, tidak ada error", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const { teacher, m, bookings } = await setup(2);
      const rs = await settle(bookings.map((b) => (async () => { await jitter(6); return mark(teacher, b.id, true); })()));
      expect(thrownOf(rs)).toEqual([]);
      expect(await prisma.affiliateCommission.count({ where: { memberId: m.id } })).toBe(1);
      const c = await prisma.affiliateCommission.findUniqueOrThrow({ where: { memberId: m.id } });
      tally(sebaran, c.bookingId === bookings[0].id ? "sesi1" : "sesi2");
    }
    spread("F5", sebaran);
  });

  it("F6: pencairan komisi dipanggil 5x barengan -> saldo bertambah tepat sekali", async () => {
    const { teacher, referrer, bookings } = await setup();
    await mark(teacher, bookings[0].id, true);
    const later = new Date(Date.now() + 4 * DAY);
    const rs = await settle(Array.from({ length: 5 }, () => releaseDueCommissions(later)));
    expect(thrownOf(rs)).toEqual([]);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: referrer.coachProfile!.id } })).walletBalance).toBe(COMMISSION);
    expect(await prisma.walletTransaction.count({ where: { type: "AFFILIATE_COMMISSION" } })).toBe(1);
    expect(await checkInvariants()).toEqual([]);
  });

  it("F7: kode kolam juga bisa; kode salah ditolak saat daftar; kode benar tersimpan (huruf kecil tetap cocok)", async () => {
    const pool = await mkPool();
    const code = await getOrCreateAffiliateCode({ poolId: pool.id }, "Tirta");
    expect(await getOrCreateAffiliateCode({ poolId: pool.id }, "Tirta")).toBe(code);
    const body = (ref: string, phone: string) =>
      new Request("http://x/api/register", {
        method: "POST",
        headers: { "x-forwarded-for": `10.0.0.${phone.slice(-2)}` },
        body: JSON.stringify({ name: "Ortu", phone, password: "12345678", acceptedTerms: true, city: "Jakarta", pricePack4: 260000, dailyCapacity: 10, wantsSelf: true, selfBirthDate: "1990-05-05", referralCode: ref }),
      });
    const bad = await register(body("SALAH99", "081277770001"));
    expect(bad.status).toBe(400);
    const ok = await register(body(code.toLowerCase(), "081277770002"));
    expect(ok.status).toBe(201);
    const u = await prisma.user.findFirstOrThrow({ where: { phone: "081277770002" }, select: { referralCode: { select: { poolId: true } } } });
    expect(u.referralCode?.poolId).toBe(pool.id);
  });
});

describe("TRIAL", () => {
  async function trialSetup() {
    const { pool, coach } = await mkPricedOffer();
    const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
    // Sesi coba model harga-dari-coach = sesi: 1.
    const buy = (_unused?: string, dependentId = dep.id) =>
      as({ id: m.id, role: "MEMBER", name: "M" }, () =>
        checkout(new Request("http://x/api/payment/checkout", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: coach.id, sesi: 1, dependentId }) })),
      );
    return { pool, m, dep, buy };
  }

  it("T1: klik beli trial 5x barengan -> tepat 1 paket trial", async () => {
    const { dep, buy } = await trialSetup();
    const rs = await settle(Array.from({ length: 5 }, () => buy()));
    expect(thrownOf(rs)).toEqual([]);
    expect(await prisma.package.count({ where: { dependentId: dep.id, isTrial: true } })).toBe(1);
  });

  it("T2: peserta yang sudah punya paket tidak boleh trial; adiknya yang belum punya paket boleh", async () => {
    const { pool, m, dep, buy } = await trialSetup();
    await prisma.package.create({ data: { memberId: m.id, dependentId: dep.id, poolId: pool.id, name: "Reguler", totalSesi: 8, sisaSesi: 8, status: "ACTIVE" } });
    expect((await buy()).status).toBe(403);
    const adik = await prisma.dependent.create({ data: { memberId: m.id, name: "Adik" } });
    const r = await buy(undefined, adik.id);
    expect(r.status).toBe(200);
    expect(await prisma.package.count({ where: { dependentId: adik.id, isTrial: true } })).toBe(1);
  });
});
