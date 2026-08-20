import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Sesi udah diverifikasi middleware (proxy.ts) sebelum request nyampe sini,
// termasuk cek isActive terbaru ke DB -- dioper lewat header biar gak perlu
// jalanin auth() ulang (query DB lagi) buat ngecek hal yang udah pasti sama.
// Kalau headernya gak ada (rute di luar cakupan middleware), redirect ke
// login sama seperti dulu waktu session-nya null.
export async function requireRole(role: "ADMIN" | "COACH" | "MEMBER") {
  const __t0 = Date.now();
  const h = await headers();
  console.log(`[TIMING2] requireRole (header read, no auth() call) took ${Date.now() - __t0}ms`);
  const id = h.get("x-session-user-id");
  const userRole = h.get("x-session-user-role") as "ADMIN" | "COACH" | "MEMBER" | null;

  if (!id || !userRole || userRole !== role) {
    redirect("/login");
  }

  return {
    user: {
      id,
      role: userRole,
      name: h.get("x-session-user-name") || null,
      email: h.get("x-session-user-email") || null,
      mustChangePassword: h.get("x-session-must-change-password") === "true",
    },
  };
}
