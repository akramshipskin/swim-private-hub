import type { Metadata } from "next";
import RegisterCoachForm from "./register-coach-form";
import { CoachSection } from "../landing-sections";

export const metadata: Metadata = {
  title: "Daftar Coach | Swim Private Hub",
  description: "Daftar sebagai coach renang dan mengajar di beberapa kolam mitra sekaligus.",
};

// Keuntungan jadi coach mitra pindah dari landing ke sini (Hadi 12 Okt,
// penilaian UI/UX 3A): formulir di atas, penjelasan lengkap di bawahnya.
export default function RegisterCoachPage() {
  return (
    <>
      <RegisterCoachForm />
      <div style={{ colorScheme: "light" }}>
        <CoachSection ctaHref="#daftar" />
      </div>
    </>
  );
}
