"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";
import { MenuIcon, UserEditIcon, LogoutIcon } from "@/components/icons";
import { ThemeMenu } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { PushMenuItem, usePushSubscription } from "@/components/push-subscription";

export function UserMenu({
  userName,
  userRole,
  avatarUrl,
}: {
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const push = usePushSubscription();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-text-muted hover:bg-surface-muted sm:max-w-none"
      >
        {/* undefined = role tanpa foto profil; null = coach belum upload (siluet default) */}
        {avatarUrl !== undefined && <Avatar src={avatarUrl} className="h-8 w-8" />}
        <div className="min-w-0 text-right leading-tight">
          <p className="max-w-[84px] truncate text-sm font-medium text-text sm:max-w-none">
            {userName}
          </p>
          <p className="text-xs text-text-subtle">{userRole}</p>
        </div>
        <MenuIcon className="h-5 w-5 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-3.5 py-3 sm:hidden">
            <p className="text-sm font-medium text-text">{userName}</p>
            <p className="text-xs text-text-subtle">{userRole}</p>
          </div>
          <div className="border-b border-border px-3.5 py-3">
            <p className="mb-2 text-xs font-medium text-text-muted">Tampilan</p>
            <ThemeMenu />
          </div>
          <div className="border-b border-border">
            <PushMenuItem {...push} />
          </div>
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text hover:bg-surface-muted"
          >
            <UserEditIcon className="h-4 w-4 text-text-muted" />
            Edit Profil
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger-text hover:bg-danger-bg"
            >
              <LogoutIcon className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
