import { auth } from "@/auth";
import { countUnread, notificationGate } from "@/lib/notifications";

// Jumlah notifikasi belum dibaca untuk lencana lonceng. Diambil klien SETELAH
// halaman tampil (bukan di render server tiap halaman), supaya halaman tidak
// bertambah lambat. Hanya milik pengguna yang sedang masuk.
export async function GET() {
  const gate = notificationGate(await auth());
  if ("redirectTo" in gate) {
    const status = gate.redirectTo === "/login" ? 401 : 403;
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status, headers: { "Cache-Control": "no-store" } });
  }
  const count = await countUnread(gate.userId);
  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
