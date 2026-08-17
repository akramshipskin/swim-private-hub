import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Member ngajuin pembatalan ke admin pas jatah self-cancel paketnya udah
// abis (atau di luar window 2 jam). Gak langsung batalin -- admin yang
// approve/reject lewat /admin/booking-overview.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookingId } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking || booking.memberId !== session.user.id) {
    return Response.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  if (booking.status !== "BOOKED") {
    return Response.json({ error: "Booking ini udah gak aktif" }, { status: 409 });
  }

  const existing = await prisma.cancelRequest.findUnique({ where: { bookingId } });
  if (existing?.status === "PENDING") {
    return Response.json(
      { error: "Pengajuan buat booking ini udah ada, tunggu admin proses." },
      { status: 409 }
    );
  }

  await prisma.cancelRequest.upsert({
    where: { bookingId },
    create: {
      bookingId,
      memberId: session.user.id,
      packageId: booking.packageId,
      reason: reason || null,
    },
    update: { status: "PENDING", reason: reason || null, decidedAt: null, createdAt: new Date() },
  });

  return Response.json({ ok: true });
}
