import type { Metadata } from "next";
import PanduanMemberView from "./panduan-member-view";

export const metadata: Metadata = {
  title: "Panduan Member (Real Case) | Swim Private Hub",
  description:
    "Contoh nyata dari akun demo aktif -- diri sendiri, 1 anak, 2 anak, dan alur beli paket, versi mobile & desktop.",
};

export default function PanduanMemberPage() {
  return <PanduanMemberView />;
}
