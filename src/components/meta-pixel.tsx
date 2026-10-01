"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Pixel Meta di browser (Hadi 2 Okt, 5A/5B: langsung jalan, orang hukum
// setuju). Hanya halaman umum & member: area coach, kolam, dan admin tidak
// dilacak. Konversi (daftar, lunas) dikirim dari server (src/lib/meta-capi.ts);
// di sini PageView + InitiateCheckout. Tanpa NEXT_PUBLIC_META_PIXEL_ID = mati.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const UNTRACKED = ["/admin", "/coach", "/pool", "/perjanjian", "/keamanan", "/ganti-password"];

type Fbq = (...args: unknown[]) => void;

export function trackMeta(event: string, params?: Record<string, unknown>) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (PIXEL_ID && fbq) fbq("track", event, params);
}

export function MetaPixel() {
  const pathname = usePathname();
  const tracked = Boolean(PIXEL_ID) && !UNTRACKED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const first = useRef(true);

  // PageView pertama dikirim skrip init; berikutnya tiap pindah halaman.
  useEffect(() => {
    if (!tracked) return;
    if (first.current) {
      first.current = false;
      return;
    }
    trackMeta("PageView");
  }, [pathname, tracked]);

  if (!tracked) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(PIXEL_ID)});fbq('track','PageView');`}
    </Script>
  );
}
