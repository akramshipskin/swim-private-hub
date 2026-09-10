import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Daftar | Les Renang Cianjur",
  description: "Buat akun baru buat booking jadwal renang dengan coach favoritmu.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
