import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
