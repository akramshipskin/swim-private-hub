import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Sesi udah diverifikasi middleware (proxy.ts) sebelum request nyampe sini,
// termasuk cek isActive terbaru ke DB -- dioper lewat header biar gak perlu
// jalanin auth() ulang (query DB lagi) buat ngecek hal yang udah pasti sama.
// Kalau headernya gak ada (rute di luar cakupan middleware), redirect ke
// login sama seperti dulu waktu session-nya null.
export async function requireRole(role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER") {
  const h = await headers();
  const id = h.get("x-session-user-id");
  const userRole = h.get("x-session-user-role") as "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER" | null;

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
