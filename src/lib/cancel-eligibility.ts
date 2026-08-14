import { prisma } from "@/lib/prisma";
import { CANCEL_QUOTA_PER_PACKAGE, CANCEL_WINDOW_HOURS } from "@/lib/policy";

export async function checkCancelEligibility(booking: {
  memberId: string;
  packageId: string;
  startTime: Date;
}): Promise<{ canCancel: boolean; reason?: string }> {
  const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilStart < CANCEL_WINDOW_HOURS) {
    return {
      canCancel: false,
      reason: `Pembatalan hanya bisa dilakukan minimal ${CANCEL_WINDOW_HOURS} jam sebelum jadwal.`,
    };
  }

  const selfCancelCount = await prisma.booking.count({
    where: {
      memberId: booking.memberId,
      packageId: booking.packageId,
      status: "CANCELLED",
      cancelledBy: "MEMBER",
    },
  });

  if (selfCancelCount >= CANCEL_QUOTA_PER_PACKAGE) {
    return {
      canCancel: false,
      reason: `Jatah pembatalan mandiri (${CANCEL_QUOTA_PER_PACKAGE}x per paket) udah abis. Hubungi admin buat kasus khusus.`,
    };
  }

  return { canCancel: true };
}
