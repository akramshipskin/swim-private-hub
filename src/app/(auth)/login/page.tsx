import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | Swim Private Hub",
  description: "Masuk ke akunmu buat booking jadwal renang dengan coach favoritmu.",
};

export default function LoginPage() {
  return <LoginForm />;
}
