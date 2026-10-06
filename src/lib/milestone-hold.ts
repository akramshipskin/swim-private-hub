// Penahanan penarikan coach karena catatan milestone telat. Aturan: lihat
// MILESTONE_NOTE_EVERY_SESSIONS di src/lib/policy.ts.
import { prisma } from "@/lib/prisma";
import { MILESTONE_HOLD_START, MILESTONE_NOTE_EVERY_SESSIONS } from "@/lib/policy";

export type OverdueParticipant = { dependentId: string; name: string; sessionsWithoutNote: number };

// Sesi Hadir coach ini per peserta yang dimulai SETELAH catatan terakhir coach
// ini untuk peserta itu. Peserta yang jumlahnya >= batas = menahan penarikan.
export function overdueFromSessions(
  sessions: { dependentId: string; startTime: Date }[],
  lastNoteAt: Map<string, Date>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const last = lastNoteAt.get(s.dependentId);
    if (last && s.startTime.getTime() <= last.getTime()) continue;
    counts.set(s.dependentId, (counts.get(s.dependentId) ?? 0) + 1);
  }
  for (const [id, n] of counts) if (n < MILESTONE_NOTE_EVERY_SESSIONS) counts.delete(id);
  return counts;
}

export async function getOverdueParticipants(coachUserId: string): Promise<OverdueParticipant[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      attended: true,
      availability: { coachId: coachUserId, startTime: { gte: MILESTONE_HOLD_START } },
    },
    select: {
      availability: { select: { startTime: true } },
      package: { select: { dependent: { select: { id: true, name: true } } } },
    },
  });
  if (bookings.length === 0) return [];
  const names = new Map(bookings.map((b) => [b.package.dependent.id, b.package.dependent.name]));
  const notes = await prisma.milestoneNote.groupBy({
    by: ["dependentId"],
    where: { coachId: coachUserId, dependentId: { in: [...names.keys()] } },
    _max: { createdAt: true },
  });
  const lastNoteAt = new Map(notes.map((n) => [n.dependentId, n._max.createdAt!]));
  const overdue = overdueFromSessions(
    bookings.map((b) => ({ dependentId: b.package.dependent.id, startTime: b.availability.startTime })),
    lastNoteAt,
  );
  return [...overdue.entries()]
    .map(([dependentId, n]) => ({ dependentId, name: names.get(dependentId)!, sessionsWithoutNote: n }))
    .sort((a, b) => b.sessionsWithoutNote - a.sessionsWithoutNote);
}
