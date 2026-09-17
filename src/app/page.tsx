import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandingView from "./landing-view";
import { coachBioLine } from "@/lib/coach-bio";

export default async function Home() {
  const session = await auth();

  if (!session) {
    const [pools, coaches, memberCount, attendedCount, packagesPerPool] = await Promise.all([
      prisma.pool.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          address: true,
          description: true,
          facilities: true,
          photos: true,
          openTime: true,
          closeTime: true,
          packageTemplates: { where: { isActive: true }, select: { price: true, totalSesi: true } },
          _count: { select: { affiliations: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "COACH", isActive: true, coachProfile: { isActive: true } },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          coachProfile: { select: { bio: true, specialties: true, photoUrl: true, certificateStatus: true, certificationNote: true, birthDate: true, gender: true } },
          poolAffiliations: { select: { pool: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.booking.count({ where: { attended: true } }),
      // Paket yang pernah aktif per kolam -> dasar "paling laris" + jumlah
      // member di kolam itu (member unik, bukan jumlah paket).
      prisma.package.findMany({
        where: { startDate: { not: null } },
        select: { poolId: true, memberId: true },
      }),
    ]);

    const poolStats = new Map<string, { sold: number; members: Set<string> }>();
    for (const pkg of packagesPerPool) {
      const entry = poolStats.get(pkg.poolId) ?? { sold: 0, members: new Set<string>() };
      entry.sold += 1;
      entry.members.add(pkg.memberId);
      poolStats.set(pkg.poolId, entry);
    }
    // Landing menampilkan maksimal 5 kolam paling laris, bukan semuanya.
    const topPools = [...pools]
      .sort((a, b) => (poolStats.get(b.id)?.sold ?? 0) - (poolStats.get(a.id)?.sold ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 5);

    return (
      <LandingView
        stats={{ poolCount: pools.length, coachCount: coaches.length, memberCount, attendedCount }}
        pools={topPools.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          description: p.description,
          facilities: p.facilities,
          photos: p.photos,
          memberCount: poolStats.get(p.id)?.members.size ?? 0,
          hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
          coachCount: p._count.affiliations,
          // Harga per sesi termurah dari katalog kolam itu.
          fromPerSession: p.packageTemplates.length
            ? Math.min(...p.packageTemplates.map((t) => Math.round(t.price / t.totalSesi)))
            : null,
        }))}
        coaches={coaches.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          bio: c.coachProfile?.bio ?? null,
          specialties: c.coachProfile?.specialties ?? [],
          photoUrl: c.coachProfile?.photoUrl ?? null,
          certified: c.coachProfile?.certificateStatus === "APPROVED",
          certificationNote: c.coachProfile?.certificationNote ?? null,
          bioLine: coachBioLine(c.coachProfile),
          pools: c.poolAffiliations.map((a) => a.pool.name),
        }))}
      />
    );
  }

  if (session.user.mustChangePassword) {
    redirect("/ganti-password");
  }

  const roleHome: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", string> = {
    ADMIN: "/admin",
    COACH: "/coach/dashboard",
    MEMBER: "/member/booking",
    POOL_OWNER: "/pool/dashboard",
  };

  redirect(roleHome[session.user.role]);
}
