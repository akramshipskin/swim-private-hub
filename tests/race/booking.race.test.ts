import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, summarize, jitter, tally, spread } from "./fx";
import { POST as bookPOST } from "@/app/api/booking/route";
import { DELETE as cancelDELETE } from "@/app/api/booking/[id]/route";
import { cancelBookingAsCoach, addAvailability, deleteAvailability } from "@/app/coach/jadwal/actions";
import { adminCancelBooking } from "@/app/admin/booking-overview/actions";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { updatePackage } from "@/app/admin/paket/actions";
import { removeAffiliation } from "@/app/admin/kolam/actions";
import { GET as availabilityGET } from "@/app/api/availability/route";
import { cancelBooking } from "@/lib/cancel-booking";
import { checkInvariants } from "./invariants";

const req = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });
const N = 12;

beforeEach(reset);

describe("BOOKING races", () => {
  it("R1: 12 member beda rebutan 1 slot yang sama -> tepat 1 menang, sisa sesi cuma kepotong di pemenang", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 48);
    const members = await Promise.all(Array.from({ length: N }, () => mkMemberWithPackage(pool.id)));
    const rs = await settle(members.map(({ m, pkg }) => as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: slot.id, packageId: pkg.id })))));
    const codes = summarize(rs); console.log("R1", codes);
    const active = await prisma.booking.count({ where: { availabilityId: slot.id, status: "BOOKED" } });
    const pkgs = await prisma.package.findMany({ where: { id: { in: members.map((x) => x.pkg.id) } } });
    const decremented = pkgs.filter((p) => p.sisaSesi === 7).length;
    expect(active).toBe(1);
    expect(decremented).toBe(1);
    expect(codes.filter((c) => c === "HTTP201").length).toBe(1);
  });

  it("R2: 1 paket sisa 2 sesi, booking 12 slot beda barengan -> maks 2 sukses, sisa gak negatif", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slots = await Promise.all(Array.from({ length: N }, () => mkSlot(coach.id, pool.id, 48)));
    const { m, pkg } = await mkMemberWithPackage(pool.id, { sisa: 2 });
    const rs = await settle(slots.map((s) => as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: s.id, packageId: pkg.id })))));
    console.log("R2", summarize(rs));
    const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    const booked = await prisma.booking.count({ where: { packageId: pkg.id, status: "BOOKED" } });
    expect(p.sisaSesi).toBeGreaterThanOrEqual(0);
    expect(booked).toBe(2);
    expect(p.sisaSesi + booked).toBe(2);
  });

  it("R3: double-klik booking slot sama pake paket sama -> 1 booking, sisa kepotong 1", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 48);
    const { m, pkg } = await mkMemberWithPackage(pool.id);
    const rs = await settle(Array.from({ length: 5 }, () => as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: slot.id, packageId: pkg.id })))));
    console.log("R3", summarize(rs));
    expect(await prisma.booking.count({ where: { availabilityId: slot.id } })).toBe(1);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(7);
  });

  it("R4: booking vs coach hapus slot barengan -> gak boleh ada booking nyangkut di slot yang kehapus / sisa sesi ilang", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: coach.id } });
    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const slot = await mkSlot(coach.id, pool.id, 48);
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      const rs = await settle([
        as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: slot.id, packageId: pkg.id }))),
        as({ id: coach.id, role: "COACH" }, () => deleteAvailability(slot.id)),
      ]);
      const slotExists = await prisma.availability.findUnique({ where: { id: slot.id } });
      const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
      const bookings = await prisma.booking.count({ where: { packageId: pkg.id, status: "BOOKED" } });
      results.push(`${summarize(rs).join("|")} slot=${!!slotExists} sisa=${p.sisaSesi} booked=${bookings}`);
      expect(p.sisaSesi + bookings).toBe(8);
    }
    console.log("R4", results);
  });

  it("R5: 2 slot jam sama di 2 kolam beda gak bisa dibuat (coach gak bisa di 2 tempat) walau submit barengan", async () => {
    const [p1, p2] = [await mkPool(), await mkPool()]; const coach = await mkUser("COACH");
    await prisma.poolAffiliation.createMany({ data: [{ poolId: p1.id, coachId: coach.id }, { poolId: p2.id, coachId: coach.id }] });
    const tomorrow = new Date(Date.now() + 2 * 86400e3).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const rs = await settle([p1, p2, p1, p2].map((p) => as({ id: coach.id, role: "COACH", name: "C" }, () => addAvailability(null, fd({ date: tomorrow, startTime: "08:00", endTime: "10:00", poolId: p.id })))));
    console.log("R5", summarize(rs));
    const slots = await prisma.availability.findMany({ where: { coachId: coach.id } });
    expect(slots.length).toBe(2);
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
  });
});

describe("CANCEL races", () => {
  it("R6: member double-klik batal booking sama -> sisa sesi balik +1 sekali doang", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 48);
    const { m, pkg } = await mkMemberWithPackage(pool.id);
    const b = await book(m.id, slot.id, pkg.id);
    const rs = await settle(Array.from({ length: 6 }, () => as({ id: m.id, role: "MEMBER" }, () => cancelDELETE(new Request("http://x"), { params: Promise.resolve({ id: b.id }) }))));
    console.log("R6", summarize(rs));
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
  });

  it("R7: jatah batal 2, member batalin 8 booking beda barengan -> maks 2 lolos", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, { jatah: 2 });
    const bs = [];
    for (let i = 0; i < 8; i++) { const s = await mkSlot(coach.id, pool.id, 48); bs.push(await book(m.id, s.id, pkg.id)); }
    const rs = await settle(bs.map((b) => as({ id: m.id, role: "MEMBER" }, () => cancelDELETE(new Request("http://x"), { params: Promise.resolve({ id: b.id }) }))));
    console.log("R7", summarize(rs));
    const cancelled = await prisma.booking.count({ where: { packageId: pkg.id, status: "CANCELLED" } });
    const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(cancelled).toBe(2);
    expect(p.sisaSesi).toBe(0 + 2);
  });

  it("R8: member batal + coach batal + admin batal booking sama barengan -> 1 menang, sisa +1 sekali", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, 48);
    const { m, pkg } = await mkMemberWithPackage(pool.id);
    const b = await book(m.id, slot.id, pkg.id);
    const rs = await settle([
      as({ id: m.id, role: "MEMBER" }, () => cancelDELETE(new Request("http://x"), { params: Promise.resolve({ id: b.id }) })),
      as({ id: coach.id, role: "COACH" }, () => cancelBookingAsCoach(null, fd({ bookingId: b.id }))),
      as({ id: admin.id, role: "ADMIN" }, () => adminCancelBooking(null, fd({ bookingId: b.id }))),
    ]);
    console.log("R8", summarize(rs));
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
  });

  it("R9: cancel vs booking ulang slot yang sama barengan -> max 1 booking aktif per slot", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 48);
    const a = await mkMemberWithPackage(pool.id);
    const others = await Promise.all(Array.from({ length: 6 }, () => mkMemberWithPackage(pool.id)));
    const b = await book(a.m.id, slot.id, a.pkg.id);
    const rs = await settle([
      as({ id: a.m.id, role: "MEMBER" }, () => cancelDELETE(new Request("http://x"), { params: Promise.resolve({ id: b.id }) })),
      ...others.map((o) => as({ id: o.m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: slot.id, packageId: o.pkg.id })))),
    ]);
    console.log("R9", summarize(rs));
    const active = await prisma.booking.count({ where: { availabilityId: slot.id, status: "BOOKED" } });
    const av = await prisma.availability.findUniqueOrThrow({ where: { id: slot.id } });
    expect(active).toBeLessThanOrEqual(1);
    expect(av.status).toBe(active === 1 ? "BOOKED" : "AVAILABLE");
    const pk = await prisma.package.findMany({ where: { id: { in: others.map((o) => o.pkg.id) } } });
    const winners = await prisma.booking.count({ where: { packageId: { in: others.map((o) => o.pkg.id) }, status: "BOOKED" } });
    expect(pk.reduce((s, p) => s + (8 - p.sisaSesi), 0)).toBe(winners);
  });
});

describe("ATTENDANCE / WALLET races", () => {
  async function pastBooking(price = 800000) {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price });
    const b = await book(m.id, slot.id, pkg.id);
    return { pool, coach, admin, slot, m, pkg, b };
  }
  async function wallet(poolId: string, coachProfileId: string) {
    const p = await prisma.pool.findUniqueOrThrow({ where: { id: poolId } });
    const c = await prisma.coachProfile.findUniqueOrThrow({ where: { id: coachProfileId } });
    const lp = await prisma.walletTransaction.aggregate({ where: { poolId }, _sum: { amount: true } });
    const lc = await prisma.walletTransaction.aggregate({ where: { coachProfileId }, _sum: { amount: true } });
    return { pool: p.walletBalance, coach: c.walletBalance, ledgerPool: lp._sum.amount ?? 0, ledgerCoach: lc._sum.amount ?? 0 };
  }

  it("R10: coach + admin tandai Hadir barengan (8x) -> wallet dikredit sekali", async () => {
    const x = await pastBooking();
    const rs = await settle(Array.from({ length: 8 }, (_, i) => as(i % 2 ? { id: x.admin.id, role: "ADMIN" } : { id: x.coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: "true" })))));
    console.log("R10", summarize(rs));
    const w = await wallet(x.pool.id, x.coach.coachProfile!.id);
    console.log("R10 wallet", w);
    expect(w.coach).toBe(55000); expect(w.pool).toBe(30000);
    expect(w.ledgerPool).toBe(w.pool); expect(w.ledgerCoach).toBe(w.coach);
  });

  it("R11: toggle Hadir/Gak Hadir bolak-balik barengan -> saldo akhir konsisten sama status akhir + ledger", async () => {
    const x = await pastBooking();
    const rs = await settle(Array.from({ length: 10 }, (_, i) => as({ id: x.coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: i % 2 ? "false" : "true" })))));
    console.log("R11", summarize(rs));
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: x.b.id } });
    const w = await wallet(x.pool.id, x.coach.coachProfile!.id);
    console.log("R11 final attended", b.attended, w);
    expect(w.coach).toBe(b.attended ? 55000 : 0);
    expect(w.ledgerCoach).toBe(w.coach); expect(w.ledgerPool).toBe(w.pool);
  });

  it("R12 (logic, sequential): sesi udah lewat & udah Hadir, lalu coach Batalin -> saldo harus dibalik / sesi gak boleh balik", async () => {
    const x = await pastBooking();
    await as({ id: x.coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: "true" })));
    const r = await settle([as({ id: x.coach.id, role: "COACH" }, () => cancelBookingAsCoach(null, fd({ bookingId: x.b.id })))]);
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: x.b.id } });
    const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
    const w = await wallet(x.pool.id, x.coach.coachProfile!.id);
    console.log("R12", summarize(r), { status: b.status, attended: b.attended, sisa: p.sisaSesi, ...w });
    expect(b.status === "CANCELLED" && w.coach > 0).toBe(false);
  });

  it("R13: coach Batal vs admin tandai Hadir barengan (sesi lewat) -> gak boleh CANCELLED tapi saldo kekredit", async () => {
    const out: string[] = [];
    let bad = 0;
    for (let i = 0; i < 8; i++) {
      await reset();
      const x = await pastBooking();
      const rs = await settle([
        as({ id: x.coach.id, role: "COACH" }, () => cancelBookingAsCoach(null, fd({ bookingId: x.b.id }))),
        as({ id: x.admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: "true" }))),
      ]);
      const b = await prisma.booking.findUniqueOrThrow({ where: { id: x.b.id } });
      const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
      const w = await wallet(x.pool.id, x.coach.coachProfile!.id);
      if (b.status === "CANCELLED" && w.coach > 0) bad++;
      out.push(`${summarize(rs).join("|")} -> ${b.status} attended=${b.attended} sisa=${p.sisaSesi} coach=${w.coach}`);
    }
    console.log("R13", out);
    expect(bad).toBe(0);
  });

  it("R14: admin edit sisa sesi (form lama) vs member booking barengan -> sisa sesi + booking aktif harus konsisten", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const { m, pkg } = await mkMemberWithPackage(pool.id, { sisa: 5 });
    const slots = await Promise.all(Array.from({ length: 3 }, () => mkSlot(coach.id, pool.id, 48)));
    const rs = await settle([
      ...slots.map((s) => as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: s.id, packageId: pkg.id })))),
      as({ id: admin.id, role: "ADMIN" }, () => updatePackage(null, fd({ packageId: pkg.id, sisaSesi: "5", expectedSisaSesi: "5", jatahCancel: "2", status: "ACTIVE", expiredDate: "" }))),
    ]);
    const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    const booked = await prisma.booking.count({ where: { packageId: pkg.id, status: "BOOKED" } });
    console.log("R14", summarize(rs), { sisa: p.sisaSesi, booked });
    expect(p.sisaSesi + booked).toBe(5);
  });

  it("R15: slot yang pernah dibooking lalu batal -> 'Hapus' cuma menutup (riwayat tetap), tidak bisa dibooking, bisa dibuka ulang di kolam yang sama", async () => {
    const [p1, p2] = [await mkPool(), await mkPool()]; const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    await prisma.poolAffiliation.createMany({ data: [{ poolId: p1.id, coachId: coach.id }, { poolId: p2.id, coachId: coach.id }] });
    const day = new Date(Date.now() + 2 * 86400e3).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const add = (poolId: string) => as({ id: coach.id, role: "COACH", name: "C" }, () => addAvailability(null, fd({ date: day, startTime: "08:00", endTime: "10:00", poolId })));
    await add(p1.id);
    const [s8, s9] = await prisma.availability.findMany({ where: { coachId: coach.id }, orderBy: { startTime: "asc" } });
    const { m, pkg } = await mkMemberWithPackage(p1.id);
    const b = await book(m.id, s8.id, pkg.id);
    await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } });

    await as({ id: coach.id, role: "COACH" }, () => deleteAvailability(s8.id));
    await as({ id: coach.id, role: "COACH" }, () => deleteAvailability(s9.id));
    expect((await prisma.availability.findUniqueOrThrow({ where: { id: s8.id } })).status).toBe("CLOSED");
    expect(await prisma.availability.findUnique({ where: { id: s9.id } })).toBeNull(); // tanpa riwayat -> benar-benar hapus
    expect(await prisma.booking.count({ where: { id: b.id, status: "CANCELLED" } })).toBe(1);

    const list = await as({ id: m.id, role: "MEMBER" }, () => availabilityGET(new Request(`http://x/api/availability?date=${day}&poolId=${p1.id}`)));
    expect((await list.json()).availabilities).toEqual([]);
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: s8.id, packageId: pkg.id })));
    expect(res.status).toBe(409);

    // Kolam lain di jam yang sama: tetap bentrok (slot lama tidak dipindah kolam).
    const other = await as({ id: coach.id, role: "COACH", name: "C" }, () => addAvailability(null, fd({ date: day, startTime: "08:00", endTime: "09:00", poolId: p2.id })));
    expect(other).toMatchObject({ error: expect.any(String) });
    // Kolam yang sama: slot lama dibuka ulang (id sama), jam 9 dibuat baru.
    expect(await add(p1.id)).toBeNull();
    const again = await prisma.availability.findMany({ where: { coachId: coach.id }, orderBy: { startTime: "asc" } });
    expect(again.map((a) => a.status)).toEqual(["AVAILABLE", "AVAILABLE"]);
    expect(again[0].id).toBe(s8.id);
    expect((await as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: s8.id, packageId: pkg.id })))).status).toBe(201);

    // Admin mencopot coach dari kolam: slot kosong ber-riwayat ikut ditutup, bukan dihapus.
    await cancelBooking({ bookingId: (await prisma.booking.findFirstOrThrow({ where: { status: "BOOKED" } })).id, actor: { role: "ADMIN" } });
    const aff = await prisma.poolAffiliation.findFirstOrThrow({ where: { poolId: p1.id } });
    await as({ id: admin.id, role: "ADMIN" }, () => removeAffiliation(fd({ affiliationId: aff.id })));
    expect((await prisma.availability.findUniqueOrThrow({ where: { id: s8.id } })).status).toBe("CLOSED");
    expect(await prisma.availability.count({ where: { coachId: coach.id } })).toBe(1);
    expect(await prisma.booking.count({ where: { availabilityId: s8.id } })).toBe(2);
    expect(await checkInvariants()).toEqual([]);
  });

  it("R16: coach menghapus slot ber-riwayat pas member booking slot itu (15 putaran) -> slot BOOKED atau CLOSED, tidak pernah dua-duanya", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const pool = await mkPool(); const coach = await mkUser("COACH");
      const slot = await mkSlot(coach.id, pool.id, 48);
      const old = await mkMemberWithPackage(pool.id);
      await cancelBooking({ bookingId: (await book(old.m.id, slot.id, old.pkg.id)).id, actor: { role: "ADMIN" } });
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      const w = i * 0.8;
      const rs = await settle([
        as({ id: m.id, role: "MEMBER" }, () => bookPOST(req({ availabilityId: slot.id, packageId: pkg.id }))),
        (async () => { await jitter(w); return as({ id: coach.id, role: "COACH" }, () => deleteAvailability(slot.id)); })(),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      const s = await prisma.availability.findUniqueOrThrow({ where: { id: slot.id } });
      const active = await prisma.booking.count({ where: { availabilityId: slot.id, status: "BOOKED" } });
      expect(s.status === "BOOKED" ? active === 1 : s.status === "CLOSED" && active === 0).toBe(true);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, s.status);
    }
    spread("R16", sebaran);
  });
});
