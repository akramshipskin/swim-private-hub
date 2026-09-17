import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Daftar | Swim Private Hub",
  description: "Buat akun baru untuk booking jadwal renang dengan coach favoritmu.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
