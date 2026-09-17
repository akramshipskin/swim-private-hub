import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildCoachInquiryWaLink } from "@/lib/whatsapp";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logotype } from "@/components/ui/logotype";
import { NavBar } from "@/components/nav-bar";
import BackButton from "./back-button";

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
  const session = await auth();

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

  const content = (
    // Login: samain container sama halaman role lain (judul gak loncat pas
    // pindah dari Cari Coach). Anonim: tengah, sejajar header publik.
    <main className={session ? "mx-auto max-w-5xl px-4 py-6 sm:py-8 [&>*]:max-w-lg" : "mx-auto max-w-lg px-4 py-8"}>
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={session?.user.role === "MEMBER" ? "/member/cari-coach" : "/"} />
        <h1 className="text-2xl font-semibold tracking-tight text-text">{coach.name}</h1>
      </div>
      {coach.coachProfile?.hasCertification && (
        <div className="mt-2">
          <Badge tone="accent">
            Bersertifikat{coach.coachProfile.certificationNote ? ` · ${coach.coachProfile.certificationNote}` : ""}
          </Badge>
        </div>
      )}
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
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-whatsapp px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Hubungi {coach.name} (WA)
        </a>
      )}

      <p className="mt-4 text-xs text-text-subtle">
        {session?.user.role === "MEMBER"
          ? "Mau booking coach ini? Pilih kolam & coach-nya di menu Booking. Paket berlaku di kolam tempat dibeli; di kolam lain bisa beli 1 sesi."
          : "Mau booking coach ini? Daftar/login sebagai member, beli paket di kolam tempat coach ini ngajar, lalu booking lewat menu Booking."}
      </p>
    </main>
  );

  // Publik = dua alur berbeda: pengunjung yang lagi LOGIN (misal member
  // yang klik "Lihat profil & kontak" dari Cari Coach) tetep butuh NavBar
  // lengkap sesuai role-nya biar gak keburu ilang navigasi -- itu bug yang
  // kejadian sebelum fix ini (cuma nambah logo doang, gak beneran misahin
  // dua alur). Pengunjung ANONIM (link dishare manual via WA, belum pernah
  // login) dapet header publik minimal + tombol Login/Daftar, sama kayak
  // landing page.
  if (session) {
    return (
      <NavBar
        userName={session.user.name ?? ""}
        userRole={roleLabel[session.user.role] ?? session.user.role}
        links={roleNavLinks[session.user.role]}
        // Cuma Member yang punya menu "Cari Coach" -- role lain gak
        // punya item yang relevan buat dipaksa nyala, biarin default.
        activePath={session.user.role === "MEMBER" ? "/member/cari-coach" : undefined}
      >
        {content}
      </NavBar>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="inline-block">
            <Logotype className="text-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>
      {content}
    </div>
  );
}
