"use client";

import { useActionState } from "react";
import { updatePoolInfo } from "@/lib/pool-info-actions";
import { POOL_FACILITIES } from "@/lib/pool-facilities";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditLock } from "@/hooks/use-edit-lock";
import { TimeSelect } from "@/components/ui/time-select";

export type PoolInfo = {
  id: string;
  description: string | null;
  address: string | null;
  contactPhone: string | null;
  openTime: string | null;
  closeTime: string | null;
  facilities: string[];
};

export default function PoolInfoForm({ pool }: { pool: PoolInfo }) {
  const [state, formAction, pending] = useActionState(updatePoolInfo, null);
  const edit = useEditLock(pending, state?.error);
  const extra = pool.facilities.filter((f) => !(POOL_FACILITIES as readonly string[]).includes(f));

  return (
    <form key={edit.formKey} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="poolId" value={pool.id} />
      <fieldset disabled={edit.locked} className="grid gap-4 disabled:opacity-90 lg:grid-cols-2">
        <Field label="Deskripsi kolam">
          <Textarea name="description" rows={3} maxLength={1000} defaultValue={pool.description ?? ""} placeholder="Ukuran kolam, kedalaman, suasana, dll." />
        </Field>
        <Field label="Alamat">
          <Input name="address" defaultValue={pool.address ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <Field label="No. telepon kolam">
            <Input name="contactPhone" defaultValue={pool.contactPhone ?? ""} />
          </Field>
          <TimeSelect name="openTime" label="Jam buka" defaultValue={pool.openTime ?? "06:00"} />
          <TimeSelect name="closeTime" label="Jam tutup" defaultValue={pool.closeTime ?? "21:00"} />
        </div>
        <div className="lg:col-span-2">
          <p className="mb-2 text-sm font-medium text-text">Fasilitas</p>
          <div className="flex flex-wrap gap-2">
            {POOL_FACILITIES.map((f) => (
              <label key={f} className="cursor-pointer">
                <input type="checkbox" name="facilities" value={f} defaultChecked={pool.facilities.includes(f)} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-muted peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">
                  {f}
                </span>
              </label>
            ))}
          </div>
        </div>
        <Field label="Fasilitas lain (pisahkan dengan koma)">
          <Input name="extraFacilities" defaultValue={extra.join(", ")} placeholder="Misal: Gazebo, Ruang laktasi" />
        </Field>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        {edit.locked ? (
          <Button type="button" variant="secondary" onClick={edit.startEdit}>Edit Info Kolam</Button>
        ) : (
          <>
            <Button type="submit" loading={pending} disabled={edit.saveDisabled}>Simpan</Button>
            <Button type="button" variant="ghost" onClick={edit.cancel} disabled={pending}>Batal</Button>
          </>
        )}
        {state?.error && <p role="alert" className="text-sm text-danger-text">{state.error}</p>}
      </div>
    </form>
  );
}
