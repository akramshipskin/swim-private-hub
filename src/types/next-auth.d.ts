import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
    mustChangePassword: boolean;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
      mustChangePassword: boolean;
    } & DefaultSession["user"];
    // Cuma dipakai sebagai payload unstable_update (lihat callback jwt).
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
    mustChangePassword: boolean;
    sessionVersion?: number;
  }
}
