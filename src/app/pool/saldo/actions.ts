"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { requestPoolWithdrawal, WithdrawalError } from "@/lib/withdrawal";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; ok?: boolean } | null;

async function getOwnedPool(userId: string) {
  const pool = await prisma.pool.findFirst({ where: { ownerUserId: userId } });
  if (!pool) throw new WithdrawalError("Akun ini belum ke-link ke kolam manapun.");
  return pool;
}

export async function updateBankInfo(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("POOL_OWNER");

  const bankName = (formData.get("bankName") as string)?.trim();
  const bankAccountNumber = (formData.get("bankAccountNumber") as string)?.trim();
  const bankAccountName = (formData.get("bankAccountName") as string)?.trim();

  if (!bankName || !bankAccountNumber || !bankAccountName) {
    return { error: "Semua field rekening wajib diisi." };
  }

  try {
    const pool = await getOwnedPool(session.user.id);
    await prisma.pool.update({
      where: { id: pool.id },
      data: { bankName, bankAccountNumber, bankAccountName },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal update rekening" };
  }

  revalidatePath("/pool/saldo");
  return { ok: true };
}

export async function requestWithdrawal(): Promise<ActionState> {
  const session = await requireRole("POOL_OWNER");

  try {
    const pool = await getOwnedPool(session.user.id);
    await requestPoolWithdrawal(pool.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal ajuin pencairan" };
  }

  revalidatePath("/pool/saldo");
  return { ok: true };
}
