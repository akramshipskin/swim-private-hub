"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { markWithdrawalFailed, markWithdrawalPaid } from "@/lib/withdrawal";
import { disburseViaIris, isIrisConfigured } from "@/lib/disbursement";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string } | null;

// Proses 1 pengajuan -- kalau Iris udah dikonfigurasi, panggil API-nya
// beneran (otomatis PAID/FAILED). Kalau belum, ini cuma nge-flag admin
// harus transfer manual lalu klik tombol "Tandai Dibayar" terpisah.
export async function processWithdrawal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const withdrawalId = formData.get("withdrawalId") as string;
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!request || request.status !== "PENDING") {
    return { error: "Pengajuan gak ditemukan atau udah diproses." };
  }

  if (!isIrisConfigured()) {
    return {
      error:
        "Midtrans Iris belum dikonfigurasi -- transfer manual dulu, lalu klik \"Tandai Dibayar\".",
    };
  }

  const claim = await prisma.withdrawalRequest.updateMany({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  if (claim.count === 0) {
    return { error: "Pengajuan gak ditemukan atau udah diproses." };
  }

  const result = await disburseViaIris({
    amount: request.amount,
    bankName: request.bankName,
    bankAccountNumber: request.bankAccountNumber,
    bankAccountName: request.bankAccountName,
    referenceNo: request.id,
  });

  if (result.success) {
    await markWithdrawalPaid(withdrawalId, result.midtransReferenceId);
  } else {
    await markWithdrawalFailed(withdrawalId, result.reason);
  }

  revalidatePath("/admin/withdrawals");
  return null;
}

export async function markPaidManually(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const withdrawalId = formData.get("withdrawalId") as string;
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!request || (request.status !== "PENDING" && request.status !== "PROCESSING")) {
    return { error: "Pengajuan gak ditemukan atau udah diproses." };
  }

  const claimed = await markWithdrawalPaid(withdrawalId);
  revalidatePath("/admin/withdrawals");
  if (!claimed) {
    return { error: "Pengajuan ini barusan udah diproses (dibayar/ditolak). Refresh dulu." };
  }
  return null;
}

export async function rejectWithdrawal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const withdrawalId = formData.get("withdrawalId") as string;
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!request || (request.status !== "PENDING" && request.status !== "PROCESSING")) {
    return { error: "Pengajuan gak ditemukan atau udah diproses." };
  }

  const claimed = await markWithdrawalFailed(withdrawalId, "Ditolak admin");
  revalidatePath("/admin/withdrawals");
  if (!claimed) {
    return { error: "Pengajuan ini barusan udah diproses (dibayar/ditolak). Refresh dulu." };
  }
  return null;
}
