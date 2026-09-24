"use client";

import { useActionState } from "react";
import { confirmTotpSetup } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function TotpConfirmForm() {
  const [state, formAction, pending] = useActionState(confirmTotpSetup, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Kode 6 digit dari aplikasi">
        <Input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="123456" required />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {state.error}
        </p>
      )}
      <Button type="submit" loading={pending} className="w-full">
        Aktifkan 2FA
      </Button>
    </form>
  );
}
