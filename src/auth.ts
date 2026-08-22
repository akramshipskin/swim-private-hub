import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      authorize: async (credentials) => {
        const identifier = (credentials?.identifier as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        // Identifier bisa email atau no HP -- coba dua-duanya, gak
        // asumsi format berdasarkan isi string (nomor HP kadang ada yang
        // isi pake format aneh).
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { phone: identifier }] },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        return token;
      }

      // Request selanjutnya (bukan sign-in baru) -- cek ulang ke DB tiap
      // kali biar admin nonaktifin/ubah role user bisa langsung ngefek,
      // gak nunggu token JWT expired (default 30 hari).
      if (!token.id) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { isActive: true, role: true, mustChangePassword: true, name: true },
      });

      if (!dbUser || !dbUser.isActive) {
        return null;
      }

      token.role = dbUser.role;
      token.mustChangePassword = dbUser.mustChangePassword;
      // Nama juga disinkron ulang tiap request (bukan cuma pas sign-in) --
      // tanpa ini, ganti nama di /profil kesimpen bener di DB tapi
      // session.user.name kebawa stale sampe logout-login ulang.
      token.name = dbUser.name;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "COACH" | "MEMBER";
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
});
