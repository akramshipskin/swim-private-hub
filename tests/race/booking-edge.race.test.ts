import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkPricedOffer, mkSlot, settle, summarize, jitter, tally, spread } from "./fx";
import { POST as bookPOST } from "@/app/api/booking/route";
import { togglePoolActive } from "@/app/admin/kolam/actions";
import { toggleUserActive } from "@/app/admin/users/actions";
import { checkInvariants } from "./invariants";

// O5 (rencana gabungan 2 Okt, BOOK-001): tiga kejadian booking yang belum
// punya tes balapan. Tes saja, aturan tidak diubah. Kejadian lain yang mirip
// sudah dites: coach dinonaktifkan (K2d), akun member dihapus (D4), paket
// ditandai EXPIRED oleh admin (E12).

beforeEach(reset);

const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });

describe("Booking di tepi aturan", () => {
  it("B1: admin menonaktifkan KOLAM bersamaan 8 member booking (12 putaran) -> tidak ada error 500, data konsisten, booking sesudahnya ditolak", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const w = i * 2;
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slots = await Promise.all(Array.from({ length: 9 }, () => mkSlot(coach.id, pool.id, 48)));
      const members = await Promise.all(slots.map(() => mkMemberWithPackage(pool.id)));
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => togglePoolActive(pool.id, false)); })(),
        ...members.slice(0, 8).map(({ m, pkg }, k) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slots[k].id, packageId: pkg.id }))); })()),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      const codes = summarize(rs.slice(1));
      expect(codes.every((c) => c === "HTTP201" || c === "HTTP409")).toBe(true);
      // Keputusan yang berlaku: booking yang sudah ada tidak dibatalkan saat
      // kolam dinonaktifkan; tiap 201 = 1 booking aktif + 1 sesi terpotong.
      const created = codes.filter((c) => c === "HTTP201").length;
      expect(await prisma.booking.count({ where: { status: "BOOKED" } })).toBe(created);
      expect(await checkInvariants()).toEqual([]);
      // Setelah nonaktif tercatat, booking baru selalu ditolak.
      const last = members[8];
      const after = await as({ id: last.m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slots[8].id, packageId: last.pkg.id })));
      expect(after.status).toBe(409);
      tally(sebaran, `${created} booking sempat masuk`);
    }
    spread("B1", sebaran);
  });

  it("B2: paket yang masa berlakunya baru saja habis, 6 booking barengan -> semua ditolak, sisa sesi utuh", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slots = await Promise.all(Array.from({ length: 6 }, () => mkSlot(coach.id, pool.id, 2)));
    const { m, pkg } = await mkMemberWithPackage(pool.id, { expired: new Date(Date.now() - 1000) });
    const rs = await settle(slots.map((s) => as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: s.id, packageId: pkg.id })))));
    expect(summarize(rs).every((c) => c === "HTTP409")).toBe(true);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
    expect(await prisma.booking.count()).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("B3: paket harga-dari-coach (terikat coach) -> admin menonaktifkan coach-nya bersamaan member booking 4 slot (12 putaran): tidak ada booking aktif tersisa, sesi utuh", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const w = i * 2;
      const { pool, coach } = await mkPricedOffer();
      const admin = await mkUser("ADMIN");
      const slots = await Promise.all(Array.from({ length: 4 }, () => mkSlot(coach.id, pool.id, 48)));
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      await prisma.package.update({ where: { id: pkg.id }, data: { coachId: coach.id, poolPrice: 480000, coachPrice: 800000, serviceFee: 83200 } });
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => toggleUserActive(coach.id, false)); })(),
        ...slots.map((s) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: s.id, packageId: pkg.id }))); })()),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      expect(await prisma.booking.count({ where: { status: "BOOKED" } })).toBe(0);
      expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `${await prisma.booking.count()} sempat dibooking lalu dibatalkan`);
    }
    spread("B3", sebaran);
  });
});
