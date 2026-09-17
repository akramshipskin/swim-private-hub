"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// router.back() kalau user dateng dari halaman lain di app ini (misal Cari
// Coach). Kalau link-nya dibuka langsung (dishare lewat WA, tab baru), gak
// ada riwayat di app ini -- router.back() dulu gak ngapa-ngapain / malah
// ngelempar keluar app, jadi pake fallbackHref.
export default function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function handleBack() {
    const cameFromThisApp =
      window.history.length > 1 &&
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin;
    if (cameFromThisApp) router.back();
    else router.push(fallbackHref);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
      &larr; Kembali
    </Button>
  );
}
