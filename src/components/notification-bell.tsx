"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";

// Dipancarkan halaman /notifikasi setelah menandai dibaca, supaya lencana
// ikut berkurang tanpa memuat ulang halaman.
export const NOTIFICATIONS_CHANGED = "sph:notifikasi-berubah";

// Lonceng di header semua peran. Jumlah belum dibaca diambil SETELAH halaman
// tampil (bukan di render server), dan diperbarui saat tab kembali dibuka.
// Sebelum data datang, lonceng tampil tanpa lencana.
export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let ctrl: AbortController | null = null;
    async function load() {
      ctrl?.abort();
      const current = new AbortController();
      ctrl = current;
      try {
        const res = await fetch("/api/notifikasi/jumlah", { cache: "no-store", signal: current.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (!current.signal.aborted && typeof data?.count === "number") setCount(data.count);
      } catch {
        // Jaringan putus / dibatalkan: lonceng tetap tampil tanpa lencana.
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => {
      ctrl?.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, load);
    };
  }, []);

  const unread = count ?? 0;
  const label = unread > 0 ? `Notifikasi, ${unread > 9 ? "lebih dari 9" : unread} belum dibaca` : "Notifikasi";

  return (
    <Link
      href="/notifikasi"
      aria-label={label}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <BellIcon className="h-5 w-5" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fixed-lime-500 px-1 text-[11px] font-semibold leading-none text-fixed-ink ring-2 ring-surface"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
