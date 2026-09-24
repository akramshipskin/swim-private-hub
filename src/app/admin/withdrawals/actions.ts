"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { markWithdrawalFailed, markWithdrawalPaid } from "@/lib/withdrawal";
import { disburseViaIris, isIrisConfigured } from "@/lib/disbursement";
import { notifyWithdrawalOutcome } from "@/lib/withdrawal-notify";
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
    return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
  }

  if (!isIrisConfigured()) {
    return {
      error:
        "Midtrans Iris belum dikonfigurasi — transfer manual dulu, lalu klik \"Tandai Dibayar\".",
    };
  }

  const claim = await prisma.withdrawalRequest.updateMany({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  if (claim.count === 0) {
    return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
  }

  const result = await disburseViaIris({
    amount: request.amount,
    bankName: request.bankName,
    bankAccountNumber: request.bankAccountNumber,
    bankAccountName: request.bankAccountName,
    referenceNo: request.id,
  });

  if (result.success) {
    if (await markWithdrawalPaid(withdrawalId, result.midtransReferenceId)) {
      await notifyWithdrawalOutcome(withdrawalId, "PAID");
    }
  } else if (result.definite) {
    if (await markWithdrawalFailed(withdrawalId, result.reason)) {
      await notifyWithdrawalOutcome(withdrawalId, "FAILED");
    }
  } else {
    // Hasil gak pasti: transfer mungkin udah jalan. Saldo JANGAN
    // dibalikin -- biarin PROCESSING sampai admin cek dashboard Iris.
    await prisma.withdrawalRequest.updateMany({
      where: { id: withdrawalId, status: "PROCESSING" },
      data: { failureReason: `Status belum pasti, cek dashboard Iris: ${result.reason}` },
    });
    revalidatePath("/admin/withdrawals");
    return {
      error:
        "Status transfer dari Iris belum pasti. Cek dashboard Iris dulu, lalu klik \"Tandai Dibayar\" atau \"Tandai Gagal\".",
    };
  }

  revalidatePath("/admin/withdrawals");
  return null;
}

export async function markPaidManually(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const withdrawalId = formData.get("withdrawalId") as string;
  // Bukti transfer wajib (keputusan Hadi 25 Sep): nomor referensi dari
  // m-banking, supaya tiap pencairan manual bisa dicocokkan ke mutasi bank.
  const transferReference = (formData.get("transferReference") as string | null)?.trim() ?? "";
  if (transferReference.length < 4 || transferReference.length > 100) {
    return { error: "Isi nomor referensi transfer dari m-banking (minimal 4 karakter)." };
  }
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!request || (request.status !== "PENDING" && request.status !== "PROCESSING")) {
    return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
  }

  const claimed = await markWithdrawalPaid(withdrawalId, undefined, { transferReference, processedById: session.user.id });
  revalidatePath("/admin/withdrawals");
  if (!claimed) {
    return { error: "Pengajuan ini baru saja diproses (dibayar/ditolak). Muat ulang halaman dulu." };
  }
  await notifyWithdrawalOutcome(withdrawalId, "PAID");
  return null;
}

export async function rejectWithdrawal(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const withdrawalId = formData.get("withdrawalId") as string;
  const confirmedFailed = formData.get("confirmedFailed") === "true";
  const request = await prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  if (!request || (request.status !== "PENDING" && request.status !== "PROCESSING")) {
    return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
  }
  // PROCESSING = udah dikirim ke Iris; nolak tanpa cek bisa bikin transfer
  // tetep jalan DAN saldo dibalikin (uang keluar 2x). Cuma boleh kalau
  // admin eksplisit konfirmasi udah cek gagal di dashboard Iris.
  if (request.status === "PROCESSING" && !confirmedFailed) {
    return { error: "Pengajuan ini sedang diproses Iris. Cek dashboard Iris dulu." };
  }

  const claimed = await markWithdrawalFailed(
    withdrawalId,
    request.status === "PROCESSING" ? "Gagal di Iris (dicek admin)" : "Ditolak admin",
    session.user.id
  );
  revalidatePath("/admin/withdrawals");
  if (!claimed) {
    return { error: "Pengajuan ini baru saja diproses (dibayar/ditolak). Muat ulang halaman dulu." };
  }
  await notifyWithdrawalOutcome(withdrawalId, "FAILED");
  return null;
}
