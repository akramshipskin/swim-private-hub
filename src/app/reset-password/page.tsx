import type { Metadata } from "next";
import { AuthCard } from "../lupa-password/auth-card";
import ResetPasswordForm from "./reset-form";
import { RESET_INVALID_ERROR, verifyResetToken } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Buat Password Baru | Swim Private Hub",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = token ? await verifyResetToken(token) : null;
  return (
    <AuthCard title="Buat Password Baru" subtitle="Setelah disimpan, semua perangkat yang masih masuk akan keluar otomatis.">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-sm text-danger-text">{RESET_INVALID_ERROR}</p>
          <a href="/lupa-password" className="text-sm font-medium text-brand-700 hover:underline">Minta Tautan Baru</a>
        </div>
      )}
    </AuthCard>
  );
}
