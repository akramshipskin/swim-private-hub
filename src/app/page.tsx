import { withinPoolHours } from "@/lib/pool-hours";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { meetsOpenSlotRule, openSlotStats, pairKey } from "@/lib/coach-open-slots";
import LandingView from "./landing-view";
import { coachBioLine } from "@/lib/coach-bio";
import { cheapestPackQuote } from "@/lib/pricing";
import { isDemoAccountEmail, isDemoPool, rankLandingCoaches, rankLandingPools } from "@/lib/landing-rank";
import { approvedCertificatesSelect, certifiedBadgeText } from "@/lib/coach-certificates";

function cheapestPack(p: {
  pricePack4: number | null;
  pricePack8: number | null;
  serviceFeeBps: number;
  affiliations: { coach: { id: string; coachProfile: { pricePack4: number | null; pricePack8: number | null } | null } }[];
}, buyable: (coachId: string) => boolean) {
  return cheapestPackQuote(p, p.affiliations.flatMap(({ coach }) => (coach.coachProfile && buyable(coach.id) ? [coach.coachProfile] : [])));
}

const NOT_DEMO_EMAIL = { OR: [{ email: null }, { NOT: { email: { endsWith: "@example.com", mode: "insensitive" as const } } }] };

export default async function Home() {
  const session = await auth();

  if (!session) {
    const now = new Date();
    const [pools, coaches, memberCount, attendedCount, packagesPerPool, sessionsPerCoach, testimonials, openSlots] = await Promise.all([
      prisma.pool.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          description: true,
          facilities: true,
          photos: true,
          openTime: true,
          closeTime: true,
          pricePack4: true,
          pricePack8: true,
          serviceFeeBps: true,
          affiliations: {
            where: { coach: { role: "COACH", isActive: true, coachProfile: { isActive: true } } },
            select: { coach: { select: { id: true, coachProfile: { select: { pricePack4: true, pricePack8: true } } } } },
          },
          ownerships: { select: { owner: { select: { email: true } } } },
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
      // Strip statistik hanya menghitung akun asli (Hadi 2 Okt): akun demo
      // (@example.com) tidak dihitung. Email kosong (daftar pakai HP) = asli.
      prisma.user.count({ where: { role: "MEMBER", isActive: true, ...NOT_DEMO_EMAIL } }),
      prisma.booking.count({ where: { attended: true, member: NOT_DEMO_EMAIL } }),
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
      prisma.testimonial.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { name: true, role: true, quote: true },
      }),
      // Jam kosong 7 hari ke depan per kolam (Hadi 2 Okt malam, #17/#18a): semua
      // kolam termasuk contoh; tampil di kartu bila >= LANDING_MIN_OPEN_SLOTS.
      prisma.availability.findMany({
        where: {
          status: "AVAILABLE",
          startTime: { gt: now, lt: new Date(now.getTime() + 7 * 86_400_000) },
          coach: { isActive: true, coachProfile: { isActive: true } },
        },
        select: { poolId: true, startTime: true, endTime: true },
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

    // "Mulai Rp..." hanya dari coach yang bisa dibeli (syarat 4 jam kosong / 14 hari),
    // sama dengan halaman beli paket.
    const slotStats = await openSlotStats(topPools.flatMap((p) => p.affiliations.map((a) => ({ coachId: a.coach.id, poolId: p.id }))), now);

    const coachSessions = new Map(sessionsPerCoach.map((r) => [r.coachId, r._count._all]));
    // Landing menampilkan maksimal 5 coach: coach asli dulu (akun demo hanya
    // mengisi slot kosong), lalu sesi Hadir terbanyak.
    const topCoaches = rankLandingCoaches(coaches, coachSessions);

    return (
      <LandingView
        testimonials={testimonials}
        stats={{
          poolCount: pools.filter((p) => !isDemoPool({ name: p.name, ownerEmails: p.ownerships.map((o) => o.owner.email) })).length,
          coachCount: coaches.filter((c) => !isDemoAccountEmail(c.email)).length,
          memberCount,
          attendedCount,
        }}
        pools={topPools.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.city && p.address ? `${p.address}, ${p.city}` : p.address ?? p.city,
          description: p.description,
          facilities: p.facilities,
          photos: p.photos,
          memberCount: poolStats.get(p.id)?.members.size ?? 0,
          hours: p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : null,
          // Hanya coach aktif yang bisa dibeli (syarat 4 jam kosong), sama dengan "mulai Rp...".
          coachCount: p.affiliations.filter((a) => meetsOpenSlotRule(slotStats.get(pairKey(a.coach.id, p.id)))).length,
          // Harga paket termurah di kolam itu (kolam + coach + biaya layanan), dari
          // semua coach yang mengajar di sana dan sudah memasang harga.
          fromPackage: cheapestPack(p, (coachId) => meetsOpenSlotRule(slotStats.get(pairKey(coachId, p.id)))),
          openSlots7d: openSlots.filter((s) => s.poolId === p.id && withinPoolHours(p, s.startTime, s.endTime)).length,
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
