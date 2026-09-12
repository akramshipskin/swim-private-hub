import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";
    mustChangePassword: boolean;
  }
}
