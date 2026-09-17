"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { requestPoolWithdrawal, WithdrawalError } from "@/lib/withdrawal";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; ok?: boolean } | null;

// poolId dioper dari client (via .bind pas render, lihat page.tsx) --
// WAJIB diverifikasi di sini kalau poolId itu beneran punya userId ini
// (bukan cuma percaya form), soalnya 1 user sekarang bisa punya lebih
// dari 1 kolam dan poolId gak lagi bisa diturunin sendirian dari
// session kayak dulu (findFirst by ownerUserId).
async function getOwnedPool(userId: string, poolId: string) {
  const pool = await prisma.pool.findFirst({
    where: { id: poolId, ownerships: { some: { ownerId: userId } } },
  });
  if (!pool) throw new WithdrawalError("Kolam ini bukan milik akun kamu.");
  return pool;
}

export async function updateBankInfo(
  poolId: string,
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
    const pool = await getOwnedPool(session.user.id, poolId);
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

export async function requestWithdrawal(
  poolId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("POOL_OWNER");

  try {
    const pool = await getOwnedPool(session.user.id, poolId);
    await requestPoolWithdrawal(pool.id, Number(formData.get("amount")));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal ajukan pencairan" };
  }

  revalidatePath("/pool/saldo");
  return { ok: true };
}
