import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "COACH" | "MEMBER";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "COACH" | "MEMBER";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "COACH" | "MEMBER";
  }
}
