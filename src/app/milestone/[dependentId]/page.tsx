import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import { ageFromBirthDate } from "@/lib/coach-bio";
import { loadMilestoneBoard, milestoneAccess } from "@/lib/milestone-data";
import { getOverdueParticipants } from "@/lib/milestone-hold";
import {
  MILESTONE_GROUPS,
  MILESTONE_GROUP_LABEL,
  currentLevel,
  formatMilestoneDate,
  groupForBirthDate,
  levelLabel,
  levelsOf,
  type MilestoneGroup,
} from "@/lib/milestone";
import { MilestoneUpdateForm, AddItemForm, type ItemSet } from "./update-form";

export const metadata: Metadata = {
  title: "Perkembangan Peserta | Swim Private Hub",
  robots: { index: false, follow: false },
};

const BACK: Record<string, { href: string; label: string }> = {
  COACH: { href: "/coach/peserta", label: "← Peserta" },
  MEMBER: { href: "/member/peserta", label: "← Peserta" },
  ADMIN: { href: "/admin/milestone", label: "← Milestone" },
};

export default async function MilestonePage({ params }: { params: Promise<{ dependentId: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  if (session.user.needsPartnerAgreement) redirect("/perjanjian");
  const { dependentId } = await params;

  const access = await milestoneAccess(session.user, dependentId);
  if (!access.canView) notFound();
  const board = await loadMilestoneBoard(dependentId);
  if (!board) notFound();
  const { dependent, items, achievements, completions, notes } = board;

  const ageGroup = groupForBirthDate(dependent.birthDate);
  const group: MilestoneGroup | null = (dependent.milestoneGroup as MilestoneGroup | null) ?? ageGroup;
  const got = new Map(achievements.map((a) => [a.itemId, a]));
  const levels = group ? levelsOf(items, group) : [];
  const current = group ? currentLevel(items, completions, group) : null;
  const doneLevel = new Map(completions.filter((c) => c.group === group).map((c) => [c.level, c]));
  const earlierCompletions = completions.filter((c) => c.group !== group);

  const overdue =
    access.canEdit && session.user.role === "COACH"
      ? (await getOverdueParticipants(session.user.id)).find((o) => o.dependentId === dependentId)
      : undefined;

  // Butir yang belum tercapai di satu kelompok: level berjalan + level lain
  // yang belum selesai.
  const itemSet = (g: MilestoneGroup): ItemSet => {
    const lv = levelsOf(items, g);
    const cur = currentLevel(items, completions, g);
    const done = new Set(completions.filter((c) => c.group === g).map((c) => c.level));
    const open = (lvl: number) =>
      lv.find((l) => l.level === lvl)?.items.filter((it) => !got.has(it.id)).map((it) => ({ id: it.id, text: it.text, level: it.level })) ?? [];
    const currentItems = cur !== null ? open(cur) : [];
    return {
      currentLevelLabel: cur !== null ? levelLabel(g, cur) : null,
      currentItems,
      otherItems: lv
        .filter((l) => l.level !== cur && !done.has(l.level))
        .map((l) => ({ label: levelLabel(g, l.level), items: open(l.level) }))
        .filter((x) => x.items.length > 0),
      suggestedItemId: currentItems[0]?.id ?? null,
    };
  };

  const age = ageFromBirthDate(dependent.birthDate);
  const coachProfile =
    session.user.role === "COACH"
      ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { photoUrl: true } })
      : null;
  const back = BACK[session.user.role];

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel[session.user.role] ?? session.user.role}
      links={roleNavLinks[session.user.role]}
      avatarUrl={coachProfile?.photoUrl}
    >
      <main className="w-full px-4 pb-16 py-6 sm:pb-8 sm:py-8">
        {back && (
          <Link href={back.href} className="text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
            {back.label}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Perkembangan {dependent.name}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {[age !== null ? `${age} tahun` : "Tanggal lahir belum diisi", group ? MILESTONE_GROUP_LABEL[group] : null]
            .filter(Boolean)
            .join(" · ")}
          {session.user.role !== "MEMBER" && ` · Akun ${dependent.member.name}`}
        </p>

        {overdue && (
          <p className="mt-4 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning-text">
            Sudah {overdue.sessionsWithoutNote} sesi Hadir tanpa catatan. Pencairan saldomu ditahan sampai catatan diisi.
          </p>
        )}

        {!access.canEdit && session.user.role === "COACH" && (
          <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
            Milestone bisa diisi setelah sesi pertama peserta ini ditandai Hadir di Riwayat Sesi.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-4">
            {access.canEdit && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Update milestone</h2>
                  <p className="mb-4 text-sm text-text-muted">
                    Isi minimal sekali tiap 2 sesi Hadir. Catatan tetap dihitung walau belum ada butir baru yang tercapai.
                  </p>
                  <MilestoneUpdateForm
                    dependentId={dependentId}
                    groupOptions={
                      group ? null : MILESTONE_GROUPS.map((g) => ({ value: g, label: MILESTONE_GROUP_LABEL[g], ...itemSet(g) }))
                    }
                    isFirst={notes.length === 0}
                    items={group ? itemSet(group) : null}
                  />
                </CardBody>
              </Card>
            )}

            {group && (
              <Card>
                <CardBody>
                  <h2 className="mb-3 text-lg font-semibold text-text">{MILESTONE_GROUP_LABEL[group]}</h2>
                  <div className="flex flex-col gap-5">
                    {levels.map((l) => {
                      const done = doneLevel.get(l.level);
                      return (
                        <section key={l.level}>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-text">{levelLabel(group, l.level)}</h3>
                            {done ? (
                              <Badge tone="success">Selesai {formatMilestoneDate(done.completedAt)}</Badge>
                            ) : l.level === current ? (
                              <Badge tone="brand">Sedang berjalan</Badge>
                            ) : (
                              <Badge>Belum</Badge>
                            )}
                            {done?.withCertificate && (
                              <Link href={`/milestone/${dependentId}/sertifikat/${done.id}`} className="text-sm font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                                Sertifikat
                              </Link>
                            )}
                          </div>
                          <ul className="mt-2 flex flex-col gap-1.5">
                            {l.items.map((it) => {
                              const a = got.get(it.id);
                              return (
                                <li key={it.id} className="flex gap-2 text-sm">
                                  <span aria-hidden="true" className={a ? "text-success-text" : "text-text-subtle"}>
                                    {a ? "✓" : "○"}
                                  </span>
                                  <span className={a ? "text-text" : "text-text-muted"}>
                                    {it.text}
                                    {it.dependentId && (
                                      <span className="ml-1 text-xs text-text-subtle">
                                        (butir tambahan coach{it.proposalStatus === "PENDING" ? ", diusulkan jadi standar" : ""})
                                      </span>
                                    )}
                                    {a && (
                                      <span className="block text-xs text-text-subtle">
                                        {a.priorSkill ? "Sudah bisa sebelumnya" : `Tercapai ${formatMilestoneDate(a.achievedAt)}`}
                                        {a.coach ? ` · ${a.coach.name}` : ""}
                                      </span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                  {current === null && levels.length > 0 && (
                    <p className="mt-4 text-sm text-success-text">Semua level di kelompok ini selesai.</p>
                  )}
                </CardBody>
              </Card>
            )}

            {earlierCompletions.length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="mb-2 text-lg font-semibold text-text">Level sebelumnya</h2>
                  <ul className="flex flex-col gap-1.5">
                    {earlierCompletions.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm text-text">
                        {levelLabel(c.group as MilestoneGroup, c.level)} · {formatMilestoneDate(c.completedAt)}
                        {c.withCertificate && (
                          <Link href={`/milestone/${dependentId}/sertifikat/${c.id}`} className="font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                            Sertifikat
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardBody>
                <h2 className="mb-3 text-lg font-semibold text-text">Catatan coach</h2>
                {notes.length === 0 ? (
                  <p className="text-sm text-text-muted">Belum ada catatan.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {notes.map((n) => (
                      <li key={n.id} className="py-3 first:pt-0">
                        <p className="text-xs text-text-subtle">
                          {formatMilestoneDate(n.createdAt)} · {n.coach.name}
                          {n.focusItem ? ` · Fokus: ${n.focusItem.text}` : ""}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-text">{n.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            {access.canEdit && group && dependent.milestoneGroup && levels.some((l) => !doneLevel.has(l.level)) && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Tambah butir sendiri</h2>
                  <p className="mb-3 text-sm text-text-muted">Butir tambahan hanya berlaku untuk {dependent.name}, kecuali disetujui jadi standar.</p>
                  <AddItemForm
                    dependentId={dependentId}
                    levels={levels
                      .filter((l) => !doneLevel.has(l.level))
                      .map((l) => ({ value: l.level, label: levelLabel(group, l.level) }))}
                  />
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </main>
    </NavBar>
  );
}
