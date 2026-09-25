import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import AuthSessionProvider from "@/components/session-provider";
import ServiceWorkerRegister from "@/components/service-worker-register";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import "./globals.css";

// Identitas visual sengaja beda total dari les-renang-cianjur (Geist) --
// Jakarta Sans buat body (humanis, gampang dibaca), Sora buat heading
// (geometris, karakter lebih kuat buat judul/CTA).
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.swimprivatehub.biz.id"),
  title: "Swim Private Hub",
  description: "Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya. Buat anak atau kamu sendiri yang baru mau belajar.",
  manifest: "/manifest.json",
  openGraph: {
    siteName: "Swim Private Hub",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#14140f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme di-set manual lewat inline script di bawah (baca
    // localStorage sebelum hydrate) -- server gak pernah tau nilainya,
    // jadi mismatch attribute ini expected, bukan bug beneran.
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakartaSans.variable} ${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Baca localStorage sebelum paint pertama, biar gak ada FOUC
            (kedip putih sebelum ganti gelap) pas user udah pernah pilih
            manual. Gak ada pilihan tersimpan = biarin CSS prefers-color-scheme
            yang handle, jangan set attribute sama sekali. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}`,
          }}
        />
        {/* Simpen referrer ASLI (dari luar situs) sekali pas pertama kali
            landing di sesi browser ini -- kalau nunggu sampe halaman
            register, document.referrer udah keganti jadi halaman internal
            (misal landing page sendiri), sumber luarnya ilang. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(!sessionStorage.getItem("entryReferrer")){sessionStorage.setItem("entryReferrer",document.referrer||"");}}catch(e){}`,
          }}
        />
        <ServiceWorkerRegister />
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
