"use client";

import { useActionState } from "react";
import { withdrawPlatform } from "./platform-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { PriceInput } from "@/components/ui/price-input";
import { useKeepFormOnError } from "@/hooks/use-keep-form-on-error";

export default function PlatformWithdrawForm({ revenue, tax }: { revenue: number; tax: number }) {
  // revenue/tax di sini = yang SUDAH boleh ditarik (lewat masa tahan).
  const [state, action, pending] = useActionState(withdrawPlatform, null);
  const keep = useKeepFormOnError(state, action);
  return (
    <form key={keep.key} onSubmit={keep.onSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`Cairkan pendapatan (maks. ${formatRupiah(Math.max(0, revenue))})`}>
          <PriceInput name="revenueAmount" defaultValue={Math.max(0, revenue)} required />
        </Field>
        <Field label="Nomor referensi / bukti transfer">
          <Input name="transferReference" required minLength={3} maxLength={100} placeholder="Nomor referensi dari m-banking" />
        </Field>
        <Field label="Catatan (opsional)">
          <Input name="note" maxLength={200} placeholder="Contoh: transfer ke rekening perusahaan" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-text max-lg:min-h-[44px]">
        <input type="checkbox" name="includeTax" className="h-4 w-4 rounded border-border text-brand-700 focus:ring-brand-500" />
        Cairkan juga saldo PPN untuk disetor ke negara ({formatRupiah(Math.max(0, tax))})
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>Catat Pencairan</Button>
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-success-text">Pencairan tercatat.</p>}
      </div>
    </form>
  );
}
