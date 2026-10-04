"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NOTIFICATIONS_CHANGED } from "@/components/notification-bell";
import { cn } from "@/lib/cn";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  hasUrl: boolean;
  unread: boolean;
  timeLabel: string;
  timeFull: string;
  iso: string;
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isUnread = (n: NotificationItem) => n.unread && !allRead && !readIds.has(n.id);
  const unreadCount = items.filter(isUnread).length;

  function open(n: NotificationItem) {
    setError(null);
    if (isUnread(n)) setReadIds((s) => new Set(s).add(n.id));
    startTransition(async () => {
      const res = await markNotificationRead(n.id);
      if ("error" in res) {
        setError(res.error);
        setReadIds((s) => {
          const next = new Set(s);
          next.delete(n.id);
          return next;
        });
        return;
      }
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
      if (res.url) router.push(res.url);
    });
  }

  function markAll() {
    setError(null);
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setAllRead(true);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Notifikasi</h1>
          {items.length > 0 && (
            <p className="mt-1 text-sm text-text-muted">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="secondary" onClick={markAll} disabled={pending}>
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-muted">Belum ada notifikasi.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-border bg-surface">
          {items.map((n) => {
            const unread = isUnread(n);
            return (
              <li key={n.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => open(n)}
                  disabled={pending}
                  className={cn(
                    "flex min-h-[44px] w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none disabled:cursor-wait motion-reduce:transition-none sm:px-5",
                    unread && "bg-brand-50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", unread ? "bg-brand-500" : "bg-transparent")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={cn("text-sm text-text", unread ? "font-semibold" : "font-medium")}>
                        {unread && <span className="sr-only">Belum dibaca: </span>}
                        {n.title}
                      </span>
                      <time dateTime={n.iso} title={n.timeFull} className="shrink-0 text-xs text-text-subtle">
                        {n.timeLabel}
                      </time>
                    </span>
                    <span className="mt-1 block text-sm text-text-muted">{n.body}</span>
                    {n.hasUrl && <span className="mt-1.5 block text-xs font-medium text-brand-700">Buka</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
