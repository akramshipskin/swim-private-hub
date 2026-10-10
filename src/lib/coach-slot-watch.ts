// Penjaga jadwal coach (Hadi 3 Okt). Paket aktif dengan sesi belum terjadwal
// tetapi coach-nya tidak membuka jam yang bisa dibooking sebelum paket
// berakhir = "tanpa jadwal". Pemeriksa harian (06.00 WIB, /api/cron/harian):
//   hari ke-2 dst : coach diperingatkan setiap hari;
//   hari ke-10    : member & admin diberi tahu, member boleh ganti coach tanpa
//                   biaya (Package.freeCoachChangeAt), coach dapat catatan
//                   pelanggaran; 3 KEJADIAN dalam 6 bulan = admin diberi tahu untuk
//                   menilai penonaktifan (admin tetap yang memutuskan).
// Hitungan pelanggaran per kejadian coach, bukan per paket (Hadi 3 Okt malam,
// #1A): coach yang diam ke 3 member = 1 kejadian. Kolam dinonaktifkan admin /
// coach dilepas admin dari kolam paket = bukan salah coach (#2A): member tetap
// boleh ganti coach tanpa biaya, coach tidak dicatat melanggar.
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

// Satu kejadian = catatan pelanggaran (per paket) dengan awal kejadian coach
// yang sama atau berdekatan (<= 10 hari dari awal kejadian pertama kelompok
// itu). Awal kejadian dicatat di tingkat coach (lihat coachStart di bawah),
// jadi satu masa diam yang tidak terputus selalu satu kejadian.
// ponytail: pengelompokan berdasarkan jarak waktu, bukan penanda kejadian di
// database. Batasnya: dua kejadian terpisah yang mulai < 10 hari berselang
// (mis. di dua kolam berbeda) dihitung satu. Naikkan ke kolom kejadian per
// coach bila itu jadi masalah.
export function countEpisodes(starts: Date[]) {
  let n = 0;
  let anchor = -Infinity;
  for (const t of starts.map((d) => d.getTime()).sort((a, b) => a - b)) {
    if (t - anchor > FREE_CHANGE_AFTER_DAYS * DAY) {
      n++;
      anchor = t;
    }
  }
  return n;
}

export async function coachViolationEpisodes(now: Date, coachIds?: string[]) {
  const rows = await prisma.coachViolation.findMany({
    where: { createdAt: { gt: new Date(now.getTime() - VIOLATION_WINDOW_DAYS * DAY) }, ...(coachIds ? { coachId: { in: coachIds } } : {}) },
    select: { coachId: true, episodeStart: true },
  });
  const by = new Map<string, Date[]>();
  for (const r of rows) by.set(r.coachId, [...(by.get(r.coachId) ?? []), r.episodeStart]);
  return new Map([...by].map(([id, starts]) => [id, countEpisodes(starts)]));
}

type Pkg = { id: string; coachId: string | null; poolId: string; expiredDate: Date | null };

// Paket aktif yang masih punya sesi belum terjadwal (sisaSesi berkurang saat booking).
export function watchedPackageWhere(now: Date, coachId?: string) {
  return {
    status: "ACTIVE" as const,
    isTrial: false,
    sisaSesi: { gt: 0 },
    coachId: coachId ?? { not: null },
    OR: [{ expiredDate: null }, { expiredDate: { gt: now } }],
    // Member yang dinonaktifkan admin atau akunnya dihapus tidak diawasi
    // (Hadi 10 Okt, T8): coach tidak diperingatkan / dicatat melanggar untuk
    // member yang tidak bisa booking. Hitungan dimulai ulang bila diaktifkan lagi.
    member: { isActive: true, anonymizedAt: null },
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
      dependent: { select: { name: true } }, coach: { select: { name: true, isActive: true } }, pool: { select: { name: true, isActive: true } },
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

  // Kolam nonaktif atau coach sudah dilepas admin dari kolam paket: coach tidak
  // bisa membuka jam di sana, jadi bukan kelalaian coach.
  const links = new Set(
    (await prisma.poolAffiliation.findMany({
      where: { coachId: { in: [...new Set(pkgs.map((p) => p.coachId!))] } },
      select: { coachId: true, poolId: true },
    })).map((a) => `${a.coachId}:${a.poolId}`),
  );
  // Coach yang dinonaktifkan admin juga bukan kelalaian coach (Hadi 10 Okt, T10).
  const noFault = (p: (typeof pkgs)[number]) => !p.pool.isActive || !p.coach?.isActive || !links.has(`${p.coachId}:${p.poolId}`);

  const warnByCoach = new Map<string, number>();
  const adminByCoach = new Map<string, { name: string; lines: string[] }>();
  for (const p of pkgs.filter((x) => !fine.has(x.id))) {
    if (!p.noSlotSince) {
      // updateMany bersyarat: dua pemeriksa bersamaan tidak memulai dua kejadian.
      result.started += (await prisma.package.updateMany({ where: { id: p.id, coachId: p.coachId, noSlotSince: null }, data: { noSlotSince: now } })).count;
      continue;
    }
    const days = daysWithoutSlot(p.noSlotSince, now);
    const paid = p._count.payments > 0;
    if (noFault(p)) {
      if (days < FREE_CHANGE_AFTER_DAYS) continue;
      // Tanpa catatan pelanggaran: paket berbayar diberi hak ganti tanpa biaya
      // sekali (penandanya freeCoachChangeAt); paket pemberian admin cukup
      // admin diberi tahu tepat di hari ke-10.
      // ponytail: paket pemberian admin diberi tahu berdasarkan "hari ke-10 tepat";
      // pemeriksa yang jalan dua kali di hari itu mengirim dua kali.
      const first = paid
        ? (await prisma.package.updateMany({ where: { id: p.id, coachId: p.coachId, noSlotSince: p.noSlotSince, freeCoachChangeAt: null }, data: { freeCoachChangeAt: now } })).count > 0
        : days === FREE_CHANGE_AFTER_DAYS;
      if (!first) continue;
      const why = !p.pool.isActive
        ? `${p.pool.name} sedang tidak aktif`
        : !p.coach?.isActive
          ? `coach ${p.coach?.name ?? ""} sedang tidak aktif`
          : `coach ${p.coach?.name ?? ""} sudah tidak mengajar di ${p.pool.name}`;
      await notifyUser(
        p.memberId,
        "Jadwal belum bisa dibooking",
        paid
          ? `Paket ${p.dependent.name} belum bisa dibooking karena ${why}. Kamu bisa ganti coach tanpa biaya sekarang supaya sesimu tidak hangus.`
          : `Paket ${p.dependent.name} belum bisa dibooking karena ${why}. Admin SPH akan menghubungimu.`,
        "/member/paket",
      );
      await notifyAdmins(
        "Paket tidak bisa dibooking (bukan salah coach)",
        `${p.dependent.name}: ${why}, ${days} hari. Tidak dicatat sebagai pelanggaran coach.${paid ? " Member boleh ganti coach tanpa biaya." : " Paket pemberian admin: bantu ganti coach/kolam."}`,
        "/admin/coach-tanpa-jadwal",
      );
      continue;
    }
    if (days >= WARN_AFTER_DAYS) warnByCoach.set(p.coachId!, (warnByCoach.get(p.coachId!) ?? 0) + 1);
    if (days >= FREE_CHANGE_AFTER_DAYS) {
      // Satu catatan per paket per kejadian (unik paket + awal kejadian):
      // pemeriksa yang jalan dua kali tidak mencatat/mengirim dua kali.
      // Awal kejadian di tingkat coach = awal diam paling lama di antara paket
      // coach ini yang sedang diam (bukan karena kolam nonaktif). Paket yang
      // ikut "diam" belakangan (mis. member membatalkan sesinya saat coach
      // masih diam) tercatat pada kejadian yang sama, bukan kejadian baru.
      const coachStart = new Date(Math.min(
        ...pkgs.filter((x) => x.coachId === p.coachId && x.noSlotSince && !fine.has(x.id) && !noFault(x)).map((x) => x.noSlotSince!.getTime()),
      ));
      const opened = await prisma.$transaction(async (tx) => {
        // Data dibaca di awal pemeriksaan: pastikan paket belum pindah coach
        // / kejadiannya belum berganti sejak itu.
        const still = await tx.package.count({ where: { id: p.id, coachId: p.coachId, noSlotSince: p.noSlotSince } });
        if (still === 0) return { violation: false, granted: false };
        // Satu catatan per paket per kejadian coach (unik paket + awal kejadian).
        const v = await tx.coachViolation.createMany({ data: [{ coachId: p.coachId!, packageId: p.id, episodeStart: coachStart }], skipDuplicates: true });
        const g = paid ? await tx.package.updateMany({ where: { id: p.id, coachId: p.coachId, freeCoachChangeAt: null }, data: { freeCoachChangeAt: now } }) : { count: 0 };
        return { violation: v.count > 0, granted: g.count > 0 };
      });
      if (!opened.violation && !opened.granted) continue;
      await notifyUser(
        p.memberId,
        "Coach belum membuka jadwal",
        paid
          ? `Coach ${p.coach?.name ?? ""} belum membuka jadwal untuk ${p.dependent.name} selama ${days} hari. Kamu bisa ganti coach tanpa biaya sekarang supaya sesimu tidak hangus.`
          : `Coach ${p.coach?.name ?? ""} belum membuka jadwal untuk ${p.dependent.name} selama ${days} hari. Admin SPH akan menghubungimu untuk mengganti coach.`,
        "/member/paket",
      );
      if (!opened.violation) continue;
      result.violations++;
      const entry = adminByCoach.get(p.coachId!) ?? { name: p.coach?.name ?? "Coach", lines: [] };
      entry.lines.push(`${p.dependent.name} (${days} hari)`);
      adminByCoach.set(p.coachId!, entry);
    }
  }
  // Admin diberi tahu sekali per coach per pemeriksaan, dengan jumlah KEJADIAN.
  const episodes = await coachViolationEpisodes(now, [...adminByCoach.keys()]);
  for (const [coachId, e] of adminByCoach) {
    const recent = episodes.get(coachId) ?? 1;
    await notifyAdmins(
      recent >= VIOLATION_LIMIT ? `Coach ${recent}x tidak membuka jadwal` : "Coach tidak membuka jadwal 10 hari",
      `${e.name}: tanpa jadwal untuk ${e.lines.join(", ")}. Pelanggaran 6 bulan terakhir: ${recent} kejadian.${recent >= VIOLATION_LIMIT ? " Pertimbangkan menonaktifkan coach." : ""}`,
      "/admin/coach-tanpa-jadwal",
    );
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
