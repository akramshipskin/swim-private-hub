"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/rate-limit";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/password-reset";
import { redirect } from "next/navigation";

export type ResetState = { error?: string; ok?: string } | null;

export async function requestResetAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  return requestPasswordReset(String(formData.get("email") ?? ""), clientIp(await headers()));
}

export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const res = await resetPasswordWithToken(
    String(formData.get("token") ?? ""),
    String(formData.get("newPassword") ?? ""),
    String(formData.get("confirmPassword") ?? ""),
  );
  if (res.error) return res;
  redirect("/login?reset=ok");
}
