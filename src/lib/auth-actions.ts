"use server";

import { signOut } from "@/auth";

// Selalu ke halaman login setelah logout -- tanpa redirectTo, logout dari
// halaman publik (mis. profil coach) tetap diam di halaman yang sama.
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
