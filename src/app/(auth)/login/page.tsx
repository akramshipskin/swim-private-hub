import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | Swim Private Hub",
  description: "Masuk ke akunmu untuk memilih coach, kolam, dan jam les renang privat.",
};

export default function LoginPage() {
  return <LoginForm />;
}
