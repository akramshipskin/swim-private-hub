import { prisma } from "@/lib/prisma";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";

export async function checkCancelEligibility(booking: {
  memberId: string;
  packageId: string;
  startTime: Date;
}): Promise<{ canCancel: boolean; reason?: string; used: number; quota: number }> {
  const pkg = await prisma.package.findUnique({
    where: { id: booking.packageId },
    select: { jatahCancel: true },
  });
  const quota = pkg?.jatahCancel ?? 0;

  const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

  const selfCancelCount = await prisma.booking.count({
    where: {
      memberId: booking.memberId,
      packageId: booking.packageId,
      status: "CANCELLED",
      cancelledBy: "MEMBER",
    },
  });

  if (hoursUntilStart < CANCEL_WINDOW_HOURS) {
    return {
      canCancel: false,
      reason: `Pembatalan hanya bisa dilakukan minimal ${CANCEL_WINDOW_HOURS} jam sebelum jadwal.`,
      used: selfCancelCount,
      quota,
    };
  }

  if (selfCancelCount >= quota) {
    return {
      canCancel: false,
      reason: "Jatah pembatalan mandiri udah abis. Ajukan ke admin buat kasus khusus.",
      used: selfCancelCount,
      quota,
    };
  }

  return { canCancel: true, used: selfCancelCount, quota };
}
