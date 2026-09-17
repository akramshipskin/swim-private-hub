"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookieConsent")) setVisible(true);
    } catch {
      // localStorage gak available (private mode dll) -- gak fatal,
      // banner cuma gak muncul, aplikasi tetep jalan normal.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem("cookieConsent", "acknowledged");
    } catch {
      // sama kayak di atas -- gak fatal kalau gagal disimpan.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_16px_-4px_rgba(8,145,178,0.15)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-text-muted sm:text-sm">
          Kami pakai cookie login &amp; local storage tema seperlunya agar aplikasi
          ini jalan.{" "}
          <a href="/kebijakan-cookie" className="font-medium text-brand-600 hover:underline">
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
