import { cn } from "@/lib/cn";

// Logotype C dari brand guideline -- "swim.privatehub" huruf kecil digabung,
// titik lime sebagai aksen. Dipake tiap kali nama brand dirender SEBAGAI
// LOGO (header/hero/footer/kartu auth), bukan buat sebutan biasa di body
// text (mis. "© 2026 Swim Private Hub" boleh tetep teks polos).
// Keputusan Hadi 30 Sep: tanda (logo.png) satu untuk semua latar; yang ikut
// tema hanya tulisan ini. Warna teksnya MEWARISI dari pembungkus: halaman
// aplikasi memakai text-text (ikut tema terang/gelap), landing memakai warna
// tetap (fixed-*/putih) -- jangan beri warna dasar di sini.
export function Logotype({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-bold tracking-tight", className)}
      style={{ fontFamily: "var(--font-heading), var(--font-sans), system-ui, sans-serif" }}
    >
      swim<span className="text-brand-500">.</span>privatehub
    </span>
  );
}
