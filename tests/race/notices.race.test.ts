// Pengingat sebelum sesi dan paket mau berakhir (Hadi 9 Okt): terkirim sekali
// walau pemeriksa jalan dua kali atau barengan.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { reset, mkUser, mkPool, mkMemberWithPackage, book, settle } from "./fx";
import { sendPackageExpiryNotices, sendSessionReminders } from "@/lib/scheduled-notices";
import { dateLabel } from "@/lib/datetime";
import * as push from "@/lib/push";

beforeEach(async () => {
  await reset();
});

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const wib = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

async function slotAt(coachId: string, poolId: string, start: Date) {
  return prisma.availability.create({ data: { coachId, poolId, date: dateLabel(wib(start)), startTime: start, endTime: new Date(start.getTime() + HOUR) } });
}

// "Sekarang" = 18.00 WIB hari ini (11.00 UTC), supaya tanggal besok WIB pasti.
const at1800 = () => {
  const d = new Date();
  d.setUTCHours(11, 0, 0, 0);
  return d;
};

describe("PENGINGAT SESI", () => {
  it("PS1: 18.00 mengingatkan sesi besok ke member dan coach sekali; dijalankan dua kali barengan tetap sekali; sesi lusa dan yang batal tidak", async () => {
    const spy = vi.spyOn(push, "sendPushToUser");
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id);
    const now = at1800();
    const tomorrow = await slotAt(coach.id, pool.id, new Date(now.getTime() + 15 * HOUR)); // besok 09.00 WIB
    const later = await slotAt(coach.id, pool.id, new Date(now.getTime() + 39 * HOUR)); // lusa
    const cancelled = await slotAt(coach.id, pool.id, new Date(now.getTime() + 16 * HOUR));
    await book(m.id, tomorrow.id, pkg.id);
    await book(m.id, later.id, pkg.id);
    const c = await book(m.id, cancelled.id, pkg.id);
    await prisma.booking.update({ where: { id: c.id }, data: { status: "CANCELLED" } });

    const rs = await settle([sendSessionReminders("evening", now), sendSessionReminders("evening", now)]);
    const total = rs.reduce((n, r) => n + (r.status === "fulfilled" ? (r.value as number) : 0), 0);
    expect(total).toBe(1);
    expect(spy.mock.calls.filter(([u]) => u === m.id)).toHaveLength(1);
    expect(spy.mock.calls.filter(([u]) => u === coach.id)).toHaveLength(1);
    expect(await sendSessionReminders("evening", now)).toBe(0);
    spy.mockRestore();
  });

  it("PS2: 06.00 mengingatkan sesi hari ini yang belum mulai; member terhapus tidak diingatkan", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const a = await mkMemberWithPackage(pool.id, coach.id);
    const b = await mkMemberWithPackage(pool.id, coach.id);
    const now = new Date();
    now.setUTCHours(23, 0, 0, 0); // 06.00 WIB besok-nya UTC
    const s1 = await slotAt(coach.id, pool.id, new Date(now.getTime() + 3 * HOUR));
    const s2 = await slotAt(coach.id, pool.id, new Date(now.getTime() + 4 * HOUR));
    await book(a.m.id, s1.id, a.pkg.id);
    await book(b.m.id, s2.id, b.pkg.id);
    await prisma.user.update({ where: { id: b.m.id }, data: { anonymizedAt: new Date() } });
    expect(await sendSessionReminders("morning", now)).toBe(1);
    expect(await sendSessionReminders("morning", now)).toBe(0);
  });
});

describe("PAKET MAU BERAKHIR", () => {
  it("PB1: 14 hari sekali, 3 hari sekali; sesi coba hanya 3 hari; tanpa sisa sesi atau direfund tidak", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const now = new Date();
    const in10 = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 10 * DAY) });
    const in2 = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 2 * DAY) });
    const trial = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 5 * DAY) });
    const trialSoon = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 2 * DAY) });
    await prisma.package.update({ where: { id: trialSoon.pkg.id }, data: { isTrial: true } });
    await prisma.package.update({ where: { id: trial.pkg.id }, data: { isTrial: true } });
    const empty = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 2 * DAY), sisa: 0 });
    const refunded = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(now.getTime() + 2 * DAY) });
    await prisma.package.update({ where: { id: refunded.pkg.id }, data: { refundedAt: now } });

    const rs = await settle([sendPackageExpiryNotices(now), sendPackageExpiryNotices(now)]);
    const total = rs.reduce((n, r) => n + (r.status === "fulfilled" ? (r.value as number) : 0), 0);
    expect(total).toBe(3); // in10 (14 hari) + in2 (3 hari) + sesi coba 2 hari (3 hari)
    const after = (id: string) => prisma.package.findUniqueOrThrow({ where: { id } });
    expect((await after(in10.pkg.id)).expiryNotice14At).not.toBeNull();
    expect((await after(in10.pkg.id)).expiryNotice3At).toBeNull();
    expect((await after(in2.pkg.id)).expiryNotice3At).not.toBeNull();
    expect((await after(trial.pkg.id)).expiryNotice14At).toBeNull();
    expect((await after(empty.pkg.id)).expiryNotice3At).toBeNull();

    // 8 hari kemudian paket in10 tinggal 2 hari: pemberitahuan 3 hari menyusul sekali.
    const later = new Date(now.getTime() + 8 * DAY);
    expect(await sendPackageExpiryNotices(later)).toBe(1); // in10 (sesi coba sudah berakhir)
    expect(await sendPackageExpiryNotices(later)).toBe(0);
  });
});
