import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logotype } from "@/components/ui/logotype";
import { NavBar } from "@/components/nav-bar";
import BackButton from "./back-button";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";

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
      coachProfile: {
        select: { bio: true, specialties: true, certificationNote: true, certificateStatus: true, certificateUrl: true, photoUrl: true, birthDate: true, gender: true },
      },
      poolAffiliations: {
        select: {
          pool: { select: { id: true, name: true, address: true, openTime: true, closeTime: true, facilities: true, photos: true } },
        },
        orderBy: { pool: { name: "asc" } },
      },
    },
  });

  if (!coach) notFound();

  // Sumber info dibedakan: pengunjung tanpa akun cuma dapat ringkasan publik;
  // pengguna yang login dapat detail kolam (jam, fasilitas) dan bisa membuka
  // file sertifikat (signed URL berumur pendek, bukan link permanen).
  const profile = coach.coachProfile;
  const certApproved = profile?.certificateStatus === "APPROVED";
  const certViewUrl =
    session && certApproved && profile?.certificateUrl ? await signedObjectUrl(CERT_BUCKET, profile.certificateUrl) : null;

  const content = (
    // Login: samain container sama halaman role lain (judul gak loncat pas
    // pindah dari Cari Coach). Anonim: tengah, sejajar header publik.
    <main className={session ? "w-full px-4 py-6 sm:py-8" : "mx-auto max-w-lg px-4 py-8"}>
      <BackButton fallbackHref={session?.user.role === "MEMBER" ? "/member/cari-coach" : "/"} />
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar src={profile?.photoUrl} alt={`Foto ${coach.name}`} className="h-24 w-24 sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text">{coach.name}</h1>
          <p className="text-sm text-text-muted">{coachBioLine(profile) ?? "Coach renang privat"}</p>
          {profile?.bio && <p className="mt-2 text-base text-text">{profile.bio}</p>}
          {profile && profile.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.specialties.map((sp) => (
                <Badge key={sp} tone="brand">
                  {sp}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {certApproved && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="success">Bersertifikat{profile?.certificationNote ? ` · ${profile.certificationNote}` : ""}</Badge>
          {session ? (
            certViewUrl && (
              <a href={certViewUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 underline">
                Lihat sertifikat
              </a>
            )
          ) : (
            profile?.certificateUrl && (
              <Link href="/register" className="text-sm font-medium text-brand-700 underline">
                Lihat sertifikat (daftar dulu)
              </Link>
            )
          )}
        </div>
      )}

      <h2 className="mt-6 text-base font-semibold text-text">Mengajar di kolam</h2>
      {coach.poolAffiliations.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">Belum terdaftar di kolam mana pun.</p>
      ) : (
        <ul className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {coach.poolAffiliations.map(({ pool }) => (
            <li key={pool.id}>
              <Card>
                <CardBody className="flex gap-3 py-3">
                  {pool.photos.length > 0 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pool.photos[0]} alt={`Foto ${pool.name}`} className="h-20 w-24 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-text">{pool.name}</p>
                    {pool.address && <p className="text-sm text-text-muted">{pool.address}</p>}
                    {session && (
                      <>
                        {pool.openTime && pool.closeTime && (
                          <p className="mt-1 text-sm text-text-muted">
                            Buka {pool.openTime}–{pool.closeTime}
                          </p>
                        )}
                        {pool.facilities.length > 0 && (
                          <p className="mt-1 line-clamp-2 text-sm text-text-muted">Fasilitas: {pool.facilities.join(", ")}</p>
                        )}
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-text-muted">
        {session?.user.role === "MEMBER"
          ? "Mau les dengan coach ini? Pilih kolam dan coach di menu Booking. Paket berlaku di kolam tempat dibeli; di kolam lain bisa beli 1 sesi."
          : session
            ? "Booking coach dilakukan member lewat menu Booking."
            : "Mau les dengan coach ini? Daftar sebagai member untuk melihat jadwal, fasilitas kolam, dan sertifikat lengkap."}
      </p>
      {!session && (
        <Link href="/register" className="mt-3 inline-block">
          <Button>Daftar sekarang</Button>
        </Link>
      )}
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
                Masuk
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
