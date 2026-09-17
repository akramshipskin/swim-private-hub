import type { Metadata } from "next";
import RegisterCoachForm from "./register-coach-form";

export const metadata: Metadata = {
  title: "Daftar Coach | Swim Private Hub",
  description: "Daftar jadi coach renang, mengajar di beberapa kolam mitra sekaligus.",
};

export default function RegisterCoachPage() {
  return <RegisterCoachForm />;
}
