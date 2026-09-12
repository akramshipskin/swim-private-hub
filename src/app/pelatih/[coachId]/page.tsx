import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildCoachInquiryWaLink } from "@/lib/whatsapp";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Coach shortcut page (pool-first browse + cheap cross-pool discovery,
// locked /plan-eng-review 2026-09-12, cross-model tension #4): pool-first
// browse gak bisa nunjukin "coach X juga ngajar di kolam lain" -- halaman
// statis ini nutup gap-nya tanpa perlu bangun search engine lintas-kolam.
// Publik, gak perlu login -- orang tua yang tau nama coach bisa cari
// lewat link ini (dishare manual/WA), gak lewat UI browse.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CoachShortcutPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;

  const coach = await prisma.user.findUnique({
    where: { id: coachId, role: "COACH" },
    select: {
      id: true,
      name: true,
      phone: true,
      coachProfile: {
        select: { bio: true, specialties: true, hasCertification: true, certificationNote: true },
      },
      poolAffiliations: {
        select: { pool: { select: { id: true, name: true, address: true } } },
        orderBy: { pool: { name: "asc" } },
      },
    },
  });

  if (!coach) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text">{coach.name}</h1>
        {coach.coachProfile?.hasCertification && (
          <Badge tone="accent">
            Bersertifikat{coach.coachProfile.certificationNote ? ` · ${coach.coachProfile.certificationNote}` : ""}
          </Badge>
        )}
      </div>
      {coach.coachProfile?.bio && (
        <p className="mt-2 text-sm text-text-muted">{coach.coachProfile.bio}</p>
      )}

      {coach.coachProfile && coach.coachProfile.specialties.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-semibold text-text-muted">Keahlian</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {coach.coachProfile.specialties.map((s) => (
              <Badge key={s} tone="brand">
                {s}
              </Badge>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-6 text-sm font-semibold text-text-muted">Ngajar di kolam</h2>
      {coach.poolAffiliations.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">Belum terafiliasi ke kolam manapun.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {coach.poolAffiliations.map(({ pool }) => (
            <Card key={pool.id}>
              <CardBody className="py-3">
                <p className="text-sm font-medium text-text">{pool.name}</p>
                {pool.address && <p className="text-xs text-text-muted">{pool.address}</p>}
              </CardBody>
            </Card>
          ))}
        </ul>
      )}

      {coach.phone && (
        <a
          href={buildCoachInquiryWaLink(coach.phone, coach.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Hubungi {coach.name} (WA)
        </a>
      )}

      <p className="mt-4 text-xs text-text-subtle">
        Buat booking beneran, tetep lewat paket kolam yang kamu punya -- halaman ini cuma buat
        bantu nemuin coach yang lagi ngajar di kolam lain.
      </p>
    </main>
  );
}
