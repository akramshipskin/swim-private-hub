// Penjaga jadwal coach (Hadi 3 Okt). Paket aktif dengan sesi belum terjadwal
// tetapi coach-nya tidak membuka jam yang bisa dibooking sebelum paket
// berakhir = "tanpa jadwal". Pemeriksa harian (06.00 WIB, /api/cron/harian):
//   hari ke-2 dst : coach diperingatkan setiap hari;
//   hari ke-10    : member & admin diberi tahu, member boleh ganti coach tanpa
//                   biaya (Package.freeCoachChangeAt), coach dapat 1 catatan
//                   pelanggaran; 3 dalam 6 bulan = admin diberi tahu untuk menilai
//                   penonaktifan (admin tetap yang memutuskan).
// Paket TIDAK diperpanjang (Hadi 3 Okt). Hak ganti coach tanpa biaya tetap
// berlaku walau coach membuka jadwal lagi, sampai paket berakhir/dipakai.
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import { withinPoolHours } from "@/lib/pool-hours";

export const WARN_AFTER_DAYS = 2;
export const FREE_CHANGE_AFTER_DAYS = 10;
export const VIOLATION_LIMIT = 3;
export const VIOLATION_WINDOW_DAYS = 183;
const DAY = 86_400_000;

type Pkg = { id: string; coachId: string | null; poolId: string; expiredDate: Date | null };

// Paket aktif yang masih punya sesi belum terjadwal (sisaSesi berkurang saat booking).
export function watchedPackageWhere(now: Date, coachId?: string) {
  return {
    status: "ACTIVE" as const,
    isTrial: false,
    sisaSesi: { gt: 0 },
    coachId: coachId ?? { not: null },
    OR: [{ expiredDate: null }, { expiredDate: { gt: now } }],
  };
}

// Paket yang coach-nya punya minimal satu jam kosong yang benar-benar bisa
// dibooking di kolam paket sebelum paket berakhir: coach & kolam aktif, di
// dalam jam buka (sama dengan aturan booking).
export async function packagesWithBookableSlot(pkgs: Pkg[], now: Date) {
  if (pkgs.length === 0) return new Set<string>();
  const slots = await prisma.availability.findMany({
    where: {
      status: "AVAILABLE",
      startTime: { gt: now },
      coachId: { in: [...new Set(pkgs.map((p) => p.coachId!))] },
      poolId: { in: [...new Set(pkgs.map((p) => p.poolId))] },
      coach: { isActive: true },
      pool: { isActive: true },
    },
    select: { coachId: true, poolId: true, startTime: true, endTime: true, pool: { select: { openTime: true, closeTime: true } } },
  });
  const bookable = slots.filter((s) => withinPoolHours(s.pool, s.startTime, s.endTime));
  const ok = new Set<string>();
  for (const p of pkgs) {
    if (bookable.some((s) => s.coachId === p.coachId && s.poolId === p.poolId && (!p.expiredDate || s.startTime < p.expiredDate))) ok.add(p.id);
  }
  return ok;
}

// Hari ke-berapa dihitung dari TANGGAL kalender WIB (bukan selisih 24 jam):
// cron yang jalan beberapa menit lebih awal/lambat tidak menggeser hari.
const wibDay = (d: Date) => Math.floor((d.getTime() + 7 * 3_600_000) / DAY);
export const daysWithoutSlot = (since: Date, now: Date) => wibDay(now) - wibDay(since);

export async function runCoachSlotWatch(now = new Date()) {
  const pkgs = await prisma.package.findMany({
    where: watchedPackageWhere(now),
    select: {
      id: true, coachId: true, poolId: true, expiredDate: true, noSlotSince: true, memberId: true,
      dependent: { select: { name: true } }, coach: { select: { name: true } },
      // Paket pemberian admin (tanpa pembayaran) tidak dapat hak ganti tanpa biaya.
      _count: { select: { payments: { where: { status: "SUCCESS" } } } },
    },
  });
  const fine = await packagesWithBookableSlot(pkgs, now);
  const result = { watched: pkgs.length, started: 0, cleared: 0, warned: 0, violations: 0 };

  // Coach membuka jadwal lagi: kejadian selesai.
  for (const p of pkgs.filter((x) => fine.has(x.id) && x.noSlotSince)) {
    result.cleared += (await prisma.package.updateMany({ where: { id: p.id, coachId: p.coachId, noSlotSince: p.noSlotSince }, data: { noSlotSince: null } })).count;
  }
  // Paket yang lepas dari pengawasan (habis/berakhir/semua terjadwal) juga dibersihkan.
  await prisma.package.updateMany({ where: { noSlotSince: { not: null }, NOT: watchedPackageWhere(now) }, data: { noSlotSince: null } });

  const warnByCoach = new Map<string, number>();
  for (const p of pkgs.filter((x) => !fine.has(x.id))) {
    if (!p.noSlotSince) {
      // updateMany bersyarat: dua pemeriksa bersamaan tidak memulai dua kejadian.
      result.started += (await prisma.package.updateMany({ where: { id: p.id, coachId: p.coachId, noSlotSince: null }, data: { noSlotSince: now } })).count;
      continue;
    }
    const days = daysWithoutSlot(p.noSlotSince, now);
    if (days >= WARN_AFTER_DAYS) warnByCoach.set(p.coachId!, (warnByCoach.get(p.coachId!) ?? 0) + 1);
    if (days >= FREE_CHANGE_AFTER_DAYS) {
      // Satu pelanggaran per paket per kejadian (unik paket + awal kejadian):
      // pemeriksa yang jalan dua kali tidak mencatat/mengirim dua kali.
      const paid = p._count.payments > 0;
      const opened = await prisma.$transaction(async (tx) => {
        // Data dibaca di awal pemeriksaan: pastikan paket belum pindah coach
        // / kejadiannya belum berganti sejak itu.
        const still = await tx.package.count({ where: { id: p.id, coachId: p.coachId, noSlotSince: p.noSlotSince } });
        if (still === 0) return false;
        const v = await tx.coachViolation.createMany({ data: [{ coachId: p.coachId!, packageId: p.id, episodeStart: p.noSlotSince! }], skipDuplicates: true });
        if (v.count === 0) return false;
        if (paid) await tx.package.updateMany({ where: { id: p.id, coachId: p.coachId, freeCoachChangeAt: null }, data: { freeCoachChangeAt: now } });
        return true;
      });
      if (!opened) continue;
      result.violations++;
      await notifyUser(
        p.memberId,
        "Coach belum membuka jadwal",
        paid
          ? `Coach ${p.coach?.name ?? ""} belum membuka jadwal untuk ${p.dependent.name} selama ${days} hari. Kamu bisa ganti coach tanpa biaya sekarang supaya sesimu tidak hangus.`
          : `Coach ${p.coach?.name ?? ""} belum membuka jadwal untuk ${p.dependent.name} selama ${days} hari. Admin SPH akan menghubungimu untuk mengganti coach.`,
        "/member/paket",
      );
      const recent = await prisma.coachViolation.count({ where: { coachId: p.coachId!, createdAt: { gt: new Date(now.getTime() - VIOLATION_WINDOW_DAYS * DAY) } } });
      await notifyAdmins(
        recent >= VIOLATION_LIMIT ? `Coach ${recent}x tidak membuka jadwal` : "Coach tidak membuka jadwal 10 hari",
        `${p.coach?.name ?? "Coach"}: ${p.dependent.name} tanpa jadwal ${days} hari. Pelanggaran 6 bulan terakhir: ${recent}.${recent >= VIOLATION_LIMIT ? " Nilai untuk penonaktifan." : ""}`,
        "/admin/coach-tanpa-jadwal",
      );
    }
  }
  for (const [coachId, n] of warnByCoach) {
    result.warned++;
    await notifyUser(
      coachId,
      "Buka jadwal untuk member kamu",
      `${n} member berpaket aktif belum bisa booking karena kamu belum membuka jam kosong. Buka jadwal sekarang; 10 hari tanpa jadwal = member boleh pindah coach dan tercatat pelanggaran.`,
      "/coach/dashboard",
    );
  }
  return result;
}
