import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandingView from "./landing-view";
import { coachBioLine } from "@/lib/coach-bio";
import { REGULAR_TEMPLATE_WHERE } from "@/lib/trial";
import { rankLandingCoaches, rankLandingPools } from "@/lib/landing-rank";
import { approvedCertificatesSelect, certifiedBadgeText } from "@/lib/coach-certificates";

export default async function Home() {
  const session = await auth();

  if (!session) {
    const [pools, coaches, memberCount, attendedCount, packagesPerPool, sessionsPerCoach] = await Promise.all([
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
          packageTemplates: { where: REGULAR_TEMPLATE_WHERE, select: { price: true, totalSesi: true } },
          ownerships: { select: { owner: { select: { email: true } } } },
          _count: { select: { affiliations: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "COACH", isActive: true, coachProfile: { isActive: true } },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          coachProfile: { select: { bio: true, specialties: true, photoUrl: true, birthDate: true, gender: true, certificates: approvedCertificatesSelect } },
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
      // Sesi Hadir per coach (slot yang punya booking attended) -> urutan
      // coach di landing: paling banyak mengajar dulu.
      prisma.availability.groupBy({
        by: ["coachId"],
        where: { bookings: { some: { attended: true } } },
        _count: { _all: true },
      }),
    ]);

    const poolStats = new Map<string, { sold: number; members: Set<string> }>();
    for (const pkg of packagesPerPool) {
      const entry = poolStats.get(pkg.poolId) ?? { sold: 0, members: new Set<string>() };
      entry.sold += 1;
      entry.members.add(pkg.memberId);
      poolStats.set(pkg.poolId, entry);
    }
    // Landing menampilkan maksimal 5 kolam: kolam asli dulu (kolam contoh hanya
    // mengisi slot kosong), lalu yang paling laris.
    const topPools = rankLandingPools(
      pools.map((p) => ({ ...p, ownerEmails: p.ownerships.map((o) => o.owner.email) })),
      new Map([...poolStats].map(([id, s]) => [id, s.sold])),
    );

    const coachSessions = new Map(sessionsPerCoach.map((r) => [r.coachId, r._count._all]));
    // Landing menampilkan maksimal 5 coach: coach asli dulu (akun demo hanya
    // mengisi slot kosong), lalu sesi Hadir terbanyak.
    const topCoaches = rankLandingCoaches(coaches, coachSessions);

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
          // Harga paket termurah dari katalog kolam itu (harga per sesi tidak ditampilkan ke publik).
          fromPackagePrice: p.packageTemplates.length
            ? Math.min(...p.packageTemplates.map((t) => t.price))
            : null,
        }))}
        coaches={topCoaches.map((c) => ({
          id: c.id,
          name: c.name,
          bio: c.coachProfile?.bio ?? null,
          specialties: c.coachProfile?.specialties ?? [],
          photoUrl: c.coachProfile?.photoUrl ?? null,
          certifiedLabel: certifiedBadgeText(c.coachProfile?.certificates),
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
