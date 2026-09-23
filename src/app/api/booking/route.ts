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
  // Proxy cuma nge-redirect halaman; API ini di luar matcher-nya, jadi
  // akun berpassword sementara dicegat di sini juga.
  if (session.user.mustChangePassword) {
    return Response.json({ error: "Ganti password sementara dulu sebelum booking." }, { status: 403 });
  }

  let body: { availabilityId?: string; packageId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const { availabilityId, packageId } = body;

  if (!availabilityId || !packageId) {
    return Response.json(
      { error: "availabilityId dan packageId wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Paket dipilih eksplisit sama member (1 paket = 1 anak, gak ada
      // FIFO lintas-anak lagi). Klaim atomic pake conditional updateMany
      // (compare-and-swap), BUKAN findFirst+update terpisah -- 2 request
      // booking bersamaan buat paket yang sama (2 slot beda) bisa
      // lolos dua-duanya kalau cuma baca sisaSesi dulu baru decrement
      // belakangan (sisaSesi bisa jadi negatif). WHERE di updateMany ini
      // sekaligus jadi IDOR guard (packageId bukan punya session.user.id
      // = gak ke-update), validasi eligibility (ACTIVE, ada sisa sesi,
      // belum kedaluwarsa), DAN klaim sesi, semuanya 1 query atomic.
      // Paket cuma berlaku di kolam tempat dibeli (revisi 2026-09-17) --
      // poolId slot dibaca dulu lalu jadi syarat klaim paket. poolId slot
      // gak pernah berubah, jadi baca-dulu di sini aman dari race.
      const slot = await tx.availability.findUnique({
        where: { id: availabilityId },
        select: { poolId: true, pool: { select: { isActive: true } } },
      });
      if (!slot) {
        throw new BookingError("Slot tidak ditemukan.", 404);
      }
      // Kolam dinonaktifin admin: booking BARU ditolak. Booking yang udah
      // ada gak disentuh (keputusan default, bisa diubah Hadi).
      if (!slot.pool.isActive) {
        throw new BookingError("Kolam ini sedang tidak aktif, belum bisa dibooking.", 409);
      }

      const claimPkg = await tx.package.updateMany({
        where: { ...activePackageWhere(session.user.id), id: packageId, poolId: slot.poolId },
        data: { sisaSesi: { decrement: 1 } },
      });

      if (claimPkg.count === 0) {
        throw new BookingError(
          "Paket ini tidak bisa dipakai untuk slot ini: paketnya untuk kolam lain, kuota sesi habis, belum aktif, atau sudah kedaluwarsa.",
          409
        );
      }

      // Klaim atomic: cuma berhasil kalau slot masih AVAILABLE. Ini yang
      // bikin "war booking" aman -- 2 request bersamaan cuma 1 yang lolos,
      // dijamin row-level lock Postgres di dalam transaksi ini.
      //
      // startTime > sekarang juga dicek di sini -- UI emang nyembunyiin slot
      // kosong yang udah lewat, tapi halaman yang dibiarin kebuka (atau
      // request langsung ke API) sebelumnya tetep bisa booking slot yang
      // jamnya udah lewat, sesi member kepotong buat jadwal yang mustahil.
      const claim = await tx.availability.updateMany({
        where: { id: availabilityId, status: "AVAILABLE", startTime: { gt: new Date() } },
        data: { status: "BOOKED" },
      });

      if (claim.count === 0) {
        throw new BookingError(
          "Slot ini sudah tidak bisa dibooking (baru saja diambil member lain, atau jamnya sudah lewat). Pilih slot lain.",
          409
        );
      }

      return tx.booking.create({
        data: {
          memberId: session.user.id,
          availabilityId,
          packageId,
          status: "BOOKED",
        },
        include: {
          availability: { include: { coach: true } },
          package: { include: { dependent: true } },
        },
      });
    });

    // Push notif best-effort -- gagal kirim gak boleh gagalin booking
    // yang udah sukses tersimpan di DB.
    sendPushToUser(session.user.id, {
      title: "Booking berhasil",
      body: `${booking.availability.coach.name}, ${formatDateLabel(booking.availability.date)} ${formatTimeWib(booking.availability.startTime)}`,
      url: "/member/riwayat",
    }).catch(() => {});

    sendPushToUser(booking.availability.coachId, {
      title: "Slot kamu dibooking",
      body: `${booking.package.dependent.name}, ${formatDateLabel(booking.availability.date)} ${formatTimeWib(booking.availability.startTime)}`,
      url: "/coach/jadwal",
    }).catch(() => {});

    return Response.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    // Unique constraint di Booking.availabilityId sebagai lapis kedua
    // kalau ada race condition yang lolos dari conditional update di atas.
    if ((err as { code?: string })?.code === "P2002") {
      return Response.json(
        { error: "Slot ini baru saja diambil member lain, coba pilih slot lain." },
        { status: 409 }
      );
    }
    // Error lain (DB putus, dll) jangan disamarin jadi "slot diambil orang".
    console.error("booking failed", err);
    return Response.json({ error: "Gagal memproses booking. Coba lagi sebentar." }, { status: 500 });
  }
}
