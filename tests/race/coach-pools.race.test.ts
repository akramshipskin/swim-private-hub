// Coach memilih / melepas kolam sendiri + daftar tunggu kota (Hadi 3 Okt).
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkUser, mkSlot, book, settle, mkPricedOffer, mkMemberWithPackage, openSlots } from "./fx";
import { POST as checkout } from "@/app/api/payment/checkout/route";
import { pickPool, releasePool } from "@/app/coach/kolam/actions";
import { joinCityWaitlist } from "@/app/member/paket/waitlist-actions";
import { pickCoachPool, releaseCoachPool } from "@/lib/coach-pools";
import * as push from "@/lib/push";

beforeEach(async () => {
  await reset();
});

const buy = (m: { id: string }, poolId: string, coachId: string, dependentId: string) =>
  as({ id: m.id, role: "MEMBER", name: "M" }, () =>
    checkout(new Request("http://x", { method: "POST", body: JSON.stringify({ poolId, coachId, sesi: 4, dependentId }) })),
  );

const linked = (poolId: string, coachId: string) => prisma.poolAffiliation.count({ where: { poolId, coachId } });

describe("LEPAS KOLAM", () => {
  it("KP1: masih ada member aktif -> ditolak, tautan & jam kosong tetap", async () => {
    const { pool, coach } = await mkPricedOffer();
    await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(Date.now() + 30 * 86400e3) });
    const slot = await mkSlot(coach.id, pool.id, 48);
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("HAS_MEMBERS");
    expect(await linked(pool.id, coach.id)).toBe(1);
    expect((await prisma.availability.findUniqueOrThrow({ where: { id: slot.id } })).status).toBe("AVAILABLE");
  });

  it("KP2: paket sudah lewat masa berlaku -> boleh lepas; jam kosong mendatang ditutup, jam yang sudah dibooking tetap", async () => {
    const { pool, coach } = await mkPricedOffer();
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(Date.now() + 30 * 86400e3) });
    const booked = await mkSlot(coach.id, pool.id, 24);
    await book(m.id, booked.id, pkg.id);
    await prisma.package.update({ where: { id: pkg.id }, data: { expiredDate: new Date(Date.now() - 1000) } });
    const open = await mkSlot(coach.id, pool.id, 48);
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("OK");
    expect(await linked(pool.id, coach.id)).toBe(0);
    expect(await prisma.availability.findUnique({ where: { id: open.id } })).toBeNull();
    expect((await prisma.availability.findUniqueOrThrow({ where: { id: booked.id } })).status).toBe("BOOKED");
  });

  it("KP3: menunggu bayar yang masih bisa dilunasi menahan; yang sudah lewat 24 jam+ tidak", async () => {
    const { pool, coach } = await mkPricedOffer();
    const { pkg } = await mkMemberWithPackage(pool.id, coach.id);
    await prisma.package.update({ where: { id: pkg.id }, data: { status: "PENDING_PAYMENT" } });
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("HAS_MEMBERS");
    await prisma.package.update({ where: { id: pkg.id }, data: { createdAt: new Date(Date.now() - 2 * 86400e3) } });
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("OK");
  });

  it("KP4: pengajuan ganti coach KE coach ini di kolam itu yang masih jalan menahan", async () => {
    const { pool, coach } = await mkPricedOffer();
    const other = await mkUser("COACH");
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: other.id } });
    const { m, pkg } = await mkMemberWithPackage(pool.id, other.id, { expired: new Date(Date.now() + 30 * 86400e3) });
    await prisma.coachChangeRequest.create({ data: { packageId: pkg.id, memberId: m.id, fromCoachId: other.id, toCoachId: coach.id, reason: "uji pindah coach" } });
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("HAS_MEMBERS");
  });

  it("KP5: lepas kolam yang tidak dipilih -> NOT_PICKED", async () => {
    const { pool } = await mkPricedOffer();
    const c = await mkUser("COACH");
    expect(await releaseCoachPool(c.id, pool.id)).toBe("NOT_PICKED");
  });

  it("KP6 (balapan): 6 member membeli paket bersamaan dengan coach melepas kolam (10 putaran) -> tidak pernah ada paket hidup tanpa tautan", async () => {
    for (let round = 0; round < 10; round++) {
      const { pool, coach } = await mkPricedOffer();
      const members = await Promise.all([1, 2, 3, 4, 5, 6].map(() => mkUser("MEMBER")));
      const deps = await Promise.all(members.map((m) => prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } })));
      const results = await settle<unknown>([
        ...members.map((m, i) => buy(m, pool.id, coach.id, deps[i].id)),
        releaseCoachPool(coach.id, pool.id),
      ]);
      const release = results.at(-1)!;
      expect(release.status).toBe("fulfilled");
      const alive = await prisma.package.count({ where: { poolId: pool.id, coachId: coach.id, status: { in: ["ACTIVE", "PENDING_PAYMENT"] } } });
      const stillLinked = await linked(pool.id, coach.id);
      if ((release as PromiseFulfilledResult<string>).value === "OK") {
        expect(stillLinked).toBe(0);
        expect(alive).toBe(0);
      } else {
        expect((release as PromiseFulfilledResult<string>).value).toBe("HAS_MEMBERS");
        expect(stillLinked).toBe(1);
        expect(alive).toBeGreaterThan(0);
      }
    }
  });
});

describe("PILIH KOLAM", () => {
  it("KP7: kolam nonaktif ditolak; klik pilih dobel bersamaan -> satu tautan; checkout setelah lepas ditolak", async () => {
    const { pool, coach } = await mkPricedOffer();
    await prisma.poolAffiliation.deleteMany({});
    const off = await prisma.pool.create({ data: { name: "Kolam Mati", isActive: false } });
    expect(await pickCoachPool(coach.id, off.id)).toBe("POOL_UNAVAILABLE");
    const rs = await settle([1, 2, 3, 4].map(() => pickCoachPool(coach.id, pool.id)));
    expect(rs.every((r) => r.status === "fulfilled" && r.value === "OK")).toBe(true);
    expect(await linked(pool.id, coach.id)).toBe(1);
    expect(await releaseCoachPool(coach.id, pool.id)).toBe("OK");
    const m = await mkUser("MEMBER");
    const dep = await prisma.dependent.create({ data: { memberId: m.id, name: "Anak" } });
    const res = await buy(m, pool.id, coach.id, dep.id);
    expect(res.status).toBe(400);
  });

  it("KP8: hanya akun coach yang boleh memakai tombol Pilih/Lepas (member & pemilik kolam ditolak)", async () => {
    const { pool } = await mkPricedOffer();
    for (const role of ["MEMBER", "POOL_OWNER", "ADMIN"] as const) {
      const u = await mkUser(role);
      await expect(as({ id: u.id, role }, () => pickPool(pool.id))).rejects.toThrow("REDIRECT:/login");
      await expect(as({ id: u.id, role }, () => releasePool(pool.id))).rejects.toThrow("REDIRECT:/login");
    }
    expect(await prisma.poolAffiliation.count({ where: { poolId: pool.id } })).toBe(1);
  });

  it("KP9: coach nonaktif tidak bisa memilih kolam", async () => {
    const { pool } = await mkPricedOffer();
    const c = await mkUser("COACH");
    await prisma.user.update({ where: { id: c.id }, data: { isActive: false } });
    expect(await pickCoachPool(c.id, pool.id)).toBe("COACH_INACTIVE");
  });
});

describe("DAFTAR TUNGGU KOTA", () => {
  it("KP10: member menunggu di Bandung; dua coach memilih kolam Bandung bersamaan -> dikabari tepat sekali", async () => {
    const spy = vi.spyOn(push, "sendPushToUser");
    const pool = await prisma.pool.create({ data: { name: "Kolam Bandung", city: "Bandung", pricePack4: 260000, pricePack8: 480000 } });
    const m = await mkUser("MEMBER");
    await expect(as({ id: m.id, role: "MEMBER" }, () => joinCityWaitlist("Bandung"))).rejects.toThrow("REDIRECT:");
    await expect(as({ id: m.id, role: "MEMBER" }, () => joinCityWaitlist("Bandung"))).rejects.toThrow("REDIRECT:");
    expect(await prisma.cityWaitlist.count({ where: { userId: m.id } })).toBe(1);
    const coaches = await Promise.all([1, 2].map(() => prisma.user.create({ data: { name: "C", phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", city: "Bandung", coachProfile: { create: { pricePack4: 440000 } } } })));
    for (const c of coaches) await openSlots(c.id, pool.id);
    await settle(coaches.map((c) => pickCoachPool(c.id, pool.id)));
    expect(spy.mock.calls.filter(([uid]) => uid === m.id)).toHaveLength(1);
    expect((await prisma.cityWaitlist.findFirstOrThrow({ where: { userId: m.id } })).notifiedAt).not.toBeNull();
    spy.mockRestore();
  });

  it("KP12: harga beda ukuran (kolam hanya 4 sesi, coach hanya 8 sesi) belum dihitung tersedia; begitu ukurannya cocok, dikabari", async () => {
    const spy = vi.spyOn(push, "sendPushToUser");
    const pool = await prisma.pool.create({ data: { name: "Kolam Bogor", city: "Bogor", pricePack4: 260000 } });
    const m = await mkUser("MEMBER");
    await prisma.cityWaitlist.create({ data: { userId: m.id, city: "Bogor" } });
    const c = await prisma.user.create({ data: { name: "C", phone: "08" + Math.random().toString().slice(2, 12), passwordHash: "x", role: "COACH", coachProfile: { create: { pricePack8: 800000 } } } });
    await openSlots(c.id, pool.id);
    await pickCoachPool(c.id, pool.id);
    expect(spy).not.toHaveBeenCalled();
    expect((await prisma.cityWaitlist.findFirstOrThrow({ where: { userId: m.id } })).notifiedAt).toBeNull();
    await prisma.coachProfile.update({ where: { userId: c.id }, data: { pricePack4: 440000 } });
    const { notifyWaitlistForCoach } = await import("@/lib/coach-pools");
    await notifyWaitlistForCoach(c.id);
    expect(spy.mock.calls.filter(([uid]) => uid === m.id)).toHaveLength(1);
    spy.mockRestore();
  });

  it("KP13: daftar tunggu di kota yang sudah punya paket tidak dicatat; pernah dikabari lalu daftar lagi = menunggu lagi", async () => {
    const { pool } = await mkPricedOffer();
    await prisma.pool.update({ where: { id: pool.id }, data: { city: "Depok" } });
    const m = await mkUser("MEMBER");
    await expect(as({ id: m.id, role: "MEMBER" }, () => joinCityWaitlist("Depok"))).rejects.toThrow("REDIRECT:");
    expect(await prisma.cityWaitlist.count({ where: { userId: m.id } })).toBe(0);
    await prisma.cityWaitlist.create({ data: { userId: m.id, city: "Surabaya", notifiedAt: new Date() } });
    await expect(as({ id: m.id, role: "MEMBER" }, () => joinCityWaitlist("Surabaya"))).rejects.toThrow("REDIRECT:");
    expect((await prisma.cityWaitlist.findFirstOrThrow({ where: { userId: m.id, city: "Surabaya" } })).notifiedAt).toBeNull();
  });

  it("KP11: coach tanpa harga memilih kolam -> belum dikabari; kota di luar daftar ditolak", async () => {
    const spy = vi.spyOn(push, "sendPushToUser");
    const pool = await prisma.pool.create({ data: { name: "Kolam Malang", city: "Malang", pricePack4: 260000 } });
    const m = await mkUser("MEMBER");
    await prisma.cityWaitlist.create({ data: { userId: m.id, city: "Malang" } });
    const c = await mkUser("COACH");
    await pickCoachPool(c.id, pool.id);
    expect(spy).not.toHaveBeenCalled();
    await expect(as({ id: m.id, role: "MEMBER" }, () => joinCityWaitlist("Semarang"))).rejects.toThrow("REDIRECT:/member/paket");
    expect(await prisma.cityWaitlist.count({ where: { userId: m.id } })).toBe(1);
    spy.mockRestore();
  });
});
