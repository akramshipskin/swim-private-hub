import type { Metadata } from "next";
import PanduanView from "./panduan-view";

export const metadata: Metadata = {
  title: "Panduan | Swim Private Hub",
  description: "Presentasi produk dan panduan penggunaan lengkap untuk Member, Coach, dan Admin.",
};

// Halaman publik -- gak butuh login, biar bisa dibagikan/dibuka siapa aja
// (calon klien, member baru yang belum daftar, dst). Gak kena middleware
// proxy.ts (matcher-nya cuma /member, /coach, /admin).
export default function PanduanPage() {
  return <PanduanView />;
}
