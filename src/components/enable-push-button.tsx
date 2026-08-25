"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BellIcon } from "@/components/icons";

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
      if (existing) {
        // Subscription browser ini punya 1 endpoint yang sama walau
        // akunnya diganti (misal member logout, coach login di HP yang
        // sama) -- endpoint lama masih "subscribed" di sisi browser,
        // tapi baris PushSubscription di server masih ke-tag userId
        // lama. Re-sync diem-diem tiap mount biar kepemilikannya selalu
        // ngikut siapa yang lagi login sekarang, gak nyasar ke akun lain.
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(existing.toJSON()),
        }).catch(() => {});
        setStatus("subscribed");
      }
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
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
      >
        <BellIcon className="h-3.5 w-3.5" />
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
