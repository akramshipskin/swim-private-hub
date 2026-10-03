// TES PENERIMAAN untuk perbaikan yang belum dikerjakan (temuan sweep 24 Sep,
// keputusan Hadi D1-D4). Tiap tes menulis perilaku yang BENAR setelah
// perbaikan. Selama bugnya belum diperbaiki tes ini memakai `it.fails`: artinya
// tes dianggap LOLOS kalau isinya gagal (bug masih ada). Begitu bug diperbaiki,
// `it.fails` justru GAGAL -- itu sinyal untuk mengganti `known` jadi `it`
// (dikerjakan Claude saat memperbaiki, bukan OpenCode).
//
// Lihat isi sebenarnya (pesan gagal asli), tanpa pembungkus `fails`:
//   RACE_KNOWN_BUGS=run npx vitest run -c vitest.race.config.ts known-bugs
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, jitter, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { POST as bookPOST } from "@/app/api/booking/route";
import { POST as register } from "@/app/api/register/route";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { requestWithdrawal as coachWithdraw } from "@/app/coach/saldo/actions";
import { toggleUserActive } from "@/app/admin/users/actions";

// Semua bug di file ini sudah diperbaiki (tesnya sudah `it`). Untuk bug baru
// yang belum diperbaiki, pasang lagi:
//   const known = process.env.RACE_KNOWN_BUGS === "run" ? it : it.fails;
const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });
const HOUR = 3600e3;

beforeEach(reset);

describe("S1 / D1: jadwal harus ada sebelum paket kedaluwarsa", () => {
  // Bug: sistem cuma cek paket masih aktif HARI INI, bukan di hari sesinya.
  it("K1: paket berlaku sampai besok, slot 30 hari lagi -> booking ditolak 409, sesi tidak terpotong", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 30 * 24);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(Date.now() + 24 * HOUR) });
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(409);
    expect(await prisma.booking.count()).toBe(0);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
  });

  // Pengaman: perbaikan tidak boleh memblokir booking yang sah. LOLOS sekarang dan harus tetap lolos.
  it("K1b: slot 12 jam lagi, paket berlaku 24 jam lagi -> booking tetap boleh (201)", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 12);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { expired: new Date(Date.now() + 24 * HOUR) });
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(201);
  });

  it("K1c: paket tanpa batas waktu -> booking jauh ke depan tetap boleh (201)", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 60 * 24);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { expired: null });
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(201);
  });
});

describe("S2 / D2: coach yang dinonaktifkan", () => {
  // Bug: slot kosong milik coach nonaktif masih bisa dibooking member.
  it("K2a: coach nonaktif -> slot kosongnya tidak bisa dibooking (409)", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    await prisma.user.update({ where: { id: coach.id }, data: { isActive: false } });
    const slot = await mkSlot(coach.id, pool.id, 48);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id);
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(409);
    expect(await prisma.booking.count()).toBe(0);
  });

  // Keputusan D2: booking yang sudah terjadwal dibatalkan OTOMATIS.
  it("K2b: admin menonaktifkan coach -> booking masa depan dibatalkan otomatis (oleh ADMIN), sesi member kembali; sesi yang sudah lewat tidak disentuh", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const future = await mkSlot(coach.id, pool.id, 48);
    const past = await mkSlot(coach.id, pool.id, -5);
    const a = await mkMemberWithPackage(pool.id, coach.id);
    const b = await mkMemberWithPackage(pool.id, coach.id);
    const futureBooking = await book(a.m.id, future.id, a.pkg.id);
    const pastBooking = await book(b.m.id, past.id, b.pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => toggleUserActive(coach.id, false));
    const fb = await prisma.booking.findUniqueOrThrow({ where: { id: futureBooking.id } });
    expect(fb.status).toBe("CANCELLED");
    expect(fb.cancelledBy).toBe("ADMIN");
    expect((await prisma.package.findUniqueOrThrow({ where: { id: a.pkg.id } })).sisaSesi).toBe(8);
    const pb = await prisma.booking.findUniqueOrThrow({ where: { id: pastBooking.id } });
    expect(pb.status).toBe("BOOKED");
    expect((await prisma.package.findUniqueOrThrow({ where: { id: b.pkg.id } })).sisaSesi).toBe(7);
  });

  it("K2d: admin menonaktifkan coach BERSAMAAN 10 member booking slotnya (12 putaran) -> tidak ada booking aktif yang tersisa, sesi member utuh", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const w = i * 2;
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slots = await Promise.all(Array.from({ length: 10 }, () => mkSlot(coach.id, pool.id, 48)));
      const members = await Promise.all(slots.map(() => mkMemberWithPackage(pool.id, coach.id)));
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => toggleUserActive(coach.id, false)); })(),
        ...members.map(({ m, pkg }, k) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slots[k].id, packageId: pkg.id }))); })()),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      expect(await prisma.booking.count({ where: { status: "BOOKED" } })).toBe(0);
      for (const { pkg } of members) expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
      expect(await checkInvariants()).toEqual([]);
      const made = await prisma.booking.count();
      tally(sebaran, `${made} sempat dibooking lalu dibatalkan`);
    }
    spread("K2d", sebaran);
  });

  // Pengaman: mengaktifkan kembali / menonaktifkan tidak boleh merusak coach lain.
  it("K2c: menonaktifkan 1 coach tidak membatalkan booking coach lain", async () => {
    const pool = await mkPool(); const coachA = await mkUser("COACH"); const coachB = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slotB = await mkSlot(coachB.id, pool.id, 48);
    const x = await mkMemberWithPackage(pool.id, coachB.id);
    const bk = await book(x.m.id, slotB.id, x.pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => toggleUserActive(coachA.id, false));
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: bk.id } })).status).toBe("BOOKED");
  });
});

describe("S3 / D3 (direvisi 29 Sep): Hadir boleh dibatalkan walau sudah dicairkan, saldo boleh minus", () => {
  // Paket 1.600.000 / 8 sesi: kolam 100.000 - PPh 500 = 99.500, coach 80.000 -
  // PPh 400 = 79.600 (di atas minimal pencairan 50.000). Tidak datang: coach 50%
  // = 40.000 - PPh 200 = 39.800, kolam 0.
  async function creditedThenWithdrawn() {
    const pool = await mkPool(); const coach = await mkUser("COACH", { bank: true }); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 1600000 });
    const b = await book(m.id, slot.id, pkg.id);
    await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
    const cp = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } });
    expect(cp.walletBalance).toBe(79600);
    await as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "79600" })));
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(0);
    return { pool, coach, admin, b };
  }

  it("K3a: Hadir sudah dicairkan, lalu diubah jadi Tidak Hadir -> BERHASIL, saldo coach -39.800, catatan uang cocok", async () => {
    const x = await creditedThenWithdrawn();
    const res = await as({ id: x.admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: "false" })));
    expect(res).toBeNull();
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: x.b.id } })).attended).toBe(false);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: x.coach.id } })).walletBalance).toBe(-39800);
    expect((await prisma.pool.findUniqueOrThrow({ where: { id: x.pool.id } })).walletBalance).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("K3c: coach mencairkan saldo BERSAMAAN admin mengubah Hadir jadi Tidak Hadir (15 putaran) -> selalu salah satu dari 2 hasil sah, catatan uang cocok", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const w = i * 3;
      const pool = await mkPool(); const coach = await mkUser("COACH", { bank: true }); const admin = await mkUser("ADMIN");
      const slot = await mkSlot(coach.id, pool.id, -3);
      const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 1600000 });
      const b = await book(m.id, slot.id, pkg.id);
      await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "79600" }))); })(),
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "false" }))); })(),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      expect(await checkInvariants()).toEqual([]);
      expect((await prisma.booking.findUniqueOrThrow({ where: { id: b.id } })).attended).toBe(false);
      const bal = (await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance;
      const withdrawn = await prisma.withdrawalRequest.count();
      // Cair duluan: saldo 0 lalu dibalik -> -39.800. Ubah duluan: saldo 39.800, cair 79.600 ditolak.
      expect((withdrawn === 1 && bal === -39800) || (withdrawn === 0 && bal === 39800)).toBe(true);
      tally(sebaran, withdrawn ? "cair duluan (saldo minus)" : "ubah duluan (cair ditolak)");
    }
    spread("K3c", sebaran);
  });

  it("K3b: Hadir belum dicairkan, diubah jadi Tidak Hadir -> saldo coach 39.800 (50% - PPh), kolam 0", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 1600000 });
    const b = await book(m.id, slot.id, pkg.id);
    await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
    const res = await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "false" })));
    expect(res).toBeNull();
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: b.id } })).attended).toBe(false);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(39800);
    expect((await prisma.pool.findUniqueOrThrow({ where: { id: pool.id } })).walletBalance).toBe(0);
    expect(await checkInvariants()).toEqual([]);
  });

  it("K3d: 8 toggle Hadir/Tidak Hadir barengan -> bagi hasil akhir cocok dengan tanda terakhir, tidak dobel", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id, { price: 1600000 });
    const b = await book(m.id, slot.id, pkg.id);
    await settle(Array.from({ length: 8 }, (_, i) => (async () => {
      await jitter(i * 2);
      return as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: i % 2 ? "true" : "false" })));
    })()));
    expect(await checkInvariants()).toEqual([]);
    const att = (await prisma.booking.findUniqueOrThrow({ where: { id: b.id } })).attended;
    const bal = (await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance;
    const poolBal = (await prisma.pool.findUniqueOrThrow({ where: { id: pool.id } })).walletBalance;
    expect([bal, poolBal]).toEqual(att === true ? [79600, 99500] : [39800, 0]);
  });
});

describe("S4 / D4: nomor HP dan email dibakukan", () => {
  const ago = Date.now() - 10000;
  const reg = (over: Record<string, unknown>) =>
    register(new Request("http://x", { method: "POST", body: JSON.stringify({ name: "a b", password: "12345678", acceptedTerms: true, city: "Jakarta", pricePack4: 260000, dailyCapacity: 10, wantsSelf: true, selfBirthDate: "1990-05-05", formRenderedAt: ago, ...over }) }));

  // Bug: "0812-3456-7890", "081234567890" dan "+6281234567890" dianggap 3 orang berbeda.
  it("K4a: HP yang sama dengan format beda (spasi, '-', +62) -> daftar kedua ditolak 409, hanya 1 akun", async () => {
    expect((await reg({ phone: "081234567890" })).status).toBe(201);
    expect((await reg({ phone: "0812-3456-7890" })).status).toBe(409);
    expect((await reg({ phone: "+62 812 3456 7890" })).status).toBe(409);
    expect((await reg({ phone: "6281234567890" })).status).toBe(409);
    expect(await prisma.user.count()).toBe(1);
  });

  it("K4b: nomor HP disimpan dalam bentuk baku 08xxxxxxxxxx", async () => {
    await reg({ phone: "+62 812-3456-7891" });
    const u = await prisma.user.findFirstOrThrow();
    expect(u.phone).toBe("081234567891");
  });

  it("K4c: email yang sama dengan huruf besar/kecil beda -> daftar kedua ditolak 409", async () => {
    expect((await reg({ phone: "081211110001", email: "Budi@Example.com" })).status).toBe(201);
    expect((await reg({ phone: "081211110002", email: "budi@example.com" })).status).toBe(409);
    expect(await prisma.user.count()).toBe(1);
  });

  it("K4d: email disimpan huruf kecil semua", async () => {
    await reg({ phone: "081211110003", email: "Budi.Santoso@Example.COM" });
    const u = await prisma.user.findFirstOrThrow();
    expect(u.email).toBe("budi.santoso@example.com");
  });

  it("K4e: 4 pendaftaran barengan dengan format HP beda-beda untuk orang yang sama -> hanya 1 akun", async () => {
    const formats = ["081234567892", "0812-3456-7892", "+6281234567892", "6281234567892"];
    await Promise.allSettled(formats.map((phone) => reg({ phone })));
    expect(await prisma.user.count()).toBe(1);
  });

  // Pengaman: nomor beda benar-benar orang beda, tetap boleh daftar.
  it("K4f: dua nomor HP yang memang berbeda -> keduanya berhasil (201)", async () => {
    expect((await reg({ phone: "081234567893" })).status).toBe(201);
    expect((await reg({ phone: "081234567894" })).status).toBe(201);
    expect(await prisma.user.count()).toBe(2);
  });
});
