"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Diam-diam gagal (browser lama/iOS non-PWA) -- fallback tetap
        // riwayat booking in-app, notif push cuma enhancement.
      });
    }
  }, []);

  return null;
}
