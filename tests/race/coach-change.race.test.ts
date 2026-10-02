// Tahap 2 harga-dari-coach (Hadi 2 Okt): saldo member, ganti coach, setoran PPh.
import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { as, reset, mkUser, mkSlot, book, fd, settle, mkPricedOffer } from "./fx";
import { checkInvariants } from "./invariants";
import { POST as checkout } from "@/app/api/payment/checkout/route";
import { POST as payChange } from "@/app/api/payment/coach-change/route";
import { POST as webhook } from "@/app/api/payment/webhook/route";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { requestCoachChange } from "@/app/member/paket/coach-change-actions";
import { approveAction } from "@/app/admin/ganti-coach/actions";
import { recordPphRemittance } from "@/app/admin/komisi/actions";
import { creditMember } from "@/lib/member-wallet";
import { releaseStalePayments } from "@/lib/stale-payments";
import { snap } from "@/lib/midtrans";
import { vi } from "vitest";

beforeEach(async () => {
  await reset();
});

const sig = (o: string, s: string, g: string) => crypto.createHash("sha512").update(o + s + g + "SB-test-server-key").digest("hex");
const hook = (orderId: string, st: string, gross: number, code = "200") =>
  webhook(new Request("http://x", { method: "POST", body: JSON.stringify({ order_id: orderId, status_code: code, gross_amount: `${gross}.00`, signature_key: sig(orderId, code, `${gross}.00`), transaction_status: st }) }));

async function giveSaldo(memberId: string, amount: number) {
  await prisma.$transaction((tx) => creditMember(tx, memberId, amount, "COACH_CHANGE_CREDIT", { note: "uji" }));
}

// Paket 8 sesi aktif dengan coach A (kolam 480rb, coach 800rb, layanan 83.200).
async function activePackage() {
  const { pool, coach } = await mkPricedOffer();
  const m = await mkUser("MEMBER");
  const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
  const pkg = await prisma.package.create({
    data: {
      memberId: m.id, dependentId: dep.id, poolId: pool.id, name: "Paket 8 sesi", totalSesi: 8, sisaSesi: 8, jatahCancel: 4, status: "ACTIVE",
      startDate: new Date(), expiredDate: new Date(Date.now() + 90 * 86400e3), coachId: coach.id, poolPrice: 480000, coachPrice: 800000, serviceFee: 83200, durationDays: 90,
    },
  });
  await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: "PKG-" + pkg.id, amount: 1363200, status: "SUCCESS", paidAt: new Date() } });
  return { pool, coach, m, dep, pkg };
}
async function otherCoach(poolId: string, p4: number, p8: number) {
  const c = await prisma.user.create({ data: { name: "Coach B", phone: "08" + Date.now().toString().slice(-10), passwordHash: "x", role: "COACH", coachProfile: { create: { pricePack4: p4, pricePack8: p8 } } } });
  await prisma.poolAffiliation.create({ data: { poolId, coachId: c.id } });
  return c;
}

describe("SALDO MEMBER", () => {
  it("SM1: saldo 500rb, klik beli 2 paket berbeda barengan (5x) -> saldo terpakai maksimal 500rb, tidak pernah minus", async () => {
    const { pool, coach } = await mkPricedOffer();
    const m = await mkUser("MEMBER");
    const deps = await Promise.all([1, 2, 3, 4, 5].map((i) => prisma.dependent.create({ data: { memberId: m.id, name: "Anak " + i } })));
    await giveSaldo(m.id, 500000);
    await settle(deps.map((d) => as({ id: m.id, role: "MEMBER", name: "M" }, () => checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: coach.id, sesi: 4, dependentId: d.id }) })))));
    const used = (await prisma.package.aggregate({ where: { memberId: m.id }, _sum: { saldoUsed: true } }))._sum.saldoUsed;
    expect(used).toBe(500000);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
    // Tiap tagihan Midtrans = harga - saldo yang dipakai paket itu.
    for (const p of await prisma.package.findMany({ where: { memberId: m.id }, include: { payments: true } })) {
      expect(p.payments[0].amount + p.saldoUsed).toBe(745500);
    }
    expect(await checkInvariants()).toEqual([]);
  });

  it("SM2: saldo menutup penuh -> paket langsung aktif tanpa Midtrans; pembayaran Midtrans kedaluwarsa (2x) -> saldo kembali sekali", async () => {
    const { pool, coach } = await mkPricedOffer();
    const m = await mkUser("MEMBER");
    const [d1, d2] = await Promise.all([1, 2].map((i) => prisma.dependent.create({ data: { memberId: m.id, name: "Anak " + i } })));
    await giveSaldo(m.id, 1000000);
    const buy = (d: string) => as({ id: m.id, role: "MEMBER", name: "M" }, () => checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: coach.id, sesi: 4, dependentId: d }) })));
    expect((await buy(d1.id)).status).toBe(200);
    const p1 = await prisma.package.findFirstOrThrow({ where: { dependentId: d1.id }, include: { payments: true } });
    expect(p1.status).toBe("ACTIVE");
    expect(p1.payments[0]).toMatchObject({ amount: 0, status: "SUCCESS" });
    // Sisa saldo 254.500 dipakai sebagian untuk paket kedua (745.500), sisanya Midtrans.
    await buy(d2.id);
    const p2 = await prisma.package.findFirstOrThrow({ where: { dependentId: d2.id }, include: { payments: true } });
    expect(p2.saldoUsed).toBe(254500);
    expect(p2.payments[0].amount).toBe(491000);
    await settle([hook(p2.payments[0].midtransOrderId, "expire", 491000, "407"), hook(p2.payments[0].midtransOrderId, "expire", 491000, "407")]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(254500);
    expect(await checkInvariants()).toEqual([]);
  });
});

describe("GANTI COACH", () => {
  it("GC1: ke coach lebih murah -> disetujui langsung pindah, booking mendatang batal, selisih ke saldo; sesi berikutnya dibagi dengan harga baru", async () => {
    const { pool, coach, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 380000, 640000);
    const admin = await mkUser("ADMIN");
    // 1 sesi sudah dijalani & Hadir dengan coach A, 1 booking minggu depan dengan coach A.
    const past = await book(m.id, (await mkSlot(coach.id, pool.id, -3)).id, pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: past.id, attended: "true" })));
    const future = await book(m.id, (await mkSlot(coach.id, pool.id, 72)).id, pkg.id);
    const r = await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Anak kurang cocok dengan gaya mengajarnya" })));
    expect(r).toEqual({ ok: true });
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    // Dua admin klik setuju barengan -> hanya satu yang memproses.
    const rs = await settle([1, 2].map(() => as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })))));
    expect(rs.filter((x) => x.status === "fulfilled" && (x.value as { ok?: boolean })?.ok).length).toBe(1);
    const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(after.coachId).toBe(b.id);
    expect(after.coachPrice).toBe(640000);
    expect(after.serviceFee).toBe(72800);
    expect(after.sisaSesi).toBe(7);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: future.id } })).status).toBe("CANCELLED");
    // Nilai sesi 170.400 -> 149.100 (selisih 21.300 x 7 sisa sesi).
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(149100);
    expect((await prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("COMPLETED");
    // Sesi dengan coach B dibagi dengan harga baru: coach 80.000 - PPh 400.
    // (Fixture: ganti coach dianggap selesai 2,5 jam lalu supaya sesi B 2 jam
    // lalu jatuh SETELAH pindah, seperti di dunia nyata.)
    await prisma.coachChangeRequest.update({ where: { id: req.id }, data: { completedAt: new Date(Date.now() - 2.5 * 3600e3) } });
    const s2 = await book(m.id, (await mkSlot(b.id, pool.id, -2)).id, pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: s2.id, attended: "true" })));
    const bp = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: b.id } });
    expect(bp.walletBalance).toBe(79600);
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC1b: sesi coach lama diubah jadi Tidak Hadir SETELAH pindah coach -> dibagi dengan harga coach lama (coach lama 50.000 - PPh 250)", async () => {
    const { pool, coach, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 380000, 640000);
    const admin = await mkUser("ADMIN");
    const past = await book(m.id, (await mkSlot(coach.id, pool.id, -3)).id, pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: past.id, attended: "true" })));
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Anak kurang cocok dengan coach" })));
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    // Admin (lewat 24 jam) mengoreksi sesi lama dua kali barengan.
    await settle([1, 2].map(() => as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: past.id, attended: "false" })))));
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(49750);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: b.id } })).walletBalance).toBe(0);
    expect((await prisma.pool.findUniqueOrThrow({ where: { id: pool.id } })).walletBalance).toBe(0);
    // Nilai sesi lama tetap 170.400 (bukan 149.100).
    const rows = await prisma.walletTransaction.aggregate({ where: { bookingId: past.id, type: { not: "PPH_WITHHELD" } }, _sum: { amount: true } });
    expect(rows._sum.amount).toBe(170400);
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC2: ke coach lebih mahal -> menunggu tambah bayar; saldo dipakai dulu; settlement 4x barengan -> selesai sekali", async () => {
    const { pool, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 600000, 1120000);
    const admin = await mkUser("ADMIN");
    await giveSaldo(m.id, 50000);
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Ingin coach yang lebih senior" })));
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    const r1 = await prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect(r1.status).toBe("AWAITING_PAYMENT");
    // fee baru = round(83.200 x 1.600.000 / 1.280.000) = 104.000; nilai sesi 170.400 -> 213.000; +42.600 x 8 sesi.
    expect(r1.amount).toBe(340800);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).coachId).not.toBe(b.id);
    // Klik bayar 3x barengan -> satu transaksi Midtrans.
    await settle([1, 2, 3].map(() => as({ id: m.id, role: "MEMBER", name: "M" }, () => payChange(new Request("http://x", { method: "POST", body: JSON.stringify({ requestId: req.id }) })))));
    const pays = await prisma.payment.findMany({ where: { coachChangeRequestId: req.id } });
    expect(pays.length).toBe(1);
    expect(pays[0].amount).toBe(290800);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
    await settle([1, 2, 3, 4].map(() => hook(pays[0].midtransOrderId, "settlement", 290800)));
    const pkgAfter = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect(pkgAfter.coachId).toBe(b.id);
    expect(pkgAfter.status).toBe("ACTIVE");
    expect(pkgAfter.coachPrice).toBe(1120000);
    expect((await prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("COMPLETED");
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC3: tambah bayar kedaluwarsa -> pengajuan batal, saldo yang terpakai kembali sekali, paket tetap dengan coach lama", async () => {
    const { pool, coach, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 600000, 1120000);
    const admin = await mkUser("ADMIN");
    await giveSaldo(m.id, 50000);
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Ingin coach yang lebih senior" })));
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => payChange(new Request("http://x", { method: "POST", body: JSON.stringify({ requestId: req.id }) })));
    const pay = await prisma.payment.findFirstOrThrow({ where: { coachChangeRequestId: req.id } });
    await settle([hook(pay.midtransOrderId, "expire", pay.amount, "407"), hook(pay.midtransOrderId, "expire", pay.amount, "407")]);
    expect((await prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("EXPIRED");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(50000);
    const p = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
    expect([p.coachId, p.status]).toEqual([coach.id, "ACTIVE"]);
    expect(await checkInvariants()).toEqual([]);
  });

  it("GC4: member mengajukan 5x barengan -> hanya satu pengajuan terbuka; alasan pendek / coach kolam lain ditolak", async () => {
    const { pool, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 380000, 640000);
    const send = (o: Record<string, string>) => as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Alasan yang cukup panjang", ...o })));
    expect((await send({ reason: "pendek" }))?.error).toBeTruthy();
    const outsider = await mkUser("COACH");
    expect((await send({ toCoachId: outsider.id }))?.error).toBeTruthy();
    await settle([1, 2, 3, 4, 5].map(() => send({})));
    expect(await prisma.coachChangeRequest.count()).toBe(1);
  });
});

describe("TEMUAN PEMERIKSA KEDUA", () => {
  it("F1: Midtrans gagal dibuat sekali, member bayar lagi, lalu kedaluwarsa -> saldo kembali utuh (tidak hilang)", async () => {
    const { pool, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 600000, 1120000);
    const admin = await mkUser("ADMIN");
    await giveSaldo(m.id, 100000);
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Ingin coach yang lebih senior" })));
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    const pay = () => as({ id: m.id, role: "MEMBER", name: "M" }, () => payChange(new Request("http://x", { method: "POST", body: JSON.stringify({ requestId: req.id }) })));
    const spy = vi.spyOn(snap, "createTransaction").mockRejectedValueOnce(new Error("down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await pay()).status).toBe(502);
    spy.mockRestore(); errSpy.mockRestore();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(100000);
    expect((await pay()).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
    const p = await prisma.payment.findFirstOrThrow({ where: { coachChangeRequestId: req.id, status: "PENDING" } });
    await hook(p.midtransOrderId, "expire", p.amount, "407");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(100000);
    expect(await checkInvariants()).toEqual([]);
  });

  it("F2: pembayaran yang menahan saldo tidak pernah dikabari 48 jam -> dibersihkan, saldo kembali; lunas belakangan -> paket aktif dan saldo ditarik lagi", async () => {
    const { pool, coach } = await mkPricedOffer();
    const m = await mkUser("MEMBER");
    const d = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
    await giveSaldo(m.id, 300000);
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId: pool.id, coachId: coach.id, sesi: 4, dependentId: d.id }) })));
    const p = await prisma.package.findFirstOrThrow({ where: { dependentId: d.id }, include: { payments: true } });
    await prisma.payment.update({ where: { id: p.payments[0].id }, data: { createdAt: new Date(Date.now() - 49 * 3600e3) } });
    await settle([releaseStalePayments(), releaseStalePayments()]);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("EXPIRED");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(300000);
    await hook(p.payments[0].midtransOrderId, "settlement", p.payments[0].amount);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("ACTIVE");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("F3: paket kedaluwarsa tidak bisa disetujui ganti coach", async () => {
    const { pool, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 380000, 640000);
    const admin = await mkUser("ADMIN");
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Anak kurang cocok dengan coach" })));
    await prisma.package.update({ where: { id: pkg.id }, data: { expiredDate: new Date(Date.now() - 3600e3) } });
    const req = await prisma.coachChangeRequest.findFirstOrThrow();
    const r = await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    expect(r?.error).toBeTruthy();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
  });

  // P1 (Hadi 2 Okt malam): paket pemberian admin tidak dibayar; ganti ke coach
  // lebih murah tidak boleh menghasilkan saldo uang untuk member.
  it("F3b: paket pemberian admin (tanpa pembayaran) tidak bisa diajukan ganti coach, dan pengajuan yang terlanjur ada tidak bisa disetujui", async () => {
    const { pool, m, pkg } = await activePackage();
    await prisma.payment.deleteMany({ where: { packageId: pkg.id } });
    const b = await otherCoach(pool.id, 380000, 640000);
    const admin = await mkUser("ADMIN");
    const r = await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: b.id, reason: "Anak kurang cocok dengan coach" })));
    expect(r).toEqual({ error: "Paket ini tidak bisa diganti coach-nya." });
    // Pengajuan yang dibuat sebelum aturan ini (atau lewat jalur lain) juga ditolak saat disetujui.
    const req = await prisma.coachChangeRequest.create({ data: { packageId: pkg.id, memberId: m.id, fromCoachId: pkg.coachId!, toCoachId: b.id, reason: "uji" } });
    const ok = await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
    expect(ok?.error).toBe("Paket pemberian admin tidak bisa diganti coach lewat pengajuan.");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).memberBalance).toBe(0);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).coachId).toBe(pkg.coachId);
  });

  it("F4: A -> B -> A (harga A naik di antaranya): sesi A periode pertama tetap dibagi harga A lama", async () => {
    const { pool, coach, m, pkg } = await activePackage();
    const b = await otherCoach(pool.id, 380000, 640000);
    const admin = await mkUser("ADMIN");
    const first = await book(m.id, (await mkSlot(coach.id, pool.id, -5)).id, pkg.id);
    const change = async (to: string) => {
      await as({ id: m.id, role: "MEMBER", name: "M" }, () => requestCoachChange(null, fd({ packageId: pkg.id, toCoachId: to, reason: "Alasan pindah coach yang jelas" })));
      const req = await prisma.coachChangeRequest.findFirstOrThrow({ where: { status: "PENDING" } });
      await as({ id: admin.id, role: "ADMIN" }, () => approveAction(null, fd({ requestId: req.id })));
      return prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: req.id } });
    };
    expect((await change(b.id)).status).toBe("COMPLETED");
    // Harga A naik jadi 1.000.000 lalu kembali ke A (lebih mahal -> lunas dari saldo hasil pindah pertama).
    await prisma.coachProfile.update({ where: { userId: coach.id }, data: { pricePack8: 1000000 } });
    await giveSaldo(m.id, 2000000);
    const back = await change(coach.id);
    expect(back.status).toBe("AWAITING_PAYMENT");
    await as({ id: m.id, role: "MEMBER", name: "M" }, () => payChange(new Request("http://x", { method: "POST", body: JSON.stringify({ requestId: back.id }) })));
    expect((await prisma.coachChangeRequest.findUniqueOrThrow({ where: { id: back.id } })).status).toBe("COMPLETED");
    // Sesi pertama (periode A lama) baru ditandai sekarang: harus 100.000 - PPh 500, bukan 125.000.
    await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: first.id, attended: "true" })));
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(99500);
    const rows = await prisma.walletTransaction.aggregate({ where: { bookingId: first.id, type: { not: "PPH_WITHHELD" } }, _sum: { amount: true } });
    expect(rows._sum.amount).toBe(170400);
    expect(await checkInvariants()).toEqual([]);
  });
});

describe("SETORAN PPh", () => {
  it("PR1: titipan 800, admin klik catat setor 800 sebanyak 5x barengan -> tercatat sekali; melebihi titipan ditolak", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.walletTransaction.createMany({
      data: [
        { type: "SESSION_REVENUE", poolId: pool.id, amount: 60000 },
        { type: "PPH_WITHHELD", poolId: pool.id, amount: -300 },
        { type: "SESSION_PAYOUT", coachProfileId: coach.coachProfile!.id, amount: 100000 },
        { type: "PPH_WITHHELD", coachProfileId: coach.coachProfile!.id, amount: -500 },
      ],
    });
    const admin = await mkUser("ADMIN");
    const send = (amount: string) => as({ id: admin.id, role: "ADMIN" }, () => recordPphRemittance(null, fd({ amount, reference: "NTPN-UJI-1" })));
    expect((await send("900"))?.error).toBeTruthy();
    await settle([1, 2, 3, 4, 5].map(() => send("800")));
    expect((await prisma.pphRemittance.aggregate({ _sum: { amount: true } }))._sum.amount).toBe(800);
  });
});
