"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { isCity } from "@/lib/cities";
import { cityHasOffer } from "@/lib/coach-pools";

// Member mendaftar daftar tunggu kota yang belum punya paket (Hadi 3 Okt).
// Dikabari sekali lewat notifikasi saat paket pertama di kota itu tersedia
// (src/lib/coach-pools.ts notifyCityWaitlist).
export async function joinCityWaitlist(city: string) {
  const session = await requireRole("MEMBER");
  if (!isCity(city)) redirect("/member/paket");
  // Kota yang sudah punya paket tidak perlu daftar tunggu: tampilkan saja.
  if (await cityHasOffer(city)) redirect(`/member/paket?kota=${encodeURIComponent(city)}#beli`);
  // Pernah dikabari lalu paketnya hilang lagi: menunggu lagi dari awal.
  await prisma.cityWaitlist.upsert({
    where: { userId_city: { userId: session.user.id, city } },
    update: { notifiedAt: null },
    create: { userId: session.user.id, city },
  }).catch((err: { code?: string }) => {
    if (err?.code !== "P2002") throw err;
  });
  redirect(`/member/paket?kota=${encodeURIComponent(city)}#beli`);
}
