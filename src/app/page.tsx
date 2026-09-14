import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LandingView from "./landing-view";

export default async function Home() {
  const session = await auth();

  if (!session) {
    const [poolCount, coachCount, memberCount] = await Promise.all([
      prisma.pool.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "COACH" } }),
      prisma.user.count({ where: { role: "MEMBER" } }),
    ]);
    return <LandingView stats={{ poolCount, coachCount, memberCount }} />;
  }

  if (session.user.mustChangePassword) {
    redirect("/ganti-password");
  }

  const roleHome: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", string> = {
    ADMIN: "/admin",
    COACH: "/coach",
    MEMBER: "/member/booking",
    POOL_OWNER: "/pool/saldo",
  };

  redirect(roleHome[session.user.role]);
}
