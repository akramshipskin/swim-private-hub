import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PARTNER_AGREEMENT_REQUIRED_ERROR } from "@/lib/partner-agreement";

// Baca sesi asli (JWT + cek ulang isActive/role ke DB di callback jwt),
// BUKAN header x-session-* dari proxy.ts. Header itu cuma ditimpa proxy di
// rute yang cocok matcher-nya; server action bisa dipanggil lewat path lain
// yang gak lewat proxy, dan di situ header bisa diisi bebas oleh klien.
export async function requireRole(role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER") {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== role) {
    redirect("/login");
  }
  if (session.user.mustChangePassword) {
    redirect("/ganti-password");
  }
  // Dicek di sini juga (bukan cuma proxy.ts): server action bisa dipanggil
  // lewat path yang tidak lewat proxy.
  if (session.user.needsTotpSetup) {
    redirect("/keamanan");
  }
  if (session.user.needsPartnerAgreement) {
    redirect("/perjanjian");
  }

  return {
    user: {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      mustChangePassword: false,
    },
  };
}

// Gerbang akun untuk aksi yang memakai auth() langsung (bukan requireRole):
// password sementara, 2FA admin, perjanjian mitra (TRD T9). null = lolos.
export function accountGateError(user: { mustChangePassword?: boolean; needsTotpSetup?: boolean; needsPartnerAgreement?: boolean }) {
  if (user.mustChangePassword) return "Ganti password sementara dulu.";
  if (user.needsTotpSetup) return "Pasang verifikasi 2 langkah dulu di menu Keamanan.";
  if (user.needsPartnerAgreement) return PARTNER_AGREEMENT_REQUIRED_ERROR;
  return null;
}
