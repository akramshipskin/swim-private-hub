import { prisma } from "@/lib/prisma";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";

export class CancelError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Batalin booking secara atomic. Dua proteksi penting di sini:
 *
 * 1. Row lock di Package (`FOR UPDATE`) -- tanpa ini, 2+ request cancel
 *    bersamaan buat paket yang sama bisa SEMUA baca hitungan jatah
 *    pembatalan mandiri sebelum salah satu commit, jadi kuota "2x per
 *    paket" bisa ditembus (kejadian nyata, ketauan pas testing: 3
 *    cancel bareng semua lolos). Row lock bikin mereka antre satu-satu.
 * 2. Conditional update di Booking (`WHERE status = 'BOOKED'`) --
 *    cegah 2 request cancel yang nembak booking SAMA barengan (misal
 *    admin double-klik) dobel nambahin sisa sesi paket.
 */
export async function cancelBooking({
  bookingId,
  actor,
}: {
  bookingId: string;
  actor: { role: "MEMBER"; memberId: string } | { role: "ADMIN" };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { availability: true },
  });

  if (!booking) {
    throw new CancelError("Booking tidak ditemukan", 404);
  }

  if (actor.role === "MEMBER" && booking.memberId !== actor.memberId) {
    throw new CancelError("Booking tidak ditemukan", 404);
  }

  if (booking.status !== "BOOKED") {
    throw new CancelError("Booking ini sudah dibatalkan/selesai", 409);
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const [pkg] = await tx.$queryRaw<
          { jatahCancel: number }[]
        >`SELECT "jatahCancel" FROM "Package" WHERE id = ${booking.packageId} FOR UPDATE`;

        if (actor.role === "MEMBER") {
          const hoursUntilStart =
            (booking.availability.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

          if (hoursUntilStart < CANCEL_WINDOW_HOURS) {
            throw new CancelError(
              `Pembatalan hanya bisa dilakukan minimal ${CANCEL_WINDOW_HOURS} jam sebelum jadwal.`,
              409
            );
          }

          const selfCancelCount = await tx.booking.count({
            where: {
              memberId: booking.memberId,
              packageId: booking.packageId,
              status: "CANCELLED",
              cancelledBy: "MEMBER",
            },
          });

          const quota = pkg?.jatahCancel ?? 0;
          if (selfCancelCount >= quota) {
            throw new CancelError(
              `Jatah pembatalan mandiri (${quota}x per paket ini) udah abis. Ajukan ke admin buat kasus khusus.`,
              409
            );
          }
        }

        const claim = await tx.booking.updateMany({
          where: { id: bookingId, status: "BOOKED" },
          data: {
            status: "CANCELLED",
            cancelledBy: actor.role,
            cancelledAt: new Date(),
          },
        });

        if (claim.count === 0) {
          throw new CancelError("Booking ini sudah dibatalkan/selesai", 409);
        }

        await tx.availability.update({
          where: { id: booking.availabilityId },
          data: { status: "AVAILABLE" },
        });

        await tx.package.update({
          where: { id: booking.packageId },
          data: { sisaSesi: { increment: 1 } },
        });
      },
      { timeout: 10000, maxWait: 8000 }
    );
  } catch (err) {
    if (err instanceof CancelError) throw err;
    // P2028 = transaksi gak kebagian giliran/expired nunggu row lock
    // Package (banyak cancel bareng buat paket yang sama). Ini kalah
    // antre, bukan bug -- kasih pesan yang sama kayak race lainnya,
    // jangan biarin bocor jadi 500 mentah ke user.
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2028"
    ) {
      throw new CancelError(
        "Lagi banyak yang proses pembatalan bareng, coba lagi sebentar.",
        409
      );
    }
    throw err;
  }
}
