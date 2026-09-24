import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, summarize, jitter } from "./fx";
import { requestWithdrawal as coachWithdraw } from "@/app/coach/saldo/actions";
import { requestWithdrawal as poolWithdraw } from "@/app/pool/saldo/actions";
import { rejectWithdrawal, markPaidManually } from "@/app/admin/withdrawals/actions";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { POST as webhook } from "@/app/api/payment/webhook/route";
import { POST as checkout } from "@/app/api/payment/checkout/route";
import { POST as register } from "@/app/api/register/route";
import { POST as registerCoach } from "@/app/api/register-coach/route";
import { POST as registerPool } from "@/app/api/register-pool/route";
import { addChild } from "@/app/profil/actions";
import { createUser, importMembersXlsx } from "@/app/admin/users/actions";
import { assignPackageToMember, createTemplate } from "@/app/admin/paket/actions";
import { affiliateCoach, updatePoolShares } from "@/app/admin/kolam/actions";
import * as XLSX from "xlsx";

beforeEach(reset);

async function ledgerCheck() {
  const pools = await prisma.pool.findMany();
  const coaches = await prisma.coachProfile.findMany();
  const bad: string[] = [];
  for (const p of pools) { const s = (await prisma.walletTransaction.aggregate({ where: { poolId: p.id }, _sum: { amount: true } }))._sum.amount ?? 0; if (s !== p.walletBalance) bad.push(`pool ${p.walletBalance} vs ledger ${s}`); if (p.walletBalance < 0) bad.push("pool negative"); }
  for (const c of coaches) { const s = (await prisma.walletTransaction.aggregate({ where: { coachProfileId: c.id }, _sum: { amount: true } }))._sum.amount ?? 0; if (s !== c.walletBalance) bad.push(`coach ${c.walletBalance} vs ledger ${s}`); if (c.walletBalance < 0) bad.push("coach negative"); }
  return bad;
}

describe("WITHDRAWAL races", () => {
  it("W1: coach klik Cairkan 8x barengan (saldo 100rb) -> 1 pengajuan, saldo 0, ledger konsisten", async () => {
    const c = await mkUser("COACH", { coachBalance: 100000, bank: true });
    await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: c.coachProfile!.id, amount: 100000 } });
    const rs = await settle(Array.from({ length: 8 }, () => as({ id: c.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "100000" })))));
    console.log("W1", summarize(rs));
    expect(await prisma.withdrawalRequest.count()).toBe(1);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: c.coachProfile!.id } })).walletBalance).toBe(0);
    expect(await ledgerCheck()).toEqual([]);
  });

  it("W2: pool owner Cairkan 8x barengan -> 1 pengajuan", async () => {
    const pool = await mkPool({ balance: 200000, bank: true });
    await prisma.walletTransaction.create({ data: { type: "SESSION_REVENUE", poolId: pool.id, amount: 200000 } });
    const owner = await mkUser("POOL_OWNER");
    await prisma.poolOwnership.create({ data: { poolId: pool.id, ownerId: owner.id } });
    const rs = await settle(Array.from({ length: 8 }, () => as({ id: owner.id, role: "POOL_OWNER" }, () => poolWithdraw(pool.id, null, fd({ amount: "200000" })))));
    console.log("W2", summarize(rs));
    expect(await prisma.withdrawalRequest.count()).toBe(1);
    expect(await ledgerCheck()).toEqual([]);
  });

  it("W3: admin klik Tolak 6x barengan -> saldo dibalikin sekali", async () => {
    const c = await mkUser("COACH", { coachBalance: 100000, bank: true }); const admin = await mkUser("ADMIN");
    await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: c.coachProfile!.id, amount: 100000 } });
    await as({ id: c.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "100000" })));
    const w = await prisma.withdrawalRequest.findFirstOrThrow();
    const rs = await settle(Array.from({ length: 6 }, () => as({ id: admin.id, role: "ADMIN" }, () => rejectWithdrawal(null, fd({ withdrawalId: w.id })))));
    console.log("W3", summarize(rs));
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: c.coachProfile!.id } })).walletBalance).toBe(100000);
    expect(await ledgerCheck()).toEqual([]);
  });

  it("W4: admin Tandai Dibayar vs Tolak barengan -> gak boleh status PAID tapi saldo udah dibalikin (duit keluar 2x)", async () => {
    const out: string[] = []; let bad = 0;
    for (let i = 0; i < 10; i++) {
      await reset();
      const c = await mkUser("COACH", { coachBalance: 100000, bank: true }); const admin = await mkUser("ADMIN");
      await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: c.coachProfile!.id, amount: 100000 } });
      await as({ id: c.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "100000" })));
      const w = await prisma.withdrawalRequest.findFirstOrThrow();
      const order = i % 2 ? [markPaidManually, rejectWithdrawal] : [rejectWithdrawal, markPaidManually];
      // transferReference wajib sejak 25 Sep (tanpa ini "Tandai Dibayar" selalu
      // ditolak dan tes ini diam-diam tidak menguji balapan lagi).
      const rs = await settle(order.map((fn) => (async () => { await jitter(i * 2); return as({ id: admin.id, role: "ADMIN" }, () => fn(null, fd({ withdrawalId: w.id, transferReference: "TRF-W4" }))); })()));
      const w2 = await prisma.withdrawalRequest.findFirstOrThrow();
      const bal = (await prisma.coachProfile.findUniqueOrThrow({ where: { id: c.coachProfile!.id } })).walletBalance;
      if (w2.status === "PAID" && bal === 100000) bad++;
      out.push(`${summarize(rs).join("|")} -> ${w2.status} saldo=${bal}`);
    }
    console.log("W4", out);
    expect(bad).toBe(0);
    // Pastikan balapannya benar-benar terjadi: kedua hasil harus pernah menang.
    expect(out.some((o) => o.includes("-> PAID"))).toBe(true);
    expect(out.some((o) => o.includes("-> FAILED"))).toBe(true);
  });

  it("W5: kredit Hadir masuk pas coach lagi Cairkan -> saldo & ledger konsisten, gak ada saldo ilang", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH", { coachBalance: 60000, bank: true }); const admin = await mkUser("ADMIN");
    await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: coach.coachProfile!.id, amount: 60000 } });
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
    const b = await book(m.id, slot.id, pkg.id);
    const rs = await settle([
      as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "100000" }))),
      as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" }))),
    ]);
    const cp = await prisma.coachProfile.findUniqueOrThrow({ where: { id: coach.coachProfile!.id } });
    const withdrawn = (await prisma.withdrawalRequest.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;
    console.log("W5", summarize(rs), { saldo: cp.walletBalance, withdrawn });
    expect(cp.walletBalance + withdrawn).toBe(60000 + 55000);
    expect(await ledgerCheck()).toEqual([]);
  });
});

describe("PAYMENT webhook races", () => {
  const sig = (o: string, s: string, g: string) => crypto.createHash("sha512").update(o + s + g + "SB-test-server-key").digest("hex");
  const hook = (orderId: string, st: string, code = "200") => webhook(new Request("http://x", { method: "POST", body: JSON.stringify({ order_id: orderId, status_code: code, gross_amount: "800000.00", signature_key: sig(orderId, code, "800000.00"), transaction_status: st }) }));
  async function pendingPkg() {
    const pool = await mkPool(); const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "A" } });
    const pkg = await prisma.package.create({ data: { memberId: m.id, dependentId: dep.id, poolId: pool.id, name: "P", totalSesi: 8, sisaSesi: 8, status: "PENDING_PAYMENT" } });
    const pay = await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: "PKG-" + pkg.id, amount: 800000 } });
    return { pkg, pay, m, dep, pool };
  }

  it("P1: Midtrans kirim settlement 6x barengan -> paket aktif sekali, gak dobel efek", async () => {
    const x = await pendingPkg();
    const rs = await settle(Array.from({ length: 6 }, () => hook(x.pay.midtransOrderId, "settlement")));
    const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
    console.log("P1", summarize(rs), p.status, p.sisaSesi);
    expect(p.status).toBe("ACTIVE"); expect(p.sisaSesi).toBe(8);
  });

  it("P2 (urutan): settlement dulu, lalu notif 'expire'/'pending' telat nyampe -> paket yang udah dibayar gak boleh mati / payment gak boleh balik PENDING", async () => {
    const x = await pendingPkg();
    await hook(x.pay.midtransOrderId, "settlement");
    await hook(x.pay.midtransOrderId, "pending", "201");
    const a = await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } });
    await hook(x.pay.midtransOrderId, "expire", "407");
    const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
    const b = await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } });
    console.log("P2", { afterLatePending: a.status, afterLateExpire: b.status, pkg: p.status });
    expect(a.status).toBe("SUCCESS");
    expect(p.status).toBe("ACTIVE");
  });

  it("P3: settlement vs expire barengan -> hasil akhir gak boleh EXPIRED kalau duit masuk", async () => {
    const out: string[] = []; let bad = 0;
    for (let i = 0; i < 8; i++) {
      await reset(); const x = await pendingPkg();
      await settle([hook(x.pay.midtransOrderId, "settlement"), hook(x.pay.midtransOrderId, "expire", "407")]);
      const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
      const pay = await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } });
      if (p.status !== "ACTIVE") bad++;
      out.push(`${pay.status}/${p.status}`);
    }
    console.log("P3", out);
    expect(bad).toBe(0);
  });

  it("P4: member double-klik Beli (checkout) 5x -> berapa paket PENDING kebikin?", async () => {
    const pool = await mkPool(); const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "A" } });
    const t = await prisma.packageTemplate.create({ data: { poolId: pool.id, name: "T", totalSesi: 8, price: 800000 } });
    const rs = await settle(Array.from({ length: 5 }, () => as({ id: m.id, role: "MEMBER", name: "M" }, () => checkout(new Request("http://x/api/payment/checkout", { method: "POST", body: JSON.stringify({ templateId: t.id, dependentId: dep.id }) })))));
    const n = await prisma.package.count({ where: { memberId: m.id } });
    console.log("P4", summarize(rs), "packages:", n);
    expect(n).toBe(1);
  });
});

describe("REGISTRATION / ACCOUNT races", () => {
  const ago = Date.now() - 10000;
  it("A1: daftar member No HP sama 6x barengan -> 1 akun, sisanya 409 (bukan 500)", async () => {
    const rs = await settle(Array.from({ length: 6 }, () => register(new Request("http://x", { method: "POST", body: JSON.stringify({ name: "a b", phone: "081234567890", password: "12345678", acceptedTerms: true, wantsSelf: true, formRenderedAt: ago }) }))));
    console.log("A1", summarize(rs));
    expect(await prisma.user.count({ where: { phone: "081234567890" } })).toBe(1);
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await prisma.dependent.count()).toBe(1);
  });
  it("A2: daftar coach & daftar kolam No HP sama barengan -> 1 akun, gak ada 500 / kolam yatim", async () => {
    const body = { name: "a", ownerName: "a", phone: "081299999999", password: "12345678", acceptedTerms: true, specialties: ["Gaya bebas"], poolName: "K", address: "J", openTime: "06:00", closeTime: "20:00", formRenderedAt: ago };
    const rs = await settle([0, 1, 2].flatMap(() => [registerCoach(new Request("http://x", { method: "POST", body: JSON.stringify(body) })), registerPool(new Request("http://x", { method: "POST", body: JSON.stringify(body) }))]));
    console.log("A2", summarize(rs));
    expect(await prisma.user.count({ where: { phone: "081299999999" } })).toBe(1);
    expect(await prisma.pool.count({ where: { ownerships: { none: {} } } })).toBe(0);
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
  });
  it("A3: member klik 'Tambah Diri sendiri' 6x barengan -> cuma 1 peserta diri sendiri", async () => {
    const m = await mkUser("MEMBER");
    const rs = await settle(Array.from({ length: 6 }, () => as({ id: m.id, role: "MEMBER" }, () => addChild(null, fd({ type: "self" })))));
    console.log("A3", summarize(rs));
    expect(await prisma.dependent.count({ where: { memberId: m.id, isSelf: true } })).toBe(1);
  });
  it("A4: admin Tambah User No HP sama 4x barengan -> 1 akun, gak crash", async () => {
    const admin = await mkUser("ADMIN");
    const rs = await settle(Array.from({ length: 4 }, () => as({ id: admin.id, role: "ADMIN" }, () => { const f = fd({ name: "x y", phone: "081277777777", password: "12345678", role: "COACH" }); return createUser(null, f); })));
    console.log("A4", summarize(rs));
    expect(await prisma.user.count({ where: { phone: "081277777777" } })).toBe(1);
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
  });
  it("A5: admin import xlsx yang sama 2x barengan -> gak ada member/paket dobel", async () => {
    const admin = await mkUser("ADMIN"); const pool = await mkPool();
    const ws = XLSX.utils.aoa_to_sheet([["Nama Member", "No HP", "Email (opsional)", "Nama Peserta/Anak", "Paket Aktif", "Sisa Sesi"], ["Budi", "081211111111", "", "Rafi", "8x", "5"], ["Budi", "081211111111", "", "Nadia", "8x", "3"]]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const mk = () => { const f = new FormData(); f.append("poolId", pool.id); f.append("file", new File([buf], "a.xlsx")); return f; };
    const rs = await settle([0, 1].map(() => as({ id: admin.id, role: "ADMIN" }, () => importMembersXlsx(null, mk()))));
    console.log("A5", summarize(rs));
    expect(await prisma.user.count({ where: { phone: "081211111111" } })).toBe(1);
    expect(await prisma.package.count()).toBe(2);
  });
  it("A6: admin double-klik Assign Paket -> berapa paket kebikin?", async () => {
    const admin = await mkUser("ADMIN"); const pool = await mkPool(); const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "A" } });
    const rs = await settle(Array.from({ length: 3 }, () => as({ id: admin.id, role: "ADMIN" }, () => assignPackageToMember(null, fd({ memberId: m.id, dependentId: dep.id, poolId: pool.id, name: "Promo", totalSesi: "4", jatahCancel: "1", expiredDate: "" })))));
    const n = await prisma.package.count({ where: { memberId: m.id } });
    console.log("A6", summarize(rs), "packages:", n);
    expect(n).toBe(1);
  });
  it("A7: admin double-klik Tambah Katalog & Tambah coach ke kolam", async () => {
    const admin = await mkUser("ADMIN"); const pool = await mkPool(); const coach = await mkUser("COACH");
    const rs1 = await settle(Array.from({ length: 3 }, () => as({ id: admin.id, role: "ADMIN" }, () => createTemplate(null, fd({ poolId: pool.id, name: "Paket A", totalSesi: "8", price: "100", durationDays: "60", jatahCancel: "2" })))));
    const rs2 = await settle(Array.from({ length: 4 }, () => as({ id: admin.id, role: "ADMIN" }, () => affiliateCoach(null, fd({ poolId: pool.id, coachId: coach.id })))));
    const t = await prisma.packageTemplate.count(); const a = await prisma.poolAffiliation.count();
    console.log("A7", summarize(rs1), summarize(rs2), { templates: t, affiliations: a });
    expect(a).toBe(1); expect(rs2.every((r) => r.status === "fulfilled")).toBe(true);
    expect(t).toBe(1);
  });
  it("A8: admin ganti persen komisi pas Hadir lagi dikredit -> total kredit gak lebih dari harga sesi", async () => {
    const pool = await mkPool({ commission: 15, coachShare: 55 }); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
    const b = await book(m.id, slot.id, pkg.id);
    const rs = await settle([
      as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" }))),
      as({ id: admin.id, role: "ADMIN" }, () => updatePoolShares(null, fd({ poolId: pool.id, commissionPercent: "10", coachSharePercent: "80" }))),
    ]);
    const sum = (await prisma.walletTransaction.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;
    console.log("A8", summarize(rs), { credited: sum });
    expect(sum).toBeLessThanOrEqual(100000);
  });
});

// Sweep keamanan 25 Sep: pagar database (CHECK) untuk pemilik baris saldo.
describe("DATABASE guard: pemilik baris saldo", () => {
  it("I1: DB menolak baris saldo yang pemiliknya tidak cocok dengan jenisnya; baris sah tetap diterima", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const cpId = coach.coachProfile!.id;
    const bad = [
      { type: "SESSION_REVENUE" as const, amount: 1 },
      { type: "SESSION_REVENUE" as const, amount: 1, poolId: pool.id, coachProfileId: cpId },
      { type: "SESSION_PAYOUT" as const, amount: 1, poolId: pool.id },
      { type: "PLATFORM_REVENUE" as const, amount: 1, poolId: pool.id },
      { type: "WITHDRAWAL" as const, amount: -1 },
    ];
    for (const data of bad) await expect(prisma.walletTransaction.create({ data })).rejects.toThrow();
    await prisma.walletTransaction.createMany({
      data: [
        { type: "SESSION_REVENUE", amount: 1, poolId: pool.id },
        { type: "SESSION_PAYOUT", amount: 1, coachProfileId: cpId },
        { type: "PLATFORM_TAX", amount: 1 },
        { type: "WITHDRAWAL", amount: -1, coachProfileId: cpId },
      ],
    });
    await expect(
      prisma.withdrawalRequest.create({ data: { amount: 1, bankName: "B", bankAccountNumber: "1", bankAccountName: "X" } })
    ).rejects.toThrow();
    await expect(
      prisma.withdrawalRequest.create({ data: { amount: 1, poolId: pool.id, coachProfileId: cpId, bankName: "B", bankAccountNumber: "1", bankAccountName: "X" } })
    ).rejects.toThrow();
  });
});
