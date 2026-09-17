"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Setujui/tolak sertifikat coach. Cuma yang masih PENDING yang bisa
// diputuskan (CAS), biar klik ganda / 2 admin gak saling timpa.
export async function reviewCertificate(coachProfileId: string, approve: boolean) {
  await requireRole("ADMIN");
  await prisma.coachProfile.updateMany({
    where: { id: coachProfileId, certificateStatus: "PENDING" },
    data: { certificateStatus: approve ? "APPROVED" : "REJECTED", hasCertification: approve },
  });
  revalidatePath("/", "layout");
}
