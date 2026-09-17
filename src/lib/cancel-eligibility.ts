import { prisma } from "@/lib/prisma";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";

export async function getCancelQuotaUsage(
  memberId: string,
  packageId: string,
): Promise<{ quota: number; used: number }> {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: { jatahCancel: true },
  });

  const used = await prisma.booking.count({
    where: { memberId, packageId, status: "CANCELLED", cancelledBy: "MEMBER" },
  });

  return { quota: pkg?.jatahCancel ?? 0, used };
}

export function evaluateCancelEligibility({
  quota,
  used,
  startTime,
}: {
  quota: number;
  used: number;
  startTime: Date;
}): { canCancel: boolean; reason?: string; used: number; quota: number } {
  const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilStart < CANCEL_WINDOW_HOURS) {
    return {
      canCancel: false,
      reason: `Pembatalan hanya bisa dilakukan minimal ${CANCEL_WINDOW_HOURS} jam sebelum jadwal.`,
      used,
      quota,
    };
  }

  if (used >= quota) {
    return {
      canCancel: false,
      reason: "Jatah pembatalan mandiri sudah habis. Ajukan ke admin buat kasus khusus.",
      used,
      quota,
    };
  }

  return { canCancel: true, used, quota };
}

// Dipertahankan buat caller yang cuma butuh 1 booking (mis. route availability
// yang cek 1 slot spesifik) -- jangan dipanggil dalam loop, pakai
// getCancelQuotaUsage + evaluateCancelEligibility langsung buat banyak
// booking sekaligus (lihat member/riwayat/page.tsx).
export async function checkCancelEligibility(booking: {
  memberId: string;
  packageId: string;
  startTime: Date;
}): Promise<{ canCancel: boolean; reason?: string; used: number; quota: number }> {
  const { quota, used } = await getCancelQuotaUsage(booking.memberId, booking.packageId);
  return evaluateCancelEligibility({ quota, used, startTime: booking.startTime });
}
