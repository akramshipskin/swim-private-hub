import Link from "next/link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Browse coach lintas-kolam -- fitur ini SENGAJA di luar scope Phase 1
// (docs/designs/marketplace-pivot.md, "NOT in scope": "Cross-pool coach
// search/filter UI... not a real search engine"), ditambah balik atas
// permintaan eksplisit setelah gap-nya di-flag ke user. Query-nya cuma
// list + filter client-side sederhana (specialties/kolam), BUKAN full-text
// search engine -- tetep proporsional sama skala data sekarang (hitungan
// puluhan coach, bukan ribuan).
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function CariCoachPage() {
  await requireRole("MEMBER");

  const coaches = await prisma.user.findMany({
    where: { role: "COACH", isActive: true, coachProfile: { isActive: true } },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: { specialties: true, hasCertification: true, certificationNote: true },
      },
      poolAffiliations: {
        select: { pool: { select: { id: true, name: true } } },
        orderBy: { pool: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl [&>*]:max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Cari Coach</h1>
      <p className="mt-1 text-sm text-text-muted">
        Semua coach aktif, lintas kolam. Paketmu bisa dipake di kolam manapun -- booking-nya
        lewat menu Booking, pilih kolam & coach yang cocok.
      </p>

      {coaches.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">Belum ada coach aktif.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <CardBody>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-text">{coach.name}</h2>
                  {coach.coachProfile?.hasCertification && (
                    <Badge tone="accent">
                      Bersertifikat
                      {coach.coachProfile.certificationNote ? ` · ${coach.coachProfile.certificationNote}` : ""}
                    </Badge>
                  )}
                </div>

                {coach.coachProfile && coach.coachProfile.specialties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {coach.coachProfile.specialties.map((s) => (
                      <Badge key={s} tone="brand">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-xs text-text-subtle">
                  {coach.poolAffiliations.length === 0
                    ? "Belum terafiliasi ke kolam manapun."
                    : `Ngajar di: ${coach.poolAffiliations.map((a) => a.pool.name).join(", ")}`}
                </p>

                <Link
                  href={`/pelatih/${coach.id}`}
                  className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline"
                >
                  Lihat profil &amp; kontak &rarr;
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
