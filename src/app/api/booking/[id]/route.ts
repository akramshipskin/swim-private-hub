import { auth } from "@/auth";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { accountGateError } from "@/lib/require-role";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  }

  const gate = accountGateError(session.user);
  if (gate) return Response.json({ error: gate }, { status: 403 });

  const { id } = await params;

  try {
    await cancelBooking({
      bookingId: id,
      actor: { role: "MEMBER", memberId: session.user.id },
    });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof CancelError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
