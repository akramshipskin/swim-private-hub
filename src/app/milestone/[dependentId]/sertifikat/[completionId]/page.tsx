import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logotype } from "@/components/ui/logotype";
import { milestoneAccess, visibleItemsWhere } from "@/lib/milestone-data";
import { MILESTONE_GROUP_LABEL, formatMilestoneDate, levelLabel, type MilestoneGroup } from "@/lib/milestone";
import { signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import PrintButton from "./print-button";

export const metadata: Metadata = {
  title: "Sertifikat Level | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Sertifikat level milestone (template SPH), ditandatangani coach yang
// menyelesaikan level itu bersama peserta. Disimpan jadi PDF lewat dialog
// cetak browser -- sengaja tanpa pustaka PDF tambahan.
export default async function LevelCertificatePage({
  params,
}: {
  params: Promise<{ dependentId: string; completionId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { dependentId, completionId } = await params;
  if (!(await milestoneAccess(session.user, dependentId)).canView) notFound();

  const completion = await prisma.milestoneLevelCompletion.findFirst({
    where: { id: completionId, dependentId, withCertificate: true },
    select: {
      group: true,
      level: true,
      completedAt: true,
      dependent: { select: { name: true } },
      coach: { select: { name: true, coachProfile: { select: { signaturePath: true } } } },
    },
  });
  if (!completion) notFound();
  const group = completion.group as MilestoneGroup;

  const items = await prisma.milestoneItem.findMany({
    where: {
      ...visibleItemsWhere(dependentId),
      group,
      level: completion.level,
      achievements: { some: { dependentId } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true },
  });
  const signaturePath = completion.coach?.coachProfile?.signaturePath;
  const signatureUrl = signaturePath ? await signedObjectUrl(CERT_BUCKET, signaturePath) : null;

  return (
    <main className="min-h-screen bg-fixed-cream px-4 py-6 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 12mm; }`}</style>
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/milestone/${dependentId}`} className="text-sm font-medium text-fixed-ink underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">
          ← Kembali
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl border-8 border-fixed-lime-100 bg-white p-8 text-fixed-ink shadow-sm sm:p-12 print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex items-center justify-between gap-4">
          <Logotype className="text-2xl text-fixed-ink" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fixed-muted">Sertifikat Level</p>
        </header>

        <div className="text-center">
          <p className="text-sm text-fixed-muted">Diberikan kepada</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{completion.dependent.name}</h1>
          <p className="mt-4 text-base">telah menyelesaikan</p>
          <p className="mt-1 text-2xl font-semibold">{levelLabel(group, completion.level)}</p>
          <p className="mt-1 text-sm text-fixed-muted">{MILESTONE_GROUP_LABEL[group]}</p>
        </div>

        {items.length > 0 && (
          <ul className="mx-auto grid max-w-2xl gap-1.5 text-sm">
            {items.map((it) => (
              <li key={it.id} className="flex gap-2">
                <span aria-hidden="true" className="text-fixed-lime-500">
                  ✓
                </span>
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs text-fixed-muted">Tanggal</p>
            <p className="text-sm font-medium">{formatMilestoneDate(completion.completedAt, "long")}</p>
          </div>
          <div className="min-w-[200px] text-center">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureUrl} alt={`Tanda tangan ${completion.coach?.name ?? "coach"}`} className="mx-auto h-16 w-auto" />
            ) : (
              <div className="h-16" />
            )}
            <div className="border-t border-fixed-ink pt-1">
              <p className="text-sm font-semibold">{completion.coach?.name ?? "Coach"}</p>
              <p className="text-xs text-fixed-muted">Coach Swim Private Hub</p>
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
