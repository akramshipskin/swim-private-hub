import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { reset, mkPool, mkUser, mkMemberWithPackage, settle, jitter, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { POST as webhook } from "@/app/api/payment/webhook/route";
import { releaseStalePayments } from "@/lib/stale-payments";
import { anonymizeMember, requestAccountDeletion, AccountDeletionError, PENDING_PAYMENT_DELETION_ERROR } from "@/lib/account-deletion";

// Keputusan Hadi 6 Okt: (1) hapus akun diblokir selama ada pembayaran Menunggu
// yang belum lewat batas bayar; (2) pembayaran Menunggu yang lewat batas
// kedaluwarsa otomatis (pemeriksa harian), termasuk yang tanpa saldo.

beforeEach(reset);

const sig = (o: string, s: string, g: string) => crypto.createHash("sha512").update(o + s + g + "SB-test-server-key").digest("hex");
const hook = (orderId: string, st: string, code = "200") =>
  webhook(new Request("http://x", { method: "POST", body: JSON.stringify({ order_id: orderId, status_code: code, gross_amount: "800000.00", signature_key: sig(orderId, code, "800000.00"), transaction_status: st }) }));
const HOUR = 3600e3;

async function pendingPkg(createdHoursAgo: number) {
  const pool = await mkPool(); const m = await mkUser("MEMBER");
  const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "A" } });
  const pkg = await prisma.package.create({ data: { memberId: m.id, dependentId: dep.id, poolId: pool.id, name: "P", totalSesi: 8, sisaSesi: 8, status: "PENDING_PAYMENT", createdAt: new Date(Date.now() - createdHoursAgo * HOUR) } });
  const pay = await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: "PKG-" + pkg.id, amount: 800000, createdAt: new Date(Date.now() - createdHoursAgo * HOUR) } });
  return { pkg, pay, m };
}

describe("Kedaluwarsa otomatis pembayaran Menunggu (2A)", () => {
  it("S1: Menunggu tanpa saldo yang lewat batas -> pembayaran dan paket kedaluwarsa; yang masih berjalan tidak disentuh", async () => {
    const old = await pendingPkg(30); const fresh = await pendingPkg(1);
    expect(await releaseStalePayments()).toBe(1);
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: old.pay.id } })).status).toBe("EXPIRED");
    expect((await prisma.package.findUniqueOrThrow({ where: { id: old.pkg.id } })).status).toBe("EXPIRED");
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: fresh.pay.id } })).status).toBe("PENDING");
    expect((await prisma.package.findUniqueOrThrow({ where: { id: fresh.pkg.id } })).status).toBe("PENDING_PAYMENT");
    expect(await releaseStalePayments()).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("S2: sudah kedaluwarsa lalu Midtrans mengabari lunas -> paket tetap diaktifkan", async () => {
    const x = await pendingPkg(30);
    await releaseStalePayments();
    await hook(x.pay.midtransOrderId, "settlement");
    const p = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } })).status).toBe("SUCCESS");
    expect(p.status).toBe("ACTIVE");
    expect(p.startDate).not.toBeNull();
    expect(await checkInvariants()).toEqual([]);
  });

  it("S3 (balapan): pemeriksa harian dan notifikasi lunas barengan -> akhirnya selalu SUCCESS + paket ACTIVE", async () => {
    const seen: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      await reset();
      const x = await pendingPkg(30);
      const rs = await settle([
        jitter(15).then(() => releaseStalePayments()),
        jitter(15).then(() => hook(x.pay.midtransOrderId, "settlement")),
      ]);
      const pay = await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } });
      const pkg = await prisma.package.findUniqueOrThrow({ where: { id: x.pkg.id } });
      tally(seen, `${rs[0].status === "fulfilled" ? rs[0].value : "ERR"}`);
      expect(pay.status).toBe("SUCCESS");
      expect(pkg.status).toBe("ACTIVE");
      expect(await checkInvariants()).toEqual([]);
    }
    spread("S3 hasil pemeriksa (1 = mengedaluwarsakan dulu, 0 = notifikasi lunas lebih dulu)", seen);
  });
});

describe("Hapus akun diblokir saat ada pembayaran berjalan (1A)", () => {
  it("D-A: pembayaran Menunggu yang masih berjalan -> ditolak, akun utuh; setelah lunas -> boleh", async () => {
    const x = await pendingPkg(1);
    await requestAccountDeletion(x.m.id);
    await expect(anonymizeMember(x.m.id)).rejects.toThrow(PENDING_PAYMENT_DELETION_ERROR);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: x.m.id } });
    expect(u.anonymizedAt).toBeNull();
    expect(u.name).not.toBe("Pengguna dihapus");
    await hook(x.pay.midtransOrderId, "settlement");
    await anonymizeMember(x.m.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: x.m.id } })).anonymizedAt).toBeInstanceOf(Date);
  });

  it("D-B: Menunggu yang sudah lewat batas tidak memblokir selamanya", async () => {
    const x = await pendingPkg(30);
    await requestAccountDeletion(x.m.id);
    await anonymizeMember(x.m.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: x.m.id } })).anonymizedAt).toBeInstanceOf(Date);
  });

  it("D-C: pembayaran milik member lain tidak ikut memblokir", async () => {
    const other = await pendingPkg(1);
    const coach = await mkUser("COACH");
    const { m } = await mkMemberWithPackage((await mkPool()).id, coach.id);
    await requestAccountDeletion(m.id);
    await anonymizeMember(m.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: m.id } })).anonymizedAt).toBeInstanceOf(Date);
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: other.pay.id } })).status).toBe("PENDING");
  });

  it("D-D (balapan): persetujuan hapus akun dan notifikasi lunas barengan -> tidak pernah terhapus selagi pembayaran masih Menunggu", async () => {
    const seen: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      await reset();
      const x = await pendingPkg(1);
      await requestAccountDeletion(x.m.id);
      const rs = await settle([
        jitter(15).then(() => anonymizeMember(x.m.id)),
        jitter(15).then(() => hook(x.pay.midtransOrderId, "settlement")),
      ]);
      const u = await prisma.user.findUniqueOrThrow({ where: { id: x.m.id } });
      const pay = await prisma.payment.findUniqueOrThrow({ where: { id: x.pay.id } });
      tally(seen, u.anonymizedAt ? "terhapus (setelah lunas)" : "diblokir");
      if (rs[0].status === "rejected") expect(rs[0].reason).toBeInstanceOf(AccountDeletionError);
      expect(pay.status).toBe("SUCCESS");
      if (u.anonymizedAt) expect(pay.status).not.toBe("PENDING");
    }
    spread("D-D hasil persetujuan", seen);
  });
});
