"use client";

import { useActionState } from "react";
import { withdrawPlatform } from "./platform-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { PriceInput } from "@/components/ui/price-input";

export default function PlatformWithdrawForm({ revenue, tax }: { revenue: number; tax: number }) {
  const [state, action, pending] = useActionState(withdrawPlatform, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`Tarik pendapatan (maks. ${formatRupiah(Math.max(0, revenue))})`}>
          <PriceInput name="revenueAmount" defaultValue={Math.max(0, revenue)} required />
        </Field>
        <Field label="Catatan (opsional)">
          <Input name="note" maxLength={200} placeholder="Misal: transfer ke rekening perusahaan" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-text max-sm:min-h-[44px]">
        <input type="checkbox" name="includeTax" className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
        Tarik juga saldo pajak (PPN) sekaligus — {formatRupiah(Math.max(0, tax))}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>Catat Penarikan</Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-success-text">Penarikan tercatat.</p>}
      </div>
    </form>
  );
}
