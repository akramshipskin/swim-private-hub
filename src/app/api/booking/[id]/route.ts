import { auth } from "@/auth";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { emitBookingChanged } from "@/lib/booking-events";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await cancelBooking({
      bookingId: id,
      actor: { role: "MEMBER", memberId: session.user.id },
    });
    emitBookingChanged();
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof CancelError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
