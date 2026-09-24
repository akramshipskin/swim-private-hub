import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials } from "@/lib/authorize";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
        otp: {},
      },
      authorize: (credentials, request) => authorizeCredentials(credentials, request),
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionVersion = user.sessionVersion ?? 0;
        return token;
      }

      // Pemilik akun sendiri yang barusan ganti password: sesinya ikut
      // naik versi (dikirim lewat unstable_update), sesi LAIN yang masih
      // bawa versi lama ditolak di bawah.
      if (trigger === "update" && typeof session?.sessionVersion === "number") {
        token.sessionVersion = session.sessionVersion;
      }

      // Request selanjutnya (bukan sign-in baru) -- cek ulang ke DB tiap
      // kali biar admin nonaktifin/ubah role user bisa langsung ngefek,
      // gak nunggu token JWT expired (default 30 hari).
      if (!token.id) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { isActive: true, role: true, mustChangePassword: true, name: true, sessionVersion: true, totpEnabledAt: true },
      });

      if (!dbUser || !dbUser.isActive) {
        return null;
      }
      // Token lama (sebelum kolom ini ada) belum bawa versi -- diadopsi,
      // bukan ditolak, biar deploy ini gak nge-logout semua user.
      if (token.sessionVersion === undefined) {
        token.sessionVersion = dbUser.sessionVersion;
      } else if (token.sessionVersion !== dbUser.sessionVersion) {
        return null;
      }

      token.role = dbUser.role;
      token.mustChangePassword = dbUser.mustChangePassword;
      // Admin wajib pasang 2FA dulu (proxy.ts mengarahkan ke /admin/keamanan).
      token.needsTotpSetup = dbUser.role === "ADMIN" && !dbUser.totpEnabledAt;
      // Nama juga disinkron ulang tiap request (bukan cuma pas sign-in) --
      // tanpa ini, ganti nama di /profil kesimpen bener di DB tapi
      // session.user.name kebawa stale sampe logout-login ulang.
      token.name = dbUser.name;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.needsTotpSetup = token.needsTotpSetup === true;
      }
      return session;
    },
  },
});
