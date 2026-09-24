"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cancelAccountDeletion, requestAccountDeletion } from "@/lib/account-deletion";
import { sendPushToRole } from "@/lib/push";

export type DeletionState = { error?: string; ok?: boolean } | null;

// Member mengajukan hapus akun; admin yang menyetujui (lihat
// src/app/admin/users/account-deletion-actions.ts).
export async function requestDeletionAction(): Promise<DeletionState> {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") return { error: "Hanya akun member yang bisa mengajukan hapus akun di sini." };
  if (await requestAccountDeletion(session.user.id)) {
    await sendPushToRole("ADMIN", {
      title: "Permintaan hapus akun",
      body: `${session.user.name ?? "Seorang member"} meminta akunnya dihapus.`,
      url: `/admin/users/${session.user.id}`,
    }).catch(() => {});
  }
  revalidatePath("/profil");
  return { ok: true };
}

export async function cancelDeletionAction(): Promise<DeletionState> {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") return { error: "Tidak punya akses." };
  await cancelAccountDeletion(session.user.id);
  revalidatePath("/profil");
  return { ok: true };
}
