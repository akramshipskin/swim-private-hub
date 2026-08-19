"use server";

import { requireRole } from "@/lib/require-role";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { revalidatePath } from "next/cache";
import { emitBookingChanged } from "@/lib/booking-events";

export type ActionState = { error?: string } | null;

// Admin cancel: override total, gak kena window 2 jam atau jatah kuota
// member -- buat kasus khusus (member gak bisa hadir, force majeure, dst).
export async function adminCancelBooking(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const bookingId = formData.get("bookingId") as string;

  try {
    await cancelBooking({ bookingId, actor: { role: "ADMIN" } });
  } catch (err) {
    if (err instanceof CancelError) return { error: err.message };
    return { error: "Gagal membatalkan booking, coba lagi." };
  }

  emitBookingChanged();
  revalidatePath("/admin/booking-overview");
  return null;
}
