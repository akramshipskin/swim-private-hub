// Tes race TAMBAHAN (sweep 24 Sep): fitur yang belum tercakup R*/W*/P*/A*.
// Pola tiap tes: siapkan data -> aksi barengan lewat settle() (dengan jitter()
// supaya urutannya bervariasi) -> cek hasil + checkInvariants(). Jangan ubah
// angka jitter/putaran tanpa alasan: itu hasil penyetelan (lihat catatan tiap tes).
import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, jitter, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { splitPlatformTax } from "@/lib/policy";
import { getPlatformBalance } from "@/lib/platform-wallet";
import { POST as bookPOST } from "@/app/api/booking/route";
import { POST as subscribePOST } from "@/app/api/push/subscribe/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import { removeAffiliation } from "@/app/admin/kolam/actions";
import { adminCancelBooking } from "@/app/admin/booking-overview/actions";
import { deleteAvailability, addAvailability } from "@/app/coach/jadwal/actions";
import { reviewTemplate, updatePackage } from "@/app/admin/paket/actions";
import { withdrawPlatform } from "@/app/admin/withdrawals/platform-actions";
import { markAttendance } from "@/app/coach/riwayat-sesi/actions";
import { rejectWithdrawal, markPaidManually } from "@/app/admin/withdrawals/actions";
import { requestWithdrawal as coachWithdraw } from "@/app/coach/saldo/actions";
import { updatePasswordProfil } from "@/app/profil/actions";
import { resetUserPassword, createUser } from "@/app/admin/users/actions";
import { reviewCertificate } from "@/app/admin/users/certificate-actions";

const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });
const thrownOf = (rs: PromiseSettledResult<unknown>[]) =>
  rs.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? (r as PromiseRejectedResult).reason));
const codesOf = (rs: PromiseSettledResult<unknown>[]) =>
  rs.flatMap((r) => (r.status === "fulfilled" && r.value instanceof Response ? [r.value.status] : []));
const valuesOf = (rs: PromiseSettledResult<unknown>[]) => rs.map((r) => (r.status === "fulfilled" ? r.value : { threw: true }));

// Coach dengan saldo awal 100.000 yang tercatat di pembukuan (supaya invariants ledger tetap benar).
async function coachWithBalance(amount = 100000) {
  const coach = await mkUser("COACH", { bank: true });
  const cp = coach.coachProfile!;
  await prisma.coachProfile.update({ where: { id: cp.id }, data: { walletBalance: amount } });
  await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: cp.id, amount } });
  return { coach, cp };
}

beforeEach(reset);

describe("BOOKING vs aksi admin/coach", () => {
  it("E1: admin mencopot coach dari kolam pas 20 member booking slotnya (12 putaran) -> slot yang sudah dibooking tetap ada, sisanya terhapus, tidak ada 500", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const w = i * 0.7; // sapuan lebar jeda (0-8 ms): kedua urutan aksi muncul; batas peralihan ada di bawah 3 ms
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const aff = await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: coach.id } });
      const slots = await Promise.all(Array.from({ length: 20 }, () => mkSlot(coach.id, pool.id, 48)));
      const members = await Promise.all(slots.map(() => mkMemberWithPackage(pool.id)));
      const rs = await settle([
        as({ id: admin.id, role: "ADMIN" }, () => removeAffiliation(fd({ affiliationId: aff.id }))),
        ...members.map(({ m, pkg }, k) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: slots[k].id, packageId: pkg.id }))); })()),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      const codes = codesOf(rs);
      expect(codes.length).toBe(20);
      // 404 sah: slot kosong ikut terhapus admin sebelum booking member sampai.
      if (!codes.every((c) => c === 201 || c === 409 || c === 404)) console.log("E1 KODE ANEH", JSON.stringify(codes));
      expect(codes.every((c) => c === 201 || c === 409 || c === 404)).toBe(true);
      const ok = codes.filter((c) => c === 201).length;
      expect(await prisma.availability.count({ where: { status: "BOOKED" } })).toBe(ok);
      expect(await prisma.availability.count()).toBe(ok); // yang kosong terhapus, yang dibooking selamat
      expect(await prisma.poolAffiliation.count()).toBe(0);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `${ok} dari 20 sempat terbooking`);
    }
    spread("E1", sebaran);
  });

  it("E2: admin membatalkan booking pas coach menghapus slotnya (15 putaran) -> sesi member selalu kembali, tidak ada booking yatim", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const w = 5 + i * 15; // sapuan lebar (5-215 ms): waktu batal admin beda tiap mesin
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slot = await mkSlot(coach.id, pool.id, 48);
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      const b = await book(m.id, slot.id, pkg.id);
      const rs = await settle([
        as({ id: admin.id, role: "ADMIN" }, () => adminCancelBooking(null, fd({ bookingId: b.id }))),
        (async () => { await jitter(w); return as({ id: coach.id, role: "COACH" }, () => deleteAvailability(slot.id)); })(),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      expect((await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } })).sisaSesi).toBe(8);
      expect(await prisma.booking.count({ where: { status: "BOOKED" } })).toBe(0);
      expect(await checkInvariants()).toEqual([]);
      // Slot pernah dibooking -> tidak pernah benar-benar terhapus, riwayat batalnya tetap ada.
      const after = await prisma.availability.findUniqueOrThrow({ where: { id: slot.id } });
      expect(await prisma.booking.count({ where: { id: b.id, status: "CANCELLED" } })).toBe(1);
      tally(sebaran, after.status === "CLOSED" ? "slot ditutup" : "slot masih terbuka (hapus kalah duluan)");
    }
    spread("E2", sebaran);
  });

  it("E12: admin menandai paket EXPIRED pas member booking 3 slot (15 putaran) -> paket EXPIRED tidak boleh punya booking, sisa sesi konsisten", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const w = 2 + i * 0.6; // jeda acak di kedua sisi (2-10 ms)
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      const slots = await Promise.all(Array.from({ length: 3 }, () => mkSlot(coach.id, pool.id, 48)));
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      const rs = await settle([
        (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => updatePackage(null, fd({ packageId: pkg.id, sisaSesi: "8", expectedSisaSesi: "8", jatahCancel: "2", status: "EXPIRED", expiredDate: "" }))); })(),
        ...slots.map((s) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: s.id, packageId: pkg.id }))); })()),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      const after = await prisma.package.findUniqueOrThrow({ where: { id: pkg.id } });
      const booked = await prisma.booking.count({ where: { packageId: pkg.id, status: "BOOKED" } });
      if (after.status === "EXPIRED") { expect(booked).toBe(0); expect(after.sisaSesi).toBe(8); }
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `${after.status}, ${booked} booking`);
    }
    spread("E12", sebaran);
  });
});

describe("USULAN PAKET (persetujuan admin)", () => {
  const pending = (over: Record<string, unknown> = {}) => ({ name: "T", totalSesi: 8, price: 900000, durationDays: 60, jatahCancel: 2, isActive: true, isNew: false, submittedAt: new Date().toISOString(), ...over });
  const tpl = (poolId: string, pendingChanges: object, over: Record<string, unknown> = {}) =>
    prisma.packageTemplate.create({ data: { poolId, name: "T", totalSesi: 8, price: 800000, durationDays: 60, jatahCancel: 2, isActive: true, pendingChanges, ...over } });

  it("E3a: admin menyetujui usulan yang sama 4x barengan -> harga baru berlaku sekali, usulan hilang, tidak ada error", async () => {
    const pool = await mkPool(); const admin = await mkUser("ADMIN");
    const t = await tpl(pool.id, pending());
    const rs = await settle(Array.from({ length: 4 }, () => as({ id: admin.id, role: "ADMIN" }, () => reviewTemplate(t.id, true))));
    expect(thrownOf(rs)).toEqual([]);
    const after = await prisma.packageTemplate.findUniqueOrThrow({ where: { id: t.id } });
    expect(after.price).toBe(900000);
    expect(after.pendingChanges).toBeNull();
  });

  it("E3b: admin menyetujui vs menolak paket BARU barengan (20 putaran) -> hasil akhirnya utuh: harga baru + aktif, atau harga lama + nonaktif, tidak setengah-setengah", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      await reset();
      const pool = await mkPool(); const admin = await mkUser("ADMIN");
      const t = await tpl(pool.id, pending({ isNew: true }), { isActive: false });
      await settle([
        (async () => { await jitter(6); return as({ id: admin.id, role: "ADMIN" }, () => reviewTemplate(t.id, true)); })(),
        (async () => { await jitter(6); return as({ id: admin.id, role: "ADMIN" }, () => reviewTemplate(t.id, false)); })(),
      ]);
      const after = await prisma.packageTemplate.findUniqueOrThrow({ where: { id: t.id } });
      expect(after.pendingChanges).toBeNull();
      expect(after.price === 900000).toBe(after.isActive === true);
      tally(sebaran, `harga=${after.price} aktif=${after.isActive}`);
    }
    spread("E3b", sebaran);
  });
});

describe("SALDO PLATFORM & PENCAIRAN", () => {
  it("E4: 4 penarikan platform Rp30.000 pas 3 sesi Hadir menambah saldo (10 putaran) -> saldo platform tidak minus dan tepat sesuai yang berhasil", async () => {
    const sebaran: Record<string, number> = {};
    const { net } = splitPlatformTax(15000); // komisi 15% dari Rp100.000 per sesi
    for (let i = 0; i < 10; i++) {
      await reset();
      const w = 3 + i * 4;
      const pool = await mkPool(); const coach = await mkUser("COACH"); const admin = await mkUser("ADMIN");
      await prisma.walletTransaction.create({ data: { type: "PLATFORM_REVENUE", amount: 100000 } });
      const bookings = [];
      for (let k = 0; k < 3; k++) {
        const slot = await mkSlot(coach.id, pool.id, -3);
        const { m, pkg } = await mkMemberWithPackage(pool.id, { price: 800000 });
        bookings.push(await book(m.id, slot.id, pkg.id));
      }
      const rs = await settle([
        ...Array.from({ length: 4 }, () => (async () => { await jitter(w); return as({ id: admin.id, role: "ADMIN" }, () => withdrawPlatform(null, fd({ revenueAmount: "30000" }))); })()),
        ...bookings.map((b) => (async () => { await jitter(30); return as({ id: coach.id, role: "COACH" }, () => markAttendance(null, fd({ bookingId: b.id, attended: "true" }))); })()),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      // Ketiga absensi harus berhasil (null = sukses); kalau ada yang menolak, pesannya tampil di sini.
      if (JSON.stringify(valuesOf(rs).slice(4)) !== "[null,null,null]") console.log("E4 ABSENSI DITOLAK", JSON.stringify(valuesOf(rs).slice(4)));
      expect(valuesOf(rs).slice(4)).toEqual([null, null, null]);
      const ok = rs.slice(0, 4).filter((r) => r.status === "fulfilled" && (r.value as { ok?: boolean } | null)?.ok === true).length;
      expect(ok).toBeGreaterThanOrEqual(3);
      expect((await getPlatformBalance()).revenue).toBe(100000 + 3 * net - 30000 * ok);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `${ok} dari 4 penarikan berhasil`);
    }
    spread("E4", sebaran);
  });

  it("E5: admin menolak pencairan lama (saldo balik) pas coach mengajukan pencairan baru (15 putaran) -> saldo + pengajuan yang berjalan selalu = Rp100.000, tidak minus", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      await reset();
      const admin = await mkUser("ADMIN");
      const { coach, cp } = await coachWithBalance();
      await as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "60000" })));
      const r1 = await prisma.withdrawalRequest.findFirstOrThrow({ where: { coachProfileId: cp.id } });
      const rs = await settle([
        as({ id: admin.id, role: "ADMIN" }, () => rejectWithdrawal(null, fd({ withdrawalId: r1.id }))),
        (async () => { await jitter(12); return as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "90000" }))); })(),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      const balance = (await prisma.coachProfile.findUniqueOrThrow({ where: { id: cp.id } })).walletBalance;
      const running = (await prisma.withdrawalRequest.aggregate({ where: { coachProfileId: cp.id, status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amount: true } }))._sum.amount ?? 0;
      expect(balance + running).toBe(100000);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `pengajuan baru ${(await prisma.withdrawalRequest.count({ where: { coachProfileId: cp.id } })) === 2 ? "berhasil" : "ditolak"}`);
    }
    spread("E5", sebaran);
  });

  it("E6: admin klik 'Tandai Dibayar' 6x barengan -> tepat 1 berhasil, 5 lainnya ditolak dengan pesan, status PAID, saldo tidak berubah lagi", async () => {
    const admin = await mkUser("ADMIN");
    const { coach, cp } = await coachWithBalance();
    await as({ id: coach.id, role: "COACH" }, () => coachWithdraw(null, fd({ amount: "60000" })));
    const r1 = await prisma.withdrawalRequest.findFirstOrThrow({ where: { coachProfileId: cp.id } });
    const rs = await settle(Array.from({ length: 6 }, () => as({ id: admin.id, role: "ADMIN" }, () => markPaidManually(null, fd({ withdrawalId: r1.id, transferReference: "TRF-E6" })))));
    expect(thrownOf(rs)).toEqual([]);
    const values = valuesOf(rs) as ({ error?: string } | null)[];
    expect(values.filter((v) => v === null).length).toBe(1);
    expect(values.filter((v) => v?.error?.includes("baru saja diproses") || v?.error?.includes("sudah diproses")).length).toBe(5);
    expect((await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: r1.id } })).status).toBe("PAID");
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: cp.id } })).walletBalance).toBe(40000);
    expect(await checkInvariants()).toEqual([]);
  });
});

describe("AKUN & SESI LOGIN", () => {
  it("E7a: 2 perangkat mengganti password pakai password lama yang sama, barengan -> password akhir salah satu dari keduanya (bukan yang lama), versi sesi naik 2", async () => {
    const u = await mkUser("MEMBER");
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash("PasswordLama1", 4) } });
    const pws = ["PasswordBaruA1", "PasswordBaruB1"];
    const rs = await settle(pws.map((pw) => as({ id: u.id, role: "MEMBER" }, () => updatePasswordProfil(null, fd({ currentPassword: "PasswordLama1", newPassword: pw, confirmPassword: pw })))));
    expect(thrownOf(rs)).toEqual([]);
    expect(valuesOf(rs)).toEqual([{ success: true }, { success: true }]);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    const matches = await Promise.all(["PasswordLama1", ...pws].map((pw) => bcrypt.compare(pw, after.passwordHash)));
    expect(matches).toEqual([false, true, false].map((_, i) => matches[i])); // bentuk array tetap
    expect(matches[0]).toBe(false);
    expect(matches[1] !== matches[2]).toBe(true); // tepat 1 dari 2 password baru yang berlaku
    expect(after.sessionVersion).toBe(2);
  });

  it("E7b: 2 admin mereset password user yang sama barengan -> salah satu password sementara berlaku, versi sesi naik 2, wajib ganti password", async () => {
    const admin = await mkUser("ADMIN"); const u = await mkUser("MEMBER");
    const rs = await settle([0, 1].map(() => as({ id: admin.id, role: "ADMIN" }, () => resetUserPassword(u.id))));
    expect(thrownOf(rs)).toEqual([]);
    const temps = (valuesOf(rs) as { tempPassword?: string }[]).map((v) => v.tempPassword!);
    expect(temps.every((t) => typeof t === "string" && t.length === 10)).toBe(true);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    const matches = await Promise.all(temps.map((t) => bcrypt.compare(t, after.passwordHash)));
    expect(matches.filter(Boolean).length).toBe(1); // tepat satu yang efektif; admin lain memegang password yang mati
    expect(after.sessionVersion).toBe(2);
    expect(after.mustChangePassword).toBe(true);
  });

  it("E13: admin membuat akun pemilik kolam (+ kolam baru) 4x barengan dengan No HP sama -> 1 akun, tepat 1 kolam (tidak ada kolam yatim)", async () => {
    const admin = await mkUser("ADMIN");
    const rs = await settle(Array.from({ length: 4 }, () => as({ id: admin.id, role: "ADMIN" }, () => createUser(null, fd({ name: "pemilik uji", phone: "081266666666", password: "12345678", role: "POOL_OWNER", poolMode: "new", newPoolName: "Kolam Uji", newPoolAddress: "Jl. Uji" })))));
    expect(thrownOf(rs)).toEqual([]);
    expect(await prisma.user.count({ where: { phone: "081266666666" } })).toBe(1);
    expect(await prisma.pool.count()).toBe(1);
    expect(await prisma.poolOwnership.count()).toBe(1);
  });

  it("E8: admin menyetujui dan menolak sertifikat coach yang sama barengan (20 putaran) -> status akhir utuh: APPROVED hanya jika badge aktif", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      await reset();
      const admin = await mkUser("ADMIN"); const coach = await mkUser("COACH");
      const cp = coach.coachProfile!;
      await prisma.coachProfile.update({ where: { id: cp.id }, data: { certificateStatus: "PENDING", certificateUrl: "x/y.pdf" } });
      const rs = await settle([
        ...[0, 1, 2].map(() => (async () => { await jitter(6); return as({ id: admin.id, role: "ADMIN" }, () => reviewCertificate(cp.id, true)); })()),
        ...[0, 1, 2].map(() => (async () => { await jitter(6); return as({ id: admin.id, role: "ADMIN" }, () => reviewCertificate(cp.id, false)); })()),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      const after = await prisma.coachProfile.findUniqueOrThrow({ where: { id: cp.id } });
      expect(["APPROVED", "REJECTED"]).toContain(after.certificateStatus);
      expect(after.hasCertification).toBe(after.certificateStatus === "APPROVED");
      tally(sebaran, after.certificateStatus);
    }
    spread("E8", sebaran);
  });
});

describe("JADWAL, NOTIFIKASI, CHAT", () => {
  it("E9: coach klik 'Tambah Slot' 4x barengan untuk jam yang sama -> tepat 3 slot (08-11), tidak ada error 500", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: coach.id } });
    const date = new Date(Date.now() + 3 * 86400e3).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const rs = await settle(Array.from({ length: 4 }, () => as({ id: coach.id, role: "COACH", name: "Coach Uji" }, () => addAvailability(null, fd({ date, startTime: "08:00", endTime: "11:00", poolId: pool.id })))));
    expect(thrownOf(rs)).toEqual([]);
    expect(await prisma.availability.count({ where: { coachId: coach.id } })).toBe(3);
    expect(await checkInvariants()).toEqual([]);
  });

  it("E10: perangkat yang sama mendaftar notifikasi 6x barengan, lalu dipakai bergantian 2 akun -> tetap 1 baris langganan, tidak ada 500", async () => {
    const a = await mkUser("MEMBER"); const b = await mkUser("COACH");
    const call = (u: { id: string; role: "MEMBER" | "COACH" }) =>
      as(u, () => subscribePOST(new Request("http://x/api/push/subscribe", { method: "POST", body: JSON.stringify({ endpoint: "https://push.example/perangkat-1", keys: { p256dh: "p", auth: "a" } }) })));
    const rs1 = await settle(Array.from({ length: 6 }, () => call({ id: a.id, role: "MEMBER" })));
    expect(thrownOf(rs1)).toEqual([]);
    expect(codesOf(rs1).every((c) => c === 200)).toBe(true);
    const rs2 = await settle(Array.from({ length: 8 }, (_, i) => call(i % 2 ? { id: a.id, role: "MEMBER" } : { id: b.id, role: "COACH" })));
    expect(thrownOf(rs2)).toEqual([]);
    expect(codesOf(rs2).every((c) => c === 200)).toBe(true);
    const rows = await prisma.pushSubscription.findMany({ where: { endpoint: "https://push.example/perangkat-1" } });
    expect(rows.length).toBe(1);
    expect([a.id, b.id]).toContain(rows[0].userId);
  });

  it("E11: member mengirim 25 pesan chat barengan -> tepat 20 diterima, 5 ditolak 429 (batas per jam), tidak ada 500", async () => {
    const m = await mkUser("MEMBER");
    const send = () => as({ id: m.id, role: "MEMBER" }, () => chatPOST(new Request("http://x/api/chat", { method: "POST", body: JSON.stringify({ content: "halo" }) })));
    const rs = await settle(Array.from({ length: 25 }, send));
    console.log("E11", { thrown: thrownOf(rs), codes: codesOf(rs).sort() });
    expect(thrownOf(rs)).toEqual([]);
    const codes = codesOf(rs);
    expect(codes.every((c) => c === 200 || c === 429)).toBe(true);
    expect(await prisma.chatMessage.count({ where: { sender: "USER" } })).toBe(20);
    expect(codes.filter((c) => c === 200).length).toBe(20);
  });
});
