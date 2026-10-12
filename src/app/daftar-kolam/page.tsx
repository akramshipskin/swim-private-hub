import type { Metadata } from "next";
import RegisterPoolForm from "./register-pool-form";
import { PoolSection } from "../landing-sections";
import { buildOwnerInquiryWaLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Daftar Kolam | Swim Private Hub",
  description: "Daftarkan kolam renangmu menjadi mitra Swim Private Hub.",
};

// Keuntungan jadi kolam mitra pindah dari landing ke sini (Hadi 12 Okt,
// penilaian UI/UX 3A). Latar krem dipaku seperti landing (tidak ikut tema gelap).
export default function RegisterPoolPage() {
  return (
    <>
      <RegisterPoolForm />
      <div className="bg-fixed-cream text-fixed-ink" style={{ colorScheme: "light" }}>
        <PoolSection waLink={buildOwnerInquiryWaLink()} ctaHref="#daftar" />
      </div>
    </>
  );
}
