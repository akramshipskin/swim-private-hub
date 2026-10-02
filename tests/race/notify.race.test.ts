// Matriks notifikasi push (30 Sep): untuk tiap kejadian, SIAPA yang menerima dan
// apa isinya. Memakai push.ts yang ASLI + Postgres lokal; hanya pengiriman ke
// layanan push (web-push) yang ditangkap. Bukti utamanya: penerima yang benar
// (peran benar, akun aktif saja, tidak bocor ke orang lain) dan judul/isi/tautan.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.unmock("@/lib/push");
const sent: { endpoint: string; payload: { title: string; body: string; url?: string } }[] = [];
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async (sub: { endpoint: string }, payload: string) => {
      sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
    },
  },
}));
// Di luar request Next, after() melempar -> push.ts menjalankan pengiriman langsung.
vi.mock("next/server", () => ({
  after: () => {
    throw new Error("outside request scope");
  },
}));
vi.mock("@/lib/policy", async (orig) => ({ ...(await orig<typeof import("@/lib/policy")>()), MILESTONE_HOLD_START: new Date(0) }));

import { prisma } from "@/lib/prisma";
import { as, reset, ALL_DAY, mkPool, mkUser, mkMemberWithPackage, mkSlot, book, fd } from "./fx";
import { POST as registerCoach } from "@/app/api/register-coach/route";
import { POST as registerPool } from "@/app/api/register-pool/route";
import { POST as bookPOST } from "@/app/api/booking/route";
import { reviewCertificate } from "@/app/admin/users/certificate-actions";
import { saveMilestoneUpdate, addMilestoneItem, reviewMilestoneProposal } from "@/app/milestone/actions";
import { requestWithdrawal as coachWithdraw } from "@/app/coach/saldo/actions";
import { requestWithdrawal as poolWithdraw } from "@/app/pool/saldo/actions";
import { rejectWithdrawal } from "@/app/admin/withdrawals/actions";
import { adjustWallet } from "@/app/admin/koreksi-saldo/actions";
import { cancelBookingAsCoach, addAvailability } from "@/app/coach/jadwal/actions";
import { requestDeletionAction } from "@/app/profil/account-deletion-actions";
import { replyToThread } from "@/app/admin/pesan/actions";

process.env.VAPID_SUBJECT = "mailto:qa@example.com";
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
process.env.VAPID_PRIVATE_KEY = "priv";

type U = { id: string; name: string };
const ago = Date.now() - 10_000;
const endpointOf = (u: U) => `https://fcm.googleapis.com/fcm/send/${u.id}`;
async function subscribe(...us: U[]) {
  for (const u of us) await prisma.pushSubscription.create({ data: { userId: u.id, endpoint: endpointOf(u), p256dh: "p", auth: "a" } });
}
// { userId: [judul, ...] } dari semua kiriman sejak reset.
async function inbox() {
  const subs = await prisma.pushSubscription.findMany();
  const byEndpoint = new Map(subs.map((s) => [s.endpoint, s.userId]));
  const out: Record<string, string[]> = {};
  for (const s of sent) (out[byEndpoint.get(s.endpoint) ?? "?"] ??= []).push(s.payload.title);
  return out;
}
const last = () => sent[sent.length - 1]?.payload;

let admin1: U, admin2: U, adminOff: U, coach: U & { coachProfile: { id: string } | null }, member: U, owner: U;

beforeEach(async () => {
  await reset();
  sent.length = 0;
  admin1 = await mkUser("ADMIN");
  admin2 = await mkUser("ADMIN");
  adminOff = await mkUser("ADMIN");
  await prisma.user.update({ where: { id: adminOff.id }, data: { isActive: false } });
  coach = await mkUser("COACH", { coachBalance: 100000, bank: true });
  member = await mkUser("MEMBER");
  owner = await mkUser("POOL_OWNER");
  await subscribe(admin1, admin2, adminOff, coach, member, owner);
});

describe("NOTIFIKASI ke admin (butuh tindakan admin)", () => {
  it("N1: coach mendaftar -> semua admin AKTIF dapat; admin nonaktif, coach, member, pemilik kolam tidak", async () => {
    const res = await registerCoach(new Request("http://x", { method: "POST", headers: { "x-forwarded-for": "9.9.9.1" }, body: JSON.stringify({ name: "coach baru", phone: "081200011122", password: "12345678", acceptedTerms: true, specialties: ["Gaya bebas"], birthDate: "1995-06-15", formRenderedAt: ago }) }));
    expect(res.status).toBe(201);
    expect(await inbox()).toEqual({ [admin1.id]: ["Pendaftaran coach baru"], [admin2.id]: ["Pendaftaran coach baru"] });
    expect(last()).toMatchObject({ body: "Coach Baru menunggu persetujuan", url: "/admin/users" });
  });

  it("N2: pemilik kolam mendaftar -> admin aktif dapat, menyebut nama kolam", async () => {
    const res = await registerPool(new Request("http://x", { method: "POST", headers: { "x-forwarded-for": "9.9.9.2" }, body: JSON.stringify({ name: "a", ownerName: "budi pemilik", phone: "081200011133", password: "12345678", acceptedTerms: true, poolName: "kolam bahari", address: "Jl. Uji 1", openTime: "06:00", closeTime: "20:00", formRenderedAt: ago }) }));
    expect(res.status).toBe(201);
    expect(await inbox()).toEqual({ [admin1.id]: ["Pendaftaran kolam baru"], [admin2.id]: ["Pendaftaran kolam baru"] });
    expect(last()?.body).toBe("Kolam Bahari (Budi Pemilik) menunggu persetujuan");
  });

  it("N4: coach mengajukan pencairan -> admin aktif dapat; pemilik kolam mengajukan -> juga", async () => {
    await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: coach.coachProfile!.id, amount: 100000 } });
    expect(await as({ id: coach.id, role: "COACH", name: "Coach Uji" }, () => coachWithdraw(null, fd({ amount: "100000" })))).toEqual({ ok: true });
    expect(await inbox()).toEqual({ [admin1.id]: ["Pengajuan pencairan baru"], [admin2.id]: ["Pengajuan pencairan baru"] });
    expect(last()?.url).toBe("/admin/withdrawals");

    sent.length = 0;
    const pool = await mkPool({ balance: 200000, bank: true });
    await prisma.walletTransaction.create({ data: { type: "SESSION_REVENUE", poolId: pool.id, amount: 200000 } });
    await prisma.poolOwnership.create({ data: { poolId: pool.id, ownerId: owner.id } });
    await as({ id: owner.id, role: "POOL_OWNER" }, () => poolWithdraw(pool.id, null, fd({ amount: "200000" })));
    expect(await inbox()).toEqual({ [admin1.id]: ["Pengajuan pencairan baru"], [admin2.id]: ["Pengajuan pencairan baru"] });
  });

  it("N5: member minta hapus akun -> admin aktif dapat", async () => {
    await as({ id: member.id, role: "MEMBER", name: "Member Uji" }, () => requestDeletionAction());
    expect(await inbox()).toEqual({ [admin1.id]: ["Permintaan hapus akun"], [admin2.id]: ["Permintaan hapus akun"] });
    expect(last()?.url).toBe(`/admin/users/${member.id}`);
  });

  it("N6: coach mengusulkan butir milestone -> admin dapat; catatan biasa (bukan usulan) -> tidak ada", async () => {
    const pool = await mkPool();
    const { m, dep, pkg } = await mkMemberWithPackage(pool.id, coach.id);
    await prisma.dependent.update({ where: { id: dep.id }, data: { birthDate: new Date(Date.UTC(new Date().getUTCFullYear() - 9, 0, 1)) } });
    await prisma.milestoneItem.create({ data: { id: "i_c1_1", group: "C", level: 1, sortOrder: 1, text: "Mengapung" } });
    const b = await book(m.id, (await mkSlot(coach.id, pool.id, -48)).id, pkg.id);
    await prisma.booking.update({ where: { id: b.id }, data: { attended: true } });
    const asCoach = <T,>(fn: () => Promise<T>) => as({ id: coach.id, role: "COACH", name: "Coach Uji" }, fn);
    await asCoach(() => saveMilestoneUpdate(dep.id, null, fd({ note: "awal" })));
    expect(sent).toEqual([]);
    await asCoach(() => addMilestoneItem(dep.id, null, fd({ text: "Butir khusus", level: "1" })));
    expect(sent).toEqual([]);
    await asCoach(() => addMilestoneItem(dep.id, null, fd({ text: "Butir usulan", level: "1", propose: "on" })));
    expect(await inbox()).toEqual({ [admin1.id]: ["Usulan butir milestone"], [admin2.id]: ["Usulan butir milestone"] });

    // Admin memutuskan -> yang mengusulkan (coach) dikabari SEKALI, klik ganda tidak.
    sent.length = 0;
    const item = await prisma.milestoneItem.findFirstOrThrow({ where: { text: "Butir usulan" } });
    await as({ id: admin1.id, role: "ADMIN" }, () => reviewMilestoneProposal(item.id, true));
    await as({ id: admin1.id, role: "ADMIN" }, () => reviewMilestoneProposal(item.id, true));
    expect(await inbox()).toEqual({ [coach.id]: ["Usulan milestone disetujui"] });
  });

  it("N7: sertifikat coach disetujui/ditolak -> hanya coach pemiliknya, sekali per keputusan", async () => {
    const cert1 = await prisma.coachCertificate.create({ data: { coachProfileId: coach.coachProfile!.id, name: "Sertifikat A", filePath: "x/a.pdf" } });
    const cert2 = await prisma.coachCertificate.create({ data: { coachProfileId: coach.coachProfile!.id, name: "Sertifikat B", filePath: "x/b.pdf" } });
    await as({ id: admin1.id, role: "ADMIN" }, () => reviewCertificate(cert1.id, true));
    await as({ id: admin1.id, role: "ADMIN" }, () => reviewCertificate(cert1.id, false)); // sudah diputuskan: diam
    expect(await inbox()).toEqual({ [coach.id]: ["Sertifikat disetujui"] });
    sent.length = 0;
    await as({ id: admin2.id, role: "ADMIN" }, () => reviewCertificate(cert2.id, false));
    expect(await inbox()).toEqual({ [coach.id]: ["Sertifikat ditolak"] });
    expect(last()?.body).toContain("Sertifikat B");
  });
});

describe("NOTIFIKASI ke coach / pemilik kolam / member", () => {
  it("N8: admin menolak pencairan -> hanya coach yang mengajukan; admin koreksi saldo -> coach itu saja", async () => {
    await prisma.walletTransaction.create({ data: { type: "SESSION_PAYOUT", coachProfileId: coach.coachProfile!.id, amount: 100000 } });
    await as({ id: coach.id, role: "COACH", name: "Coach Uji" }, () => coachWithdraw(null, fd({ amount: "100000" })));
    sent.length = 0;
    const w = await prisma.withdrawalRequest.findFirstOrThrow();
    await as({ id: admin1.id, role: "ADMIN" }, () => rejectWithdrawal(null, fd({ withdrawalId: w.id })));
    expect(await inbox()).toEqual({ [coach.id]: ["Pencairan tidak diproses"] });
    expect(last()?.url).toBe("/coach/saldo");

    sent.length = 0;
    await as({ id: admin1.id, role: "ADMIN" }, () => adjustWallet(null, fd({ targetType: "coach", targetId: coach.coachProfile!.id, direction: "credit", source: "none", amount: "25000", reason: "koreksi uji", idempotencyKey: "k-1" })));
    expect(await inbox()).toEqual({ [coach.id]: ["Saldo kamu ditambah admin"] });
  });

  it("N9: member booking -> member DAN coach dapat; coach membatalkan -> member dikabari; orang lain tidak", async () => {
    const pool = await mkPool();
    const { m, pkg } = await mkMemberWithPackage(pool.id, coach.id);
    await subscribe(m as U);
    const slot = await mkSlot(coach.id, pool.id, 48);
    const res = await as({ id: m.id, role: "MEMBER", name: "Member Uji" }, () => bookPOST(new Request("http://x", { method: "POST", body: JSON.stringify({ availabilityId: slot.id, packageId: pkg.id }) })));
    expect(res.status).toBeLessThan(300);
    // Booking mengirim tanpa menunggu (fire-and-forget), jadi tunggu sampai tiba.
    await vi.waitFor(async () => expect(Object.keys(await inbox()).sort()).toEqual([coach.id, m.id].sort()));
    const got = await inbox();
    expect(got[member.id]).toBeUndefined();
    expect(got[admin1.id]).toBeUndefined();

    sent.length = 0;
    const b = await prisma.booking.findFirstOrThrow({ where: { availabilityId: slot.id } });
    await as({ id: coach.id, role: "COACH", name: "Coach Uji" }, () => cancelBookingAsCoach(null, fd({ bookingId: b.id })));
    await vi.waitFor(async () => expect((await inbox())[m.id]).toEqual(["Booking dibatalkan coach"]));
    const after = await inbox();
    expect(after[admin1.id]).toBeUndefined();
    expect(after[member.id]).toBeUndefined();
  });

  it("N10: coach membuka slot -> hanya member yang punya paket aktif DI KOLAM ITU", async () => {
    const pool = await mkPool({ hours: ALL_DAY });
    const otherPool = await mkPool({ hours: ALL_DAY });
    const { m } = await mkMemberWithPackage(pool.id, coach.id);
    const { m: elsewhere } = await mkMemberWithPackage(otherPool.id, coach.id);
    await subscribe(m as U, elsewhere as U);
    await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: coach.id } });
    const day = new Date(Date.now() + 3 * 86400e3).toISOString().slice(0, 10);
    const res = await as({ id: coach.id, role: "COACH", name: "Coach Uji" }, () => addAvailability(null, fd({ date: day, startTime: "08:00", endTime: "09:00", poolId: pool.id })));
    expect(res).toBeNull();
    expect(await inbox()).toEqual({ [m.id]: ["Slot jadwal baru"] });
  });

  it("N11: admin membalas chat -> hanya pemilik percakapan; isi panjang dipotong", async () => {
    const thread = await prisma.chatThread.create({ data: { userId: member.id, needsAdmin: true } });
    await as({ id: admin1.id, role: "ADMIN" }, () => replyToThread(null, fd({ threadId: thread.id, content: "y".repeat(150) })));
    expect(await inbox()).toEqual({ [member.id]: ["Balasan dari admin"] });
    expect(last()?.body).toBe(`${"y".repeat(97)}...`);
    expect((await prisma.chatThread.findUniqueOrThrow({ where: { id: thread.id } })).needsAdmin).toBe(true);
  });
});
