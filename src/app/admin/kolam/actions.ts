"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { removeOpenSlots } from "@/lib/availability";
import { formNumber } from "@/lib/format";
import { PENDING_APPROVAL_WHERE } from "@/lib/pending-approval";

export type ActionState = { error?: string } | null;

export async function affiliateCoach(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const poolId = formData.get("poolId") as string;
  const coachId = formData.get("coachId") as string;
  if (!poolId || !coachId) {
    return { error: "Pilih coach dulu." };
  }
  const coach = await prisma.user.findFirst({ where: { id: coachId, role: "COACH", isActive: true }, select: { id: true } });
  if (!coach) {
    return { error: "Coach tidak ditemukan atau belum aktif. Aktifkan dulu di Kelola User." };
  }

  // upsert Prisma bukan atomic di DB -- 2 submit barengan bisa dua-duanya
  // nyoba create dan yang kalah kena unique constraint (P2002), yang dulu
  // bikin halaman error. Afiliasinya udah ada = tujuan tercapai, abaikan.
  await prisma.poolAffiliation
    .upsert({
      where: { poolId_coachId: { poolId, coachId } },
      update: {},
      create: { poolId, coachId },
    })
    .catch((err: { code?: string }) => {
      if (err?.code !== "P2002") throw err;
    });

  revalidatePath("/admin/kolam");
  return null;
}

export async function removeAffiliation(formData: FormData) {
  await requireRole("ADMIN");
  const affiliationId = formData.get("affiliationId") as string;
  const affiliation = await prisma.poolAffiliation.findUnique({ where: { id: affiliationId } });
  if (!affiliation) {
    revalidatePath("/admin/kolam");
    return;
  }
  // Coach yang dicopot dari kolam dulu slot kosongnya ke depan di kolam itu
  // tetep kebuka & bisa dibooking member. Slot yang udah dibooking
  // dibiarin -- itu janji ke member, dibatalin manual kalau perlu.
  // Slot kosong yang pernah dibooking ditutup, bukan dihapus (riwayat tetap).
  await prisma.$transaction(async (tx) => {
    await tx.poolAffiliation.deleteMany({ where: { id: affiliationId } });
    await removeOpenSlots({ coachId: affiliation.coachId, poolId: affiliation.poolId, startTime: { gt: new Date() } }, tx);
  });
  revalidatePath("/admin/kolam");
}

// Approve/nonaktifin kolam -- kolam yang isActive:false (baru daftar
// sendiri, belum di-review) otomatis gak keliatan di dropdown booking
// member (lihat member/booking/page.tsx), jadi gak bisa nerima booking
// sebelum admin approve.
export async function togglePoolActive(poolId: string, nextActive: boolean) {
  await requireRole("ADMIN");

  await prisma.$transaction(async (tx) => {
    await tx.pool.update({
      where: { id: poolId },
      data: { isActive: nextActive },
    });
    // Keputusan Hadi 25 Sep (opsi A): menyetujui kolam sekaligus menyetujui
    // pemiliknya -- HANYA pendaftar baru yang belum pernah disetujui. Pemilik
    // yang sengaja dinonaktifkan (sudah punya approvedAt) tidak disentuh.
    if (nextActive) {
      await tx.user.updateMany({
        where: { ...PENDING_APPROVAL_WHERE, role: "POOL_OWNER", poolOwnerships: { some: { poolId } } },
        data: { isActive: true, approvedAt: new Date() },
      });
    }
  });

  revalidatePath("/admin/kolam");
  revalidatePath("/admin/users");
}

export async function updatePoolShares(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const poolId = formData.get("poolId") as string;
  const commissionPercent = formNumber(formData, "commissionPercent");
  const coachSharePercent = formNumber(formData, "coachSharePercent");

  if (
    !Number.isInteger(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100 ||
    !Number.isInteger(coachSharePercent) ||
    coachSharePercent < 0 ||
    coachSharePercent > 100
  ) {
    return { error: "Persentase harus angka 0-100." };
  }
  // Sisa (100 - commission - coach) itu bagian kolam -- kalau dua-duanya
  // udah >100, gak ada sisa buat kolam sama sekali, itu jelas salah input.
  if (commissionPercent + coachSharePercent > 100) {
    return { error: "Total komisi platform + komisi coach tidak boleh lebih dari 100%." };
  }

  await prisma.pool.update({
    where: { id: poolId },
    data: { commissionPercent, coachSharePercent },
  });

  revalidatePath("/admin/kolam");
  return null;
}
