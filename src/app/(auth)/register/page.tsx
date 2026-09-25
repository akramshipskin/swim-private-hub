import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Daftar | Swim Private Hub",
  description: "Buat akun baru untuk memilih coach, kolam, dan jam les renang privat.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
