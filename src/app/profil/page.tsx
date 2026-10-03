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
import { isStorageConfigured, signedObjectUrl, CERT_BUCKET } from "@/lib/storage";
import DeleteAccountCard from "./delete-account-card";
import { CitySelect } from "@/components/city-select";
import { Button } from "@/components/ui/button";
import { saveMyCity } from "@/app/kota/actions";

export const metadata: Metadata = {
  title: "Profil | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
      ? `${process.env.NEXT_PUBLIC_APP_URL || "https://www.swimprivatehub.biz.id"}/pelatih/${session.user.id}`
      : null;
  const coachProfile =
    session.user.role === "COACH"
      ? await prisma.coachProfile.findUnique({
          where: { userId: session.user.id },
          select: {
            bio: true,
            specialties: true,
            certificationNote: true,
            photoUrl: true,
            birthDate: true,
            gender: true,
            certificates: { select: { id: true, name: true, status: true }, orderBy: { createdAt: "asc" } },
            signaturePath: true,
          },
        })
      : null;

  // Hapus akun mandiri: khusus member (coach/pemilik kolam punya saldo & jadwal
  // yang diurus lewat admin).
  const deletionAccount =
    session.user.role === "MEMBER"
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { deletionRequestedAt: true, memberBalance: true } })
      : null;

  // 2FA opsional untuk coach/member/pemilik kolam (admin wajib, diurus di
  // /keamanan lewat pengalihan otomatis).
  const totp =
    session.user.role !== "ADMIN"
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { totpEnabledAt: true } })
      : null;

  // Kota domisili member & coach (Hadi 3 Okt), bisa diganti di sini.
  const cityUser =
    session.user.role === "MEMBER" || session.user.role === "COACH"
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { city: true } })
      : null;
  const { error } = await searchParams;

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel[session.user.role] ?? session.user.role}
      links={roleNavLinks[session.user.role]}
      avatarUrl={coachProfile?.photoUrl}
    >
      <main className="w-full px-4 pb-16 py-6 sm:pb-8 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Profil Saya</h1>

        {/* Dua kolom eksplisit (bukan grid auto): kartu "Nama" pendek, jadi
            kalau pakai grid biasa muncul lubang besar di bawahnya sebelum
            kartu berikutnya (Hadi 18 Sep). */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-4">
            <Card>
              <CardBody>
                <h2 className="mb-3 text-lg font-semibold text-text">Nama</h2>
                <EditNameForm
                  currentName={session.user.name ?? ""}
                  label={session.user.role === "MEMBER" ? "Nama orang tua / pemilik akun" : "Nama Lengkap"}
                />
              </CardBody>
            </Card>

            {cityUser && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Kota domisili</h2>
                  <p className="mb-3 text-sm text-text-muted">
                    {session.user.role === "COACH"
                      ? "Kolam di kota ini tampil lebih dulu di menu Kolam Saya."
                      : "Kolam dan coach di kota ini tampil lebih dulu saat membeli paket."}
                  </p>
                  <form action={saveMyCity} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="from" value="profil" />
                    <CitySelect defaultValue={cityUser.city ?? ""} aria-label="Kota domisili" className="min-w-48 flex-1" />
                    <Button type="submit" variant="secondary">Simpan kota</Button>
                  </form>
                  {error === "kota" && <p role="alert" className="mt-2 text-sm text-danger-text">Pilih kota dari daftar.</p>}
                </CardBody>
              </Card>
            )}

            {coachProfile && (
              <Card>
                <CardBody>
                  <h2 className="mb-3 text-lg font-semibold text-text">Foto &amp; Sertifikat</h2>
                  <CoachMediaForm
                    photoUrl={coachProfile.photoUrl}
                    certificates={coachProfile.certificates}
                    defaultCertificateName={coachProfile.certificationNote}
                    signatureUrl={coachProfile.signaturePath ? await signedObjectUrl(CERT_BUCKET, coachProfile.signaturePath) : null}
                    hasSignature={!!coachProfile.signaturePath}
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

            {totp && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Verifikasi 2 Langkah (2FA)</h2>
                  <p className="mb-3 text-sm text-text-muted">
                    {totp.totpEnabledAt
                      ? "Aktif — setiap masuk kamu diminta kode dari Google Authenticator."
                      : "Belum aktif. Tambahan pengaman: selain password, masuk juga butuh kode dari HP-mu."}
                  </p>
                  <a href="/keamanan" className="inline-block text-sm font-medium text-brand-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center">
                    {totp.totpEnabledAt ? "Kelola 2FA →" : "Pasang 2FA →"}
                  </a>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {coachProfile && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Profil Coach</h2>
                  <p className="mb-3 text-sm text-text-muted">Ditampilkan ke orang tua di halaman profil publik kamu.</p>
                  <EditCoachProfileForm profile={coachProfile} />
                </CardBody>
              </Card>
            )}

            {publicProfileLink && (
              <Card>
                <CardBody>
                  <h2 className="mb-1 text-lg font-semibold text-text">Link Profil Publik</h2>
                  <p className="mb-3 text-sm text-text-muted">
                    Kirim link ini ke calon member yang menanyakan jadwal atau kolammu. Link ini bisa dibuka siapa saja
                    tanpa perlu masuk.
                  </p>
                  <CopyLinkButton link={publicProfileLink} />
                </CardBody>
              </Card>
            )}

            {deletionAccount && (
              <DeleteAccountCard
                requestedAt={deletionAccount.deletionRequestedAt?.toISOString() ?? null}
                memberBalance={deletionAccount.memberBalance}
              />
            )}

            {session.user.role === "MEMBER" && (
              <p className="text-sm text-text-muted">
                Tambah atau ubah peserta les ada di menu{" "}
                <a href="/member/peserta" className="font-medium text-brand-700 underline">
                  Peserta
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </main>
    </NavBar>
  );
}
