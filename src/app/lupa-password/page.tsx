import type { Metadata } from "next";
import { AuthCard } from "./auth-card";
import RequestResetForm from "./request-form";

export const metadata: Metadata = {
  title: "Lupa Password | Swim Private Hub",
  robots: { index: false, follow: false },
};

export default function LupaPasswordPage() {
  return (
    <AuthCard title="Lupa Password" subtitle="Kami kirim tautan untuk membuat password baru ke email akunmu.">
      <RequestResetForm />
    </AuthCard>
  );
}
