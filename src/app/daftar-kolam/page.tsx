import type { Metadata } from "next";
import RegisterPoolForm from "./register-pool-form";

export const metadata: Metadata = {
  title: "Daftar Kolam | Swim Private Hub",
  description: "Daftarkan kolam renangmu jadi mitra Swim Private Hub.",
};

export default function RegisterPoolPage() {
  return <RegisterPoolForm />;
}
