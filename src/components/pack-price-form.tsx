"use client";

import { useActionState, type ReactNode } from "react";
import { Field } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Button } from "@/components/ui/button";
import { useEditLock } from "@/hooks/use-edit-lock";

export type PackPriceState = { error?: string; ok?: boolean } | null;

// Form harga paket 4 dan 8 sesi (coach, pemilik kolam, admin). Kosong = tidak
// menjual ukuran itu. Harga langsung berlaku untuk pembelian berikutnya.
export default function PackPriceForm({
  action,
  hidden,
  pricePack4,
  pricePack8,
  children,
}: {
  action: (prev: PackPriceState, formData: FormData) => Promise<PackPriceState>;
  hidden?: Record<string, string>;
  pricePack4: number | null;
  pricePack8: number | null;
  // Isian tambahan (admin: biaya layanan, bebas potongan PPh).
  children?: (locked: boolean) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const edit = useEditLock(pending, state?.error);
  return (
    <form key={edit.formKey} action={formAction} className="flex flex-wrap items-end gap-3">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {/* Harga saat halaman dibuka: form admin hanya menulis harga yang benar-benar
          diubah, supaya tidak menimpa harga baru dari coach/kolam dengan angka lama. */}
      <input type="hidden" name="origPack4" value={pricePack4 ?? ""} />
      <input type="hidden" name="origPack8" value={pricePack8 ?? ""} />
      <Field label="Paket 4 sesi (Rp)">
        <PriceInput name="pricePack4" defaultValue={pricePack4 ?? ""} disabled={edit.locked} className="w-full sm:w-36" />
      </Field>
      <Field label="Paket 8 sesi (Rp)">
        <PriceInput name="pricePack8" defaultValue={pricePack8 ?? ""} disabled={edit.locked} className="w-full sm:w-36" />
      </Field>
      {children?.(edit.locked)}
      {edit.locked ? (
        <Button type="button" size="sm" variant="secondary" onClick={edit.startEdit}>
          Edit
        </Button>
      ) : (
        <>
          <Button type="submit" size="sm" loading={pending} disabled={edit.saveDisabled}>
            Simpan
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={edit.cancel} disabled={pending}>
            Batal
          </Button>
        </>
      )}
      {state?.error && <p className="w-full text-xs text-danger-text">{state.error}</p>}
    </form>
  );
}
