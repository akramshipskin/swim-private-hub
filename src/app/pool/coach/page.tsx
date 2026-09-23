import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { todayWibDateString, wibDateTime } from "@/lib/datetime";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";

export default async function PoolCoachPage() {
  const session = await requireRole("POOL_OWNER");
  const startMonth = wibDateTime(`${todayWibDateString().slice(0, 7)}-01`, "00:00");
  const now = new Date();

  const pools = await prisma.pool.findMany({
    where: { ownerships: { some: { ownerId: session.user.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      affiliations: {
        orderBy: { coach: { name: "asc" } },
        select: {
          coach: {
            select: {
              id: true,
              name: true,
              phone: true,
              coachProfile: { select: { photoUrl: true, specialties: true, certificateStatus: true, certificationNote: true, birthDate: true, gender: true } },
              availabilities: {
                select: { status: true, startTime: true, poolId: true, bookings: { where: { attended: true }, select: { id: true } } },
                where: { startTime: { gte: startMonth } },
              },
            },
          },
        },
      },
    },
  });

  if (pools.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center text-sm text-text-muted">
        Akun ini belum terhubung ke kolam mana pun. Hubungi admin.
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Coach di Kolam</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">Coach yang terdaftar mengajar di kolammu, dengan aktivitas bulan ini.</p>
      {pools.map((p) => (
        <section key={p.id} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-brand-700">{p.name}</h2>
          {p.affiliations.length === 0 ? (
            <p className="text-sm text-text-muted">Belum ada coach. Hubungi admin untuk menambahkan coach ke kolam ini.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {p.affiliations.map(({ coach }) => {
                const here = coach.availabilities.filter((a) => a.poolId === p.id);
                const attended = here.reduce((n, a) => n + a.bookings.length, 0);
                const upcomingBooked = here.filter((a) => a.status === "BOOKED" && a.startTime > now).length;
                const upcomingOpen = here.filter((a) => a.status === "AVAILABLE" && a.startTime > now).length;
                return (
                  <Card key={coach.id}>
                    <CardBody className="flex gap-4">
                      <Avatar src={coach.coachProfile?.photoUrl} className="h-14 w-14" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-text">{coach.name}</p>
                          {coach.coachProfile?.certificateStatus === "APPROVED" && <Badge tone="success">Bersertifikat</Badge>}
                        </div>
                        {coachBioLine(coach.coachProfile) && (
                          <p className="text-xs text-text-subtle">{coachBioLine(coach.coachProfile)}</p>
                        )}
                        <p className="text-sm text-text-muted">
                          {coach.coachProfile?.specialties.join(", ") || "Keahlian belum diisi"}
                        </p>
                        {coach.phone && <p className="text-sm text-text-muted">No HP: {coach.phone}</p>}
                        <p className="mt-2 text-sm text-text">
                          Bulan ini di kolammu: <b>{attended}</b> sesi sudah mengajar · {upcomingBooked} sesi akan datang ·{" "}
                          {upcomingOpen} slot masih kosong
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
