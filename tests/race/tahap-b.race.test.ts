// Tahap B (Hadi 10-11 Okt): tolak pendaftar, kolam mengikuti pemiliknya (T19),
// laporan coach. Terhadap Postgres lokal.
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, settle } from "./fx";
import { rejectRegistration, toggleUserActive } from "@/app/admin/users/actions";
import { togglePoolActive } from "@/app/admin/kolam/actions";
import { createCoachReport, resolveCoachReport } from "@/lib/coach-report";

beforeEach(reset);
const asAdmin = <T,>(fn: () => Promise<T>) => as({ id: "admin-x", role: "ADMIN" }, fn);

async function pendingCoach(phone = "081299990001") {
  return prisma.user.create({ data: { name: "Calon Coach", phone, email: "calon@x.test", passwordHash: "x", role: "COACH", isActive: false, coachProfile: { create: {} } } });
}

describe("TOLAK PENDAFTAR", () => {
  it("TB1: ditolak dengan alasan -> nomor & email dibebaskan, tidak lagi menunggu; tolak dua kali barengan = sekali; alasan terlalu pendek ditolak", async () => {
    const c = await pendingCoach();
    expect(await asAdmin(() => rejectRegistration(c.id, "abc"))).toEqual({ error: "Tulis alasan penolakan (minimal 5 karakter)." });
    const rs = await settle([asAdmin(() => rejectRegistration(c.id, "Sertifikat belum ada")), asAdmin(() => rejectRegistration(c.id, "Sertifikat belum ada"))]);
    const ok = rs.filter((r) => r.status === "fulfilled" && !("error" in (r.value as object)));
    expect(ok).toHaveLength(1);
    expect((ok[0] as PromiseFulfilledResult<{ phone: string }>).value.phone).toBe("081299990001");
    const u = await prisma.user.findUniqueOrThrow({ where: { id: c.id } });
    expect(u).toMatchObject({ phone: null, email: null, rejectionReason: "Sertifikat belum ada", isActive: false });
    // Nomor yang sama bisa dipakai daftar ulang.
    await expect(pendingCoach()).resolves.toBeTruthy();
  });

  it("TB2: akun yang sudah aktif tidak bisa ditolak", async () => {
    const coach = await mkUser("COACH");
    expect(await asAdmin(() => rejectRegistration(coach.id, "Sertifikat belum ada"))).toMatchObject({ error: expect.stringMatching(/sudah diproses/) });
  });
});

describe("KOLAM MENGIKUTI PEMILIK (T19)", () => {
  async function poolWithOwners(n: number) {
    const pool = await prisma.pool.create({ data: { name: "Kolam T19", isActive: true } });
    const owners = [];
    for (let i = 0; i < n; i++) {
      const o = await mkUser("POOL_OWNER");
      await prisma.user.update({ where: { id: o.id }, data: { approvedAt: new Date() } });
      await prisma.poolOwnership.create({ data: { poolId: pool.id, ownerId: o.id } });
      owners.push(o);
    }
    return { pool, owners };
  }
  const active = async (id: string) => (await prisma.pool.findUniqueOrThrow({ where: { id } })).isActive;

  it("TK1: satu pemilik nonaktif -> kolam mati; aktif lagi -> kolam menyala", async () => {
    const { pool, owners } = await poolWithOwners(1);
    await asAdmin(() => toggleUserActive(owners[0].id, false));
    expect(await active(pool.id)).toBe(false);
    await asAdmin(() => toggleUserActive(owners[0].id, true));
    expect(await active(pool.id)).toBe(true);
  });

  it("TK2: dua pemilik: kolam baru mati bila keduanya nonaktif", async () => {
    const { pool, owners } = await poolWithOwners(2);
    await asAdmin(() => toggleUserActive(owners[0].id, false));
    expect(await active(pool.id)).toBe(true);
    await asAdmin(() => toggleUserActive(owners[1].id, false));
    expect(await active(pool.id)).toBe(false);
  });

  it("TK3: kolam yang dimatikan admin tidak ikut menyala saat pemilik diaktifkan", async () => {
    const { pool, owners } = await poolWithOwners(1);
    await asAdmin(() => togglePoolActive(pool.id, false));
    await asAdmin(() => toggleUserActive(owners[0].id, false));
    await asAdmin(() => toggleUserActive(owners[0].id, true));
    expect(await active(pool.id)).toBe(false);
  });
});

describe("LAPORAN COACH", () => {
  it("LC1: member melapor coach yang pernah melatih; coach lain ditolak; admin menutup sekali", async () => {
    const pool = await mkPool();
    const coach = await mkUser("COACH");
    const other = await mkUser("COACH");
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id);
    await book(m.id, (await mkSlot(coach.id, pool.id, 24)).id, pkg.id);
    await expect(createCoachReport({ memberId: m.id, coachId: other.id, message: "Coach ini minta bayar langsung", file: null })).rejects.toThrow(/pernah melatih/);
    await expect(createCoachReport({ memberId: m.id, coachId: coach.id, message: "pendek", file: null })).rejects.toThrow(/minimal 10/);
    const r = await createCoachReport({ memberId: m.id, coachId: coach.id, message: "Coach menawarkan les di luar aplikasi lewat WA", file: null });
    expect(r.status).toBe("OPEN");
    const rs = await settle([
      resolveCoachReport({ reportId: r.id, adminId: "a", resolution: "Coach ditegur" }),
      resolveCoachReport({ reportId: r.id, adminId: "a", resolution: "Coach ditegur" }),
    ]);
    expect(rs.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
});
