"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { requestCoachWithdrawal, WithdrawalError } from "@/lib/withdrawal";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; ok?: boolean } | null;

async function getOwnCoachProfile(userId: string) {
  const profile = await prisma.coachProfile.findUnique({ where: { userId } });
  if (!profile) throw new WithdrawalError("Profil coach tidak ditemukan.");
  return profile;
}

export async function updateBankInfo(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("COACH");

  const bankName = (formData.get("bankName") as string)?.trim();
  const bankAccountNumber = (formData.get("bankAccountNumber") as string)?.trim();
  const bankAccountName = (formData.get("bankAccountName") as string)?.trim();

  if (!bankName || !bankAccountNumber || !bankAccountName) {
    return { error: "Semua field rekening wajib diisi." };
  }

  try {
    const profile = await getOwnCoachProfile(session.user.id);
    await prisma.coachProfile.update({
      where: { id: profile.id },
      data: { bankName, bankAccountNumber, bankAccountName },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal update rekening" };
  }

  revalidatePath("/coach/saldo");
  return { ok: true };
}

export async function requestWithdrawal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("COACH");

  try {
    const profile = await getOwnCoachProfile(session.user.id);
    await requestCoachWithdrawal(profile.id, Number(formData.get("amount")));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal ajukan pencairan" };
  }

  revalidatePath("/coach/saldo");
  return { ok: true };
}
