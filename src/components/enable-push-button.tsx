"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function EnablePushButton() {
  const [status, setStatus] = useState<
    "idle" | "unsupported" | "subscribed" | "loading" | "error"
  >("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) setStatus("subscribed");
    });
  }, []);

  async function handleEnable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-xs text-gray-400">
        Browser ini belum dukung notifikasi push. Di iPhone, tambahkan dulu ke
        Home Screen lalu buka dari sana.
      </p>
    );
  }

  if (status === "subscribed") {
    return <p className="text-xs text-green-600">Notifikasi aktif ✓</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleEnable}
        disabled={status === "loading"}
        className="text-xs text-blue-600 underline disabled:opacity-50"
      >
        {status === "loading" ? "Mengaktifkan..." : "Aktifkan Notifikasi"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600">
          Izin notifikasi ditolak/gagal. Cek pengaturan notifikasi browser
          buat situs ini.
        </p>
      )}
    </div>
  );
}
