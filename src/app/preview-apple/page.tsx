import type { Metadata } from "next";
import PreviewAppleView from "./preview-apple-view";

export const metadata: Metadata = {
  title: "Preview: Apple Design | Les Renang Cianjur",
  description: "Duplikat halaman Booking dengan visual ala Apple -- gak nyambung ke app utama, cuma preview.",
};

export default function PreviewApplePage() {
  return <PreviewAppleView />;
}
