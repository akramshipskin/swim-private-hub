import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandingView from "./landing-view";

export default async function Home() {
  const session = await auth();

  if (!session) {
    const [pools, coaches, memberCount, attendedCount] = await Promise.all([
      prisma.pool.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          address: true,
          description: true,
          facilities: true,
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
          coachProfile: { select: { bio: true, specialties: true, photoUrl: true, certificateStatus: true, certificationNote: true } },
          poolAffiliations: { select: { pool: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.booking.count({ where: { attended: true } }),
    ]);
    return (
      <LandingView
        stats={{ poolCount: pools.length, coachCount: coaches.length, memberCount, attendedCount }}
        pools={pools.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          description: p.description,
          facilities: p.facilities,
          hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
          coachCount: p._count.affiliations,
          // Harga per sesi termurah dari katalog kolam itu.
          fromPerSession: p.packageTemplates.length
            ? Math.min(...p.packageTemplates.map((t) => Math.round(t.price / t.totalSesi)))
            : null,
        }))}
        coaches={coaches.map((c) => ({
          id: c.id,
          name: c.name,
          bio: c.coachProfile?.bio ?? null,
          specialties: c.coachProfile?.specialties ?? [],
          photoUrl: c.coachProfile?.photoUrl ?? null,
          certified: c.coachProfile?.certificateStatus === "APPROVED",
          certificationNote: c.coachProfile?.certificationNote ?? null,
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
