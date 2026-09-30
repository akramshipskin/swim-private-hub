"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";

// Setujui/tolak 1 sertifikat coach. Cuma yang masih PENDING yang bisa
// diputuskan (CAS), biar klik ganda / 2 admin gak saling timpa. Sertifikat
// yang keburu dihapus coach = 0 baris, diam saja.
export async function reviewCertificate(certificateId: string, approve: boolean) {
  await requireRole("ADMIN");
  const { count } = await prisma.coachCertificate.updateMany({
    where: { id: certificateId, status: "PENDING" },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewedAt: new Date() },
  });
  // Kabari coach hanya kalau keputusan ini benar-benar terjadi (bukan klik ganda).
  if (count > 0) {
    const cert = await prisma.coachCertificate.findUnique({
      where: { id: certificateId },
      select: { name: true, coachProfile: { select: { userId: true } } },
    });
    if (cert) {
      await notifyUser(
        cert.coachProfile.userId,
        approve ? "Sertifikat disetujui" : "Sertifikat ditolak",
        approve ? `"${cert.name}" disetujui, badge Bersertifikat tampil di profil kamu.` : `"${cert.name}" tidak disetujui. Unggah ulang bila perlu.`,
        "/profil"
      );
    }
  }
  revalidatePath("/", "layout");
}
