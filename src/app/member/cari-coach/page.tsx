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
        select: { bio: true, specialties: true, certificationNote: true, certificateStatus: true, photoUrl: true },
      },
      poolAffiliations: {
        select: { pool: { select: { id: true, name: true, address: true } } },
        orderBy: { pool: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Cari Coach</h1>
      <p className="mt-1 text-sm text-text-muted">
        Semua coach aktif, lintas kolam. Paket berlaku di kolam tempat dibeli — mau ke kolam lain,
        beli 1 sesi di sana lewat menu Booking.
      </p>

      {coaches.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">Belum ada coach aktif.</p>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <CardBody className="flex gap-4">
                {coach.coachProfile?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.coachProfile.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
                    {coach.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text">{coach.name}</h2>
                    {coach.coachProfile?.certificateStatus === "APPROVED" && (
                      <Badge tone="accent">
                        Bersertifikat{coach.coachProfile.certificationNote ? ` · ${coach.coachProfile.certificationNote}` : ""}
                      </Badge>
                    )}
                  </div>
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
                    {coach.poolAffiliations.length === 0 ? (
                      <p className="text-sm text-text-muted">Belum terdaftar di kolam mana pun.</p>
                    ) : (
                      <ul className="mt-1 flex flex-col gap-1">
                        {coach.poolAffiliations.map(({ pool }) => (
                          <li key={pool.id} className="text-sm text-text">
                            <span className="font-medium">{pool.name}</span>
                            {pool.address && <span className="text-text-muted"> · {pool.address}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link href={`/pelatih/${coach.id}`} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                    Lihat profil lengkap &rarr;
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
