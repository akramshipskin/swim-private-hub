"use server";

import { requireRole } from "@/lib/require-role";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { revalidatePath } from "next/cache";
import { emitBookingChanged } from "@/lib/booking-events";

// Admin cancel: override total, gak kena window 2 jam atau jatah kuota
// member -- buat kasus khusus (member gak bisa hadir, force majeure, dst).
export async function adminCancelBooking(bookingId: string) {
  await requireRole("ADMIN");

  try {
    await cancelBooking({ bookingId, actor: { role: "ADMIN" } });
  } catch (err) {
    if (err instanceof CancelError) return;
    throw err;
  }

  emitBookingChanged();
  revalidatePath("/admin/booking-overview");
}
