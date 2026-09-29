import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { reviewMilestoneProposal } from "@/app/milestone/actions";
import { formatMilestoneDate, levelLabel, type MilestoneGroup } from "@/lib/milestone";

export const metadata = { title: "Milestone | Swim Private Hub" };

export default async function AdminMilestonePage() {
  await requireRole("ADMIN");
  const [proposals, recentNotes] = await Promise.all([
    prisma.milestoneItem.findMany({
      where: { proposalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        group: true,
        level: true,
        text: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        dependent: { select: { id: true, name: true } },
      },
    }),
    prisma.milestoneNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        note: true,
        createdAt: true,
        coach: { select: { name: true } },
        dependent: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Milestone</h1>
      <p className="mt-1 text-sm text-text-muted">
        Usulan butir dari coach dan catatan perkembangan terbaru. Detail tiap peserta bisa dibuka dari sini atau dari halaman user member.
      </p>
      <Link href="/admin/milestone/butir" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
        Kelola butir standar →
      </Link>

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-1 text-lg font-semibold text-text">Usulan butir standar ({proposals.length})</h2>
          <p className="mb-3 text-sm text-text-muted">
            Disetujui = berlaku untuk semua peserta di kelompok & level itu (termasuk yang sedang berjalan). Ditolak = tetap
            jadi butir khusus peserta asalnya.
          </p>
          {proposals.length === 0 ? (
            <p className="text-sm text-text-muted">Tidak ada usulan.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {proposals.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{p.text}</p>
                    <p className="text-xs text-text-subtle">
                      {levelLabel(p.group as MilestoneGroup, p.level)} · dari {p.createdBy?.name ?? "coach"} ·{" "}
                      {formatMilestoneDate(p.createdAt)}
                      {p.dependent && (
                        <>
                          {" "}
                          · untuk{" "}
                          <Link href={`/milestone/${p.dependent.id}`} className="underline">
                            {p.dependent.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ConfirmSubmit
                      action={reviewMilestoneProposal.bind(null, p.id, true)}
                      label="Setujui"
                      title="Jadikan butir standar?"
                      description={`"${p.text}" akan muncul di ${levelLabel(p.group as MilestoneGroup, p.level)} untuk semua peserta.`}
                      confirmLabel="Ya, setujui"
                    />
                    <ConfirmSubmit
                      action={reviewMilestoneProposal.bind(null, p.id, false)}
                      label="Tolak"
                      variant="danger"
                      title="Tolak usulan?"
                      description="Butir tetap berlaku hanya untuk peserta asalnya."
                      confirmLabel="Ya, tolak"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <h2 className="mb-3 text-lg font-semibold text-text">Catatan terbaru</h2>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-text-muted">Belum ada catatan.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentNotes.map((n) => (
                <li key={n.id} className="py-3 first:pt-0">
                  <p className="text-xs text-text-subtle">
                    {formatMilestoneDate(n.createdAt)} · {n.coach.name} ·{" "}
                    <Link href={`/milestone/${n.dependent.id}`} className="font-medium text-brand-700 underline">
                      {n.dependent.name}
                    </Link>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-text">{n.note}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
