import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Daftar | Swim Private Hub",
  description: "Buat akun baru untuk memilih coach, kolam, dan jam les renang privat.",
};

// ?ref=KODE dari link afiliasi coach/kolam mengisi kolom kode otomatis.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const { ref } = await searchParams;
  return <RegisterForm initialReferralCode={typeof ref === "string" ? ref.slice(0, 20).toUpperCase() : ""} />;
}
