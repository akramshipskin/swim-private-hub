"use client";

import { signOutAction } from "@/lib/auth-actions";
import { releasePushSubscription } from "@/components/push-subscription";

// Jalan keluar dari halaman persetujuan: akun yang belum mau menyetujui tidak
// boleh terkunci di sini. Sama dengan menu Keluar (lepas notifikasi dulu).
export function LogoutButton() {
  async function handleLogout() {
    await releasePushSubscription();
    await signOutAction();
  }
  return (
    <form action={handleLogout} className="mt-4 text-center">
      <button type="submit" className="text-sm font-medium text-text-muted hover:text-brand-700 hover:underline max-lg:min-h-[44px]">
        Keluar
      </button>
    </form>
  );
}
