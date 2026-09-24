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
import { reviewTemplate } from "@/app/admin/paket/actions";
import { updatePoolTemplate } from "@/app/pool/paket/actions";

const known = process.env.RACE_KNOWN_BUGS === "run" ? it : it.fails;
const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });
const HOUR = 3600e3;

beforeEach(reset);

describe("S1 / D1: jadwal harus ada sebelum paket kedaluwarsa", () => {
  // Bug: sistem cuma cek paket masih aktif HARI INI, bukan di hari sesinya.
  it("K1: paket berlaku sampai besok, slot 30 hari lagi -> booking ditolak 409, sesi tidak terpotong", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 30 * 24);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { expired: new Date(Date.now() + 24 * HOUR) });
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(409);
    expect(await prisma.booking.count()).toBe(0);
    expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
  });

  // Pengaman: perbaikan tidak boleh memblokir booking yang sah. LOLOS sekarang dan harus tetap lolos.
  it("K1b: slot 12 jam lagi, paket berlaku 24 jam lagi -> booking tetap boleh (201)", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 12);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { expired: new Date(Date.now() + 24 * HOUR) });
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(201);
  });

  it("K1c: paket tanpa batas waktu -> booking jauh ke depan tetap boleh (201)", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const slot = await mkSlot(coach.id, pool.id, 60 * 24);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { expired: null });
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
    const { m, pkg } = await mkMemberWithPackage(pool.id);
    const res = await as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slot.id, packageId: pkg.id })));
    expect(res.status).toBe(409);
    expect(await prisma.booking.count()).toBe(0);
  });

  // Keputusan D2: booking yang sudah terjadwal dibatalkan OTOMATIS.
  it("K2b: admin menonaktifkan coach -> booking masa depan dibatalkan otomatis (oleh ADMIN), sesi member kembali; sesi yang sudah lewat tidak disentuh", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const future = await mkSlot(coach.id, pool.id, 48);
    const past = await mkSlot(coach.id, pool.id, -5);
    const a = await mkMemberWithPackage(pool.id);
    const b = await mkMemberWithPackage(pool.id);
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
      const members = await Promise.all(slots.map(() => mkMemberWithPackage(pool.id)));
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
    const x = await mkMemberWithPackage(pool.id);
    const bk = await book(x.m.id, slotB.id, x.pkg.id);
    await as({ id: admin.id, role: "ADMIN" }, () => toggleUserActive(coachA.id, false));
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: bk.id } })).status).toBe("BOOKED");
  });
});

describe("S3 / D3: saldo yang sudah dicairkan tidak boleh jadi minus", () => {
  async function creditedThenWithdrawn() {
    const pool = await mkPool(); const coach = await mkUser("COACH", { bank: true }); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
    const b = await book(m.id, slot.id, pkg.id);
    await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
    const cp = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } });
    expect(cp.walletBalance).toBe(55000); // 800000 / 8 = 100000 per sesi, bagian coach 55%
    await as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "55000" })));
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(0);
    return { pool, coach, admin, b };
  }

  // Bug: status Hadir bisa dibatalkan setelah saldonya dicairkan -> saldo -55.000.
  it("K3a: Hadir sudah dicairkan, lalu diubah jadi Tidak Hadir -> DITOLAK dengan pesan, status tetap Hadir, saldo tetap 0", async () => {
    const x = await creditedThenWithdrawn();
    const res = await as({ id: x.admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: x.b.id, attended: "false" })));
    expect(res?.error).toBeTruthy();
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: x.b.id } })).attended).toBe(true);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: x.coach.id } })).walletBalance).toBe(0);
  });

  it("K3c: coach mencairkan saldo BERSAMAAN admin membatalkan Hadir (15 putaran) -> tepat satu yang berhasil, saldo tidak pernah minus, catatan uang cocok", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const w = i * 3;
      const pool = await mkPool(); const coach = await mkUser("COACH", { bank: true }); const admin = await mkUser("ADMIN");
      const slot = await mkSlot(coach.id, pool.id, -3);
      const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
      const b = await book(m.id, slot.id, pkg.id);
      await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "55000" }))); })(),
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "false" }))); })(),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      const cp = await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } });
      expect(cp.walletBalance).toBeGreaterThanOrEqual(0);
      expect(await checkInvariants()).toEqual([]);
      const attended = (await prisma.booking.findUniqueOrThrow({ where: { id: b.id } })).attended;
      const withdrawn = await prisma.withdrawalRequest.count();
      // Tepat satu jalan: cair (Hadir tetap) ATAU batal Hadir (tidak ada pencairan).
      expect((attended === true && withdrawn === 1) || (attended === false && withdrawn === 0)).toBe(true);
      tally(sebaran, attended ? "cair menang" : "batal Hadir menang");
    }
    spread("K3c", sebaran);
  });

  // Pengaman: mengubah Hadir -> Tidak Hadir SEBELUM dicairkan harus tetap boleh.
  it("K3b: Hadir belum dicairkan, diubah jadi Tidak Hadir -> tetap boleh, saldo balik 0", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
    const slot = await mkSlot(coach.id, pool.id, -3);
    const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
    const b = await book(m.id, slot.id, pkg.id);
    await as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" })));
    const res = await as({ id: admin.id, role: "ADMIN" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "false" })));
    expect(res).toBeNull();
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: b.id } })).attended).toBe(false);
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { userId: coach.id } })).walletBalance).toBe(0);
  });
});

describe("S4 / D4: nomor HP dan email dibakukan", () => {
  const ago = Date.now() - 10000;
  const reg = (over: Record<string, unknown>) =>
    register(new Request("http://x", { method: "POST", body: JSON.stringify({ name: "a b", password: "12345678", acceptedTerms: true, wantsSelf: true, formRenderedAt: ago, ...over }) }));

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

describe("Kehilangan usulan harga (lost update)", () => {
  it("K5: pemilik kolam mengusulkan perubahan harga pas admin menyetujui usulan sebelumnya (200 putaran, jeda acak) -> usulan baru tidak boleh hilang diam-diam", async () => {
    // BUG TERBUKTI (24 Sep, ~5 dari 120 putaran): reviewTemplateChange membaca usulan lalu menulis
    // tanpa mengunci baris. Pemilik menimpa usulan di antaranya -> admin menerapkan usulan LAMA
    // dan menghapus usulan BARU. Perbaikan (Claude): kunci baris (FOR UPDATE) SEBELUM membaca.
    // Peluang muncul ~4% per putaran, jadi 200 putaran (peluang lolos tanpa bug < 0,1%).
    const outcomes: Record<string, number> = {};
    let lost = 0;
    for (let i = 0; i < 200; i++) {
      await reset();
      const pool = await mkPool(); const owner = await mkUser("POOL_OWNER"); const admin = await mkUser("ADMIN");
      await prisma.poolOwnership.create({ data: { poolId: pool.id, ownerId: owner.id } });
      const t = await prisma.packageTemplate.create({
        data: {
          poolId: pool.id, name: "T", totalSesi: 8, price: 800000, durationDays: 60, jatahCancel: 2, isActive: true,
          pendingChanges: { name: "T", totalSesi: 8, price: 900000, durationDays: 60, jatahCancel: 2, isActive: true, isNew: false, submittedAt: new Date().toISOString() },
        },
      });
      await settle([
        (async () => { await jitter(14); return as({ id: admin.id, role: "ADMIN" }, () => reviewTemplate(t.id, true)); })(),
        as({ id: owner.id, role: "POOL_OWNER" }, () => updatePoolTemplate(null, fd({ templateId: t.id, name: "T", totalSesi: "8", price: "950000", durationDays: "60", jatahCancel: "2", isActive: "on" }))),
      ]);
      const after = await prisma.packageTemplate.findUniqueOrThrow({ where: { id: t.id } });
      const pending = after.pendingChanges as { price?: number } | null;
      const key = `harga=${after.price} usulan=${pending ? pending.price : "kosong"}`;
      outcomes[key] = (outcomes[key] ?? 0) + 1;
      // Boleh: (harga 900000, usulan 950000) atau (harga 950000, usulan kosong).
      // SALAH (usulan 950000 hilang): harga 900000 dan usulan kosong.
      if (after.price === 900000 && pending === null) lost++;
    }
    console.log("N6", outcomes);
    expect(lost).toBe(0);
  });
});
