"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../lupa-password/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Password Baru">
        <PasswordInput name="newPassword" placeholder="Minimal 8 karakter" required autoComplete="new-password" />
      </Field>
      <Field label="Ulangi Password Baru">
        <PasswordInput name="confirmPassword" placeholder="Ulangi password baru" required autoComplete="new-password" />
      </Field>
      {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
      <Button type="submit" loading={pending}>Simpan Password Baru</Button>
    </form>
  );
}
