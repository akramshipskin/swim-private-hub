"use client";

import { useState } from "react";
import { useClientValue } from "@/hooks/use-client-value";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
  const needsConsent = useClientValue(() => {
    try {
      return !localStorage.getItem("cookieConsent");
    } catch {
      // localStorage tidak tersedia (private mode dll) -- banner tidak muncul.
      return false;
    }
  }, false);
  const [dismissed, setDismissed] = useState(false);
  const visible = needsConsent && !dismissed;

  function dismiss() {
    try {
      localStorage.setItem("cookieConsent", "acknowledged");
    } catch {
      // sama kayak di atas -- gak fatal kalau gagal disimpan.
    }
    setDismissed(true);
  }

  if (!visible) return null;

  // Satu baris (teks + tombol berdampingan) supaya di HP tidak menutup tombol
  // daftar di kunjungan pertama. Tautan diberi area sentuh 44px lewat padding
  // yang diimbangi margin negatif (tampilan teks tidak bergeser).
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 py-2.5 shadow-[0_-4px_16px_-4px_rgba(20,20,15,0.15)] sm:py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="text-xs text-text-muted sm:text-sm">
          Kami pakai cookie sesi masuk dan penyimpanan tema seperlunya agar aplikasi
          ini jalan.{" "}
          <a href="/kebijakan-cookie" className="-my-3 inline-block py-3 font-medium text-brand-700 hover:underline">
            Kebijakan Cookie
          </a>
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0">
          Oke, Mengerti
        </Button>
      </div>
    </div>
  );
}
