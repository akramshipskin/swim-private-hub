import { SearchForm, matchesQuery } from "@/components/search-form";
import { ShowMoreLink, listHref, pageSize } from "@/components/show-more-link";
import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";
import { approvedCertificatesSelect, certifiedBadgeText } from "@/lib/coach-certificates";

// Browse coach lintas-kolam -- fitur ini SENGAJA di luar scope Phase 1
// (docs/designs/marketplace-pivot.md, "NOT in scope": "Cross-pool coach
// search/filter UI... not a real search engine"), ditambah balik atas
// permintaan eksplisit setelah gap-nya di-flag ke user. Query-nya cuma
// list + filter client-side sederhana (specialties/kolam), BUKAN full-text
// search engine -- tetep proporsional sama skala data sekarang (hitungan
// puluhan coach, bukan ribuan).
export const metadata = {
  title: "Cari Coach | Swim Private Hub",
  robots: { index: false, follow: false },
};

// Puluhan coach: tampil 12 dulu (coach di kota member lebih dulu), tombol menambah 12.
const PAGE = 12;

export default async function CariCoachPage({ searchParams }: { searchParams: Promise<{ q?: string; n?: string }> }) {
  const session = await requireRole("MEMBER");
  const sp = await searchParams;
  const q = sp.q ?? "";
  const limit = pageSize(sp.n, PAGE);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { city: true } });

  const coaches = await prisma.user.findMany({
    // Hanya coach yang sudah memilih minimal 1 kolam aktif (Hadi 3 Okt malam,
    // #7A): coach tanpa kolam belum bisa dibeli.
    where: { role: "COACH", isActive: true, coachProfile: { isActive: true }, poolAffiliations: { some: { pool: { isActive: true } } } },
    select: {
      id: true,
      name: true,
      city: true,
      coachProfile: {
        select: { bio: true, specialties: true, photoUrl: true, birthDate: true, gender: true, certificates: approvedCertificatesSelect },
      },
      poolAffiliations: {
        where: { pool: { isActive: true } },
        select: { pool: { select: { id: true, name: true, address: true, city: true } } },
        orderBy: { pool: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  // Coach yang domisili atau kolamnya di kota member tampil lebih dulu; sisanya urut nama.
  const inMyCity = (c: (typeof coaches)[number]) => !!me?.city && (c.city === me.city || c.poolAffiliations.some((a) => a.pool.city === me.city));
  const matched = coaches
    .filter((c) => matchesQuery(q, c.name, c.city, ...c.poolAffiliations.flatMap((a) => [a.pool.name, a.pool.city]), ...(c.coachProfile?.specialties ?? [])))
    .sort((a, b) => Number(inMyCity(b)) - Number(inMyCity(a)));
  const shownCoaches = matched.slice(0, limit);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Cari Coach</h1>
      <p className="mt-1 text-sm text-text-muted">
        Semua coach aktif beserta kolam tempat mereka mengajar; coach di kotamu tampil lebih dulu. Paket dibeli per coach dan kolam lewat menu Paket,
        dan hanya berlaku untuk coach itu di kolam itu.
      </p>

      {coaches.length > PAGE && <div className="mt-4"><SearchForm q={q} placeholder="Cari coach, kolam, atau kota" /></div>}

      {coaches.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">Belum ada coach aktif.</p>
      ) : matched.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">Tidak ada coach yang cocok dengan &quot;{q}&quot;.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shownCoaches.map((coach) => (
            <Card key={coach.id}>
              <CardBody className="flex gap-4">
                <Avatar src={coach.coachProfile?.photoUrl} className="h-16 w-16" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text">{coach.name}</h2>
                    {certifiedBadgeText(coach.coachProfile?.certificates) && (
                      <Badge tone="success">{certifiedBadgeText(coach.coachProfile?.certificates)}</Badge>
                    )}
                  </div>
                  {(coach.city || coachBioLine(coach.coachProfile)) && (
                    <p className="mt-0.5 text-xs text-text-subtle">
                      {[coach.city && `Domisili ${coach.city}`, coachBioLine(coach.coachProfile)].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {coach.coachProfile?.bio && <p className="mt-1 line-clamp-2 text-sm text-text-muted">{coach.coachProfile.bio}</p>}
                  {coach.coachProfile && coach.coachProfile.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {coach.coachProfile.specialties.map((sp) => (
                        <Badge key={sp} tone="brand">{sp}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-text">Mengajar di</p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {coach.poolAffiliations.map(({ pool }) => (
                        <li key={pool.id} className="text-sm text-text">
                          <span className="font-medium">{pool.name}</span>
                          {(pool.address || pool.city) && (
                            <span className="text-text-muted"> · {[pool.address, pool.city].filter(Boolean).join(", ")}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={`/pelatih/${coach.id}`} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                    Lihat profil lengkap &rarr;
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <ShowMoreLink href={listHref({ q: q || undefined, n: String(limit + PAGE) })} shown={shownCoaches.length} total={matched.length} unit="coach" />
    </main>
  );
}
