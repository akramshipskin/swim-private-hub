// Kota tahap 2-4 (Hadi 3 Okt): kapasitas harian kolam, syarat 4 jam kosong,
// penjaga jadwal coach, ganti coach tanpa biaya hari ke-10.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkUser, mkSlot, book, settle, fd, mkPricedOffer, openSlots } from "./fx";
import { checkInvariants } from "./invariants";
import { POST as bookingPost } from "@/app/api/booking/route";
import { POST as checkout } from "@/app/api/payment/checkout/route";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { freeChangeCoach } from "@/app/member/paket/free-change-actions";
import { runCoachSlotWatch, countEpisodes, coachViolationEpisodes } from "@/lib/coach-slot-watch";
import { completeCoachChange } from "@/lib/coach-change";
import { togglePoolActive } from "@/app/admin/kolam/actions";
import * as push from "@/lib/push";

beforeEach(async () => {
  await reset();
});

const DAY = 86_400_000;
const bookAs = (memberId: string, availabilityId: string, packageId: string) =>
  as({ id: memberId, role: "MEMBER", name: "M" }, () => bookingPost(new Request("http://x", { method: "POST", body: JSON.stringify({ availabilityId, packageId }) })));

// Paket 8 sesi lunas: kolam 480rb + coach 800rb + layanan 83.200 = 1.363.200 (nilai sesi 170.400).
async function paidPackage(poolId: string, coachId: string, opts: { freeChange?: boolean } = {}) {
  const m = await mkUser("MEMBER");
  const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak " + m.id.slice(-4) } });
  const pkg = await prisma.package.create({
    data: {
      memberId: m.id, dependentId: dep.id, poolId, coachId, name: "Paket 8 sesi", totalSesi: 8, sisaSesi: 8, jatahCancel: 4, status: "ACTIVE",
      startDate: new Date(), expiredDate: new Date(Date.now() + 60 * DAY), poolPrice: 480000, coachPrice: 800000, serviceFee: 83200, durationDays: 90,
      freeCoachChangeAt: opts.freeChange ? new Date() : null,
    },
  });
  await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: "PKG-" + pkg.id, amount: 1363200, status: "SUCCESS", paidAt: new Date() } });
  return { m, dep, pkg };
}
async function coachAt(poolId: string, p8: number, city = "Jakarta") {
  const c = await prisma.user.create({ data: { name: "Coach " + Math.random().toString().slice(2, 8), phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", city, coachProfile: { create: { pricePack4: Math.round(p8 / 2), pricePack8: p8 } } } });
  await prisma.poolAffiliation.create({ data: { poolId, coachId: c.id } });
  await openSlots(c.id, poolId);
  return c;
}

describe("KAPASITAS HARIAN", () => {
  it("KH1: kapasitas 2, lima member booking hari yang sama bersamaan -> tepat 2 berhasil; hari lain tidak terpengaruh", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: pool.id }, data: { dailyCapacity: 2 } });
    const slots = await Promise.all([1, 2, 3, 4, 5].map(() => mkSlot(coach.id, pool.id, 30)));
    const pkgs = await Promise.all(slots.map(() => paidPackage(pool.id, coach.id)));
    const rs = await settle(slots.map((s, i) => bookAs(pkgs[i].m.id, s.id, pkgs[i].pkg.id)));
    const ok = rs.filter((r) => r.status === "fulfilled" && r.value.status === 201).length;
    expect(ok).toBe(2);
    const day = slots[0].date;
    expect(await prisma.booking.count({ where: { status: "BOOKED", availability: { poolId: pool.id, date: day } } })).toBe(2);
    // Sesi gagal tidak memotong sisa sesi paket.
    expect((await prisma.package.aggregate({ where: { id: { in: pkgs.map((p) => p.pkg.id) } }, _sum: { sisaSesi: true } }))._sum.sisaSesi).toBe(5 * 8 - 2);
    const other = await mkSlot(coach.id, pool.id, 30 + 48);
    expect((await bookAs(pkgs[4].m.id, other.id, pkgs[4].pkg.id)).status).toBe(201);
    expect(await checkInvariants({ ledger: false })).toEqual([]);
  });

  it("KH2: kapasitas diturunkan di bawah jumlah booking -> booking lama tetap, booking baru ditolak; dikosongkan -> tanpa batas", async () => {
    const { pool, coach } = await mkPricedOffer();
    const [a, b, c] = await Promise.all([1, 2, 3].map(() => mkSlot(coach.id, pool.id, 30)));
    const p1 = await paidPackage(pool.id, coach.id);
    expect((await bookAs(p1.m.id, a.id, p1.pkg.id)).status).toBe(201);
    expect((await bookAs(p1.m.id, b.id, p1.pkg.id)).status).toBe(201);
    await prisma.pool.update({ where: { id: pool.id }, data: { dailyCapacity: 1 } });
    expect((await bookAs(p1.m.id, c.id, p1.pkg.id)).status).toBe(409);
    expect(await prisma.booking.count({ where: { status: "BOOKED", packageId: p1.pkg.id } })).toBe(2);
    await prisma.pool.update({ where: { id: pool.id }, data: { dailyCapacity: null } });
    expect((await bookAs(p1.m.id, c.id, p1.pkg.id)).status).toBe(201);
  });
});

describe("SYARAT 4 JAM KOSONG", () => {
  it("SJ1: coach dengan 3 jam kosong tidak bisa dibeli; jam ke-4 di hari ke-20 tidak dihitung; jam ke-4 dalam 14 hari = bisa", async () => {
    const { pool } = await mkPricedOffer();
    const c = await prisma.user.create({ data: { name: "C", phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", coachProfile: { create: { pricePack4: 440000, pricePack8: 800000 } } } });
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: c.id } });
    await openSlots(c.id, pool.id, 3);
    await mkSlot(c.id, pool.id, 20 * 24);
    const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
    const buy = () => as({ id: m.id, role: "MEMBER" }, () => checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: c.id, sesi: 4, dependentId: dep.id }) })));
    expect((await buy()).status).toBe(409);
    await mkSlot(c.id, pool.id, 5 * 24);
    expect((await buy()).status).toBe(200);
  });
  it("SJ2: jam kosong di tanggal yang kapasitas kolamnya sudah penuh tidak dihitung untuk syarat beli (penjaga jadwal tetap menganggap coach membuka jam)", async () => {
    const { pool, coach: other } = await mkPricedOffer();
    const c = await prisma.user.create({ data: { name: "C", phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", coachProfile: { create: { pricePack4: 440000, pricePack8: 800000 } } } });
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: c.id } });
    const mine = [];
    for (let i = 0; i < 4; i++) mine.push(await mkSlot(c.id, pool.id, 30));
    const busy = await mkSlot(other.id, pool.id, 30);
    expect(mine.every((s) => s.date.getTime() === busy.date.getTime())).toBe(true);
    const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
    const buy = () => as({ id: m.id, role: "MEMBER" }, () => checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: c.id, sesi: 4, dependentId: dep.id }) })));
    expect((await buy()).status).toBe(200);
    await prisma.payment.deleteMany({ where: { package: { memberId: m.id } } });
    await prisma.package.deleteMany({ where: { memberId: m.id } });
    // Kapasitas 1 dan sudah terisi booking member lain di tanggal yang sama.
    await prisma.pool.update({ where: { id: pool.id }, data: { dailyCapacity: 1 } });
    const p0 = await paidPackage(pool.id, other.id);
    expect((await bookAs(p0.m.id, busy.id, p0.pkg.id)).status).toBe(201);
    expect((await buy()).status).toBe(409);
    const { pkg } = await paidPackage(pool.id, c.id);
    // Penjaga jadwal (pelanggaran coach) sengaja tidak memakai kapasitas: kolam
    // penuh karena member lain bukan kelalaian coach (menunggu keputusan Hadi).
    await runCoachSlotWatch(new Date());
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).toBeNull();
  });
});

describe("PENJAGA JADWAL COACH", () => {
  it("PJ1: hari 0 dicatat, hari 2 coach diingatkan, hari 10 member+admin diberi tahu + 1 pelanggaran + hak ganti tanpa biaya; jalan ulang tidak dobel; coach buka jadwal = kejadian selesai, hak tetap", async () => {
    const spyUser = vi.spyOn(push, "sendPushToUser");
    const spyRole = vi.spyOn(push, "sendPushToRole");
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    const { m, pkg } = await paidPackage(pool.id, coach.id);
    const t0 = new Date();
    await runCoachSlotWatch(t0);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).toEqual(t0);
    await runCoachSlotWatch(new Date(t0.getTime() + 1 * DAY));
    expect(spyUser.mock.calls.filter(([u]) => u === coach.id)).toHaveLength(0);
    await runCoachSlotWatch(new Date(t0.getTime() + 2 * DAY));
    expect(spyUser.mock.calls.filter(([u]) => u === coach.id)).toHaveLength(1);
    const t10 = new Date(t0.getTime() + 10 * DAY);
    await runCoachSlotWatch(t10);
    await runCoachSlotWatch(t10);
    expect(await prisma.coachViolation.count({ where: { coachId: coach.id } })).toBe(1);
    expect(spyUser.mock.calls.filter(([u]) => u === m.id)).toHaveLength(1);
    expect(spyRole.mock.calls.filter(([r]) => r === "ADMIN")).toHaveLength(1);
    const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(after.freeCoachChangeAt).not.toBeNull();
    // Paket TIDAK diperpanjang.
    expect(after.expiredDate).toEqual(pkg.expiredDate);
    // Jam kosong sesudah "hari ke-11" (waktu pemeriksa di tes ini dimajukan).
    await mkSlot(coach.id, pool.id, 12 * 24);
    await runCoachSlotWatch(new Date(t0.getTime() + 11 * DAY));
    const cleared = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(cleared.noSlotSince).toBeNull();
    expect(cleared.freeCoachChangeAt).not.toBeNull();
    spyUser.mockRestore();
    spyRole.mockRestore();
  });

  it("PJ6: coach diam ke 3 member = 3 catatan paket tapi 1 kejadian; admin diberi tahu sekali", async () => {
    const spyRole = vi.spyOn(push, "sendPushToRole");
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    for (let i = 0; i < 3; i++) await paidPackage(pool.id, coach.id);
    const t0 = new Date();
    await runCoachSlotWatch(t0);
    await runCoachSlotWatch(new Date(t0.getTime() + 10 * DAY));
    expect(await prisma.coachViolation.count({ where: { coachId: coach.id } })).toBe(3);
    expect((await coachViolationEpisodes(new Date(t0.getTime() + 10 * DAY), [coach.id])).get(coach.id)).toBe(1);
    expect(spyRole.mock.calls.filter(([r]) => r === "ADMIN")).toHaveLength(1);
    expect((spyRole.mock.calls[0][1] as { title: string }).title).toContain("Coach tidak membuka jadwal");
    spyRole.mockRestore();
    // Pengelompokan: awal kejadian berjarak > 10 hari = kejadian terpisah.
    const d = (n: number) => new Date(t0.getTime() + n * DAY);
    expect(countEpisodes([d(0), d(1), d(9)])).toBe(1);
    expect(countEpisodes([d(0), d(11), d(30), d(31)])).toBe(3);
  });

  it("PJ7: kolam dinonaktifkan admin: hari ke-10 member boleh ganti tanpa biaya (sekali), coach TIDAK dicatat melanggar dan tidak diingatkan", async () => {
    const spyUser = vi.spyOn(push, "sendPushToUser");
    const { pool, coach } = await mkPricedOffer();
    const { m, pkg } = await paidPackage(pool.id, coach.id);
    await prisma.pool.update({ where: { id: pool.id }, data: { isActive: false } });
    const t0 = new Date();
    await runCoachSlotWatch(t0);
    await runCoachSlotWatch(new Date(t0.getTime() + 3 * DAY));
    expect(spyUser.mock.calls.filter(([u]) => u === coach.id)).toHaveLength(0);
    const t10 = new Date(t0.getTime() + 10 * DAY);
    await runCoachSlotWatch(t10);
    await runCoachSlotWatch(t10);
    expect(await prisma.coachViolation.count({ where: { coachId: coach.id } })).toBe(0);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).freeCoachChangeAt).not.toBeNull();
    expect(spyUser.mock.calls.filter(([u]) => u === m.id)).toHaveLength(1);
    spyUser.mockRestore();
  });

  it("PJ8: satu masa diam coach tetap 1 kejadian walau paket kedua baru ikut diam 12 hari kemudian (member membatalkan sesinya)", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    await paidPackage(pool.id, coach.id);
    const b = await paidPackage(pool.id, coach.id);
    await prisma.package.update({ where: { id: b.pkg.id }, data: { sisaSesi: 0 } });
    const t0 = new Date();
    const at = (d: number) => new Date(t0.getTime() + d * DAY);
    await runCoachSlotWatch(t0);
    await runCoachSlotWatch(at(10));
    await prisma.package.update({ where: { id: b.pkg.id }, data: { sisaSesi: 1 } });
    await runCoachSlotWatch(at(12));
    await runCoachSlotWatch(at(22));
    expect(await prisma.coachViolation.count({ where: { coachId: coach.id } })).toBe(2);
    expect((await coachViolationEpisodes(at(22), [coach.id])).get(coach.id)).toBe(1);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: b.pkg.id } })).freeCoachChangeAt).not.toBeNull();
  });

  it("PJ9: kolam diaktifkan lagi: hitungan hari dimulai ulang (hari saat kolam nonaktif tidak dihitung)", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    const { pkg } = await paidPackage(pool.id, coach.id);
    await prisma.pool.update({ where: { id: pool.id }, data: { isActive: false } });
    await runCoachSlotWatch(new Date(Date.now() - 8 * DAY));
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).not.toBeNull();
    const admin = await mkUser("ADMIN");
    await as({ id: admin.id, role: "ADMIN" }, () => togglePoolActive(pool.id, true));
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).toBeNull();
  });

  it("PJ2: jam kosong setelah paket berakhir tidak dihitung; paket tanpa sisa sesi / sesi coba tidak diawasi", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    const { pkg } = await paidPackage(pool.id, coach.id);
    await prisma.package.update({ where: { id: pkg.id }, data: { expiredDate: new Date(Date.now() + 2 * DAY) } });
    await mkSlot(coach.id, pool.id, 5 * 24);
    const done = await paidPackage(pool.id, coach.id);
    await prisma.package.update({ where: { id: done.pkg.id }, data: { sisaSesi: 0 } });
    await runCoachSlotWatch(new Date());
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).not.toBeNull();
    expect((await prisma.package.findUniqueOrThrow({ where: { id: done.pkg.id } })).noSlotSince).toBeNull();
  });
});

describe("PENJAGA JADWAL: kasus tepi", () => {
  it("PJ3: jam kosong coach nonaktif / di luar jam buka tidak dihitung aman", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: pool.id }, data: { openTime: "06:00", closeTime: "08:00" } });
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    const { pkg } = await paidPackage(pool.id, coach.id);
    // Jam 15.00 WIB: di luar jam buka 06.00-08.00.
    const day = new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10);
    const start = new Date(`${day}T15:00:00+07:00`);
    await prisma.availability.create({ data: { coachId: coach.id, poolId: pool.id, date: new Date(`${day}T00:00:00Z`), startTime: start, endTime: new Date(start.getTime() + 3600e3) } });
    await runCoachSlotWatch(new Date());
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).not.toBeNull();
    // Jam di dalam jam buka, tapi coach dinonaktifkan admin: tetap dianggap tanpa jadwal.
    await prisma.pool.update({ where: { id: pool.id }, data: { openTime: null, closeTime: null } });
    await prisma.user.update({ where: { id: coach.id }, data: { isActive: false } });
    await prisma.package.update({ where: { id: pkg.id }, data: { noSlotSince: null } });
    await runCoachSlotWatch(new Date());
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).noSlotSince).not.toBeNull();
  });

  it("PJ4: paket pemberian admin: hari ke-10 tetap tercatat pelanggaran, tapi tanpa hak ganti tanpa biaya", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.availability.deleteMany({ where: { coachId: coach.id } });
    const { pkg } = await paidPackage(pool.id, coach.id);
    await prisma.payment.deleteMany({ where: { packageId: pkg.id } });
    const t0 = new Date();
    await runCoachSlotWatch(t0);
    await runCoachSlotWatch(new Date(t0.getTime() + 10 * DAY));
    expect(await prisma.coachViolation.count({ where: { packageId: pkg.id } })).toBe(1);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).freeCoachChangeAt).toBeNull();
  });

  it("PJ5: ganti coach biasa (disetujui admin) mengakhiri kejadian coach lama dan memakai hak ganti tanpa biaya", async () => {
    const { pool, coach } = await mkPricedOffer();
    const b = await coachAt(pool.id, 800000);
    const { m, pkg } = await paidPackage(pool.id, coach.id, { freeChange: true });
    await prisma.package.update({ where: { id: pkg.id }, data: { noSlotSince: new Date(Date.now() - 7 * DAY) } });
    const req = await prisma.coachChangeRequest.create({ data: { packageId: pkg.id, memberId: m.id, fromCoachId: coach.id, toCoachId: b.id, reason: "uji ganti biasa", newCoachPrice: 800000 } });
    const r = await prisma.$transaction((tx) => completeCoachChange(tx, req.id));
    expect(r.ok).toBe(true);
    const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(after).toMatchObject({ coachId: b.id, noSlotSince: null, freeCoachChangeAt: null });
  });
});

describe("GANTI COACH TANPA BIAYA", () => {
  const change = (memberId: string, pkgId: string, coachId: string, poolId: string) =>
    as({ id: memberId, role: "MEMBER", name: "M" }, () => freeChangeCoach(pkgId, coachId, poolId, null));

  it("GC1: pindah ke kolam lain sekota yang lebih murah: selisih sisa sesi masuk saldo sekali; booking coach lama dibatalkan; sesi lama tetap dibagi dengan harga kolam & coach lama ke kolam lama", async () => {
    const { pool: poolA, coach: oldCoach } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: poolA.id }, data: { city: "Jakarta" } });
    const poolB = await prisma.pool.create({ data: { name: "Kolam B", city: "Jakarta", pricePack4: 200000, pricePack8: 400000, serviceFeeBps: 650 } });
    const newCoach = await coachAt(poolB.id, 700000);
    const { m, pkg } = await paidPackage(poolA.id, oldCoach.id, { freeChange: true });
    // Sesi lampau (sudah berjalan, belum ditandai) + sesi mendatang dengan coach lama.
    const past = await mkSlot(oldCoach.id, poolA.id, -3);
    const pastBooking = await book(m.id, past.id, pkg.id);
    const future = await mkSlot(oldCoach.id, poolA.id, 30);
    await book(m.id, future.id, pkg.id);
    const balanceBefore = (await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance;

    await expect(change(m.id, pkg.id, newCoach.id, poolB.id)).rejects.toThrow("REDIRECT:/member/paket?ganti=ok");

    const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(after).toMatchObject({ coachId: newCoach.id, poolId: poolB.id, poolPrice: 400000, coachPrice: 700000, freeCoachChangeAt: null, sisaSesi: 7 });
    // Biaya layanan dengan tarif saat beli: 83.200 x 1.100.000 / 1.280.000 = 71.500.
    expect(after.serviceFee).toBe(71500);
    // Nilai sesi lama 170.400, baru floor(1.171.500/8) = 146.437 -> selisih 23.963 x 7 sisa sesi.
    const credited = (await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance - balanceBefore;
    expect(credited).toBe(23963 * 7);
    expect((await prisma.booking.findFirstOrThrow({ where: { availabilityId: future.id } })).status).toBe("CANCELLED");
    expect((await prisma.availability.findUniqueOrThrow({ where: { id: future.id } })).status).toBe("AVAILABLE");

    // Coach lama menandai sesi lampau: kolam A dapat 480.000/8 = 60.000 - PPh 300.
    await as({ id: oldCoach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: pastBooking.id, attended: "true" })));
    const poolALedger = await prisma.walletTransaction.aggregate({ where: { poolId: poolA.id, bookingId: pastBooking.id }, _sum: { amount: true } });
    expect(poolALedger._sum.amount).toBe(59700);
    expect(await prisma.walletTransaction.count({ where: { poolId: poolB.id } })).toBe(0);
    // Dikoreksi jadi Tidak Hadir setelah pindah: bagian kolam lama dibalik penuh (kolam 0 saat tidak datang).
    await as({ id: oldCoach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: pastBooking.id, attended: "false" })));
    expect((await prisma.walletTransaction.aggregate({ where: { poolId: poolA.id, bookingId: pastBooking.id }, _sum: { amount: true } }))._sum.amount).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC4: rangkaian ganti biasa sekolam (catatan lama tanpa harga kolam) lalu ganti tanpa biaya lintas kolam: sesi periode pertama tetap pakai harga kolam & coach awal", async () => {
    const { pool: poolA, coach: c1 } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: poolA.id }, data: { city: "Jakarta" } });
    const c2 = await coachAt(poolA.id, 800000);
    const poolB = await prisma.pool.create({ data: { name: "Kolam B2", city: "Jakarta", pricePack8: 400000 } });
    const c3 = await coachAt(poolB.id, 700000);
    const { m, pkg } = await paidPackage(poolA.id, c1.id);
    const s1 = await mkSlot(c1.id, poolA.id, -3);
    const b1 = await book(m.id, s1.id, pkg.id);
    // Ganti biasa c1 -> c2 di kolam yang sama, lalu catatannya dibuat seperti data lama (tanpa harga kolam).
    const req = await prisma.coachChangeRequest.create({ data: { packageId: pkg.id, memberId: m.id, fromCoachId: c1.id, toCoachId: c2.id, reason: "uji rangkaian", newCoachPrice: 800000 } });
    expect((await prisma.$transaction((tx) => completeCoachChange(tx, req.id))).ok).toBe(true);
    await prisma.coachChangeRequest.update({ where: { id: req.id }, data: { oldPoolPrice: null, fromPoolId: null } });
    await prisma.package.update({ where: { id: pkg.id }, data: { freeCoachChangeAt: new Date() } });
    await expect(change(m.id, pkg.id, c3.id, poolB.id)).rejects.toThrow("REDIRECT:/member/paket?ganti=ok");
    await as({ id: c1.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b1.id, attended: "true" })));
    expect((await prisma.walletTransaction.aggregate({ where: { poolId: poolA.id, bookingId: b1.id }, _sum: { amount: true } }))._sum.amount).toBe(59700);
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC2: ditolak bila lebih mahal, kota lain, tanpa hak, coach tanpa jam kosong, atau milik member lain", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: pool.id }, data: { city: "Jakarta" } });
    const pricey = await coachAt(pool.id, 900000);
    const bandung = await prisma.pool.create({ data: { name: "Kolam Bandung", city: "Bandung", pricePack8: 300000 } });
    const far = await coachAt(bandung.id, 500000, "Bandung");
    const idle = await prisma.user.create({ data: { name: "Idle", phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", coachProfile: { create: { pricePack8: 500000 } } } });
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: idle.id } });
    const { m, pkg } = await paidPackage(pool.id, coach.id, { freeChange: true });
    const noRight = await paidPackage(pool.id, coach.id);
    const cheap = await coachAt(pool.id, 500000);
    const other = await mkUser("MEMBER");
    const err = async (p: Promise<unknown>) => ((await p) as { error?: string })?.error;
    expect(await err(change(m.id, pkg.id, pricey.id, pool.id))).toMatch(/lebih mahal/);
    expect(await err(change(m.id, pkg.id, far.id, bandung.id))).toMatch(/kota yang sama/);
    expect(await err(change(m.id, pkg.id, idle.id, pool.id))).toMatch(/cukup jadwal/);
    expect(await err(change(noRight.m.id, noRight.pkg.id, cheap.id, pool.id))).toMatch(/belum berhak/);
    expect(await err(change(other.id, pkg.id, cheap.id, pool.id))).toMatch(/tidak ditemukan/);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).coachId).toBe(coach.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
  });

  it("GC3 (balapan): klik Pindah 5x bersamaan ke dua coach berbeda + member booking coach lama bersamaan -> tepat 1 pindah, saldo dikredit sekali, tidak ada booking coach lama yang tertinggal", async () => {
    for (let round = 0; round < 5; round++) {
      const { pool, coach } = await mkPricedOffer();
      await prisma.pool.update({ where: { id: pool.id }, data: { city: "Jakarta" } });
      const c1 = await coachAt(pool.id, 700000);
      const c2 = await coachAt(pool.id, 600000);
      const { m, pkg } = await paidPackage(pool.id, coach.id, { freeChange: true });
      const slot = await mkSlot(coach.id, pool.id, 50);
      const rs = await settle<unknown>([
        ...[c1, c2, c1, c2, c1].map((c) => change(m.id, pkg.id, c.id, pool.id)),
        bookAs(m.id, slot.id, pkg.id),
      ]);
      // Booking bersamaan selesai rapi (berhasil lalu dibatalkan, atau ditolak), bukan galat server/deadlock.
      const bookingRes = rs.at(-1)!;
      expect(bookingRes.status).toBe("fulfilled");
      expect([201, 409]).toContain((bookingRes as PromiseFulfilledResult<Response>).value.status);
      expect(await prisma.coachChangeRequest.count({ where: { packageId: pkg.id, free: true } })).toBe(1);
      expect(await prisma.memberWalletTransaction.count({ where: { packageId: pkg.id, type: "COACH_CHANGE_CREDIT" } })).toBe(1);
      const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
      expect([c1.id, c2.id]).toContain(after.coachId);
      expect(await prisma.booking.count({ where: { packageId: pkg.id, status: "BOOKED", availability: { coachId: coach.id } } })).toBe(0);
      expect(await checkInvariants()).toEqual([]);
    }
  });
});
