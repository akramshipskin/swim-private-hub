import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireRole(role: "ADMIN" | "COACH" | "MEMBER") {
  const __t0 = Date.now();
  const session = await auth();
  console.log(`[TIMING] auth() took ${Date.now() - __t0}ms`);
  if (!session || session.user.role !== role) {
    redirect("/login");
  }
  return session;
}
