"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { recordPphRemittance } from "./actions";

export default function PphRemitForm() {
  const [state, action, pending] = useActionState(recordPphRemittance, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <Field label="Nominal disetor (Rp)">
        <PriceInput name="amount" className="w-full sm:w-36" />
      </Field>
      <Field label="Nomor bukti setor (NTPN)">
        <Input name="reference" maxLength={100} className="w-full sm:w-48" />
      </Field>
      <Field label="Catatan (opsional)">
        <Input name="note" maxLength={300} className="w-full sm:w-56" />
      </Field>
      <Button type="submit" size="sm" loading={pending}>
        Catat sudah disetor
      </Button>
      {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
      {state?.ok && <p className="w-full text-xs text-success-text">Setoran tercatat.</p>}
    </form>
  );
}
