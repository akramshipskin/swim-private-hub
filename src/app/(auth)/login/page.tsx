import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Masuk | Swim Private Hub",
  description: "Masuk ke akunmu untuk memilih coach, kolam, dan jam les renang privat.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return <LoginForm resetDone={reset === "ok"} />;
}
