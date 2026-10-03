"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { formNumber, formatRupiah } from "@/lib/format";

export type RemitState = { error?: string; ok?: boolean } | null;

// Catat setoran titipan PPh 0,5% ke kantor pajak (Hadi 2 Okt). Tidak boleh
// melebihi titipan yang belum disetor; dikunci supaya klik ganda tidak dobel.
export async function recordPphRemittance(_prev: RemitState, formData: FormData): Promise<RemitState> {
  const session = await requireRole("ADMIN");
  const amount = formNumber(formData, "amount");
  const reference = formData.get("reference")?.toString().trim() ?? "";
  const note = formData.get("note")?.toString().trim() || null;
  if (!Number.isInteger(amount) || amount < 1) return { error: "Nominal setoran harus angka bulat minimal Rp 1." };
  if (reference.length < 3 || reference.length > 100) return { error: "Isi nomor bukti setor (NTPN/kode billing), 3–100 karakter." };
  const res = await withDedupeLock("pph-remittance", async (tx) => {
    const held = -((await tx.walletTransaction.aggregate({ where: { type: "PPH_WITHHELD" }, _sum: { amount: true } }))._sum.amount ?? 0);
    const paid = (await tx.pphRemittance.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;
    const outstanding = held - paid;
    if (amount > outstanding) return { error: `Melebihi titipan yang belum disetor (${formatRupiah(outstanding)}).` };
    await tx.pphRemittance.create({ data: { amount, reference, note: note?.slice(0, 300) ?? null, createdById: session.user.id } });
    return null;
  });
  if (res) return res;
  revalidatePath("/admin/komisi");
  return { ok: true };
}
