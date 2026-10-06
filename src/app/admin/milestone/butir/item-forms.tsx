"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MILESTONE_GROUPS, MILESTONE_GROUP_LABEL } from "@/lib/milestone";
import { addStandardItem, updateStandardItem, type ItemActionState } from "../actions";

function Status({ state }: { state: ItemActionState }) {
  if (state?.error) return <p role="alert" className="text-xs text-danger-text">{state.error}</p>;
  if (state?.success) return <p className="text-xs text-success-text">Tersimpan.</p>;
  return null;
}

export function EditItemForm({ id, text, sortOrder }: { id: string; text: string; sortOrder: number }) {
  const [state, action, pending] = useActionState(updateStandardItem.bind(null, id), null);
  return (
    <form action={action} className="flex flex-1 flex-col gap-1">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <Input name="sortOrder" type="number" min={0} max={999} defaultValue={sortOrder} aria-label="Urutan" className="w-20 shrink-0" />
        {/* HP: teks keterampilan satu baris penuh supaya terbaca. */}
        <Input name="text" defaultValue={text} maxLength={200} required aria-label="Teks keterampilan" className="min-w-0 flex-1 max-sm:order-first max-sm:basis-full" />
        <Button type="submit" size="sm" variant="secondary" loading={pending}>Simpan</Button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function AddItemForm() {
  const [state, action, pending] = useActionState(addStandardItem, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Select name="group" aria-label="Kelompok" required className="w-auto">
          {MILESTONE_GROUPS.map((g) => (
            <option key={g} value={g}>{g} · {MILESTONE_GROUP_LABEL[g]}</option>
          ))}
        </Select>
        <Input name="level" type="number" min={1} max={10} defaultValue={1} aria-label="Level" className="w-20" />
      </div>
      <div className="flex gap-2">
        <Input name="text" placeholder="Teks keterampilan baru" maxLength={200} required aria-label="Teks keterampilan baru" className="min-w-0 flex-1" />
        <Button type="submit" size="sm" loading={pending}>Tambah</Button>
      </div>
      <Status state={state} />
    </form>
  );
}
