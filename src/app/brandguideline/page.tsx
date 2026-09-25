import type { Metadata } from "next";
import BrandGuidelineView from "./brandguideline-view";

export const metadata: Metadata = {
  title: "Brand Guideline | Swim Private Hub",
  description: "Acuan identitas visual Swim Private Hub: logo, warna, tipografi, komponen, gerak, dan bahasa.",
};

// Halaman publik -- gak butuh login, jadi bisa dibagikan ke siapa saja
// (desainer, developer baru, mitra). Gak kena middleware proxy.ts (matcher
// cuma /member, /coach, /admin, /pool).
export default function BrandGuidelinePage() {
  return <BrandGuidelineView />;
}
