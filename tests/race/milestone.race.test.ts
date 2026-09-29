// Milestone + penahanan pencairan coach (Batch 3, 29 Sep) terhadap Postgres
// lokal. Catatan: TRUNCATE ... CASCADE di reset() ikut mengosongkan
// MilestoneItem (butir standar hasil migrasi), jadi tiap tes membuat butirnya sendiri.
import { describe, it, expect, beforeEach, vi } from "vitest";

// Batas mulai hitungan dimundurkan supaya sesi "kemarin" ikut dihitung.
vi.mock("@/lib/policy", async (orig) => ({ ...(await orig<typeof import("@/lib/policy")>()), MILESTONE_HOLD_START: new Date(0) }));

import { prisma } from "@/lib/prisma";
import { as, reset, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd, settle, jitter, spread, tally } from "./fx";
import { saveMilestoneUpdate, reviewMilestoneProposal, addMilestoneItem } from "@/app/milestone/actions";
import { requestWithdrawal } from "@/app/coach/saldo/actions";
import { getOverdueParticipants } from "@/lib/milestone-hold";
import { milestoneAccess } from "@/lib/milestone-data";

const thrownOf = (rs: PromiseSettledResult<unknown>[]) =>
  rs.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? (r as PromiseRejectedResult).reason));

async function mkItems() {
  await prisma.milestoneItem.createMany({
    data: [
      { id: "i_c1_1", group: "C", level: 1, sortOrder: 1, text: "Mengapung" },
      { id: "i_c1_2", group: "C", level: 1, sortOrder: 2, text: "Meluncur" },
      { id: "i_c2_1", group: "C", level: 2, sortOrder: 3, text: "Gaya bebas" },
      { id: "i_d1_1", group: "D", level: 1, sortOrder: 1, text: "Dewasa" },
    ],
  });
}

// Peserta umur ~9 tahun (kelompok C) dengan n sesi Hadir bersama coach (sesi lampau).
async function setup(sessions = 1) {
  const pool = await mkPool();
  const coach = await mkUser("COACH", { coachBalance: 100000, bank: true });
  await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: coach.coachProfile!.id, amount: 100000 } });
  const { m, dep, pkg } = await mkMemberWithPackage(pool.id);
  await prisma.dependent.update({ where: { id: dep.id }, data: { birthDate: new Date(Date.UTC(new Date().getUTCFullYear() - 9, 0, 1)) } });
  for (let i = 0; i < sessions; i++) {
    const slot = await mkSlot(coach.id, pool.id, -48 + i);
    const b = await book(m.id, slot.id, pkg.id);
    await prisma.booking.update({ where: { id: b.id }, data: { attended: true } });
  }
  return { pool, coach, m, dep, pkg };
}
const asCoach = (c: { id: string }, fn: () => Promise<unknown>) => as({ id: c.id, role: "COACH", name: "Coach Uji" }, fn);

beforeEach(async () => {
  await reset();
  await mkItems();
});

describe("MILESTONE", () => {
  it("M1: catatan pertama menentukan kelompok dari umur; butir tercapai + level selesai bersertifikat", async () => {
    const { coach, dep } = await setup();
    const r = await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "Bagus", achieved: "i_c1_1" })));
    expect(r).toEqual({ success: true });
    expect((await prisma.dependent.findUniqueOrThrow({ where: { id: dep.id } })).milestoneGroup).toBe("C");
    expect(await prisma.milestoneLevelCompletion.count()).toBe(0);

    const f = fd({ note: "Level 1 beres" });
    f.append("achieved", "i_c1_2");
    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, f));
    const done = await prisma.milestoneLevelCompletion.findMany();
    expect(done).toMatchObject([{ group: "C", level: 1, withCertificate: true, coachId: coach.id }]);
  });

  it("M2: penilaian awal (semua 'sudah bisa sebelumnya') = level selesai TANPA sertifikat; penilaian awal kedua kali ditolak", async () => {
    const { coach, dep } = await setup();
    const f = fd({ note: "Penilaian awal", prior: "on" });
    f.append("achieved", "i_c1_1");
    f.append("achieved", "i_c1_2");
    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, f));
    expect(await prisma.milestoneLevelCompletion.findMany()).toMatchObject([{ level: 1, withCertificate: false }]);
    const again = await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "x", prior: "on" })));
    expect(again).toEqual({ error: "Penilaian awal hanya untuk catatan pertama peserta." });
  });

  it("M3: coach yang tidak pernah mengajar peserta ditolak; butir dari kelompok lain ditolak", async () => {
    const { coach, dep } = await setup();
    const stranger = await mkUser("COACH");
    expect(await asCoach(stranger, () => saveMilestoneUpdate(dep.id, null, fd({ note: "x" })))).toEqual({ error: "Kamu belum pernah mengajar peserta ini." });
    expect(await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "x", achieved: "i_d1_1" })))).toEqual({
      error: "Butir tidak valid, muat ulang halaman.",
    });
    expect(await prisma.milestoneNote.count()).toBe(0);
  });

  it("M4: dua coach menyimpan butir terakhir level barengan (20 putaran) -> level selesai tepat 1x, 2 catatan, tidak ada 500", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      await reset();
      await mkItems();
      const { pool, coach, m, dep, pkg } = await setup();
      const coach2 = await mkUser("COACH");
      const s2 = await mkSlot(coach2.id, pool.id, -30);
      await book(m.id, s2.id, pkg.id);
      await prisma.milestoneAchievement.create({ data: { dependentId: dep.id, itemId: "i_c1_1", coachId: coach.id } });
      await prisma.dependent.update({ where: { id: dep.id }, data: { milestoneGroup: "C" } });
      const rs = await settle(
        [coach, coach2].map((c) =>
          (async () => {
            await jitter(6);
            return asCoach(c, () => saveMilestoneUpdate(dep.id, null, fd({ note: "selesai", achieved: "i_c1_2" })));
          })(),
        ),
      );
      expect(thrownOf(rs)).toEqual([]);
      expect(await prisma.milestoneLevelCompletion.count()).toBe(1);
      expect(await prisma.milestoneNote.count()).toBe(2);
      const winner = (await prisma.milestoneLevelCompletion.findFirstOrThrow()).coachId;
      tally(sebaran, winner === coach.id ? "coach1" : "coach2");
    }
    spread("M4", sebaran);
  });

  it("M5: usulan butir disetujui admin -> jadi standar untuk peserta lain; klik setujui+tolak barengan diputuskan 1x", async () => {
    const { coach, dep } = await setup();
    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "awal" })));
    expect(await asCoach(coach, () => addMilestoneItem(dep.id, null, fd({ text: "Butir baru", level: "1", propose: "on" })))).toEqual({ success: true });
    const item = await prisma.milestoneItem.findFirstOrThrow({ where: { text: "Butir baru" } });
    expect(item).toMatchObject({ dependentId: dep.id, proposalStatus: "PENDING", group: "C" });
    const admin = await mkUser("ADMIN");
    const rs = await settle([true, false, true].map((ok) => as({ id: admin.id, role: "ADMIN" }, () => reviewMilestoneProposal(item.id, ok))));
    expect(thrownOf(rs)).toEqual([]);
    const after = await prisma.milestoneItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(["APPROVED", "REJECTED"]).toContain(after.proposalStatus);
    expect(after.dependentId).toBe(after.proposalStatus === "APPROVED" ? null : dep.id);
  });
});

describe("AKSES", () => {
  it("A1: member pemilik & coach pengajar boleh lihat; member lain, coach lain, pemilik kolam tidak; hanya coach pengajar yang boleh menulis", async () => {
    const { coach, m, dep } = await setup();
    const otherMember = await mkUser("MEMBER");
    const otherCoach = await mkUser("COACH");
    const owner = await mkUser("POOL_OWNER");
    const admin = await mkUser("ADMIN");
    const cek = (u: { id: string; role: string }) => milestoneAccess(u, dep.id);
    expect(await cek({ id: m.id, role: "MEMBER" })).toEqual({ canView: true, canEdit: false });
    expect(await cek({ id: coach.id, role: "COACH" })).toEqual({ canView: true, canEdit: true });
    expect(await cek({ id: admin.id, role: "ADMIN" })).toEqual({ canView: true, canEdit: false });
    expect(await cek({ id: otherMember.id, role: "MEMBER" })).toEqual({ canView: false, canEdit: false });
    expect(await cek({ id: otherCoach.id, role: "COACH" })).toEqual({ canView: false, canEdit: false });
    expect(await cek({ id: owner.id, role: "POOL_OWNER" })).toEqual({ canView: false, canEdit: false });
  });
});

describe("PENAHANAN PENCAIRAN", () => {
  it("H1: 1 sesi Hadir tanpa catatan -> boleh cair; 2 sesi -> ditahan, saldo utuh; setelah catatan -> boleh cair", async () => {
    const one = await setup(1);
    expect(await getOverdueParticipants(one.coach.id)).toEqual([]);

    await reset();
    await mkItems();
    const { coach, dep } = await setup(2);
    const denied = await asCoach(coach, () => requestWithdrawal(null, fd({ amount: "60000" })));
    expect(denied).toEqual({ error: `Pencairan ditahan: isi dulu catatan milestone untuk ${dep.name}.` });
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: coach.coachProfile!.id } })).walletBalance).toBe(100000);
    expect(await prisma.withdrawalRequest.count()).toBe(0);

    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "Latihan napas" })));
    const ok = await asCoach(coach, () => requestWithdrawal(null, fd({ amount: "60000" })));
    expect(ok).toEqual({ ok: true });
    expect((await prisma.coachProfile.findUniqueOrThrow({ where: { id: coach.coachProfile!.id } })).walletBalance).toBe(40000);
  });

  it("H2: sesi Hadir dengan coach LAIN tidak ikut dihitung (per coach); sesi Tidak Hadir tidak dihitung", async () => {
    const { pool, coach, m, dep, pkg } = await setup(1);
    const other = await mkUser("COACH");
    const s = await mkSlot(other.id, pool.id, -20);
    const b = await book(m.id, s.id, pkg.id);
    await prisma.booking.update({ where: { id: b.id }, data: { attended: true } });
    const s3 = await mkSlot(coach.id, pool.id, -10);
    const b3 = await book(m.id, s3.id, pkg.id);
    await prisma.booking.update({ where: { id: b3.id }, data: { attended: false } });
    expect(await getOverdueParticipants(coach.id)).toEqual([]);
    expect(await getOverdueParticipants(other.id)).toEqual([]);
    expect(dep.id).toBeTruthy();
  });

  it("H3: coach mengajukan pencairan pas mengisi catatan (20 putaran) -> tidak ada 500, saldo & ledger konsisten", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      await reset();
      await mkItems();
      const { coach, dep } = await setup(2);
      const rs = await settle([
        (async () => { await jitter(8); return asCoach(coach, () => requestWithdrawal(null, fd({ amount: "60000" }))); })(),
        (async () => { await jitter(8); return asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "catat" }))); })(),
      ]);
      expect(thrownOf(rs)).toEqual([]);
      const wd = await prisma.withdrawalRequest.count();
      const bal = (await prisma.coachProfile.findUniqueOrThrow({ where: { id: coach.coachProfile!.id } })).walletBalance;
      const ledger = await prisma.walletTransaction.aggregate({ where: { coachProfileId: coach.coachProfile!.id }, _sum: { amount: true } });
      expect(bal).toBe(wd === 1 ? 40000 : 100000);
      expect(ledger._sum.amount).toBe(bal);
      tally(sebaran, wd === 1 ? "cair" : "ditahan");
    }
    spread("H3", sebaran);
  });
});

describe("BUTIR STANDAR (admin)", () => {
  let adminId = "";
  beforeEach(async () => { adminId = (await mkUser("ADMIN")).id; });
  const asAdmin = <T,>(fn: () => Promise<T>) => as({ id: adminId, role: "ADMIN", name: "Admin" }, fn);

  it("M-A1: butir dinonaktifkan tidak dihitung -> peserta yang tinggal kurang butir itu selesai level di catatan berikutnya; level selesai tidak dicabut saat butir diaktifkan lagi", async () => {
    const { setStandardItemActive } = await import("@/app/admin/milestone/actions");
    const { coach, dep } = await setup();
    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "Mulai", achieved: "i_c1_1" })));
    await asAdmin(() => setStandardItemActive("i_c1_2", false));
    await asCoach(coach, () => saveMilestoneUpdate(dep.id, null, fd({ note: "Lanjut" })));
    expect(await prisma.milestoneLevelCompletion.findMany({ select: { group: true, level: true } })).toEqual([{ group: "C", level: 1 }]);
    await asAdmin(() => setStandardItemActive("i_c1_2", true));
    expect(await prisma.milestoneLevelCompletion.count()).toBe(1);
  });

  it("M-A2: edit teks/urutan hanya untuk butir standar; butir khusus peserta & input tidak valid ditolak; tambah butir urutannya di belakang", async () => {
    const { updateStandardItem, addStandardItem } = await import("@/app/admin/milestone/actions");
    const { dep } = await setup();
    await prisma.milestoneItem.create({ data: { id: "khusus", group: "C", level: 1, text: "Khusus", dependentId: dep.id } });
    expect(await asAdmin(() => updateStandardItem("i_c1_1", null, fd({ text: "Mengapung 5 detik", sortOrder: "4" })))).toEqual({ success: true });
    expect(await prisma.milestoneItem.findUniqueOrThrow({ where: { id: "i_c1_1" } })).toMatchObject({ text: "Mengapung 5 detik", sortOrder: 4, group: "C", level: 1 });
    expect(await asAdmin(() => updateStandardItem("khusus", null, fd({ text: "Diubah", sortOrder: "1" })))).toEqual({ error: "Butir standar tidak ditemukan." });
    expect(await asAdmin(() => updateStandardItem("i_c1_1", null, fd({ text: "ab", sortOrder: "1" })))).toMatchObject({ error: expect.any(String) });
    expect(await asAdmin(() => addStandardItem(null, fd({ group: "Z", level: "1", text: "Apa" })))).toEqual({ error: "Pilih kelompok." });
    expect(await asAdmin(() => addStandardItem(null, fd({ group: "C", level: "0", text: "Apa" })))).toMatchObject({ error: expect.any(String) });
    expect(await asAdmin(() => addStandardItem(null, fd({ group: "C", level: "1", text: "Menyelam" })))).toEqual({ success: true });
    expect(await prisma.milestoneItem.findFirstOrThrow({ where: { text: "Menyelam" } })).toMatchObject({ dependentId: null, sortOrder: 5, isActive: true });
  });

  it("M-A3: bukan admin (coach) ditolak", async () => {
    const { addStandardItem } = await import("@/app/admin/milestone/actions");
    const { coach } = await setup();
    await expect(asCoach(coach, () => addStandardItem(null, fd({ group: "C", level: "1", text: "Menyelinap" })))).rejects.toThrow();
    expect(await prisma.milestoneItem.count({ where: { text: "Menyelinap" } })).toBe(0);
  });
});
