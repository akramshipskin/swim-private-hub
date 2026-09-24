"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { anonymizeMember, AccountDeletionError } from "@/lib/account-deletion";

export async function anonymizeMemberAction(userId: string): Promise<{ error?: string; cancelledBookings?: number }> {
  await requireRole("ADMIN");
  try {
    const { cancelledBookings } = await anonymizeMember(userId);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { cancelledBookings };
  } catch (err) {
    if (err instanceof AccountDeletionError) return { error: err.message };
    throw err;
  }
}
