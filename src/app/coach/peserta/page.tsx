import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOverdueParticipants } from "@/lib/milestone-hold";
import { formatMilestoneDate } from "@/lib/milestone";
import { MILESTONE_NOTE_EVERY_SESSIONS } from "@/lib/policy";

export const metadata = { title: "Peserta | Swim Private Hub" };

// Semua peserta yang pernah/sedang diajar coach ini, dengan status catatan
// milestone. Peserta yang menahan pencairan ditaruh paling atas.
export default async function CoachPesertaPage() {
  const session = await requireRole("COACH");
  const bookings = await prisma.booking.findMany({
    where: { status: "BOOKED", availability: { coachId: session.user.id } },
    select: {
      availability: { select: { startTime: true } },
      package: { select: { dependent: { select: { id: true, name: true, member: { select: { name: true } } } } } },
    },
    orderBy: { availability: { startTime: "desc" } },
  });

  const byDependent = new Map<string, { id: string; name: string; memberName: string; lastSession: Date }>();
  for (const b of bookings) {
    const d = b.package.dependent;
    if (!byDependent.has(d.id)) byDependent.set(d.id, { id: d.id, name: d.name, memberName: d.member.name, lastSession: b.availability.startTime });
  }
  const ids = [...byDependent.keys()];
  const [overdue, lastNotes] = await Promise.all([
    getOverdueParticipants(session.user.id),
    ids.length
      ? prisma.milestoneNote.groupBy({
          by: ["dependentId"],
          where: { coachId: session.user.id, dependentId: { in: ids } },
          _max: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);
  const overdueMap = new Map(overdue.map((o) => [o.dependentId, o.sessionsWithoutNote]));
  const lastNoteMap = new Map(lastNotes.map((n) => [n.dependentId, n._max.createdAt]));
  const rows = [...byDependent.values()].sort(
    (a, b) => (overdueMap.get(b.id) ?? 0) - (overdueMap.get(a.id) ?? 0) || b.lastSession.getTime() - a.lastSession.getTime(),
  );

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Peserta</h1>
      <p className="mt-1 text-sm text-text-muted">
        Isi Update milestone tiap peserta minimal sekali per {MILESTONE_NOTE_EVERY_SESSIONS} sesi Hadir. Bila ada peserta
        yang melewati batas itu, pengajuan pencairan saldo ditahan sampai catatannya diisi.
      </p>

      {overdue.length > 0 && (
        <p className="mt-4 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
          Pencairan ditahan: {overdue.length} peserta belum diberi catatan.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">Belum ada peserta yang booking sesimu.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((r) => {
            const late = overdueMap.get(r.id);
            const lastNote = lastNoteMap.get(r.id);
            return (
              <Card key={r.id}>
                <CardBody className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-text">{r.name}</p>
                    {late ? <Badge tone="warning">{late} sesi tanpa catatan</Badge> : null}
                  </div>
                  <p className="text-xs text-text-subtle">
                    Akun {r.memberName} · Sesi terakhir {formatMilestoneDate(r.lastSession)} · Catatan terakhirmu{" "}
                    {lastNote ? formatMilestoneDate(lastNote) : "belum ada"}
                  </p>
                  <Link href={`/milestone/${r.id}`} className="text-sm font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                    Update milestone →
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
