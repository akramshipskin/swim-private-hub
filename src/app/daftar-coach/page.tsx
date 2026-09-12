import type { Metadata } from "next";
import RegisterCoachForm from "./register-coach-form";

export const metadata: Metadata = {
  title: "Daftar Coach | Swim Private Hub",
  description: "Daftar jadi coach renang, ngajar di beberapa kolam mitra sekaligus.",
};

export default function RegisterCoachPage() {
  return <RegisterCoachForm />;
}
