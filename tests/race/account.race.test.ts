import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, settle, jitter, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { anonymizeMember, requestAccountDeletion, cancelAccountDeletion, AccountDeletionError, ANONYMIZED_NAME } from "@/lib/account-deletion";
import { authorizeCredentials } from "@/lib/authorize";
import { POST as bookPOST } from "@/app/api/booking/route";
import { POST as register } from "@/app/api/register/route";

// Hapus akun (keputusan Hadi 25 Sep): member mengajukan, admin menyetujui ->
// identitas dianonimkan, riwayat transaksi & arsip chat tetap ada.

beforeEach(reset);
const bookReq = (body: unknown) => new Request("http://x/api/booking", { method: "POST", body: JSON.stringify(body) });

describe("Hapus akun member", () => {
  it("D1: disetujui -> identitas hilang, tidak bisa login, jadwal mendatang batal, riwayat & pembayaran tetap", async () => {
    const pool = await mkPool(); const coach = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id);
    await prisma.user.update({ where: { id: m.id }, data: { email: "Ani@Example.com", passwordHash: await bcrypt.hash("rahasia123", 4) } });
    const future = await book(m.id, (await mkSlot(coach.id, pool.id, 48)).id, pkg.id);
    const past = await book(m.id, (await mkSlot(coach.id, pool.id, -5)).id, pkg.id);
    await prisma.chatThread.create({ data: { userId: m.id, messages: { create: { sender: "USER", content: "halo" } } } });
    const phone = m.phone!;

    expect(await requestAccountDeletion(m.id)).toBe(true);
    const res = await anonymizeMember(m.id);
    expect(res.cancelledBookings).toBe(1);

    const u = await prisma.user.findUniqueOrThrow({ where: { id: m.id }, include: { dependents: true } });
    expect(u).toMatchObject({ name: ANONYMIZED_NAME, phone: null, email: null, isActive: false });
    expect(u.anonymizedAt).toBeInstanceOf(Date);
    expect(u.dependents.every((d) => d.name === "Peserta dihapus")).toBe(true);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: future.id } })).status).toBe("CANCELLED");
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: past.id } })).status).toBe("BOOKED");
    expect(await prisma.payment.count({ where: { packageId: pkg.id } })).toBe(1);
    expect(await prisma.chatMessage.count({ where: { thread: { userId: m.id } } })).toBe(1);
    const login = await authorizeCredentials({ identifier: phone, password: "rahasia123" }, new Request("http://x", { headers: { "x-forwarded-for": "5.5.5.5" } })).catch((e) => e);
    expect(login).toBeNull();
    expect(await checkInvariants()).toEqual([]);
  });

  it("D2: nomor HP & email yang dihapus boleh dipakai daftar lagi", async () => {
    const { m } = await mkMemberWithPackage((await mkPool()).id);
    const phone = "081277770001";
    await prisma.user.update({ where: { id: m.id }, data: { phone } });
    await requestAccountDeletion(m.id);
    await anonymizeMember(m.id);
    const res = await register(new Request("http://x", { method: "POST", body: JSON.stringify({ name: "a b", phone, password: "12345678", acceptedTerms: true, wantsSelf: true, formRenderedAt: Date.now() - 10000 }) }));
    expect(res.status).toBe(201);
  });

  it("D3: tanpa pengajuan member, akun non-member, atau sudah dihapus -> ditolak; pengajuan bisa dibatalkan", async () => {
    const { m } = await mkMemberWithPackage((await mkPool()).id);
    await expect(anonymizeMember(m.id)).rejects.toBeInstanceOf(AccountDeletionError);
    const coach = await mkUser("COACH");
    expect(await requestAccountDeletion(coach.id)).toBe(false);
    await requestAccountDeletion(m.id);
    expect(await cancelAccountDeletion(m.id)).toBe(true);
    await expect(anonymizeMember(m.id)).rejects.toBeInstanceOf(AccountDeletionError);
    await requestAccountDeletion(m.id);
    await anonymizeMember(m.id);
    await expect(anonymizeMember(m.id)).rejects.toBeInstanceOf(AccountDeletionError);
  });

  it("D4: admin menyetujui hapus akun BERSAMAAN member booking 5 slot (12 putaran) -> tidak ada booking aktif yang tersisa", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      await reset();
      const w = i * 12;
      const pool = await mkPool(); const coach = await mkUser("COACH");
      const { m, pkg } = await mkMemberWithPackage(pool.id);
      const slots = await Promise.all(Array.from({ length: 5 }, () => mkSlot(coach.id, pool.id, 48)));
      await requestAccountDeletion(m.id);
      const rs = await settle([
        anonymizeMember(m.id),
        // Hapus akun membuat hash password dulu (±60 md) -- jeda booking disapu
        // 0-130 md supaya booking jatuh sebelum, di tengah, dan sesudah kunci.
        ...slots.map((s) => (async () => { await jitter(w); return as({ id: m.id, role: "MEMBER" }, () => bookPOST(bookReq({ availabilityId: s.id, packageId: pkg.id }))); })()),
      ]);
      expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
      expect(await prisma.booking.count({ where: { status: "BOOKED" } })).toBe(0);
      expect(await checkInvariants()).toEqual([]);
      tally(sebaran, `${await prisma.booking.count()} sempat dibooking`);
    }
    spread("D4", sebaran);
  });
});
