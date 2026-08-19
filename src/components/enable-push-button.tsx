"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
    return <Badge tone="neutral">Notifikasi gak didukung browser ini</Badge>;
  }

  if (status === "subscribed") {
    return <Badge tone="success">Notifikasi aktif</Badge>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleEnable}
        disabled={status === "loading"}
        className="inline-flex items-center rounded-full border border-brand-700/15 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      >
        {status === "loading" ? "Mengaktifkan..." : "Aktifkan Notifikasi"}
      </button>
      {status === "error" && (
        <p className="text-xs text-danger-text">
          Izin notifikasi ditolak/gagal. Cek pengaturan notifikasi browser buat situs ini.
        </p>
      )}
    </div>
  );
}
