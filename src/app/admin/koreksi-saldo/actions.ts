"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/require-role";
import { formNumber } from "@/lib/format";
import { AdjustmentError, createWalletAdjustment } from "@/lib/wallet-adjustment";
import { notifyWalletAdjustment } from "@/lib/withdrawal-notify";

// id = kunci kiriman: berubah tiap koreksi berhasil, dipakai formulir untuk
// mengosongkan isiannya.
export type WalletAdjustState = { error?: string; ok?: boolean; id?: string } | null;

// Koreksi saldo coach/kolam (lihat src/lib/wallet-adjustment.ts). Arah dipilih
// terpisah dari nominal supaya admin tidak perlu mengetik tanda minus.
export async function adjustWallet(_state: WalletAdjustState, formData: FormData): Promise<WalletAdjustState> {
  const session = await requireRole("ADMIN");
  const targetType = formData.get("targetType");
  const targetId = String(formData.get("targetId") ?? "");
  const direction = formData.get("direction");
  const source = formData.get("source");
  const nominal = formNumber(formData, "amount");

  if ((targetType !== "pool" && targetType !== "coach") || !targetId) return { error: "Formulir tidak lengkap, muat ulang halaman." };
  if (direction !== "credit" && direction !== "debit") return { error: "Pilih tambah atau kurangi saldo." };
  if (source !== "platform" && source !== "none") return { error: "Pilih sumber dana koreksi." };
  if (!Number.isInteger(nominal) || nominal <= 0) return { error: "Isi nominal koreksi." };

  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  const target = targetType === "pool" ? { poolId: targetId } : { coachProfileId: targetId };
  const amount = direction === "credit" ? nominal : -nominal;
  try {
    const row = await createWalletAdjustment({
      target,
      amount,
      reason: String(formData.get("reason") ?? ""),
      fromPlatform: source === "platform",
      adminId: session.user.id,
      idempotencyKey,
    });
    // null = kiriman ganda yang sudah tercatat: jangan kirim notifikasi dua kali.
    if (row) await notifyWalletAdjustment(target, amount, row.note ?? "");
  } catch (err) {
    if (err instanceof AdjustmentError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin/koreksi-saldo");
  revalidatePath("/admin/users/[userId]", "page");
  revalidatePath(targetType === "pool" ? "/pool/saldo" : "/coach/saldo");
  revalidatePath("/admin/komisi");
  revalidatePath("/admin/kolam");
  revalidatePath("/admin");
  return { ok: true, id: idempotencyKey };
}
