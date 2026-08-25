import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/session-provider";
import ServiceWorkerRegister from "@/components/service-worker-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Les Renang Cianjur",
  description: "Booking jadwal renang dengan coach favoritmu.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme di-set manual lewat inline script di bawah (baca
    // localStorage sebelum hydrate) -- server gak pernah tau nilainya,
    // jadi mismatch attribute ini expected, bukan bug beneran.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        <ServiceWorkerRegister />
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
