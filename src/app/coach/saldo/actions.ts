"use server";

import { validateBankName, normalizeBankAccount } from "@/lib/banks";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { requestCoachWithdrawal, WithdrawalError } from "@/lib/withdrawal";
import { notifyAdminsWithdrawalRequested } from "@/lib/withdrawal-notify";
import { revalidatePath } from "next/cache";
import { sealSecret } from "@/lib/secret-box";
import { userErrorMessage } from "@/lib/user-error";

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
    return { error: "Semua data rekening wajib diisi." };
  }
  const bankError = validateBankName(bankName);
  if (bankError) return { error: bankError };
  const account = normalizeBankAccount(bankAccountNumber, bankAccountName);
  if ("error" in account) return { error: account.error };

  try {
    const profile = await getOwnCoachProfile(session.user.id);
    await prisma.coachProfile.update({
      where: { id: profile.id },
      // Nomor rekening disimpan terenkripsi (src/lib/secret-box.ts).
      data: { bankName, bankAccountNumber: sealSecret(account.number), bankAccountName },
    });
  } catch (err) {
    return { error: userErrorMessage(err, "Gagal menyimpan rekening. Coba lagi.") };
  }

  revalidatePath("/coach/saldo");
  return { ok: true };
}

export async function requestWithdrawal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("COACH");

  try {
    const profile = await getOwnCoachProfile(session.user.id);
    const request = await requestCoachWithdrawal(profile.id, Number(formData.get("amount")));
    await notifyAdminsWithdrawalRequested(session.user.name ?? "Coach", request.amount);
  } catch (err) {
    return { error: userErrorMessage(err, "Gagal mengajukan penarikan. Coba lagi.") };
  }

  revalidatePath("/coach/saldo");
  return { ok: true };
}
