import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { activePackageWhere } from "@/lib/active-package";

class BookingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { availabilityId } = (await request.json()) as {
    availabilityId?: string;
  };

  if (!availabilityId) {
    return Response.json(
      { error: "availabilityId wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Package dengan sisa sesi paling lama dulu dipakai (FIFO), harus
      // ACTIVE, punya sisa sesi, dan belum lewat masa berlaku (kalau ada).
      const pkg = await tx.package.findFirst({
        where: activePackageWhere(session.user.id),
        orderBy: { createdAt: "asc" },
      });

      if (!pkg) {
        throw new BookingError(
          "Kuota sesi habis, paket belum aktif, atau udah kedaluwarsa. Beli/perpanjang paket dulu.",
          409
        );
      }

      // Klaim atomic: cuma berhasil kalau slot masih AVAILABLE. Ini yang
      // bikin "war booking" aman -- 2 request bersamaan cuma 1 yang lolos,
      // dijamin row-level lock Postgres di dalam transaksi ini.
      const claim = await tx.availability.updateMany({
        where: { id: availabilityId, status: "AVAILABLE" },
        data: { status: "BOOKED" },
      });

      if (claim.count === 0) {
        throw new BookingError(
          "Slot ini baru aja diambil member lain, coba pilih slot lain.",
          409
        );
      }

      await tx.package.update({
        where: { id: pkg.id },
        data: { sisaSesi: { decrement: 1 } },
      });

      return tx.booking.create({
        data: {
          memberId: session.user.id,
          availabilityId,
          packageId: pkg.id,
          status: "BOOKED",
        },
        include: { availability: { include: { coach: true } } },
      });
    });

    // Push notif best-effort -- gagal kirim gak boleh gagalin booking
    // yang udah sukses tersimpan di DB.
    sendPushToUser(session.user.id, {
      title: "Booking berhasil",
      body: `${booking.availability.coach.name}, ${formatDateLabel(booking.availability.date)} ${formatTimeWib(booking.availability.startTime)}`,
      url: "/member/riwayat",
    }).catch(() => {});

    return Response.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    // Unique constraint di Booking.availabilityId sebagai lapis kedua
    // kalau ada race condition yang lolos dari conditional update di atas.
    return Response.json(
      { error: "Slot ini baru aja diambil member lain, coba pilih slot lain." },
      { status: 409 }
    );
  }
}
