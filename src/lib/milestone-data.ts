// Akses & pembacaan data milestone satu peserta. Dipakai halaman
// /milestone/[dependentId], sertifikat level, dan server action milestone.
import { prisma } from "@/lib/prisma";

type Viewer = { id: string; role: string };

// Siapa boleh apa (Hadi 29 Sep): member = pesertanya sendiri, coach = peserta
// yang pernah/sedang dia ajar (ada booking yang tidak dibatalkan), admin =
// semua. Kolam tidak. Hanya coach yang menulis catatan.
export async function milestoneAccess(viewer: Viewer, dependentId: string) {
  if (viewer.role === "ADMIN") {
    const exists = await prisma.dependent.count({ where: { id: dependentId } });
    return { canView: exists > 0, canEdit: false };
  }
  if (viewer.role === "MEMBER") {
    const own = await prisma.dependent.count({ where: { id: dependentId, memberId: viewer.id } });
    return { canView: own > 0, canEdit: false };
  }
  if (viewer.role === "COACH") {
    const taught = await coachTeachesDependent(viewer.id, dependentId);
    return { canView: taught, canEdit: taught && (await coachHasTaughtDependent(viewer.id, dependentId)) };
  }
  return { canView: false, canEdit: false };
}

export async function coachTeachesDependent(coachUserId: string, dependentId: string) {
  const n = await prisma.booking.count({
    where: { status: "BOOKED", availability: { coachId: coachUserId }, package: { dependentId } },
  });
  return n > 0;
}

// Menulis milestone (catatan, keterampilan, sertifikat) baru boleh setelah minimal 1
// sesi peserta ini dengan coach tersebut ditandai Hadir (Hadi 3 Okt malam, #8A).
export async function coachHasTaughtDependent(coachUserId: string, dependentId: string) {
  const n = await prisma.booking.count({
    where: { status: "BOOKED", attended: true, availability: { coachId: coachUserId }, package: { dependentId } },
  });
  return n > 0;
}

// Keterampilan yang berlaku untuk peserta ini: standar aktif + keterampilan tambahan coach
// khusus peserta ini.
export function visibleItemsWhere(dependentId: string) {
  return { isActive: true, OR: [{ dependentId: null }, { dependentId }] };
}

export async function loadMilestoneBoard(dependentId: string) {
  const [dependent, items, achievements, completions, notes] = await Promise.all([
    prisma.dependent.findUnique({
      where: { id: dependentId },
      select: { id: true, name: true, birthDate: true, milestoneGroup: true, member: { select: { name: true } } },
    }),
    prisma.milestoneItem.findMany({
      where: visibleItemsWhere(dependentId),
      orderBy: [{ group: "asc" }, { level: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, group: true, level: true, sortOrder: true, text: true, dependentId: true, proposalStatus: true },
    }),
    prisma.milestoneAchievement.findMany({
      where: { dependentId },
      select: { itemId: true, priorSkill: true, achievedAt: true, coach: { select: { name: true } } },
    }),
    prisma.milestoneLevelCompletion.findMany({
      where: { dependentId },
      orderBy: { completedAt: "asc" },
      select: { id: true, group: true, level: true, withCertificate: true, completedAt: true, coach: { select: { name: true } } },
    }),
    prisma.milestoneNote.findMany({
      where: { dependentId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, note: true, createdAt: true, coach: { select: { name: true } }, focusItem: { select: { text: true } } },
    }),
  ]);
  return dependent ? { dependent, items, achievements, completions, notes } : null;
}
