"use client";

import { useEffect, useState } from "react";
import { useClientValue } from "@/hooks/use-client-value";
import { BellIcon } from "@/components/icons";

export type PushStatus = "idle" | "subscribed" | "loading" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Dipanggil tepat SEBELUM logout: lepas baris langganan browser ini dari akun
// yang sedang login, supaya HP/komputer yang dipakai bergantian tidak terus
// menerima notifikasi akun sebelumnya. Langganan di sisi browser sengaja
// TIDAK dibatalkan -- begitu ada yang login lagi, usePushSubscription di
// bawah menyambungkannya ke akun baru tanpa minta izin ulang. Tidak boleh
// menahan logout: gagal atau lambat (offline) dilewati, maksimal 3 detik.
export async function releasePushSubscription() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const release = (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    })();
    await Promise.race([release, new Promise((resolve) => setTimeout(resolve, 3000))]);
  } catch {
    // logout tetap lanjut
  }
}

// Dipanggil dari UserMenu (selalu ter-mount di semua halaman & role), bukan
// dari dalam dropdown -- sinkronisasi kepemilikan langganan di bawah harus
// jalan di setiap halaman, tidak cuma saat menu dibuka.
export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("idle");
  const supported = useClientValue(() => "serviceWorker" in navigator && "PushManager" in window, true);

  useEffect(() => {
    if (!supported) return;
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
  }, [supported]);

  async function enable() {
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
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
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

  return { supported, status, enable };
}

export function PushMenuItem({
  supported,
  status,
  enable,
}: {
  supported: boolean;
  status: PushStatus;
  enable: () => void;
}) {
  if (!supported) {
    return (
      <p className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-subtle">
        <BellIcon className="h-4 w-4 shrink-0" />
        Notifikasi tidak didukung browser ini
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <p className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-success-text">
        <BellIcon className="h-4 w-4 shrink-0" />
        Notifikasi aktif
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={enable}
        disabled={status === "loading"}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-text hover:bg-surface-muted disabled:opacity-50 max-sm:min-h-[44px]"
      >
        <BellIcon className="h-4 w-4 shrink-0 text-text-muted" />
        {status === "loading" ? "Mengaktifkan..." : "Aktifkan Notifikasi"}
      </button>
      {status === "error" && (
        <p className="px-3.5 pb-2.5 text-xs text-danger-text">
          Izin notifikasi ditolak atau gagal. Cek pengaturan notifikasi browser untuk situs ini.
        </p>
      )}
    </div>
  );
}
