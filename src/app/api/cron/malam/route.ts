import { cronAuthorized } from "@/lib/cron-auth";
import { sendSessionReminders } from "@/lib/scheduled-notices";

// Pemeriksa malam (Vercel Cron 18.00 WIB, lihat vercel.json): pengingat sesi
// besok (Hadi 9 Okt). Pengingat pagi ikut pemeriksa harian 06.00.
export async function GET(request: Request) {
  if (!cronAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const remindersSent = await sendSessionReminders("evening");
  return Response.json({ ok: true, remindersSent });
}
