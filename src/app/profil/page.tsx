import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Card, CardBody } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { roleNavLinks, roleLabel } from "@/lib/nav-links";
import EditNameForm from "./edit-name-form";
import EditPasswordForm from "./edit-password-form";
import ManageChildrenForm from "./manage-children-form";
import CopyLinkButton from "./copy-link-button";

export const metadata: Metadata = {
  title: "Profil | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");

  const children =
    session.user.role === "MEMBER"
      ? await prisma.dependent.findMany({
          where: { memberId: session.user.id },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, isActive: true, isSelf: true },
        })
      : null;

  // Halaman /pelatih/[coachId] publik (gak perlu login), tapi sebelum ini
  // gak ada satu pun tempat di app buat coach nemuin/nyalin link
  // profilnya sendiri -- satu-satunya link ke sana ada di member/cari-coach
  // yang butuh login. Coach gak bisa share apa-apa. Tambah di sini biar
  // coach bisa copy & kirim manual via WA, sesuai niat aslinya.
  const publicProfileLink =
    session.user.role === "COACH"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/pelatih/${session.user.id}`
      : null;
  const hasTrailingSection = children !== null || publicProfileLink !== null;

  return (
    <NavBar
      userName={session.user.name ?? ""}
      userRole={roleLabel[session.user.role] ?? session.user.role}
      links={roleNavLinks[session.user.role]}
    >
      <main className="mx-auto max-w-5xl [&>*]:max-w-xl px-4 pb-16 py-6 sm:pb-8 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Edit Profil</h1>

        <Card className="mb-4">
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-text">Nama</h2>
            <EditNameForm
              currentName={session.user.name ?? ""}
              label={session.user.role === "MEMBER" ? "Nama/Orang Tua" : "Nama Lengkap"}
            />
          </CardBody>
        </Card>

        <Card className={hasTrailingSection ? "mb-4" : undefined}>
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
                Kirim link ini ke calon member yang nanya jadwal/kolam kamu -- bisa dibuka
                siapa aja tanpa perlu login.
              </p>
              <CopyLinkButton link={publicProfileLink} />
            </CardBody>
          </Card>
        )}

        {children && (
          <Card>
            <CardBody>
              <h2 className="mb-3 text-lg font-semibold text-text">Anak</h2>
              <ManageChildrenForm children={children} />
            </CardBody>
          </Card>
        )}
      </main>
    </NavBar>
  );
}
