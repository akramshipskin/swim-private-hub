import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardBody } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import EditNameForm from "./edit-name-form";
import EditPasswordForm from "./edit-password-form";
import CopyLinkButton from "./copy-link-button";
import EditCoachProfileForm from "./edit-coach-profile-form";
import CoachMediaForm from "./coach-media-form";
import { isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Profil | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");


  // Halaman /pelatih/[coachId] publik (gak perlu login), tapi sebelum ini
  // gak ada satu pun tempat di app buat coach nemuin/nyalin link
  // profilnya sendiri -- satu-satunya link ke sana ada di member/cari-coach
  // yang butuh login. Coach gak bisa share apa-apa. Tambah di sini biar
  // coach bisa copy & kirim manual via WA, sesuai niat aslinya.
  const publicProfileLink =
    session.user.role === "COACH"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/pelatih/${session.user.id}`
      : null;
  const coachProfile =
    session.user.role === "COACH"
      ? await prisma.coachProfile.findUnique({
          where: { userId: session.user.id },
          select: { bio: true, specialties: true, certificationNote: true, photoUrl: true, certificateStatus: true, birthDate: true, gender: true },
        })
      : null;

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel[session.user.role] ?? session.user.role}
      links={roleNavLinks[session.user.role]}
      avatarUrl={coachProfile?.photoUrl}
    >
      <main className="w-full px-4 pb-16 py-6 sm:pb-8 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Edit Profil</h1>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Nama</h2>
            <EditNameForm
              currentName={session.user.name ?? ""}
              label={session.user.role === "MEMBER" ? "Nama/Orang Tua" : "Nama Lengkap"}
            />
          </CardBody>
        </Card>

        {coachProfile && (
          <Card>
            <CardBody>
              <h2 className="mb-1 text-lg font-semibold text-text">Profil Coach</h2>
              <p className="mb-3 text-sm text-text-muted">
                Ditampilkan ke orang tua di halaman profil publik kamu.
              </p>
              <EditCoachProfileForm profile={coachProfile} />
            </CardBody>
          </Card>
        )}

        {coachProfile && (
          <Card>
            <CardBody>
              <h2 className="mb-3 text-lg font-semibold text-text">Foto &amp; Sertifikat</h2>
              <CoachMediaForm
                photoUrl={coachProfile.photoUrl}
                certificateStatus={coachProfile.certificateStatus}
                certificationNote={coachProfile.certificationNote}
                storageReady={isStorageConfigured()}
              />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Ganti Password</h2>
            <EditPasswordForm />
          </CardBody>
        </Card>

        {publicProfileLink && (
          <Card>
            <CardBody>
              <h2 className="mb-1 text-lg font-semibold text-text">Link Profil Publik</h2>
              <p className="mb-3 text-sm text-text-muted">
                Kirim link ini ke calon member yang bertanya jadwal/kolam kamu — bisa dibuka
                siapa saja tanpa perlu login.
              </p>
              <CopyLinkButton link={publicProfileLink} />
            </CardBody>
          </Card>
        )}

        {session.user.role === "MEMBER" && (
          <p className="text-sm text-text-muted">
            Tambah atau ubah peserta les ada di menu{" "}
            <a href="/member/peserta" className="font-medium text-brand-700 underline">Peserta</a>.
          </p>
        )}
        </div>
      </main>
    </NavBar>
  );
}
