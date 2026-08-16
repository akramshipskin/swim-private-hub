"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Password Baru">
        <Input
          type="password"
          name="newPassword"
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </Field>
      <Field label="Konfirmasi Password Baru">
        <Input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={pending} className="mt-1 w-full">
        Simpan & Lanjut
      </Button>
    </form>
  );
}
