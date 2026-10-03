"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isCity } from "@/lib/cities";

const HOME = { MEMBER: "/member/paket", COACH: "/coach/kolam" } as const;

// Member & coach memilih kota domisili (Hadi 3 Okt). Dipakai halaman /kota
// (akun lama tanpa kota) dan form Profil (ganti kota). Hanya akun sendiri.
export async function saveMyCity(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");
  const { role, id } = session.user;
  if (role !== "MEMBER" && role !== "COACH") redirect("/");
  const city = formData.get("city");
  const back = formData.get("from") === "profil" ? "/profil" : "/kota";
  if (!isCity(city)) redirect(`${back}?error=kota`);
  await prisma.user.update({ where: { id }, data: { city } });
  revalidatePath("/", "layout");
  redirect(back === "/profil" ? "/profil" : HOME[role]);
}
