"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { partnerAgreementData } from "@/lib/partner-agreement";

export async function acceptPartnerAgreement(formData: FormData) {
  // auth() langsung, bukan requireRole: requireRole mengarahkan akun yang
  // belum setuju kembali ke /perjanjian.
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  const { role, id } = session.user;
  if (role !== "COACH" && role !== "POOL_OWNER") redirect("/");

  const data = partnerAgreementData(role, formData.get("agree") === "on");
  if (data === null) redirect("/perjanjian?error=1");
  if (Object.keys(data).length > 0) await prisma.user.update({ where: { id }, data });
  redirect(role === "COACH" ? "/coach/dashboard" : "/pool/dashboard");
}
