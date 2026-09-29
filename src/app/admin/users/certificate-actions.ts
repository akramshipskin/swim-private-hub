"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Setujui/tolak 1 sertifikat coach. Cuma yang masih PENDING yang bisa
// diputuskan (CAS), biar klik ganda / 2 admin gak saling timpa. Sertifikat
// yang keburu dihapus coach = 0 baris, diam saja.
export async function reviewCertificate(certificateId: string, approve: boolean) {
  await requireRole("ADMIN");
  await prisma.coachCertificate.updateMany({
    where: { id: certificateId, status: "PENDING" },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewedAt: new Date() },
  });
  revalidatePath("/", "layout");
}
