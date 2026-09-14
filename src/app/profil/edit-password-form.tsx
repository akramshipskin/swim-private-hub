"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePasswordProfil } from "./actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function EditPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordProfil, null);
  const [formKey, setFormKey] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      setFormKey((k) => k + 1);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <Field label="Password Saat Ini">
        <PasswordInput name="currentPassword" placeholder="••••••••" required autoComplete="current-password" />
      </Field>
      <Field label="Password Baru">
        <PasswordInput name="newPassword" placeholder="••••••••" required autoComplete="new-password" />
      </Field>
      <Field label="Konfirmasi Password Baru">
        <PasswordInput name="confirmPassword" placeholder="••••••••" required autoComplete="new-password" />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success-text">
          Password berhasil diganti.
        </p>
      )}

      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Ganti Password
      </Button>
    </form>
  );
}
