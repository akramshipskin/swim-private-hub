import { prisma } from "@/lib/prisma";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";
import { sendPushToUser } from "@/lib/push";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";

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
 *
 * COACH sengaja disamain sama ADMIN (bypass window & jatah kuota member)
 * -- coach batalin sesi karena sakit/emergency bukan kesalahan dia mau
 * "ngirit" jatah pembatalan, dan gak fair kalau kepentok window yang
 * sama kayak member yang emang lagi coba cancel mepet.
 */
export async function cancelBooking({
  bookingId,
  actor,
}: {
  bookingId: string;
  actor: { role: "MEMBER"; memberId: string } | { role: "ADMIN" } | { role: "COACH"; coachId: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      availability: true,
      package: { include: { dependent: true } },
    },
  });

  if (!booking) {
    throw new CancelError("Booking tidak ditemukan", 404);
  }

  if (actor.role === "MEMBER" && booking.memberId !== actor.memberId) {
    throw new CancelError("Booking tidak ditemukan", 404);
  }

  if (actor.role === "COACH" && booking.availability.coachId !== actor.coachId) {
    throw new CancelError("Bukan sesi kamu", 403);
  }

  if (booking.status !== "BOOKED") {
    throw new CancelError("Booking ini sudah dibatalkan/selesai", 409);
  }

  // Sesi yang udah ditandai Hadir/Gak Hadir gak boleh dibatalin siapapun --
  // sebelumnya lolos: sisa sesi member balik +1 TAPI kredit wallet
  // coach/kolam yang udah masuk gak dibalik (duit & sesi kepake dobel).
  // Kebukti di tes race lokal 2026-09-17. Jalur koreksinya: ubah status
  // kehadiran (reverseSessionRevenue jalan), lalu koreksi sisa sesi di
  // menu Paket admin.
  if (booking.attended !== null) {
    throw new CancelError(
      "Sesi ini udah ditandai kehadirannya, gak bisa dibatalin. Kalau salah tandai, ubah status kehadirannya dulu, lalu koreksi sisa sesi di menu Paket.",
      409
    );
  }

  // Coach cuma boleh batalin sesi yang belum mulai -- sesi yang udah
  // lewat itu urusan absensi (Hadir/Gak Hadir), bukan pembatalan.
  if (actor.role === "COACH" && booking.availability.startTime <= new Date()) {
    throw new CancelError("Sesi ini udah mulai/lewat, gak bisa dibatalin. Tandai kehadirannya di Riwayat Sesi.", 409);
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
              "Jatah pembatalan mandiri udah abis. Ajukan ke admin buat kasus khusus.",
              409
            );
          }
        }

        // attended: null ikut di CAS -- nutup race batal vs tandai Hadir
        // barengan (pasangannya: markAttendance nge-CAS status BOOKED).
        const claim = await tx.booking.updateMany({
          where: { id: bookingId, status: "BOOKED", attended: null },
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

    // Best-effort -- gagal ngirim gak boleh gagalin pembatalan yang udah
    // sukses tersimpan. Coach yang cancel sendiri gak perlu dikabarin
    // soal aksinya sendiri -- yang perlu tau itu MEMBER-nya (sesi mereka
    // ilang), makanya arah notifnya kebalik dari cancel oleh member/admin.
    if (actor.role === "COACH") {
      sendPushToUser(booking.memberId, {
        title: "Booking dibatalkan coach",
        body: `${booking.package.dependent.name}, ${formatDateLabel(booking.availability.startTime)} ${formatTimeWib(booking.availability.startTime)} dibatalin coach. Sisa sesi udah balik.`,
        url: "/member/riwayat",
      }).catch(() => {});
    } else {
      sendPushToUser(booking.availability.coachId, {
        title: "Booking dibatalkan",
        body: `${booking.package.dependent.name}, ${formatDateLabel(booking.availability.startTime)} ${formatTimeWib(booking.availability.startTime)} udah kosong lagi`,
        url: "/coach/jadwal",
      }).catch(() => {});
    }
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
