"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
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

// Approve pengajuan pembatalan member: batalin booking-nya (sama kayak
// admin cancel biasa -- sesi kepakenya balik ke paket) terus tandain
// pengajuannya APPROVED.
export async function approveCancelRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const requestId = formData.get("requestId") as string;
  const cr = await prisma.cancelRequest.findUnique({ where: { id: requestId } });

  if (!cr || cr.status !== "PENDING") {
    return { error: "Pengajuan gak ditemukan atau udah diproses." };
  }

  try {
    await cancelBooking({ bookingId: cr.bookingId, actor: { role: "ADMIN" } });
  } catch (err) {
    if (err instanceof CancelError) return { error: err.message };
    return { error: "Gagal approve, coba lagi." };
  }

  await prisma.cancelRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", decidedAt: new Date() },
  });

  emitBookingChanged();
  revalidatePath("/admin/booking-overview");
  return null;
}

// Reject: booking tetep BOOKED, sesi tetep kepotong -- gak ada refund.
export async function rejectCancelRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const requestId = formData.get("requestId") as string;

  await prisma.cancelRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", decidedAt: new Date() },
  });

  revalidatePath("/admin/booking-overview");
  return null;
}
