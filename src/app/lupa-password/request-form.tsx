"use client";

import { useActionState, useState } from "react";
import { requestResetAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { buildAdminWaLink } from "@/lib/whatsapp";
import { EmailTypoHint } from "@/components/email-typo-hint";

export default function RequestResetForm() {
  const [state, formAction, pending] = useActionState(requestResetAction, null);
  const [email, setEmail] = useState("");
  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm text-text">{state.ok}</p>
        <a href="/login" className="text-sm font-medium text-brand-700 hover:underline">Kembali ke Masuk</a>
      </div>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email Akun">
        <Input name="email" type="email" placeholder="nama@email.com" required autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <EmailTypoHint value={email} onUse={setEmail} />
      {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
      <Button type="submit" loading={pending}>Kirim Tautan</Button>
      <p className="text-center text-sm text-text-muted">
        Akunmu tidak memakai email?{" "}
        <a
          href={buildAdminWaLink("Halo Admin Swim Private Hub, saya lupa password akun saya. Nomor HP akun saya: ")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block -my-3 py-3 font-medium text-brand-700 hover:underline"
        >
          Minta reset ke admin
        </a>
      </p>
    </form>
  );
}
