"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { markAllRead, markRead, notificationGate } from "@/lib/notifications";

export type NotificationActionResult = { error: string } | { ok: true; url: string | null };

const NOT_ALLOWED = "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi.";

// Server action bisa dipanggil langsung tanpa lewat tampilan: sesi dibaca
// ulang di sini dan userId sesi selalu ikut di WHERE (lihat notifications.ts).
export async function markNotificationRead(id: unknown): Promise<NotificationActionResult> {
  const gate = notificationGate(await auth());
  if ("redirectTo" in gate) return { error: NOT_ALLOWED };
  if (typeof id !== "string" || !id || id.length > 64) return { error: "Notifikasi tidak ditemukan." };
  const res = await markRead(gate.userId, id);
  if (!res.found) return { error: "Notifikasi tidak ditemukan." };
  revalidatePath("/notifikasi");
  return { ok: true, url: res.url };
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const gate = notificationGate(await auth());
  if ("redirectTo" in gate) return { error: NOT_ALLOWED };
  await markAllRead(gate.userId);
  revalidatePath("/notifikasi");
  return { ok: true, url: null };
}
