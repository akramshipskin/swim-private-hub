import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingView from "./landing-view";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LandingView />;
  }

  if (session.user.mustChangePassword) {
    redirect("/ganti-password");
  }

  const roleHome: Record<string, string> = {
    ADMIN: "/admin",
    COACH: "/coach",
    MEMBER: "/member/booking",
  };

  redirect(roleHome[session.user.role]);
}
