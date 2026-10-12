import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Logotype } from "@/components/ui/logotype";
import { NavBar } from "@/components/nav-bar";
import BackButton from "./back-button";
import { Avatar } from "@/components/ui/avatar";
import { coachBioLine } from "@/lib/coach-bio";
import { certifiedBadgeText } from "@/lib/coach-certificates";
import Image from "next/image";

// Coach shortcut page (pool-first browse + cheap cross-pool discovery,
// locked /plan-eng-review 2026-09-12, cross-model tension #4): pool-first
// browse gak bisa nunjukin "coach X juga ngajar di kolam lain" -- halaman
// statis ini nutup gap-nya tanpa perlu bangun search engine lintas-kolam.
// Publik, gak perlu login -- orang tua yang tau nama coach bisa cari
// lewat link ini (dishare manual/WA), gak lewat UI browse.
export const metadata: Metadata = {
  title: "Profil Coach | Swim Private Hub",
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
    // Coach nonaktif (belum disetujui / dinonaktifkan admin) tidak dipublikasikan.
    // Aturan sama dengan landing & Cari Coach: akun aktif DAN profil coach aktif.
    where: { id: coachId, role: "COACH", isActive: true, coachProfile: { isActive: true } },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          bio: true,
          specialties: true,
          photoUrl: true,
          birthDate: true,
          gender: true,
          certificates: { where: { status: "APPROVED" }, select: { id: true, name: true, filePath: true }, orderBy: { createdAt: "asc" } },
        },
      },
      poolAffiliations: {
        where: { pool: { isActive: true } },
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
  const certificates = await Promise.all(
    (profile?.certificates ?? []).map(async (c) => ({
      ...c,
      viewUrl: session && c.filePath ? await signedObjectUrl(CERT_BUCKET, c.filePath) : null,
    }))
  );
  const certifiedLabel = certifiedBadgeText(certificates);

  const content = (
    // Login: samain container sama halaman role lain (judul gak loncat pas
    // pindah dari Cari Coach). Anonim: tengah, sejajar header publik.
    <main className={session ? "w-full px-4 py-6 sm:py-8" : "mx-auto w-full max-w-6xl px-4 py-8"}>
      <BackButton fallbackHref={session?.user.role === "MEMBER" ? "/member/cari-coach" : "/"} />
      {/* Rombak 12 Okt (penilaian UI/UX): desktop dua kolom, profil di kiri; kolam
          dan ajakan daftar di kanan, menempel saat digulir. HP satu kolom. */}
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-10">
        <section aria-label="Profil coach" className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar src={profile?.photoUrl} alt={`Foto ${coach.name}`} className="h-28 w-28 sm:h-32 sm:w-32" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">{coach.name}</h1>
              <p className="mt-1 text-sm text-text-muted">{coachBioLine(profile) ?? "Coach renang privat"}</p>
              {certifiedLabel && (
                <div className="mt-2">
                  <Badge tone="success">{certifiedLabel}</Badge>
                </div>
              )}
            </div>
          </div>

          {profile?.bio && <p className="max-w-prose text-base leading-relaxed text-text">{profile.bio}</p>}

          {profile && profile.specialties.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text">Keahlian</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.specialties.map((sp) => (
                  <Badge key={sp} tone="brand">
                    {sp}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {certifiedLabel && (
            <div>
              <h2 className="text-sm font-semibold text-text">Sertifikat</h2>
              <ul className="mt-2 flex flex-col divide-y divide-border border-y border-border">
                {certificates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm text-text">
                    <span>{c.name}</span>
                    {session ? (
                      c.viewUrl && (
                        <a href={c.viewUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                          Lihat sertifikat
                        </a>
                      )
                    ) : (
                      c.filePath && (
                        <Link href="/register" className="font-medium text-brand-700 underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                          Lihat sertifikat (daftar dulu)
                        </Link>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside aria-label="Kolam dan pendaftaran" className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div>
            <h2 className="text-base font-semibold text-text">Mengajar di kolam</h2>
            {coach.poolAffiliations.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">Belum terdaftar di kolam mana pun.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
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
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted p-4 sm:p-5">
            <p className="text-sm text-text">
              {session?.user.role === "MEMBER"
                ? "Mau les dengan coach ini? Beli paketnya di menu Paket (pilih kolam lalu coach ini), lalu booking jadwalnya di menu Booking."
                : session
                  ? "Booking coach dilakukan member lewat menu Booking."
                  : "Mau les dengan coach ini? Daftar sebagai member untuk melihat jadwal, fasilitas kolam, dan sertifikat lengkap."}
            </p>
            {!session && (
              <Link href="/register" className={buttonClass({ className: "mt-3 w-full" })}>
                Daftar gratis
              </Link>
            )}
            {session?.user.role === "MEMBER" && (
              <Link href="/member/paket" className={buttonClass({ className: "mt-3 w-full" })}>
                Ke menu Paket
              </Link>
            )}
          </div>
        </aside>
      </div>
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-2 max-lg:min-h-[44px]">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <Logotype className="text-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
                Masuk
            </Link>
            <Link href="/register" className={buttonClass({ size: "sm" })}>
              Daftar
            </Link>
          </div>
        </div>
      </header>
      {content}
    </div>
  );
}
